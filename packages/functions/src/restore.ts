import { BinaryReader } from '@openfairygui/core/project-io';
import {
	assertDocumentPaths,
	assertSafeRestoreSegment,
	imageFileName,
	replaceLooseResourceBaseName,
	resourceFileName,
	resourceInstanceFileName,
	type RestoreResource,
} from './restore-internals/resource-paths.js';
import { synthesizeLooseSkeletonResources, initializeRestoredResourceRelations } from './restore-internals/skeleton.js';
import { restoreAssets, copyExternalTtfFonts } from './restore-internals/asset-output.js';
import {
	type Document,
	type FileSystem,
	generateId,
	type Package,
	GComponent,
	GImage,
	GMovieClip,
	ProjectType,
	ProjectWriter,
} from '@openfairygui/core';
import {
	assertRestoreOutputDir,
	basename,
	commitRestoreOutput,
	createRestoreStagingDir,
	normalizeRestoreOutputDir,
	resolveOutputProjectPath,
	trimTrailingSlashes,
} from './restore-internals/output-transaction.js';
import {
	initializeFontGlyphImageResources,
	initializeFontTextureImageResources,
	initializePublishedFontDefaults,
	initializePublishedFontTextureIds,
	initializePublishedTextFontResources,
} from './restore-internals/font.js';

export interface RestoreImageCropInput {
	sourcePath: string;
	outputPath: string;
	left: number;
	top: number;
	width: number;
	height: number;
	rotated: boolean;
	offsetX: number;
	offsetY: number;
	expectedWidth: number;
	expectedHeight: number;
}

export type RestoreImageCropper = (input: RestoreImageCropInput) => Promise<void>;
export type RestoreImageExtractInput = Omit<RestoreImageCropInput, 'outputPath'>;
export type RestoreImageExtractor = (input: RestoreImageExtractInput) => Promise<Uint8Array>;

export interface RestoreExecutionOptions {
	binaryPaths: string[];
	sourceDir: string;
	outputProjectPath: string;
	projectType?: number;
	cropImage?: RestoreImageCropper;
	extractImage?: RestoreImageExtractor;
	getImageSize?: (filePath: string) => Promise<{ width: number; height: number } | null>;
	padImage?: (sourcePath: string, outputPath: string, width: number, height: number) => Promise<void>;
	upscaleImage?: (sourcePath: string, outputPath: string, width: number, height: number) => Promise<void>;
	fontDir?: string;
	langDir?: string;
}

export interface RestoreResult {
	document: Document;
	projectPath: string;
	warnings: string[];
}

export interface RestoreFileSystem
	extends Pick<
		FileSystem,
		'readFile' | 'readFileRaw' | 'writeFile' | 'writeFileRaw' | 'mkdir' | 'exists' | 'join' | 'dirname'
	> {
	readdir(path: string): Promise<string[]>;
	isFile(path: string): Promise<boolean>;
	resolvePath(path: string): string | Promise<string>;
	rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
	rename(from: string, to: string): Promise<void>;
}

export interface RestoreOptions {
	inputDir: string;
	output: string;
	fs: RestoreFileSystem;
	packages?: string[];
	force?: boolean;
	projectType?: number;
	cropImage?: RestoreImageCropper;
	extractImage?: RestoreImageExtractor;
	getImageSize?: (filePath: string) => Promise<{ width: number; height: number } | null>;
	padImage?: (sourcePath: string, outputPath: string, width: number, height: number) => Promise<void>;
	upscaleImage?: (sourcePath: string, outputPath: string, width: number, height: number) => Promise<void>;
	fontDir?: string;
	langDir?: string;
}

export interface FontInfo {
	packageName: string;
	resourceId: string;
	fontName: string;
	fileName: string;
	relativeOutputPath: string;
}

export interface ListMissingFontsOptions {
	inputDir: string;
	fs: RestoreFileSystem;
	packages?: string[];
}

