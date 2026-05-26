import fs from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

// restore 后必定不同的属性，对比时跳过
const IGNORED_ATTRS = new Set(['id', 'group', 'idnum']);

// 数值比较容差
const NUMERIC_TOLERANCE = 0.01;

// 源有显式默认值但还原省略了（或反过来）的属性，视为一致
const DEFAULT_VALUE_MAP: Record<string, string> = {
	selected: '0',
	playing: 'true',
	visible: 'true',
	touchable: 'true',
	exported: 'false',
	grayed: 'false',
	checked: 'false',
	opaque: 'true',
	aspect: 'true',
	margin: '0,0,0,0',
	fillOrigin: '0',
	fillAmount: '100',
};

// 不参与对比的包描述文件
const SKIPPED_XML_FILES = new Set(['package.xml', 'package_branch.xml']);

export interface DiffEntry {
	package: string;
	component: string;
	path: string;
	expected: string;
	actual: string;
	type: 'attribute_mismatch' | 'missing_element' | 'extra_element';
}

export interface DiffReport {
	summary: {
		totalFiles: number;
		matchingFiles: number;
		diffFiles: number;
		missingFiles: number;
	};
	diffs: DiffEntry[];
	missingInRestored: string[];
	extraInRestored: string[];
}

function isNumericClose(a: string, b: string): boolean {
	const numA = parseFloat(a);
	const numB = parseFloat(b);
	if (isNaN(numA) || isNaN(numB)) return false;
	return Math.abs(numA - numB) < NUMERIC_TOLERANCE;
}

// ui:// 引用去掉包 ID 部分，只比较资源 ID
function stripPackageIdFromUiRef(value: string): string {
	if (!value.startsWith('ui://') || value.length <= 13) return value;
	return value.slice(13);
}

// 布尔值等价表: "true"/"1" 和 "false"/"0" 视为一致
const BOOL_EQ: Record<string, string> = { 'true': '1', '1': 'true', 'false': '0', '0': 'false' };

function valuesMatch(expected: string, actual: string): boolean {
	if (expected === actual) return true;
	if (isNumericClose(expected, actual)) return true;

	// 布尔值等价比较
	if (BOOL_EQ[expected] === actual) return true;

	// ui:// 引用只比较资源 ID 部分
	if (expected.startsWith('ui://') && actual.startsWith('ui://')) {
		return stripPackageIdFromUiRef(expected) === stripPackageIdFromUiRef(actual);
	}

	return false;
}

function createParser(): XMLParser {
	return new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '',
		attributesGroupName: ':@',
	});
}

// 获取节点的唯一标识（用于匹配源和还原的对应节点）
function getNodeKey(node: any): string | null {
	const attrs = node[':@'];
	if (!attrs) return null;
	return attrs.name || attrs.id || null;
}

// 将子节点统一为数组
function asArray(value: any): any[] {
	if (value == null) return [];
	if (Array.isArray(value)) return value;
	return [value];
}

