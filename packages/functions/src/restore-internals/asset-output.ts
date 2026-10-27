import type { Document, Package, Sprite, ImageResource, FontResource, MovieClipResource } from '@openfairygui/core';
import type { RestoreFileSystem, RestoreExecutionOptions } from '../restore.js';
import { isSyntheticFontGlyphImage, serializeFont } from './font.js';
import { serializeMovieClip } from './movie-clip.js';
import {
	resourceFileName,
	resourcePublishedFileName,
	imageFileName,
	sourceFileCandidates,
	resolveSourceFile,
	resourceOutputPath,
} from './resource-paths.js';

interface SpriteLookupEntry {
	sourceAtlas: string;
	sprite: Sprite;
}

const TRANSPARENT_PNG_1X1 = Uint8Array.from([
	137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196,
	137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 96, 0, 0, 0, 2, 0, 1, 229, 39, 212, 138, 0, 0, 0, 0, 73, 69, 78, 68,
	174, 66, 96, 130,
]);

function findImageResource(pkg: Package, itemId: string): ImageResource | null {
	return pkg.listImageResources().find((resource) => resource.getId() === itemId) ?? null;
}

export async function restoreAssets(
	fs: RestoreFileSystem,
	doc: Document,
	options: RestoreExecutionOptions,
	warnings: string[],
): Promise<void> {
	for (const pkg of doc.getRoot().listPackages()) {
		await restoreAtlasImages(fs, pkg, options);
		await writeGeneratedResources(fs, pkg, options, warnings);
		await copyExternalTtfFonts(fs, pkg, options, warnings);
		await copyLooseResources(fs, pkg, options, warnings);
	}
}

async function restoreAtlasImages(
	fs: RestoreFileSystem,
	pkg: Package,
	options: RestoreExecutionOptions,
): Promise<void> {
	if (!options.cropImage) return;
	for (const atlas of pkg.listAtlases()) {
		const sourceAtlas = await resolveSourceFile(fs, options.sourceDir, sourceFileCandidates(pkg, atlas.getFile()));
		if (!sourceAtlas) {
			throw new Error(
				`Atlas image not found for package "${pkg.getName()}": ${sourceFileCandidates(pkg, atlas.getFile()).join(', ')}`,
			);
		}

		// 检测图集缩放（实际图片尺寸 vs 二进制记录的逻辑尺寸）
		// FairyGUI 发布时可能对图集做降采样，运行时通过 UV 缩放映射坐标
		const logicalWidth = atlas.getWidth();
		const logicalHeight = atlas.getHeight();
		let actualWidth = logicalWidth;
		let actualHeight = logicalHeight;
		if (options.getImageSize) {
			const actualSize = await options.getImageSize(sourceAtlas);
			if (actualSize) {
				actualWidth = actualSize.width;
				actualHeight = actualSize.height;
			}
		}
		const scaleX = logicalWidth > 0 ? actualWidth / logicalWidth : 1;
		const scaleY = logicalHeight > 0 ? actualHeight / logicalHeight : 1;
		const isScaled = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001;

		// 计算图集需要的最小尺寸，用于 pad 被裁剪过的图集
		let maxAtlasX = 0;
		let maxAtlasY = 0;
		for (const sprite of atlas.listSprites()) {
			const right = sprite.getRectX() + sprite.getRectWidth();
			const bottom = sprite.getRectY() + sprite.getRectHeight();
			if (right > maxAtlasX) maxAtlasX = right;
			if (bottom > maxAtlasY) maxAtlasY = bottom;
		}

		// 确定工作图集路径：放大或补边到逻辑尺寸
		let workingAtlasPath = sourceAtlas;
		if (isScaled && options.getImageSize && options.upscaleImage) {
			// 图集被降采样：放大到逻辑尺寸后用原始坐标提取 sprite
			const upscaleW = 2 ** Math.ceil(Math.log2(logicalWidth));
			const upscaleH = 2 ** Math.ceil(Math.log2(logicalHeight));
			console.warn(
				`[restore] Atlas "${atlas.getFile()}" scaled: logical ${logicalWidth}x${logicalHeight}, actual ${actualWidth}x${actualHeight}, upscaling to ${upscaleW}x${upscaleH}`,
			);
			workingAtlasPath = sourceAtlas + '.upscaled.png';
			await options.upscaleImage(sourceAtlas, workingAtlasPath, upscaleW, upscaleH);
		} else if (maxAtlasX > 0 && maxAtlasY > 0 && options.getImageSize && options.padImage) {
			// 图集被裁剪：补边到 2 的幂次
			if (actualWidth < maxAtlasX || actualHeight < maxAtlasY) {
				const padW = 2 ** Math.ceil(Math.log2(maxAtlasX));
				const padH = 2 ** Math.ceil(Math.log2(maxAtlasY));
				console.warn(
					`[restore] Atlas "${atlas.getFile()}" trimmed: ${actualWidth}x${actualHeight}, padding to ${padW}x${padH}`,
				);
				workingAtlasPath = sourceAtlas + '.padded.png';
				await options.padImage(sourceAtlas, workingAtlasPath, padW, padH);
			}
		}

		for (const sprite of atlas.listSprites()) {
			const image = findImageResource(pkg, sprite.getItemId());
			if (!image) continue;

			if (sprite.getRectWidth() <= 0 || sprite.getRectHeight() <= 0) {
				// sprite 在图集中尺寸为 0（被发布器裁剪/合并），生成占位图片
				const origW = sprite.getOriginalWidth() ?? image.getWidth() ?? 0;
				const origH = sprite.getOriginalHeight() ?? image.getHeight() ?? 0;
				if (origW > 0 && origH > 0 && options.extractImage) {
					const placeholderPath = resourceOutputPath(
						fs,
						options.outputProjectPath,
						pkg,
						image,
						imageFileName(image),
					);
					await fs.mkdir(fs.dirname(placeholderPath));
					try {
						const data = await options.extractImage({
							sourcePath: workingAtlasPath,
							left: 0,
							top: 0,
							width: 0,
							height: 0,
							rotated: false,
							offsetX: 0,
							offsetY: 0,
							expectedWidth: origW,
							expectedHeight: origH,
						});
						await fs.writeFileRaw(placeholderPath, data);
					} catch (placeholderError) {
						const message =
							placeholderError instanceof Error ? placeholderError.message : String(placeholderError);
						console.warn(
							`[restore] Failed to create placeholder for "${image.getName() ?? image.getId()}": ${message}`,
						);
					}
				}
				continue;
			}

			const outputPath = resourceOutputPath(fs, options.outputProjectPath, pkg, image, imageFileName(image));
			const imageWidth = image.getWidth() ?? 0;
			const imageHeight = image.getHeight() ?? 0;
			const spriteWidth = sprite.getRotated() ? sprite.getRectHeight() : sprite.getRectWidth();
			const spriteHeight = sprite.getRotated() ? sprite.getRectWidth() : sprite.getRectHeight();
			await fs.mkdir(fs.dirname(outputPath));
			await options.cropImage({
				sourcePath: workingAtlasPath,
				outputPath,
				left: sprite.getRectX(),
				top: sprite.getRectY(),
				width: sprite.getRectWidth(),
				height: sprite.getRectHeight(),
				rotated: sprite.getRotated(),
				offsetX: sprite.getOffsetX(),
				offsetY: sprite.getOffsetY(),
				expectedWidth: Math.max(imageWidth, sprite.getOriginalWidth(), spriteWidth),
				expectedHeight: Math.max(imageHeight, sprite.getOriginalHeight(), spriteHeight),
			});
		}
	}
}

