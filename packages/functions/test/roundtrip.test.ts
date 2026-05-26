import test from 'ava';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { NodeIO } from '@openfairygui/core';
import { publish, restore, type PublishFileSystem, type RestoreFileSystem, type RestoreImageCropInput, type RestoreImageExtractInput } from '../src/index.js';
import { diffXmlProjects } from '../src/roundtrip-diff.js';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const TEST_PROJECT_DIR = path.join(ROOT_DIR, 'TestProject');
const SOURCE_DIR = path.join(TEST_PROJECT_DIR, 'SourceFgui');
const PUBLISH_DIR = path.join(TEST_PROJECT_DIR, 'PublishFolder');
const CRACK_DIR = path.join(TEST_PROJECT_DIR, 'CrackFgui');
const REPORT_PATH = path.join(TEST_PROJECT_DIR, 'roundtrip-report.json');

async function extractImage(input: RestoreImageExtractInput): Promise<Uint8Array> {
	let pipeline = sharp(input.sourcePath).extract({
		left: input.left,
		top: input.top,
		width: input.width,
		height: input.height,
	});
	if (input.rotated) pipeline = pipeline.rotate(90);
	const { data, info } = await pipeline.png().toBuffer({ resolveWithObject: true });
	const needsOriginalCanvas = input.expectedWidth > 0 && input.expectedHeight > 0 && (
		input.offsetX !== 0
		|| input.offsetY !== 0
		|| info.width !== input.expectedWidth
		|| info.height !== input.expectedHeight
	);
	if (needsOriginalCanvas) {
		return sharp({
			create: {
				width: input.expectedWidth,
				height: input.expectedHeight,
				channels: 4,
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			},
		})
			.composite([{ input: data, left: input.offsetX, top: input.offsetY }])
			.png()
			.toBuffer();
	}
	return data;
}

async function cropImage(input: RestoreImageCropInput): Promise<void> {
	await fs.mkdir(path.dirname(input.outputPath), { recursive: true });
	await fs.writeFile(input.outputPath, await extractImage(input));
}

function createRestoreFs(): RestoreFileSystem {
	return {
		async readFile(filePath: string): Promise<string> {
			return fs.readFile(filePath, 'utf-8');
		},
		async readFileRaw(filePath: string): Promise<Uint8Array> {
			const buf = await fs.readFile(filePath);
			return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
		},
		async writeFile(filePath: string, content: string): Promise<void> {
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, content, 'utf-8');
		},
		async writeFileRaw(filePath: string, data: Uint8Array): Promise<void> {
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, data);
		},
		async mkdir(dirPath: string): Promise<void> {
			await fs.mkdir(dirPath, { recursive: true });
		},
		async readdir(dirPath: string): Promise<string[]> {
			return fs.readdir(dirPath);
		},
		async exists(filePath: string): Promise<boolean> {
			try {
				await fs.access(filePath);
				return true;
			} catch {
				return false;
			}
		},
		async isFile(filePath: string): Promise<boolean> {
			try {
				return (await fs.stat(filePath)).isFile();
			} catch {
				return false;
			}
		},
		async resolvePath(filePath: string): Promise<string> {
			try {
				return await fs.realpath(filePath);
			} catch {
				return path.resolve(filePath);
			}
		},
		async rm(targetPath: string, options?: { recursive?: boolean; force?: boolean }): Promise<void> {
			await fs.rm(targetPath, { recursive: options?.recursive ?? false, force: options?.force ?? false });
		},
		join(...paths: string[]): string {
			return path.join(...paths);
		},
		dirname(filePath: string): string {
			return path.dirname(filePath);
		},
	};
}

function createPublishFs(): PublishFileSystem {
	return {
		async readFileRaw(filePath: string): Promise<Uint8Array> {
			const data = await fs.readFile(filePath);
			return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
		},
		async writeFileRaw(filePath: string, data: Uint8Array): Promise<void> {
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, data);
		},
		async mkdir(dirPath: string): Promise<void> {
			await fs.mkdir(dirPath, { recursive: true });
		},
		async readdir(dirPath: string): Promise<string[]> {
			return fs.readdir(dirPath);
		},
		async deleteFile(filePath: string): Promise<void> {
			await fs.rm(filePath, { force: true });
		},
		join(...paths: string[]): string {
			return path.join(...paths);
		},
	};
}

test.serial('roundtrip: publish restore diff generates report', async (t) => {
	// 清理上一次的输出
	await fs.rm(PUBLISH_DIR, { recursive: true, force: true }).catch(() => undefined);
	await fs.rm(CRACK_DIR, { recursive: true, force: true }).catch(() => undefined);

	// Step 1: publish SourceFgui -> PublishFolder
	const io = new NodeIO();
	const doc = await io.readProject(path.join(SOURCE_DIR, 'FairyGUI-Unity-Examples.fairy'));

	await doc.transform(publish({
		output: PUBLISH_DIR,
		fs: createPublishFs(),
		encoder: sharp,
		basePath: path.join(SOURCE_DIR, 'assets'),
	}));

	// Step 2: restore PublishFolder -> CrackFgui
	await restore({
		inputDir: PUBLISH_DIR,
		output: CRACK_DIR,
		fs: createRestoreFs(),
		force: true,
		cropImage,
		extractImage,
		getImageSize: async (p) => {
			const meta = await sharp(p).metadata();
			return meta.width && meta.height ? { width: meta.width, height: meta.height } : null;
		},
		padImage: async (src, out, w, h) => {
			const meta = await sharp(src).metadata();
			await sharp(src).extend({
				top: 0,
				left: 0,
				right: w - (meta.width ?? 0),
				bottom: h - (meta.height ?? 0),
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			}).png().toFile(out);
		},
	});

	// Step 3: diff SourceFgui/assets vs CrackFgui/assets
	const report = await diffXmlProjects(
		path.join(SOURCE_DIR, 'assets'),
		path.join(CRACK_DIR, 'assets'),
	);

	// Step 4: 写入报告文件
	await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');

	// 验证至少处理了一些文件
	t.true(report.summary.totalFiles > 0, 'should have processed at least one XML file');

	// 报告统计信息
	console.log('--- Roundtrip Diff Report ---');
	console.log(`Total files:   ${report.summary.totalFiles}`);
	console.log(`Matching:      ${report.summary.matchingFiles}`);
	console.log(`Diff files:    ${report.summary.diffFiles}`);
	console.log(`Missing files: ${report.summary.missingFiles}`);
	console.log(`Missing in restored: ${report.missingInRestored.length}`);
	console.log(`Extra in restored:   ${report.extraInRestored.length}`);
	console.log(`Total diff entries:  ${report.diffs.length}`);
	console.log(`Report written to: ${REPORT_PATH}`);

	// 按类型统计差异
	const byType = new Map<string, number>();
	for (const diff of report.diffs) {
		byType.set(diff.type, (byType.get(diff.type) ?? 0) + 1);
	}
	for (const [type, count] of byType) {
		console.log(`  ${type}: ${count}`);
	}
});