// 递归对比两个解析后的 XML 节点
function diffNodes(
	sourceNode: any,
	restoredNode: any,
	context: { pkg: string; comp: string; path: string },
	diffs: DiffEntry[],
): void {
	const sourceAttrs = sourceNode[':@'] ?? {};
	const restoredAttrs = restoredNode[':@'] ?? {};

	// 对比属性
	const allAttrKeys = new Set([...Object.keys(sourceAttrs), ...Object.keys(restoredAttrs)]);
	for (const key of allAttrKeys) {
		if (IGNORED_ATTRS.has(key)) continue;

		const sourceVal = String(sourceAttrs[key] ?? '');
		const restoredVal = String(restoredAttrs[key] ?? '');

		if (!valuesMatch(sourceVal, restoredVal)) {
			// 检查是否为默认值差异（任一端为空，另一端为默认值）
			const defaultVal = DEFAULT_VALUE_MAP[key];
			const isSourceOmission = sourceVal === '' && restoredVal === defaultVal;
			const isRestoredOmission = restoredVal === '' && sourceVal === defaultVal;
			if (!isSourceOmission && !isRestoredOmission) {
				diffs.push({
					package: context.pkg,
					component: context.comp,
					path: `${context.path}.${key}`,
					expected: sourceVal,
					actual: restoredVal,
					type: 'attribute_mismatch',
				});
			}
		}
	}

	// 收集子节点键（排除 :@）
	const sourceKeys = Object.keys(sourceNode).filter((k) => k !== ':@');
	const restoredKeys = new Set(Object.keys(restoredNode).filter((k) => k !== ':@'));

	for (const tag of sourceKeys) {
		const sourceChildren = asArray(sourceNode[tag]);
		const restoredChildren = restoredKeys.has(tag) ? asArray(restoredNode[tag]) : [];

		if (restoredChildren.length === 0 && sourceChildren.length > 0) {
			for (const child of sourceChildren) {
				const key = getNodeKey(child);
				const childPath = key ? `${context.path}/${tag}[@${key}]` : `${context.path}/${tag}`;
				diffs.push({
					package: context.pkg,
					component: context.comp,
					path: childPath,
					expected: '<element>',
					actual: '<missing>',
					type: 'missing_element',
				});
			}
			continue;
		}

		// 按 name/id 匹配，无标识时按顺序匹配
		const unmatchedRestored = [...restoredChildren];
		for (const sourceChild of sourceChildren) {
			const sourceKey = getNodeKey(sourceChild);
			let matched: any = null;
			let matchedIndex = -1;

			if (sourceKey) {
				matchedIndex = unmatchedRestored.findIndex((r) => getNodeKey(r) === sourceKey);
			} else {
				// 无 name/id 时按顺序取第一个未匹配的
				matchedIndex = 0;
			}

			if (matchedIndex >= 0 && matchedIndex < unmatchedRestored.length) {
				matched = unmatchedRestored[matchedIndex];
				unmatchedRestored.splice(matchedIndex, 1);
			}

			const childPath = sourceKey
				? `${context.path}/${tag}[@${sourceKey}]`
				: `${context.path}/${tag}`;

			if (!matched) {
				diffs.push({
					package: context.pkg,
					component: context.comp,
					path: childPath,
					expected: '<element>',
					actual: '<missing>',
					type: 'missing_element',
				});
				continue;
			}

			diffNodes(sourceChild, matched, { ...context, path: childPath }, diffs);
		}

		// 还原端多余的子节点
		for (const extra of unmatchedRestored) {
			const key = getNodeKey(extra);
			const childPath = key ? `${context.path}/${tag}[@${key}]` : `${context.path}/${tag}`;
			diffs.push({
				package: context.pkg,
				component: context.comp,
				path: childPath,
				expected: '<missing>',
				actual: '<element>',
				type: 'extra_element',
			});
		}
	}

	// 还原端有但源没有的标签
	for (const tag of restoredKeys) {
		if (sourceKeys.includes(tag)) continue;
		const restoredChildren = asArray(restoredNode[tag]);
		for (const child of restoredChildren) {
			const key = getNodeKey(child);
			const childPath = key ? `${context.path}/${tag}[@${key}]` : `${context.path}/${tag}`;
			diffs.push({
				package: context.pkg,
				component: context.comp,
				path: childPath,
				expected: '<missing>',
				actual: '<element>',
				type: 'extra_element',
			});
		}
	}
}

function diffXmlContent(
	sourceXml: string,
	restoredXml: string,
	context: { pkg: string; comp: string },
): DiffEntry[] {
	const parser = createParser();
	const sourceParsed = parser.parse(sourceXml);
	const restoredParsed = parser.parse(restoredXml);

	// 默认模式：parsed = { component: { ":@": {...}, ... } }
	// 取第一个非 PI 键的内容
	const getRoot = (parsed: any): any => {
		const keys = Object.keys(parsed).filter((k) => !k.startsWith('?'));
		return keys.length > 0 ? parsed[keys[0]] : null;
	};

	const sourceRoot = getRoot(sourceParsed);
	const restoredRoot = getRoot(restoredParsed);

	if (!sourceRoot || !restoredRoot) return [];

	const diffs: DiffEntry[] = [];
	diffNodes(sourceRoot, restoredRoot, { ...context, path: context.comp }, diffs);
	return diffs;
}

