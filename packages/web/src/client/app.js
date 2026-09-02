/**
 * OpenFairyGUI Web UI - 前端主逻辑
 *
 * 模块:
 *   Tab 切换
 *   浏览按钮 (调用 Windows 原生文件夹选择对话框)
 *   日志面板 (SSE 接收)
 *   表单提交 (还原/发布/检查/字体)
 */

(function () {
	'use strict';

	// ==============================
	// Tab 切换
	// ==============================
	var tabs = document.querySelectorAll('.tab');
	var panels = document.querySelectorAll('.tab-panel');

	tabs.forEach(function (tab) {
		tab.addEventListener('click', function () {
			tabs.forEach(function (t) { t.classList.remove('active'); });
			panels.forEach(function (p) { p.classList.remove('active'); });
			tab.classList.add('active');
			document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
		});
	});

	// ==============================
	// 浏览按钮 - 调用 Windows 原生文件夹选择对话框
	// ==============================
	var browsing = false;

	document.querySelectorAll('.btn-browse').forEach(function (btn) {
		btn.addEventListener('click', async function () {
			if (browsing) return;
			var targetInput = document.getElementById(btn.dataset.target);
			if (!targetInput) return;

			browsing = true;
			btn.disabled = true;
			btn.textContent = '选择中...';

			try {
				var resp = await fetch('/api/open-folder', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						initialPath: targetInput.value || '',
						title: '选择文件夹'
					})
				});
				var data = await resp.json();

				if (data.error) {
					appendLog('error', data.error, Date.now());
				} else if (data.path) {
					targetInput.value = data.path;
				}
				// data.path 为 null 表示用户取消了选择，不做任何操作
			} catch (err) {
				appendLog('error', '打开文件夹对话框失败: ' + err.message, Date.now());
			} finally {
				browsing = false;
				btn.disabled = false;
				btn.textContent = '浏览...';
			}
		});
	});

	// ==============================
	// 日志面板
	// ==============================
	var logPanel = document.getElementById('log-panel');
	var logEntries = [];

	function appendLog(level, text, ts) {
		var time = new Date(ts).toLocaleTimeString('zh-CN', { hour12: false });
		logEntries.push({ time: time, level: level, text: text });

		var entry = document.createElement('div');
		entry.className = 'log-entry';
		entry.innerHTML =
			'<span class="log-ts">[' + escapeHtml(time) + ']</span>' +
			'<span class="log-level ' + escapeHtml(level) + '">' + escapeHtml(level.toUpperCase()) + '</span>' +
			'<span class="log-text">' + escapeHtml(text) + '</span>';
		logPanel.appendChild(entry);
		logPanel.scrollTop = logPanel.scrollHeight;
	}

	function clearLog() {
		logPanel.innerHTML = '';
		logEntries = [];
	}

	// 日志按钮
	document.getElementById('btn-copy-log').addEventListener('click', function () {
		var text = logEntries.map(function (e) { return '[' + e.time + '] ' + e.level.toUpperCase() + ' ' + e.text; }).join('\n');
		navigator.clipboard.writeText(text).then(function () {
			appendLog('system', '日志已复制到剪贴板', Date.now());
		});
	});

	document.getElementById('btn-save-log').addEventListener('click', function () {
		var text = logEntries.map(function (e) { return '[' + e.time + '] ' + e.level.toUpperCase() + ' ' + e.text; }).join('\n');
		var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'ofgui-log-' + new Date().toISOString().replace(/[:.]/g, '-') + '.txt';
		a.click();
		URL.revokeObjectURL(url);
	});

	document.getElementById('btn-clear-log').addEventListener('click', clearLog);

	// SSE 连接管理
	var currentEventSource = null;

	function connectSSE(taskId) {
		if (currentEventSource) {
			currentEventSource.close();
		}

		currentEventSource = new EventSource('/api/logs/' + taskId);

		currentEventSource.onmessage = function (event) {
			try {
				var data = JSON.parse(event.data);
				appendLog(data.level, data.text, data.ts);

				if (data.level === 'system') {
					currentEventSource.close();
					currentEventSource = null;
					enableButtons();
				}
			} catch {
				// 忽略解析错误
			}
		};

		currentEventSource.onerror = function () {
			currentEventSource.close();
			currentEventSource = null;
		};
	}

	// ==============================
	// 按钮状态管理
	// ==============================
	var runButtons = document.querySelectorAll('.btn-run');

	function disableButtons() {
		runButtons.forEach(function (btn) {
			btn.disabled = true;
			btn.dataset.originalText = btn.textContent;
			btn.innerHTML = '<span class="spinner"></span>执行中...';
		});
	}

	function enableButtons() {
		runButtons.forEach(function (btn) {
			btn.disabled = false;
			btn.textContent = btn.dataset.originalText || btn.textContent;
		});
	}

	// ==============================
	// 发布
	// ==============================
	document.getElementById('btn-publish').addEventListener('click', async function () {
		var body = {
			inputPath: document.getElementById('publish-inputPath').value,
			outputPath: document.getElementById('publish-outputPath').value,
			compressed: document.getElementById('publish-compressed').checked,
			noAtlas: document.getElementById('publish-noAtlas').checked,
			packages: document.getElementById('publish-packages').value || undefined,
			branch: document.getElementById('publish-branch').value || undefined,
			projectType: document.getElementById('publish-projectType').value || undefined,
			maxAtlasSize: parseInt(document.getElementById('publish-maxAtlasSize').value) || undefined,
		};

		if (!body.inputPath || !body.outputPath) {
			appendLog('error', '请填写输入项目和输出目录', Date.now());
			return;
		}

		disableButtons();
		clearLog();

		try {
			var resp = await fetch('/api/publish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			var data = await resp.json();
			if (data.error) {
				appendLog('error', data.error, Date.now());
				enableButtons();
				return;
			}
			connectSSE(data.taskId);
		} catch (err) {
			appendLog('error', '请求失败: ' + err.message, Date.now());
			enableButtons();
		}
	});

	// ==============================
	// 还原
	// ==============================
	document.getElementById('btn-restore').addEventListener('click', async function () {
		var body = {
			inputPath: document.getElementById('restore-inputPath').value,
			outputPath: document.getElementById('restore-outputPath').value,
			force: document.getElementById('restore-force').checked,
			packages: document.getElementById('restore-packages').value || undefined,
			projectType: document.getElementById('restore-projectType').value || undefined,
			fontDir: document.getElementById('restore-fontDir').value || undefined,
			langDir: document.getElementById('restore-langDir').value || undefined,
		};

		if (!body.inputPath || !body.outputPath) {
			appendLog('error', '请填写输入目录和输出目录', Date.now());
			return;
		}

		disableButtons();
		clearLog();

		try {
			var resp = await fetch('/api/restore', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			var data = await resp.json();
			if (data.error) {
				appendLog('error', data.error, Date.now());
				enableButtons();
				return;
			}
			connectSSE(data.taskId);
		} catch (err) {
			appendLog('error', '请求失败: ' + err.message, Date.now());
			enableButtons();
		}
	});

	// ==============================
	// 检查
	// ==============================
	document.getElementById('btn-inspect').addEventListener('click', async function () {
		var inputPath = document.getElementById('inspect-inputPath').value;
		if (!inputPath) {
			appendLog('error', '请填写输入项目路径', Date.now());
			return;
		}

		disableButtons();
		appendLog('info', '正在检查项目: ' + inputPath, Date.now());

		try {
			var resp = await fetch('/api/inspect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ inputPath: inputPath }),
			});
			var data = await resp.json();

			if (data.error) {
				appendLog('error', data.error, Date.now());
			} else {
				renderInspectReport(data.report);
				appendLog('info', '检查完成', Date.now());
			}
		} catch (err) {
			appendLog('error', '请求失败: ' + err.message, Date.now());
		}

		enableButtons();
	});

	function renderInspectReport(report) {
		var container = document.getElementById('inspect-result');
		if (!report) {
			container.innerHTML = '<p style="color:var(--text-muted);">无报告数据</p>';
			return;
		}

		var html = '';

		// 概览统计卡片
		html += '<div class="stat-grid">';
		html += statCard('项目 ID', report.projectId);
		html += statCard('类型', report.projectType);
		html += statCard('版本', report.version);
		html += statCard('包数量', report.totals.packages);
		html += statCard('图片', report.totals.images);
		html += statCard('音效', report.totals.sounds);
		html += statCard('字体', report.totals.fonts);
		html += statCard('组件', report.totals.components);
		html += statCard('控制器', report.totals.controllers);
		html += statCard('动画', report.totals.transitions);
		html += '</div>';

		// 包详情表
		if (report.packages && report.packages.length > 0) {
			html += '<table>';
			html += '<tr><th>包名</th><th>ID</th><th>图片</th><th>音效</th><th>字体</th><th>组件</th></tr>';
			report.packages.forEach(function (pkg) {
				html += '<tr>';
				html += '<td>' + escapeHtml(pkg.name) + '</td>';
				html += '<td>' + escapeHtml(pkg.id) + '</td>';
				html += '<td>' + pkg.resources.images.count + '</td>';
				html += '<td>' + pkg.resources.sounds.count + '</td>';
				html += '<td>' + pkg.resources.fonts.count + '</td>';
				html += '<td>' + pkg.resources.components.count + '</td>';
				html += '</tr>';
			});
			html += '</table>';
		}

		container.innerHTML = html;
	}

	function statCard(label, value) {
		return '<div class="stat-card"><div class="result-card-title">' + escapeHtml(label) + '</div><div class="stat-card-value">' + escapeHtml(String(value)) + '</div></div>';
	}

	// ==============================
	// 列出字体
	// ==============================
	document.getElementById('btn-fonts').addEventListener('click', async function () {
		var inputPath = document.getElementById('fonts-inputPath').value;
		if (!inputPath) {
			appendLog('error', '请填写输入目录', Date.now());
			return;
		}

		disableButtons();
		appendLog('info', '正在搜索字体: ' + inputPath, Date.now());

		try {
			var body = {
				inputPath: inputPath,
				packages: document.getElementById('fonts-packages').value || undefined,
			};
			var resp = await fetch('/api/list-fonts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			var data = await resp.json();

			if (data.error) {
				appendLog('error', data.error, Date.now());
			} else {
				renderFontsList(data.fonts);
				appendLog('info', '找到 ' + (data.fonts ? data.fonts.length : 0) + ' 个字体', Date.now());
			}
		} catch (err) {
			appendLog('error', '请求失败: ' + err.message, Date.now());
		}

		enableButtons();
	});

	function renderFontsList(fonts) {
		var container = document.getElementById('fonts-result');
		if (!fonts || fonts.length === 0) {
			container.innerHTML = '<p style="color:var(--text-muted);padding:12px;">未找到 TTF 字体</p>';
			return;
		}

		var html = '<table>';
		html += '<tr><th>包名</th><th>字体名称</th><th>文件名</th><th>输出路径</th></tr>';
		fonts.forEach(function (font) {
			html += '<tr>';
			html += '<td>' + escapeHtml(font.packageName) + '</td>';
			html += '<td>' + escapeHtml(font.fontName) + '</td>';
			html += '<td>' + escapeHtml(font.fileName) + '</td>';
			html += '<td>' + escapeHtml(font.relativeOutputPath) + '</td>';
			html += '</tr>';
		});
		html += '</table>';
		container.innerHTML = html;
	}

	// ==============================
	// 工具函数
	// ==============================
	function escapeHtml(str) {
		var div = document.createElement('div');
		div.textContent = str;
		return div.innerHTML;
	}
})();
