# 工程循环校验 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建一个 roundtrip 测试，验证 publish -> restore 循环后还原的 FairyGUI 工程 XML 属性与原工程保持一致。

**Architecture:** 测试分三阶段运行：先 publish SourceFgui 到 PublishFolder，再 restore PublishFolder 到 CrackFgui，最后递归对比两个工程的 XML 组件文件，输出 JSON 差异报告。

**Tech Stack:** ava 测试框架, Node.js fs/path, fast-xml-parser (新增依赖), sharp (已有)

**Design Doc:** `docs/plans/2026-05-26-roundtrip-validation-design.md`

---

### Task 1: 添加 fast-xml-parser 依赖

**Files:**
- Modify: `packages/functions/package.json`

**Step 1: 安装依赖**

Run:
```bash
cd packages/functions && pnpm add -D fast-xml-parser
```

**Step 2: 验证安装**

Run:
```bash
cd packages/functions && node -e "const {XMLParser} = require('fast-xml-parser'); console.log('ok')"
```
Expected: 输出 `ok`

**Step 3: Commit**

```bash
git add packages/functions/package.json packages/functions/pnpm-lock.yaml
git commit -m "chore: add fast-xml-parser dev dependency for roundtrip test"
```

---

### Task 2: 编写 XML 对比工具函数

**Files:**
- Create: `packages/functions/src/roundtrip-diff.ts`

这是核心对比引擎，提供 `diffXmlProjects()` 函数。

**Step 1: 编写 diff 工具函数**

创建 `packages/functions/src/roundtrip-diff.ts`，包含以下功能：

```typescript
import { XMLParser } from 'fast-xml-parser';
import fs from 'node:fs/promises';
import path from 'node:path';

// 已知差异白名单：这些属性在 restore 后会变化，对比时跳过
const IGNORED_ATTRS = new Set([
  'id',           // restore 后 ID 重新生成
]);

// 数值属性容差
const NUMERIC_TOLERANCE = 0.01;

// 默认值映射：源文件有显式默认值但还原文件省略了
const DEFAULT_VALUE_MAP: Record<string, string> = {
  'selected': '0',
  'playing': 'true',
  'visible': 'true',
  'touchable': 'true',
  'exported': 'false',
  'grayed': 'false',
  'checked': 'false',
};

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

/**
 * 递归对比两个 XML 节点树的属性差异
 */
function diffNodes(
  sourceNode: any,
  restoredNode: any,
  context: { pkg: string; comp: string; path: string },
  diffs: DiffEntry[],
): void {
  // 对比属性
  const sourceAttrs = sourceNode[':@'] ?? {};
  const restoredAttrs = restoredNode[':@'] ?? {};
  const allAttrKeys = new Set([...Object.keys(sourceAttrs), ...Object.keys(restoredAttrs)]);

  for (const attr of allAttrKeys) {
    if (IGNORED_ATTRS.has(attr)) continue;

    const sourceVal = String(sourceAttrs[attr] ?? '');
    const restoredVal = String(restoredAttrs[attr] ?? '');

    // 跳过两边都没有的属性
    if (!sourceVal && !restoredVal) continue;

    // 处理默认值差异：源有默认值，还原没有
    if (!restoredVal && sourceVal && DEFAULT_VALUE_MAP[attr] === sourceVal) continue;
    if (!sourceVal && restoredVal && DEFAULT_VALUE_MAP[attr] === restoredVal) continue;

    // 数值容差比较
    if (isNumericClose(sourceVal, restoredVal)) continue;

    // ui:// 引用中的包 ID 可能变化，跳过
    if (sourceVal.startsWith('ui://') && restoredVal.startsWith('ui://')) {
      // 比较 src 部分（去掉包 ID 前缀）
      const sourceResId = sourceVal.slice(5 + 8); // 去掉 ui:// + 8字符包ID
      const restoredResId = restoredVal.slice(5 + 8);
      if (sourceResId === restoredResId) continue;
    }

    if (sourceVal !== restoredVal) {
      diffs.push({
        package: context.pkg,
        component: context.comp,
        path: `${context.path}.${attr}`,
        expected: sourceVal,
        actual: restoredVal,
        type: 'attribute_mismatch',
      });
    }
  }

  // 递归对比子节点
  // ... (按标签名和 name 属性匹配)
}

function isNumericClose(a: string, b: string): boolean {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  if (isNaN(numA) || isNaN(numB)) return false;
  return Math.abs(numA - numB) < NUMERIC_TOLERANCE;
}

/**
 * 对比两个工程的 XML 文件
 */
export async function diffXmlProjects(
  sourceDir: string,
  restoredDir: string,
): Promise<DiffReport> {
  // 遍历 assets/ 下的包目录，对比同名组件 XML
  // ...
}
```

注意：上面的代码是示意性的，实现时需要：
1. 使用 `fast-xml-parser` 的 `ignoreAttributes: false` + `preserveNodeOrder: true` + `isArray` 选项确保属性和子节点正确解析
2. 递归对比子节点时，先按 `name` 属性匹配，无 `name` 时按标签+顺序匹配
3. 处理 `displayList`、`controller`、`transition` 等特殊嵌套结构