// 递归收集目录下所有 .xml 文件
async function collectXmlFiles(
	dir: string,
	base = '',
): Promise<Array<{ fullPath: string; relative: string }>> {
	const results: Array<{ fullPath: string; relative: string }> = [];
	let entries: import('node:fs').Dirent[];
	try {
		entries = await fs.readdir(dir, { withFileTypes: true });
	} catch {
		return results;
	}

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		const relative = base ? `${base}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			const sub = await collectXmlFiles(fullPath, relative);
			results.push(...sub);
		} else if (entry.isFile() && entry.name.endsWith('.xml') && !SKIPPED_XML_FILES.has(entry.name)) {
			results.push({ fullPath, relative });
		}
	}
	return results;
}

export async function diffXmlProjects(sourceDir: string, restoredDir: string): Promise<DiffReport> {
	const diffs: DiffEntry[] = [];
	const missingInRestored: string[] = [];
	const extraInRestored: string[] = [];

	// 扫描源目录下的所有子目录（每个是一个包）
	const sourceEntries = await fs.readdir(sourceDir, { withFileTypes: true });
	const sourcePackages = new Map<string, string>();
	for (const entry of sourceEntries) {
		if (entry.isDirectory()) {
			sourcePackages.set(entry.name, path.join(sourceDir, entry.name));
		}
	}

	// 扫描还原目录
	const restoredEntries = await fs.readdir(restoredDir, { withFileTypes: true });
	const restoredPackages = new Map<string, string>();
	for (const entry of restoredEntries) {
		if (entry.isDirectory()) {
			restoredPackages.set(entry.name, path.join(restoredDir, entry.name));
		}
	}

	let totalFiles = 0;
	let matchingFiles = 0;
	let diffFiles = 0;
	let missingFiles = 0;

	// 遍历每个源包
	for (const [pkgName, pkgDir] of sourcePackages) {
		const sourceFiles = await collectXmlFiles(pkgDir);
		const restoredPkgDir = restoredPackages.get(pkgName);

		for (const sourceFile of sourceFiles) {
			totalFiles++;
			const relativePath = `${pkgName}/${sourceFile.relative}`;

			if (!restoredPkgDir) {
				missingInRestored.push(relativePath);
				missingFiles++;
				continue;
			}

			const restoredFilePath = path.join(restoredPkgDir, sourceFile.relative);
			let restoredXml: string;
			try {
				restoredXml = await fs.readFile(restoredFilePath, 'utf-8');
			} catch {
				missingInRestored.push(relativePath);
				missingFiles++;
				continue;
			}

			const sourceXml = await fs.readFile(sourceFile.fullPath, 'utf-8');
			const fileDiffs = diffXmlContent(sourceXml, restoredXml, {
				pkg: pkgName,
				comp: sourceFile.relative,
			});

			if (fileDiffs.length > 0) {
				diffs.push(...fileDiffs);
				diffFiles++;
			} else {
				matchingFiles++;
			}
		}
	}

	// 检查还原端多余的文件
	for (const [pkgName, pkgDir] of restoredPackages) {
		if (!sourcePackages.has(pkgName)) {
			const restoredFiles = await collectXmlFiles(pkgDir);
			for (const f of restoredFiles) {
				extraInRestored.push(`${pkgName}/${f.relative}`);
			}
			continue;
		}

		const sourceFiles = await collectXmlFiles(sourcePackages.get(pkgName)!);
		const sourceRelatives = new Set(sourceFiles.map((f) => f.relative));
		const restoredFiles = await collectXmlFiles(pkgDir);
		for (const f of restoredFiles) {
			if (!sourceRelatives.has(f.relative)) {
				extraInRestored.push(`${pkgName}/${f.relative}`);
			}
		}
	}

	return {
		summary: {
			totalFiles,
			matchingFiles,
			diffFiles,
			missingFiles,
		},
		diffs,
		missingInRestored,
		extraInRestored,
	};
}
