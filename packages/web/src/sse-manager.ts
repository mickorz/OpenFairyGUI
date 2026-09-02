import http from 'node:http';
import type { ILogger } from '@openfairygui/core';

interface SSEClient {
	res: http.ServerResponse;
}

interface LogEntry {
	level: string;
	text: string;
	ts: number;
}

class SSEStream {
	private clients: SSEClient[] = [];
	private buffer: LogEntry[] = [];
	private closed = false;

	addClient(res: http.ServerResponse) {
		res.writeHead(200, {
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'Access-Control-Allow-Origin': '*',
		});

		// 发送已缓冲的日志
		for (const entry of this.buffer) {
			res.write(`data: ${JSON.stringify(entry)}\n\n`, 'utf-8');
		}

		const client: SSEClient = { res };
		this.clients.push(client);

		res.on('close', () => {
			this.clients = this.clients.filter((c) => c !== client);
		});
	}

	push(level: string, text: string) {
		const entry: LogEntry = { level, text, ts: Date.now() };
		this.buffer.push(entry);

		if (this.closed) return;

		const data = `data: ${JSON.stringify(entry)}\n\n`;
		for (const client of this.clients) {
			try {
				client.res.write(data, 'utf-8');
			} catch {
				// 客户端已断开
			}
		}
	}

	close() {
		this.closed = true;
		for (const client of this.clients) {
			try {
				client.res.end();
			} catch {
				// 忽略
			}
		}
		this.clients = [];
	}
}

// 全局 SSE 管理器
const streams = new Map<string, SSEStream>();

// 5分钟后自动清理
function scheduleCleanup(taskId: string) {
	setTimeout(() => {
		streams.delete(taskId);
	}, 300_000);
}

export function createSSELogger(taskId: string): ILogger {
	const stream = new SSEStream();
	streams.set(taskId, stream);

	return {
		debug(text: string) { stream.push('debug', text); },
		info(text: string) { stream.push('info', text); },
		warn(text: string) { stream.push('warn', text); },
		error(text: string) { stream.push('error', text); },
	};
}

export function completeTask(taskId: string, success: boolean) {
	const stream = streams.get(taskId);
	if (stream) {
		stream.push('system', success ? 'DONE' : 'FAILED');
		stream.close();
		scheduleCleanup(taskId);
	}
}

export function handleSSE(_req: http.IncomingMessage, res: http.ServerResponse, taskId: string) {
	const stream = streams.get(taskId);
	if (!stream) {
		res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
		res.end(JSON.stringify({ error: 'Task not found' }));
		return;
	}
	stream.addClient(res);
}
