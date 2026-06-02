/**
 * Inspect API Handler
 *
 * POST /api/inspect
 *
 * 请求体: { inputPath }
 * 响应:   { report: InspectReport }
 *
 * 流程:
 *   POST /api/inspect
 *     |-> resolveFairyPath()
 *     |-> NodeIO.readProject()
 *     |-> inspect(doc) -> InspectReport
 *     |-> 返回 JSON 报告
 */
import http from 'node:http';
import { inspect as inspectFn } from '@openfairygui/functions';
import { parseBody, jsonResponse } from '../router.js';
import { resolveFairyPath, createNodeIO } from './shared.js';

interface InspectRequestBody {
	inputPath: string;
}

export async function handleInspect(req: http.IncomingMessage, res: http.ServerResponse) {
	const body = await parseBody<InspectRequestBody>(req);

	if (!body.inputPath) {
		jsonResponse(res, 400, { error: '缺少必要参数: inputPath' });
		return;
	}

	try {
		const fairyPath = await resolveFairyPath(body.inputPath);
		const io = createNodeIO();
		const doc = await io.readProject(fairyPath);
		const report = inspectFn(doc);

		jsonResponse(res, 200, { report });
	} catch (err: any) {
		jsonResponse(res, 500, { error: err.message || '检查项目失败' });
	}
}
