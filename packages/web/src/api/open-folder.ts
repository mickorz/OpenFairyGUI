/**
 * Windows 原生文件夹选择对话框 API
 *
 * POST /api/open-folder
 *
 * 请求体: { initialPath?: string, title?: string }
 * 响应:   { path: string | null }
 *
 * 流程:
 *   POST /api/open-folder
 *     |-> 通过 PowerShell 调用 System.Windows.Forms.FolderBrowserDialog
 *     |-> 用户选择文件夹后返回路径
 *     |-> 取消则返回 null
 */
import http from 'node:http';
import { execFile } from 'node:child_process';
import { parseBody, jsonResponse } from '../router.js';

interface OpenFolderRequestBody {
	initialPath?: string;
	title?: string;
}

export async function handleOpenFolder(req: http.IncomingMessage, res: http.ServerResponse) {
	const body = await parseBody<OpenFolderRequestBody>(req);

	const title = (body.title || '选择文件夹').replace(/'/g, "''");
	const initialPath = (body.initialPath || '').replace(/'/g, "''");

	// PowerShell 脚本：调用 Windows 原生 FolderBrowserDialog
	// 开头强制 UTF-8 输出编码，防止中文 Windows 上 GBK 乱码
	// -STA: 单线程单元，Windows Forms 需要
	const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = '${title}'
$dialog.ShowNewFolderButton = $true
${initialPath ? `$dialog.SelectedPath = '${initialPath}'` : ''}
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
	[Console]::Out.WriteLine($dialog.SelectedPath)
} else {
	[Console]::Out.WriteLine('')
}
$dialog.Dispose()
`.trim();

	execFile('powershell.exe', [
		'-NoProfile',
		'-STA',
		'-Command',
		psScript,
	], { timeout: 300_000, encoding: 'utf-8' }, (err, stdout) => {
		if (err) {
			jsonResponse(res, 500, { error: '打开文件夹对话框失败: ' + err.message });
			return;
		}

		const selectedPath = stdout.trim();
		if (selectedPath) {
			jsonResponse(res, 200, { path: selectedPath });
		} else {
			jsonResponse(res, 200, { path: null });
		}
	});
}