**Step 2: 导出函数**

确保在 `packages/functions/src/index.ts` 中导出 roundtrip-diff 的公共类型。

**Step 3: Commit**

```bash
git add packages/functions/src/roundtrip-diff.ts
git commit -m "feat: add XML diff engine for roundtrip validation"
```

---

### Task 3: 编写 roundtrip 测试文件

**Files:**
- Create: `packages/functions/test/roundtrip.test.ts`

**Step 1: 编写测试骨架**

```typescript
import test from 'ava';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { NodeIO } from '@openfairygui/core';
import { publish, restore } from '../src/index.js';
import { diffXmlProjects, type DiffReport } from '../src/roundtrip-diff.js';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const TEST_PROJECT_DIR = path.join(ROOT_DIR, 'TestProject');
const SOURCE_DIR = path.join(TEST_PROJECT_DIR, 'SourceFgui');
const PUBLISH_DIR = path.join(TEST_PROJECT_DIR, 'PublishFolder');
const CRACK_DIR = path.join(TEST_PROJECT_DIR, 'CrackFgui');
const REPORT_PATH = path.join(TEST_PROJECT_DIR, 'roundtrip-report.json');

// (复用 restore.test.ts 中的 createRestoreFs, createPublishFs, cropImage, extractImage)

test.serial('roundtrip: publish -> restore -> diff produces report', async (t) => {
  // 1. 清理
  await fs.rm(PUBLISH_DIR, { recursive: true, force: true });
  await fs.rm(CRACK_DIR, { recursive: true, force: true });

  // 2. Publish
  const io = new NodeIO();
  const fairyPath = path.join(SOURCE_DIR, 'FairyGUI-Unity-Examples.fairy');
  const doc = await io.readProject(fairyPath);
  await doc.transform(publish({
    output: PUBLISH_DIR,
    fs: createPublishFs(),
    encoder: sharp,
    basePath: path.join(SOURCE_DIR, 'assets'),
  }));
  t.true(await fs.stat(PUBLISH_DIR).then(() => true).catch(() => false), 'publish output exists');

  // 3. Restore
  const result = await restore({
    inputDir: PUBLISH_DIR,
    output: CRACK_DIR,
    fs: createRestoreFs(),
    force: true,
    cropImage,
    extractImage,
    getImageSize: async (p) => {
      const meta = await sharp(p).metadata();
      return meta.width && meta.height ? { width: meta.width, height: meta.height } : null;
    },
    padImage: async (src, out, w, h) => {
      const meta = await sharp(src).metadata();
      await sharp(src).extend({
        top: 0, left: 0,
        right: w - (meta.width ?? 0),
        bottom: h - (meta.height ?? 0),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      }).png().toFile(out);
    },
  });
  t.truthy(result, 'restore completed');

  // 4. Diff
  const report = await diffXmlProjects(
    path.join(SOURCE_DIR, 'assets'),
    path.join(CRACK_DIR, 'assets'),
  );

  // 5. 写入报告
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');

  // 6. 输出摘要
  console.log(`Roundtrip report: ${report.summary.totalFiles} files, ${report.summary.diffFiles} diffs, ${report.summary.missingFiles} missing`);

  // 测试不因差异失败 - 重点是生成报告
  t.true(report.summary.totalFiles > 0, 'found files to compare');
});
```

**Step 2: 复用 restore.test.ts 的辅助函数**

将 `createRestoreFs`、`createPublishFs`、`cropImage`、`extractImage` 等辅助函数从 `restore.test.ts` 复制到本文件（或抽取为共享模块）。考虑代码量，直接复制到本文件更简单。

**Step 3: Commit**

```bash
git add packages/functions/test/roundtrip.test.ts
git commit -m "test: add roundtrip publish-restore-diff test"
```

---

### Task 4: 完善 XML 对比引擎实现

**Files:**
- Modify: `packages/functions/src/roundtrip-diff.ts`

**Step 1: 完善 diffXmlProjects 函数**

实现完整的 `diffXmlProjects` 函数，包括：

1. 扫描 `sourceDir` 下所有子目录（每个子目录是一个包）
2. 跳过 `images/` 等非组件目录，只对比 `.xml` 文件
3. 对每个包目录，在 `restoredDir` 中找同名目录
4. 逐文件对比 XML 内容

