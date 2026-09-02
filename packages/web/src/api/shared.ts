/**
 * Web API 共享工具模块
 *
 * 从 CLI 层提取核心逻辑，适配 Web 端使用：
 *   resolveFairyPath()     - .fairy 文件路径解析
 *   parseProjectType()     - 项目类型字符串/ID 转换
 *   createNodeRestoreFs()  - Node.js 文件系统适配器 (restore 用)
 *   createPublishFs()      - Node.js 文件系统适配器 (publish 用)
 *   createRestoreImageProcessors() - sharp 图片处理函数
 *
 * 流程:
 *   API Handler
 *     |-> shared 工具函数
 *     |-> @openfairygui/core / @openfairygui/functions
 */
import {
	NodeIO,
	ProjectType,
} from '@openfairygui/core';
import type {
	PublishFileSystem,
	RestoreFileSystem,
	RestoreImageCropInput,
	RestoreImageCropper,
	RestoreImageExtractInput,
	RestoreImageExtractor,
} from '@openfairygui/functions';
import fs from 'node:fs/promises';
import path from 'node:path';

/** 解析输入路径到 .fairy 文件路径 */
export async function resolveFairyPath(input: string): Promise<string> {
	const resolved = path.resolve(input);
	const stat = await fs.stat(resolved);

	if (stat.isFile() && resolved.endsWith('.fairy')) {
		return resolved;
	}

	if (stat.isDirectory()) {
		const entries = await fs.readdir(resolved);
		const fairyFiles = entries.filter((e) => e.endsWith('.fairy'));
		if (fairyFiles.length === 1) {
			return path.join(resolved, fairyFiles[0]);
		}
		if (fairyFiles.length > 1) {
			throw new Error(`目录中存在多个 .fairy 文件: ${resolved}，请指定其中一个`);
		}
		throw new Error(`未在目录中找到 .fairy 文件: ${resolved}`);
	}

	throw new Error(`输入不是 .fairy 文件或目录: ${resolved}`);
}

/** 项目类型字符串/ID 转数字枚举 */
export function parseProjectType(value: string | undefined): number | undefined {
	if (!value) return undefined;
	const trimmed = value.trim();
	if (trimmed === '') return undefined;
	if (/^\d+$/u.test(trimmed)) return Number(trimmed);
	const normalized = trimmed.toLowerCase();
	const map: Record<string, number> = {
		unity: ProjectType.Unity,
		flash: ProjectType.Flash,
		starling: ProjectType.Starling,
		cocoscreator: ProjectType.CocosCreator,
		cocos: ProjectType.CocosCreator,
		layabox: ProjectType.LayaBox,
		laya: ProjectType.LayaBox,
		egret: ProjectType.Egret,
		haxe: ProjectType.Haxe,
		pixi: ProjectType.Pixi,
		libgdx: ProjectType.LibGDX,
		unreal: ProjectType.Unreal,
		cryengine: ProjectType.CryEngine,
		monogame: ProjectType.MonoGame,
		vision: ProjectType.Vision,
	};
	const resolved = map[normalized];
	if (resolved === undefined) {
		throw new Error(`未知项目类型: ${value}，请使用数字 ID 或: ${Object.keys(map).join(', ')}`);
	}
	return resolved;
}

