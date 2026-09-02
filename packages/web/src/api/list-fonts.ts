/**
 * List Fonts API Handler
 *
 * POST /api/list-fonts
 *
 * 请求体: { inputPath, packages? }
 * 响应:   { fonts: FontInfo[] }
 *
 * 流程:
 *   POST /api/list-fonts
 *     |-> 解析 inputPath
 *     |-> createNodeRestoreFs()
 *     |-> listMissingFonts(options) -> FontInfo[]
 *     |-> 返回 JSON 字体列表
 */
import http from 'node:http';
import path from 'node:path';
import { listMissingFonts } from '@openfairygui/functions';
import { parseBody, jsonResponse } from '../router.js';
import { createNodeRestoreFs } from './shared.js';

interface ListFontsRequestBody {
	inputPath: string;
	packages?: string;
}

export async function handleListFonts(req: http.IncomingMessage, res: http.ServerResponse) {
	const body = await parseBody<ListFontsRequestBody>(req);

	if (!body.inputPath) {
		jsonResponse(res, 400, { error: '缺少必要参数: inputPath' });
		return;
	}

	try {
		const releaseDir = path.resolve(body.inputPath);
		const pkgFilter = body.packages
			? body.packages.split(',').map((s) => s.trim()).filter(Boolean)
			: undefined;

		const nodeFs = createNodeRestoreFs();
		const fonts = await listMissingFonts({
			inputDir: releaseDir,
			fs: nodeFs,
			packages: pkgFilter,
		});

		jsonResponse(res, 200, { fonts });
	} catch (err: any) {
		jsonResponse(res, 500, { error: err.message || '列出字体失败' });
	}
}
