/**
 * 目录浏览 API
 *
 * GET /api/browse?path=xxx
 *
 * 返回指定目录的子目录列表，支持 Windows 驱动器枚举。
 *
 * 流程:
 *   GET /api/browse
 *     |-> 解析 path 参数
 *     |-> 列出子目录（仅目录，不展示文件）
 *     |-> Windows 下无 path 参数时列出所有驱动器
 *     |-> 返回 JSON { path, dirs[] }
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { jsonResponse } from '../router.js';

interface BrowseEntry {
	name: string;
	fullPath: string;
}

interface BrowseResult {
	path: string;
	parent: string | null;
	dirs: BrowseEntry[];
}

export async function handleBrowse(req: http.IncomingMessage, res: http.ServerResponse) {
	const url = new URL(req.url || '/', `http://${req.headers.host}`);
	const targetPath = url.searchParams.get('path') || '';

	try {
		// Windows: 无参数时列出驱动器
		if (!targetPath && process.platform === 'win32') {
			const drives = await listWindowsDrives();
			jsonResponse(res, 200, {
				path: '',
				parent: null,
				dirs: drives,
			});
			return;
		}

		// 无路径且非 Windows 时使用根目录
		const resolved = targetPath ? path.resolve(targetPath) : '/';

		// 检查路径是否存在且为目录
		const stat = await fs.stat(resolved);
		if (!stat.isDirectory()) {
			jsonResponse(res, 400, { error: `路径不是目录: ${resolved}` });
			return;
		}

		const entries = await fs.readdir(resolved, { withFileTypes: true });
		const dirs: BrowseEntry[] = [];

		for (const entry of entries) {
			if (entry.isDirectory()) {
				dirs.push({
					name: entry.name,
					fullPath: path.join(resolved, entry.name),
				});
			}
		}

		// 按名称排序
		dirs.sort((a, b) => a.name.localeCompare(b.name));

		const result: BrowseResult = {
			path: resolved,
			parent: getParentDir(resolved),
			dirs,
		};

		jsonResponse(res, 200, result);
	} catch (err: any) {
		jsonResponse(res, 500, { error: err.message || '浏览目录失败' });
	}
}

/** 获取上级目录 */
function getParentDir(dirPath: string): string | null {
	const parent = path.dirname(dirPath);
	// 如果已经是根目录，没有上级
	if (parent === dirPath) return null;
	return parent;
}

/** 列出 Windows 可用驱动器 */
async function listWindowsDrives(): Promise<BrowseEntry[]> {
	const drives: BrowseEntry[] = [];
	// 从 C: 到 Z: 检测
	for (let code = 65; code <= 90; code++) {
		const letter = String.fromCharCode(code);
		const drivePath = `${letter}:\\`;
		try {
			await fs.access(drivePath);
			drives.push({
				name: `${letter}:`,
				fullPath: drivePath,
			});
		} catch {
			// 驱动器不存在，跳过
		}
	}
	return drives;
}