type ReferencedDisplayObject = GComponent | GImage | GMovieClip;

function isPublishedBinaryFile(fileName: string): boolean {
	return /_fui\.bytes$/i.test(fileName) || /\.fui$/i.test(fileName) || /\.bin$/i.test(fileName);
}

function inferPackageName(fileName: string): string {
	if (/_fui\.bytes$/i.test(fileName)) return fileName.replace(/_fui\.bytes$/i, '');
	if (/\.fui$/i.test(fileName)) return fileName.replace(/\.fui$/i, '');
	return fileName.replace(/\.bin$/i, '');
}

/** 从 langDir 扫描 fairy多语言_*.txt，写入 settings.i18n.langFiles（含字体配对） */
async function initializeI18nSettings(
	fs: RestoreFileSystem,
	doc: Document,
	langDir: string,
	outputProjectPath: string,
): Promise<void> {
	const entries = await fs.readdir(langDir).catch(() => [] as string[]);
	const langFileRegex = /^fairy多语言_(.+)\.txt$/;
	const basePath = fs.dirname(outputProjectPath);
	const langFiles: Array<{ name: string; path: string; fontName: string }> = [];
	for (const entry of entries) {
		const match = langFileRegex.exec(entry);
		if (match) {
			langFiles.push({ name: match[1], path: fs.join(basePath, entry), fontName: '' });
		}
	}
	if (langFiles.length === 0) return;
	const root = doc.getRoot();
	const settings = root.getSettings?.() ?? {};
	root.setSettings?.({ ...settings, i18n: { langFiles } });
}

/** 复制 langDir 下的多语言 txt 文件到项目根目录 */
async function copyLangFiles(fs: RestoreFileSystem, langDir: string, outputProjectPath: string): Promise<void> {
	const entries = await fs.readdir(langDir).catch(() => [] as string[]);
	const langFiles = entries.filter((entry) => /^fairy多语言_.+\.txt$/.test(entry));
	const basePath = fs.dirname(outputProjectPath);
	for (const fileName of langFiles) {
		const sourcePath = fs.join(langDir, fileName);
		const outputPath = fs.join(basePath, fileName);
		await fs.mkdir(fs.dirname(outputPath));
		await fs.writeFileRaw(outputPath, await fs.readFileRaw(sourcePath));
	}
}

/** 列出二进制包中引用了 TTF 字体文件的资源（供 list-fonts 命令使用） */
export async function listMissingFonts(options: ListMissingFontsOptions): Promise<FontInfo[]> {
	const sourceDir = trimTrailingSlashes(options.inputDir);
	const packageFilter = options.packages?.length ? new Set(options.packages) : null;

	const topEntries = await options.fs.readdir(sourceDir);
	const subDirs: string[] = [];
	for (const name of topEntries) {
		const fullPath = options.fs.join(sourceDir, name);
		if (!(await options.fs.isFile(fullPath))) {
			subDirs.push(fullPath);
		}
	}
	const searchDirs = [sourceDir, ...subDirs];

	const binaryPaths: string[] = [];
	for (const dir of searchDirs) {
		const entries = await options.fs.readdir(dir).catch(() => [] as string[]);
		const found = entries
			.filter((name) => isPublishedBinaryFile(name))
			.filter((name) => !packageFilter || packageFilter.has(inferPackageName(name)))
			.map((name) => options.fs.join(dir, name));
		for (const filePath of found) {
			if (await options.fs.isFile(filePath)) binaryPaths.push(filePath);
		}
	}

	if (binaryPaths.length === 0) return [];

	const reader = new BinaryReader(options.fs);
	const doc = await reader.readMany(binaryPaths);

	const fonts: FontInfo[] = [];
	for (const pkg of doc.getRoot().listPackages()) {
		for (const resource of pkg.listResources()) {
			if (resource.propertyType !== 'FontResource') continue;
			const fileName = resourceFileName(resource);
			if (!/\.ttf$/i.test(fileName)) continue;
			const fontPath = resource.getPath?.() ?? '/';
			const relDir = fontPath.replace(/^\/+/, '').replace(/\/+$/, '');
			const relativeOutputPath = `assets/${pkg.getName()}${relDir ? '/' + relDir : ''}/${fileName}`;
			fonts.push({
				packageName: pkg.getName(),
				resourceId: resource.getId(),
				fontName: resource.getName?.() ?? fileName.replace(/\.ttf$/i, ''),
				fileName,
				relativeOutputPath,
			});
		}
	}
	return fonts;
}

