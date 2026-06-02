/**
 * Restore API Handler
 *
 * POST /api/restore
 *
 * 请求体: { inputPath, outputPath, force, packages, projectType, fontDir, langDir }
 * 响应:   { taskId }
 *
 * 流程:
 *   POST /api/restore
 *     |-> 解析参数，生成 taskId
 *     |-> 创建 SSE Logger
 *     |-> 异步执行 restore()
 *     |     |-> createNodeRestoreFs()
 *     |     |-> createRestoreImageProcessors()
 *     |     |-> restore(options) -> RestoreResult
 *     |     |-> completeTask(taskId, success)
 *     |-> 立即返回 { taskId }
 */
import http from 'node:http';
import path from 'node:path';
import { restore } from '@openfairygui/functions';
import { parseBody, jsonResponse, generateId } from '../router.js';
import { createSSELogger, completeTask } from '../sse-manager.js';
import {
	createNodeRestoreFs,
	createRestoreImageProcessors,
	parseProjectType,
} from './shared.js';

interface RestoreRequestBody {
	inputPath: string;
	outputPath: string;
	force?: boolean;
	packages?: string;
	projectType?: string;
	fontDir?: string;
	langDir?: string;
}

export async function handleRestore(req: http.IncomingMessage, res: http.ServerResponse) {
	const body = await parseBody<RestoreRequestBody>(req);

	if (!body.inputPath || !body.outputPath) {
		jsonResponse(res, 400, { error: '缺少必要参数: inputPath, outputPath' });
		return;
	}

	const taskId = generateId();
	const logger = createSSELogger(taskId);

	// 立即返回 taskId
	jsonResponse(res, 200, { taskId });

	// 异步执行 restore
	(async () => {
		const origWarn = console.warn;
		const origError = console.error;

		try {
			// 拦截 console 调用
			console.warn = (msg: any) => { logger.warn(String(msg)); };
			console.error = (msg: any) => { logger.error(String(msg)); };

			const releaseDir = path.resolve(body.inputPath);
			const outputDir = path.resolve(body.outputPath);
			const pkgFilter = body.packages
				? body.packages.split(',').map((s) => s.trim()).filter(Boolean)
				: undefined;
			const projectType = parseProjectType(body.projectType);

			logger.info(`开始还原 FairyGUI 项目: ${releaseDir}`);
			logger.info(`输出目录: ${outputDir}`);

			const nodeFs = createNodeRestoreFs();
			const { cropImage, extractImage, getImageSize, padImage, upscaleImage } = await createRestoreImageProcessors();

			const result = await restore({
				inputDir: releaseDir,
				output: outputDir,
				fs: nodeFs,
				packages: pkgFilter,
				force: body.force,
				projectType,
				cropImage,
				extractImage,
				getImageSize,
				padImage,
				upscaleImage,
				fontDir: body.fontDir ? path.resolve(body.fontDir) : undefined,
				langDir: body.langDir ? path.resolve(body.langDir) : undefined,
			});

			const packages = result.document.getRoot().listPackages();
			logger.info(`还原完成! 输出: ${result.projectPath}`);
			logger.info(`包: ${packages.map((pkg) => pkg.getName()).join(', ')}`);
			for (const warning of result.warnings) {
				logger.warn(`警告: ${warning}`);
			}

			completeTask(taskId, true);
		} catch (err: any) {
			logger.error(`还原失败: ${err.message || err}`);
			completeTask(taskId, false);
		} finally {
			console.warn = origWarn;
			console.error = origError;
		}
	})();
}