```typescript
export async function diffXmlProjects(
  sourceDir: string,
  restoredDir: string,
): Promise<DiffReport> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    preserveNodeOrder: true,
    isArray: (name) => {
      // 这些标签可能有多个子节点
      return ['controller', 'image', 'graph', 'text', 'component',
        'loader', 'movieclip', 'jta', 'list', 'group', 'richtext',
        'inputtext', 'loader3d', 'gearDisplay', 'gearColor', 'gearLook',
        'gearSize', 'gearXY', 'gearText', 'gearIcon', 'relation',
        'transition', 'item', 'action'].includes(name);
    },
  });

  const diffs: DiffEntry[] = [];
  const missingInRestored: string[] = [];
  const extraInRestored: string[] = [];

  // 收集源目录中的包和 XML 文件
  const packages = await fs.readdir(sourceDir);
  let totalFiles = 0;
  let matchingFiles = 0;
  let diffFiles = 0;
  let missingFiles = 0;

  for (const pkgName of packages) {
    const sourcePkgDir = path.join(sourceDir, pkgName);
    const restoredPkgDir = path.join(restoredDir, pkgName);

    if (!(await fs.stat(sourcePkgDir).then(s => s.isDirectory()).catch(() => false))) continue;
    if (!(await fs.stat(restoredPkgDir).then(s => s.isDirectory()).catch(() => false))) {
      missingInRestored.push(pkgName);
      continue;
    }

    // 递归收集源目录 XML 文件
    const sourceFiles = await collectXmlFiles(sourcePkgDir);
    const restoredFiles = await collectXmlFiles(restoredPkgDir);

    const sourceSet = new Set(sourceFiles.map(f => f.relative));
    const restoredSet = new Set(restoredFiles.map(f => f.relative));

    for (const relPath of sourceSet) {
      totalFiles++;
      if (!restoredSet.has(relPath)) {
        missingInRestored.push(`${pkgName}/${relPath}`);
        missingFiles++;
        continue;
      }

      // 读取并解析两个 XML
      const sourceXml = await fs.readFile(path.join(sourcePkgDir, relPath), 'utf-8');
      const restoredXml = await fs.readFile(path.join(restoredPkgDir, relPath), 'utf-8');

      const sourceParsed = parser.parse(sourceXml);
      const restoredParsed = parser.parse(restoredXml);

      const fileDiffs: DiffEntry[] = [];
      diffNodes(sourceParsed, restoredParsed, {
        pkg: pkgName,
        comp: relPath.replace(/\.xml$/i, ''),
        path: '',
      }, fileDiffs);

      if (fileDiffs.length > 0) {
        diffs.push(...fileDiffs);
        diffFiles++;
      } else {
        matchingFiles++;
      }
    }

    for (const relPath of restoredSet) {
      if (!sourceSet.has(relPath)) {
        extraInRestored.push(`${pkgName}/${relPath}`);
      }
    }
  }

  return {
    summary: { totalFiles, matchingFiles, diffFiles, missingFiles },
    diffs,
    missingInRestored,
    extraInRestored,
  };
}
```

**Step 2: 完善 diffNodes 递归对比**

关键实现点：
- 使用 `fast-xml-parser` 解析后的结构：`{ 'tagName': { ...子节点 }, ':@': { ...属性 } }`
- 遍历源节点的所有键（排除 `':@'`），在还原节点中找对应子节点
- 先按 `name` 属性匹配同名子节点，无 `name` 时按顺序匹配
- 属性比较使用白名单跳过和数值容差

**Step 3: 添加 collectXmlFiles 辅助函数**

```typescript
async function collectXmlFiles(dir: string, base = ''): Promise<Array<{ fullPath: string; relative: string }>> {
  const results: Array<{ fullPath: string; relative: string }> = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relative = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...await collectXmlFiles(fullPath, relative));
    } else if (entry.name.endsWith('.xml')) {
      results.push({ fullPath, relative });
    }
  }
  return results;
}
```

**Step 4: Commit**

```bash
git add packages/functions/src/roundtrip-diff.ts
git commit -m "feat: complete XML diff engine with recursive node comparison"
```

---

### Task 5: 运行测试并验证报告

**Step 1: 运行测试**

Run:
```bash
cd packages/functions && npx ava test/roundtrip.test.ts --verbose
```

**Step 2: 检查报告**

Run:
```bash
cat TestProject/roundtrip-report.json | head -50
```

查看 `summary` 部分，确认：
- `totalFiles > 0`：找到了文件
- 报告中生成了 diffs 条目

**Step 3: 根据报告调整白名单**

根据实际报告内容，可能需要：
- 添加更多到 `IGNORED_ATTRS`（如 restore 已知的不可还原属性）
- 调整 `DEFAULT_VALUE_MAP`
- 参考 `docs/published-project-restore-limitations.md` 中已确认的不可还原项

**Step 4: Commit 最终版本**

```bash
git add packages/functions/src/roundtrip-diff.ts packages/functions/test/roundtrip.test.ts TestProject/roundtrip-report.json
git commit -m "test: complete roundtrip validation with JSON diff report"
```

---

### Task 6: 清理和收尾

**Step 1: 更新 .gitignore**

将测试产物添加到 `.gitignore`：

```
TestProject/PublishFolder/
TestProject/CrackFgui/
```

注意：`roundtrip-report.json` 不加入 gitignore，保留用于审查。

**Step 2: 验证测试可重复运行**

Run:
```bash
cd packages/functions && npx ava test/roundtrip.test.ts --verbose
```

确认测试幂等：清理 -> publish -> restore -> diff 流程可重复执行。

**Step 3: 最终 Commit**

```bash
git add .gitignore
git commit -m "chore: add publish/restore output to gitignore for roundtrip test"
```
