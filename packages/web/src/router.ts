import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, 'client');

interface Route {
	method: string;
	pattern: RegExp;
	handler: (req: http.IncomingMessage, res: http.ServerResponse, match: RegExpMatchArray) => void;
}

export function createRouter() {
	const routes: Route[] = [];

	function addRoute(method: string, pattern: string, handler: Route['handler']) {
		routes.push({ method, pattern: new RegExp(`^${pattern}$`), handler });
	}

	function on(method: string, pattern: string, handler: Route['handler']) {
		addRoute(method, pattern, handler);
	}

	// 静态文件
	on('GET', '/', async (_req, res) => {
		await serveStatic(res, 'index.html', 'text/html; charset=utf-8');
	});
	on('GET', '/style\\.css', async (_req, res) => {
		await serveStatic(res, 'style.css', 'text/css; charset=utf-8');
	});
	on('GET', '/app\\.js', async (_req, res) => {
		await serveStatic(res, 'app.js', 'application/javascript; charset=utf-8');
	});

	// API 路由
	on('POST', '/api/open-folder', async (req, res, _match) => {
		const { handleOpenFolder } = await import('./api/open-folder.js');
		await handleOpenFolder(req, res);
	});

	on('GET', '/api/browse', async (req, res, _match) => {
		const { handleBrowse } = await import('./api/browse.js');
		await handleBrowse(req, res);
	});

	on('POST', '/api/publish', async (_req, res) => {
		const { handlePublish } = await import('./api/publish.js');
		await handlePublish(_req, res);
	});

	on('POST', '/api/restore', async (_req, res) => {
		const { handleRestore } = await import('./api/restore.js');
		await handleRestore(_req, res);
	});

	on('POST', '/api/inspect', async (_req, res) => {
		const { handleInspect } = await import('./api/inspect.js');
		await handleInspect(_req, res);
	});

	on('POST', '/api/list-fonts', async (_req, res) => {
		const { handleListFonts } = await import('./api/list-fonts.js');
		await handleListFonts(_req, res);
	});

	on('GET', '/api/logs/(\\w+)', async (_req, res, match) => {
		const { handleSSE } = await import('./sse-manager.js');
		handleSSE(_req, res, match[1]);
	});

	return {
		handle(req: http.IncomingMessage, res: http.ServerResponse) {
			const url = new URL(req.url || '/', `http://${req.headers.host}`);
			const pathname = url.pathname;
			const method = req.method || 'GET';

			for (const route of routes) {
				if (route.method !== method) continue;
				const match = pathname.match(route.pattern);
				if (match) {
					route.handler(req, res, match);
					return;
				}
			}

			res.writeHead(404, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Not Found' }));
		},
	};

	async function serveStatic(res: http.ServerResponse, filename: string, contentType: string) {
		try {
			const filePath = path.join(clientDir, filename);
			const data = await fs.readFile(filePath);
			res.writeHead(200, { 'Content-Type': contentType });
			res.end(data);
		} catch {
			res.writeHead(404);
			res.end('Not Found');
		}
	}
}

// 工具函数: 解析 JSON body
export async function parseBody<T>(req: http.IncomingMessage): Promise<T> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		req.on('data', (chunk: Buffer) => chunks.push(chunk));
		req.on('end', () => {
			try {
				const body = Buffer.concat(chunks).toString('utf-8');
				resolve(JSON.parse(body) as T);
			} catch (e) {
				reject(e);
			}
		});
		req.on('error', reject);
	});
}

// 工具函数: 发送 JSON 响应
export function jsonResponse(res: http.ServerResponse, statusCode: number, data: unknown) {
	res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
	res.end(JSON.stringify(data));
}

// 工具函数: 生成简单 ID
export function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
