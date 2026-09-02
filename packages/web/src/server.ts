import http from 'node:http';
import { createRouter } from './router.js';

export function startServer(port = 3210, host?: string) {
	const router = createRouter();
	const server = http.createServer((req, res) => router.handle(req, res));

	// host 为 undefined 时 Node.js 绑定所有接口 (IPv4 + IPv6)
	server.listen(port, host, () => {
		const addr = server.address();
		let url: string;
		if (addr && typeof addr === 'object') {
			const h = addr.family === 'IPv6' ? `[${addr.address}]` : addr.address;
			url = `http://${h}:${addr.port}`;
		} else {
			url = `http://localhost:${port}`;
		}
		console.log(`OpenFairyGUI Web UI: ${url}`);
		console.log(`  也可以访问: http://127.0.0.1:${port}`);
	});

	return server;
}

// 直接运行时启动服务器
const isMain = process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js');
if (isMain) {
	const port = parseInt(process.env.PORT || '3210', 10);
	// 不指定 host 让 Node.js 绑定到所有接口，避免 IPv6/IPv4 兼容问题
	const host = process.env.HOST || undefined;
	startServer(port, host);
}
