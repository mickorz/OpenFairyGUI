/**
 * Publish API Handler
 *
 * POST /api/publish
 *
 * 请求体: { inputPath, outputPath, compressed, noAtlas, packages, branch, projectType, maxAtlasSize }
 * 响应:   { taskId }
 *
 * 流程:
 *   POST /api/publish
 *     |-> 解析参数，生成 taskId
 *     |-> 创建 SSE Logger
 *     |-> 异步执行 publish transform
 *     |     |-> resolveFairyPath()
 *     |     |-> NodeIO.readProject()
 *     |     |-> resolvePublishOptions()
 *     |     |-> doc.transform(publish(options))
 *     |     |-> completeTask(taskId, success)
 *     |-> 立即返回 { taskId }
 */
import http from 'node:http';
import path from 'node:path';
import { publish, resolvePublishOptions } from '@openfairygui/functions';
import { parseBody, jsonResponse, generateId } from '../router.js';
import { createSSELogger, completeTask } from '../sse-manager.js';
import {
	resolveFairyPath,
	parseProjectType,
	createPublishFs,
	createNodeIO,
} from './shared.js';

interface PublishRequestBody {
	inputPath: string;
	outputPath: string;
	compressed?: boolean;
	noAtlas?: boolean;
	packages?: string;
	branch?: string;
	projectType?: string;
	maxAtlasSize?: number;
}

export async function handlePublish(req: http.IncomingMessage, res: http.ServerResponse) {
	const body = await parseBody<PublishRequestBody>(req);

	if (!body.inputPath || !body.outputPath) {
		jsonResponse(res, 400, { error: '缺少必要参数: inputPath, outputPath' });
		return;
	}

	const taskId = generateId();
	const logger = createSSELogger(taskId);

	// 立即返回 taskId
	jsonResponse(res, 200, { taskId });

	// 异步执行 publish
	(async () => {
		const origWarn = console.warn;
		const origError = console.error;

		try {
			console.warn = (msg: any) => { logger.warn(String(msg)); };
			console.error = (msg: any) => { logger.error(String(msg)); };

			const fairyPath = await resolveFairyPath(body.inputPath);
			const projectDir = path.dirname(fairyPath);
			const outputDir = path.resolve(body.outputPath);

			logger.info(`读取项目: ${fairyPath}`);

			const io = createNodeIO();
			const doc = await io.readProject(fairyPath);

			// 设置项目类型
			const projectType = parseProjectType(body.projectType);
			if (projectType !== undefined) {
				doc.getRoot().setProjectType(projectType);
			}

			const pkgFilter = body.packages
				? body.packages.split(',').map((s) => s.trim()).filter(Boolean)
				: undefined;
			const maxAtlasSize = body.maxAtlasSize || undefined;

			const resolved = resolvePublishOptions(doc, {
				compressed: body.compressed,
				packages: pkgFilter,
				atlas: maxAtlasSize ? { maxSize: maxAtlasSize } : undefined,
			});

			logger.info(`配置: ext=${resolved.fileExtension}, compressed=${resolved.compressed}`);
			if (body.branch) {
				logger.info(`活跃分支: ${body.branch}`);
			}

			const atlasConfig: NonNullable<import('@openfairygui/functions').PublishOptions['atlas']> = {
				...resolved.atlas,
				readFileRaw: async (filePath: string) => {
					const buf = await import('node:fs/promises').then((m) => m.readFile(filePath));
					return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
				},
			};

			// 尝试加载 sharp
			let encoder: import('@openfairygui/functions').PublishOptions['encoder'];
			try {
				const sharp = await import('sharp');
				encoder = sharp.default ?? sharp;
				logger.info('Sharp 已加载，将生成图集 PNG');
			} catch {
				logger.info('Sharp 不可用，图集 PNG 将不会生成');
			}

			const publishFs = createPublishFs();

			await doc.transform(publish({
				output: outputDir,
				compressed: resolved.compressed,
				fileExtension: resolved.fileExtension,
				packages: resolved.packages,
				fs: publishFs,
				encoder,
				basePath: path.join(projectDir, 'assets'),
				atlas: atlasConfig,
				branch: body.branch,
				skipAtlas: body.noAtlas,
			}));

			logger.info(`发布完成! 输出: ${outputDir}`);
			completeTask(taskId, true);
		} catch (err: any) {
			logger.error(`发布失败: ${err.message || err}`);
			completeTask(taskId, false);
		} finally {
			console.warn = origWarn;
			console.error = origError;
		}
	})();
}
