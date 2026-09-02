#!/usr/bin/env node
'use strict';
const path = require('path');
const tsxPath = path.resolve(__dirname, '..', 'node_modules', '.bin', 'tsx');
const { execFileSync } = require('child_process');
const serverPath = path.resolve(__dirname, '..', 'src', 'server.ts');

const port = process.env.PORT || '3210';
const host = process.env.HOST || 'localhost';

try {
	execFileSync(process.execPath, ['--import', 'tsx', serverPath], {
		stdio: 'inherit',
		env: { ...process.env, PORT: port, HOST: host },
	});
} catch (e) {
	process.exit(e.status || 1);
}
