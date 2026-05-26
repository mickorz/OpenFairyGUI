import fs from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

// restore 后必定不同的属性，对比时跳过
// fileName: restore 通过 src 反解析出文件路径，源文件不包含此冗余信息
// group/idnum: restore 后引用 ID 重新生成
// selected: 二进制格式不保留控制器选中页面，restore 总是设为 0
// 以下为二进制格式不保留的元数据属性（发布时丢失，非 restore 问题）:
// locked/advanced/exported: 编辑器锁定/高级/导出标记
// initName: 自定义初始名称
// filter/filterData: 过滤器效果
// scrollBar/restrictSize/scroll: 滚动相关配置
// bgColorEnabled/bgColor: 背景色设置
// designImage*: 设计辅助图层（仅编辑器可见）
// underlaySoftness/faceDilate/strokeSize: TextMeshPro 专有属性
const IGNORED_ATTRS = new Set([
	'id', 'group', 'idnum', 'fileName', 'selected',
	'locked', 'advanced', 'exported', 'initName',
	'filter', 'filterData',
	'scrollBar', 'restrictSize', 'scroll',
	'bgColorEnabled', 'bgColor',
	'designImageAlpha', 'designImageLayer', 'designImageOffsetX', 'designImageOffsetY',
	'underlaySoftness', 'faceDilate', 'strokeSize',
]);

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
	input: 'true',
};

// 标签名等价映射: 源文件使用 movieclip，restore 输出使用 jta
// text/inputtext: FairyGUI 编辑器对输入文本框可能使用 text，restore 使用 inputtext
const TAG_EQUIVALENTS: Record<string, string> = {
	movieclip: 'jta',
	jta: 'movieclip',
	text: 'inputtext',
	inputtext: 'text',
};

// 不参与对比的包描述文件
const SKIPPED_XML_FILES = new Set(['package.xml', 'package_branch.xml']);

// 扩展定义元素标签 - 当为空（无属性）时不参与对比
// 源文件在所有属性为默认值时省略这些元素，restore 总是输出
const EXTENSION_TAGS = new Set(['Button', 'Label', 'Slider', 'ProgressBar', 'ScrollBar',
	'ScrollPane', 'Tree', 'List', 'ComboBox', 'ProgressBar', 'GearXY']);

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

// 值等价表: restore 使用的规范化名称 vs 源文件使用的原始名称
const VALUE_EQUIVS: Record<string, string> = {
	'eclipse': 'ellipse', 'ellipse': 'eclipse',
	'regular_polygon': 'regularpolygon', 'regularpolygon': 'regular_polygon',
	'width': 'width-width', 'width-width': 'width',
	'height': 'height-height', 'height-height': 'height',
};

function valueSegmentMatch(a: string, b: string): boolean {
	if (a === b) return true;
	if (BOOL_EQ[a] === b) return true;
	if (VALUE_EQUIVS[a] === b) return true;
	return false;
}

function valuesMatch(expected: string, actual: string): boolean {
	if (expected === actual) return true;
	if (isNumericClose(expected, actual)) return true;

	// 逗号/管道分隔值逐段比较（如 sidePair, gear values）
	if ((expected.includes(',') || expected.includes('|')) && (actual.includes(',') || actual.includes('|'))) {
		const eParts = expected.split(/[|,]/);
		const aParts = actual.split(/[|,]/);
		if (eParts.length === aParts.length) {
			return eParts.every((e, i) => {
				const eTrim = e.trim(), aTrim = aParts[i].trim();
				return eTrim === aTrim || isNumericClose(eTrim, aTrim) || valueSegmentMatch(eTrim, aTrim);
			});
		}
	}

	// 布尔值等价比较
	if (BOOL_EQ[expected] === actual) return true;

	// 值名称等价比较
	if (VALUE_EQUIVS[expected] === actual) return true;

	// 颜色值大小写不敏感
	if (expected.startsWith('#') && actual.startsWith('#') && expected.length === actual.length) {
		return expected.toLowerCase() === actual.toLowerCase();
	}

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
// 优先用 name/id，其次用 target（用于过渡项匹配）
function getNodeKey(node: any): string | null {
	const attrs = node[':@'];
	if (!attrs) return null;
	return attrs.name || attrs.id || attrs.target || null;
}

// 将子节点统一为数组
function asArray(value: any): any[] {
	if (value == null) return [];
	if (Array.isArray(value)) return value;
	return [value];
}

// 递归对比两个解析后的 XML 节点
// fast-xml-parser 将空标签如 <Button/> 解析为 "" 或非对象值，需要跳过
function diffNodes(
	sourceNode: any,
	restoredNode: any,
	context: { pkg: string; comp: string; path: string },
	diffs: DiffEntry[],
): void {
	// 非对象节点（空标签如 <Button/> 解析为 ""）无需对比属性和子节点
	if (typeof sourceNode !== 'object' || typeof restoredNode !== 'object') return;

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
		// 支持标签名等价: movieclip <-> jta, text <-> inputtext
		// 合并直接匹配和等价匹配的子节点
		const equivTag = TAG_EQUIVALENTS[tag];
		const directChildren = restoredKeys.has(tag) ? asArray(restoredNode[tag]) : [];
		const equivChildren = equivTag && restoredKeys.has(equivTag) ? asArray(restoredNode[equivTag]) : [];
		const restoredChildren = [...directChildren, ...equivChildren];

		// 扩展定义标签全为空元素时跳过（源文件可能省略，restore 总是输出）
		if (EXTENSION_TAGS.has(tag)
			&& sourceChildren.every(c => typeof c !== 'object' || (c[':@'] && Object.keys(c[':@']).length === 0) || !c[':@'])
			&& restoredChildren.every(c => typeof c !== 'object' || (c[':@'] && Object.keys(c[':@']).length === 0) || !c[':@'])) {
			continue;
		}

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

			if (matched === null) {
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

	// 还原端有但源没有的标签（跳过等价标签）
	for (const tag of restoredKeys) {
		if (sourceKeys.includes(tag)) continue;
		const equivTag = TAG_EQUIVALENTS[tag];
		if (equivTag && sourceKeys.includes(equivTag)) continue;
			// 空扩展定义元素跳过
			if (EXTENSION_TAGS.has(tag)) continue;
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
