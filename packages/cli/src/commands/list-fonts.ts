import path from 'node:path';
import { createNodeRestoreFileSystem, listMissingFonts } from '@openfairygui/functions/node';
import type { Command } from 'commander';
import { printJson } from '../utils/json-output.js';

type ListFontsCommandOptions = {
	packages?: string;
	json?: boolean;
};

export function registerListFontsCommand(program: Command): void {
	program
		.command('list-fonts')
		.description('List TTF fonts needed by published binaries')
		.argument('<release-dir>', 'Published release directory')
		.option('-p, --packages <a,b,c>', 'Only scan specific packages (comma-separated)')
		.option('--json', 'Print one JSON result or error (exit 0: success, 1: workflow failure, 2: invalid arguments)')
		.action(async (releaseDir: string, options: ListFontsCommandOptions) => {
			const inputDir = path.resolve(releaseDir);
			const pkgFilter = options.packages
				? options.packages
						.split(',')
						.map((value) => value.trim())
						.filter(Boolean)
				: undefined;

			const fonts = await listMissingFonts({
				inputDir,
				fs: await createNodeRestoreFileSystem(),
				packages: pkgFilter,
			});

			if (options.json) {
				printJson('list-fonts', { fonts });
				return;
			}

			if (fonts.length === 0) {
				console.log('No TTF fonts found in published binaries.');
				return;
			}

			console.log(`Found ${fonts.length} TTF font(s):\n`);
			for (const font of fonts) {
				console.log(`  Package:     ${font.packageName}`);
				console.log(`  Font Name:   ${font.fontName}`);
				console.log(`  File Name:   ${font.fileName}`);
				console.log(`  Output Path: ${font.relativeOutputPath}`);
				console.log();
			}
		});
}