/** 创建 Node.js Restore 文件系统适配器 */
export function createNodeRestoreFs(): RestoreFileSystem {
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

/** 创建 Node.js Publish 文件系统适配器 */
export function createPublishFs(): NonNullable<PublishFileSystem> {
	return {
		async readFileRaw(filePath: string): Promise<Uint8Array> {
			const buf = await fs.readFile(filePath);
			return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
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

/** 创建 sharp 图片处理器 (restore 用) */
export async function createRestoreImageProcessors() {
	let sharp: any;
	try {
		const mod = await import('sharp');
		sharp = mod.default ?? mod;
	} catch {
		throw new Error('restore: 需要 sharp 来裁剪图集图片。请使用 pnpm add sharp 安装');
	}

	async function extractImage(input: RestoreImageExtractInput): Promise<Uint8Array> {
		const targetPath = (input as RestoreImageCropInput).outputPath ?? input.sourcePath;
		let image = sharp(input.sourcePath).extract({
			left: input.left,
			top: input.top,
			width: input.width,
			height: input.height,
		});
		if (input.rotated) image = image.rotate(90);
		const { data, info } = await image.png().toBuffer({ resolveWithObject: true });
		const needsOriginalCanvas = input.expectedWidth > 0 && input.expectedHeight > 0 && (
			input.offsetX !== 0
			|| input.offsetY !== 0
			|| info.width !== input.expectedWidth
			|| info.height !== input.expectedHeight
		);

		if (needsOriginalCanvas) {
			if (
				input.offsetX < 0
				|| input.offsetY < 0
				|| input.offsetX + info.width > input.expectedWidth
				|| input.offsetY + info.height > input.expectedHeight
			) {
				throw new Error(
					`restore: 裁剪图片超出原始画布 ${targetPath}: `
					+ `裁剪 ${info.width}x${info.height} 位于 ${input.offsetX},${input.offsetY}, `
					+ `画布 ${input.expectedWidth}x${input.expectedHeight}`,
				);
			}
			const composed = await sharp({
				create: {
					width: input.expectedWidth,
					height: input.expectedHeight,
					channels: 4,
					background: { r: 0, g: 0, b: 0, alpha: 0 },
				},
			})
				.composite([{ input: data, left: input.offsetX, top: input.offsetY }])
				.png()
				.toBuffer({ resolveWithObject: true });
			if (
				input.expectedWidth > 0
				&& input.expectedHeight > 0
				&& (composed.info.width !== input.expectedWidth || composed.info.height !== input.expectedHeight)
			) {
				throw new Error(
					`restore: 裁剪图片尺寸不匹配 ${targetPath}: `
					+ `期望 ${input.expectedWidth}x${input.expectedHeight}, 实际 ${composed.info.width}x${composed.info.height}`,
				);
			}
			return composed.data;
		}

		if (
			input.expectedWidth > 0
			&& input.expectedHeight > 0
			&& (info.width !== input.expectedWidth || info.height !== input.expectedHeight)
		) {
			throw new Error(
				`restore: 裁剪图片尺寸不匹配 ${targetPath}: `
				+ `期望 ${input.expectedWidth}x${input.expectedHeight}, 实际 ${info.width}x${info.height}`,
			);
		}
		return data;
	}

	return {
		extractImage,
		cropImage: async (input: RestoreImageCropInput): Promise<void> => {
			await fs.mkdir(path.dirname(input.outputPath), { recursive: true });
			await fs.writeFile(input.outputPath, await extractImage(input));
		},
		getImageSize: async (filePath: string): Promise<{ width: number; height: number } | null> => {
			try {
				const meta = await sharp(filePath).metadata();
				return meta.width && meta.height ? { width: meta.width, height: meta.height } : null;
			} catch {
				return null;
			}
		},
		padImage: async (sourcePath: string, outputPath: string, width: number, height: number): Promise<void> => {
			const meta = await sharp(sourcePath).metadata();
			const origW = meta.width ?? 0;
			const origH = meta.height ?? 0;
			await sharp(sourcePath)
				.extend({
					top: 0,
					left: 0,
					right: width - origW,
					bottom: height - origH,
					background: { r: 0, g: 0, b: 0, alpha: 0 },
				})
				.png()
				.toFile(outputPath);
		},
		upscaleImage: async (sourcePath: string, outputPath: string, width: number, height: number): Promise<void> => {
			await sharp(sourcePath, { limitInputPixels: false })
				.resize(width, height, { kernel: 'nearest' })
				.png()
				.toFile(outputPath);
		},
	};
}

/** 创建 NodeIO 实例（用于读写项目） */
export function createNodeIO(): NodeIO {
	return new NodeIO();
}