/** 从 fontDir 复制 TTF 字体文件到对应 FontResource 的输出路径 */
export async function copyExternalTtfFonts(
	fs: RestoreFileSystem,
	pkg: Package,
	options: RestoreExecutionOptions,
	warnings: string[],
): Promise<void> {
	if (!options.fontDir) return;
	const fontDirEntries = await fs.readdir(options.fontDir).catch(() => [] as string[]);
	const ttfFileMap = new Map<string, string>();
	for (const entry of fontDirEntries) {
		if (/\.ttf$/i.test(entry)) {
			ttfFileMap.set(entry.toLowerCase(), entry);
		}
	}
	if (ttfFileMap.size === 0) return;

	for (const resource of pkg.listResources()) {
		if (resource.propertyType !== 'FontResource') continue;
		const fileName = resourceFileName(resource);
		if (!/\.ttf$/i.test(fileName)) continue;

		const match = ttfFileMap.get(fileName.toLowerCase());
		if (!match) {
			warnings.push(`TTF font file not found in fontDir for package "${pkg.getName()}": ${fileName}`);
			continue;
		}

		const sourcePath = fs.join(options.fontDir, match);
		const outputPath = resourceOutputPath(fs, options.outputProjectPath, pkg, resource, fileName);
		await fs.mkdir(fs.dirname(outputPath));
		await fs.writeFileRaw(outputPath, await fs.readFileRaw(sourcePath));
	}
}

async function copyLooseResources(
	fs: RestoreFileSystem,
	pkg: Package,
	options: RestoreExecutionOptions,
	warnings: string[],
): Promise<void> {
	for (const resource of pkg.listResources()) {
		const restoreAsLooseImage = resource.getExtras()?._restoreAsLooseImage === true;
		if (
			!['SoundResource', 'MiscResource', 'SpineResource', 'DragonBonesResource'].includes(
				resource.propertyType,
			) &&
			!restoreAsLooseImage
		) {
			continue;
		}
		const fileName = resourceFileName(resource);
		if (!fileName) continue;
		const sourcePath = await resolveSourceFile(
			fs,
			options.sourceDir,
			sourceFileCandidates(pkg, resourcePublishedFileName(resource), fileName),
		);
		if (!sourcePath) {
			warnings.push(`Loose resource not found for package "${pkg.getName()}": ${fileName}`);
			continue;
		}
		const outputPath = resourceOutputPath(fs, options.outputProjectPath, pkg, resource, fileName);
		await fs.mkdir(fs.dirname(outputPath));
		await fs.writeFileRaw(outputPath, await fs.readFileRaw(sourcePath));
	}
}