export async function restore(options: RestoreOptions): Promise<RestoreResult> {
	const sourceDir = trimTrailingSlashes(options.inputDir);
	const outputDir = normalizeRestoreOutputDir(options.output);
	const outputProjectPath = resolveOutputProjectPath(outputDir, options.fs);
	await assertRestoreOutputDir(sourceDir, outputDir, options.fs, options.force === true);

	const packageFilter = options.packages?.length ? new Set(options.packages) : null;
	const binaryNames = (await options.fs.readdir(sourceDir))
		.filter((name) => isPublishedBinaryFile(name))
		.filter((name) => !packageFilter || packageFilter.has(inferPackageName(name)));
	for (const binaryName of binaryNames) assertSafeRestoreSegment(binaryName, 'published binary file name');
	const candidateBinaryPaths = binaryNames
		.map((name) => options.fs.join(sourceDir, name))
		.sort((left, right) => left.localeCompare(right));
	const binaryPaths = (
		await Promise.all(
			candidateBinaryPaths.map(async (filePath) => ((await options.fs.isFile(filePath)) ? filePath : null)),
		)
	)
		.filter((filePath): filePath is string => !!filePath)
		.sort((left, right) => left.localeCompare(right));

	if (binaryPaths.length === 0) {
		throw new Error(`No FairyGUI published binary files found in ${sourceDir}.`);
	}

	const restorer = new RestoreWorkflow(options.fs);
	const document = await restorer.prepare({
		binaryPaths,
		sourceDir,
		outputProjectPath,
		projectType: options.projectType,
		cropImage: options.cropImage,
		extractImage: options.extractImage,
	});
	// 从 langDir 初始化多语言设置（需在写入项目文件前完成）
	if (options.langDir) {
		await initializeI18nSettings(options.fs, document, options.langDir, outputProjectPath);
	}
	const stagingDir = await createRestoreStagingDir(outputDir, options.fs);
	const stagingProjectPath = options.fs.join(stagingDir, basename(outputProjectPath));
	const warnings: string[] = [];
	try {
		await restorer.write(
			document,
			{
				binaryPaths,
				sourceDir,
				outputProjectPath: stagingProjectPath,
				projectType: options.projectType,
				cropImage: options.cropImage,
				extractImage: options.extractImage,
				getImageSize: options.getImageSize,
				padImage: options.padImage,
				upscaleImage: options.upscaleImage,
				fontDir: options.fontDir,
				langDir: options.langDir,
			},
			warnings,
		);
		// 复制多语言 txt 文件到项目根目录
		if (options.langDir) {
			await copyLangFiles(options.fs, options.langDir, outputProjectPath);
		}
		const cleanupWarning = await commitRestoreOutput(stagingDir, outputDir, options.fs);
		if (cleanupWarning) warnings.push(cleanupWarning);
	} catch (error) {
		await options.fs.rm(stagingDir, { recursive: true, force: true }).catch(() => undefined);
		throw error;
	}

	return { document, projectPath: outputProjectPath, warnings };
}

class RestoreWorkflow {
	private readonly _fs: RestoreFileSystem;

	constructor(fs: RestoreFileSystem) {
		this._fs = fs;
	}