async function writeGeneratedResources(
	fs: RestoreFileSystem,
	pkg: Package,
	options: RestoreExecutionOptions,
	warnings: string[],
): Promise<void> {
	for (const resource of pkg.listResources()) {
		if (resource.propertyType === 'FontResource') {
			await writeFontFile(fs, pkg, resource, options.outputProjectPath);
		} else if (resource.propertyType === 'MovieClipResource') {
			await writeMovieClipFile(fs, pkg, resource, options, warnings);
		}
	}
	await writeSyntheticFontGlyphImages(fs, pkg, options.outputProjectPath);
}

async function writeFontFile(
	fs: RestoreFileSystem,
	pkg: Package,
	resource: FontResource,
	outputProjectPath: string,
): Promise<void> {
	const fileName = resourceFileName(resource);
	if (!/\.fnt$/i.test(fileName)) return;
	const glyphs = resource.listGlyphs() ?? [];
	if (glyphs.length === 0) return;

	const outputPath = resourceOutputPath(fs, outputProjectPath, pkg, resource, fileName);
	await fs.mkdir(fs.dirname(outputPath));
	await fs.writeFile(outputPath, serializeFont(pkg, resource, glyphs));
}

async function writeMovieClipFile(
	fs: RestoreFileSystem,
	pkg: Package,
	resource: MovieClipResource,
	options: RestoreExecutionOptions,
	warnings: string[],
): Promise<void> {
	const fileName = resourceFileName(resource);
	if (!/\.jta$/i.test(fileName)) return;
	const frames = resource.listFrames() ?? [];
	if (frames.length === 0) return;
	if (!options.extractImage) {
		warnings.push(`MovieClip file not generated for package "${pkg.getName()}": ${fileName}`);
		return;
	}

	const sprites = await buildSpriteLookup(fs, pkg, options);
	const textures: Uint8Array[] = [];
	for (const [index, frame] of frames.entries()) {
		const spriteEntry = sprites.get(frame.getSpriteId());
		if (!spriteEntry) {
			warnings.push(
				`MovieClip frame sprite not found for package "${pkg.getName()}": ${fileName} frame ${index}`,
			);
			return;
		}
		const sprite = spriteEntry.sprite;
		if (sprite.getRectWidth() <= 0 || sprite.getRectHeight() <= 0) {
			textures.push(new Uint8Array(0));
			continue;
		}
		textures.push(
			await options.extractImage({
				sourcePath: spriteEntry.sourceAtlas,
				left: sprite.getRectX(),
				top: sprite.getRectY(),
				width: sprite.getRectWidth(),
				height: sprite.getRectHeight(),
				rotated: sprite.getRotated(),
				offsetX: 0,
				offsetY: 0,
				expectedWidth: sprite.getRotated() ? sprite.getRectHeight() : sprite.getRectWidth(),
				expectedHeight: sprite.getRotated() ? sprite.getRectWidth() : sprite.getRectHeight(),
			}),
		);
	}

	const outputPath = resourceOutputPath(fs, options.outputProjectPath, pkg, resource, fileName);
	await fs.mkdir(fs.dirname(outputPath));
	await fs.writeFileRaw(outputPath, serializeMovieClip(resource, frames, textures));
}

async function writeSyntheticFontGlyphImages(
	fs: RestoreFileSystem,
	pkg: Package,
	outputProjectPath: string,
): Promise<void> {
	for (const resource of pkg.listResources()) {
		if (resource.propertyType !== 'ImageResource' || !isSyntheticFontGlyphImage(resource)) continue;
		const fileName = resourceFileName(resource) || `${resource.getId() ?? 'glyph'}.png`;
		const outputPath = resourceOutputPath(fs, outputProjectPath, pkg, resource, fileName);
		await fs.mkdir(fs.dirname(outputPath));
		await fs.writeFileRaw(outputPath, TRANSPARENT_PNG_1X1);
	}
}

async function buildSpriteLookup(
	fs: RestoreFileSystem,
	pkg: Package,
	options: RestoreExecutionOptions,
): Promise<Map<string, SpriteLookupEntry>> {
	const sprites = new Map<string, SpriteLookupEntry>();
	for (const atlas of pkg.listAtlases()) {
		const sourceAtlas = await resolveSourceFile(fs, options.sourceDir, sourceFileCandidates(pkg, atlas.getFile()));
		if (!sourceAtlas) {
			throw new Error(
				`Atlas image not found for package "${pkg.getName()}": ${sourceFileCandidates(pkg, atlas.getFile()).join(', ')}`,
			);
		}
		for (const sprite of atlas.listSprites()) {
			sprites.set(sprite.getItemId(), { sourceAtlas, sprite });
		}
	}
	return sprites;
}