	async prepare(options: RestoreExecutionOptions): Promise<Document> {
		const reader = new BinaryReader(this._fs);
		const doc = await reader.readMany(options.binaryPaths);
		assertDocumentPaths(doc);
		this._initializeProjectDefaults(doc, options.projectType);
		this._initializeImageFileNames(doc);
		this._initializeLooseResourceFileNames(doc);
		assertDocumentPaths(doc);
		await synthesizeLooseSkeletonResources(this._fs, doc, options.sourceDir);
		initializeRestoredResourceRelations(doc);
		initializePublishedFontTextureIds(doc);
		initializeFontTextureImageResources(doc);
		initializeFontGlyphImageResources(doc);
		initializePublishedTextFontResources(doc);
		this._initializeDisplayObjectFileNames(doc);
		initializePublishedFontDefaults(doc);
		assertDocumentPaths(doc);
		return doc;
	}

	async write(doc: Document, options: RestoreExecutionOptions, warnings: string[]): Promise<void> {
		const writer = new ProjectWriter(this._fs);
		await writer.write(doc, options.outputProjectPath);
		await restoreAssets(this._fs, doc, options, warnings);
	}

	private _initializeProjectDefaults(doc: Document, projectType?: number): void {
		doc.getRoot()
			.setProjectId(generateId())
			.setProjectType(projectType ?? ProjectType.Unity)
			.setVersion('3.0')
			.setSettings({
				publish: {
					binaryFormat: true,
					fileExtension: 'bytes',
					compressDesc: false,
				},
				common: {},
				adaptation: {},
			});
		for (const pkg of doc.getRoot().listPackages()) {
			pkg.setSourceAtlasSettings({
				...pkg.getSourceAtlasSettings(),
				atlases: pkg.listAtlases().map((atlas) => ({
					index: atlas.getIndex(),
					name: atlas.getIndex() === 0 ? 'Default' : atlas.getName(),
					compression: false,
				})),
			});
		}
	}

	private _initializeImageFileNames(doc: Document): void {
		for (const pkg of doc.getRoot().listPackages()) {
			for (const resource of pkg.listResources()) {
				if (resource.propertyType !== 'ImageResource') continue;
				imageFileName(resource);
				ProjectWriter.setImageWriteHints(resource, { omitPackageSize: true });
			}
		}
	}

	private _initializeLooseResourceFileNames(doc: Document): void {
		for (const pkg of doc.getRoot().listPackages()) {
			for (const resource of pkg.listResources()) {
				if (
					resource.propertyType !== 'MiscResource' &&
					resource.propertyType !== 'SpineResource' &&
					resource.propertyType !== 'DragonBonesResource' &&
					resource.propertyType !== 'SoundResource'
				)
					continue;
				const current = resource.getFile() ?? '';
				if (!current) continue;
				const normalized = replaceLooseResourceBaseName(resource, current);
				if (normalized !== current) resource.setFile(normalized);
			}
		}
	}

	private _initializeDisplayObjectFileNames(doc: Document): void {
		for (const pkg of doc.getRoot().listPackages()) {
			for (const component of pkg.listComponents()) {
				for (const child of component.listChildren()) {
					if (
						!(child instanceof GComponent || child instanceof GImage || child instanceof GMovieClip) ||
						child.getFileName()
					)
						continue;
					const resource = this._resolveDisplayObjectResource(doc, pkg, child);
					const fileName = resource ? resourceInstanceFileName(resource) : '';
					if (fileName) child.setFileName(fileName);
				}
			}
		}
	}

	private _resolveDisplayObjectResource(
		doc: Document,
		pkg: Package,
		child: ReferencedDisplayObject,
	): RestoreResource | null {
		const src = child.getSrc() ?? '';
		if (!src) return null;
		const targetPackage = child.getPackageId() ? doc.getRoot().getPackageById(child.getPackageId() ?? '') : pkg;
		return targetPackage?.getResourceById(src) ?? null;
	}
}
