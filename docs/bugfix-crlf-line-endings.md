# Bug修复: 还原输出的XML文件使用LF换行导致FairyGUI编辑器无法识别包

> 日期: 2026-05-27
> 影响版本: commit 3225170 及之前所有版本
> 修复文件: `packages/core/src/io/project-writer.ts`

## 问题现象

FairyGUI编辑器打开还原输出的项目目录时，能识别到项目文件（.fairy），但左侧包列表为空，看不到任何包和组件。

## 根因分析

`project-writer.ts` 中所有XML输出使用 `\n`（LF）作为换行符：

```typescript
// 修复前
const fairyXml = `<?xml version="1.0" encoding="utf-8"?>\n`
    + `<projectDescription .../>;\n`;

// renderXmlNode 中
return `${indent}<${tagName}...>\n${childLines.join('\n')}\n${indent}</${tagName}>`;

// package.xml 输出
return `${lines.join('\n')}\n`;
```

FairyGUI编辑器是Windows平台.NET应用，解析XML文件时严格要求 `\r\n`（CRLF）换行。使用LF换行的XML文件无法被正确解析，导致包列表扫描失败。

## 对比验证

```bash
# 源文件（编辑器创建，CRLF）
$ file SourceFgui/assets/Bag/package.xml
XML 1.0 document, ASCII text, with CRLF line terminators

# 还原文件（修复前，LF）
$ file CrackFgui/assets/Bag/package.xml
XML 1.0 document, ASCII text

# 还原文件（修复后，CRLF）
$ file CrackFgui/assets/Bag/package.xml
XML 1.0 document, ASCII text, with CRLF line terminators
```

## 修复方案

在 `project-writer.ts` 顶部定义CRLF常量，替换所有XML输出中的换行：

```typescript
// FairyGUI 编辑器（Windows）要求 CRLF 换行
const NL = '\r\n';
```

### 修复点1: .fairy 文件输出

```typescript
// 修复前
const fairyXml = `<?xml version="1.0" encoding="utf-8"?>\n`
    + `<projectDescription .../>\n`;

// 修复后
const fairyXml = `<?xml version="1.0" encoding="utf-8"?>${NL}<projectDescription .../>`;
```

### 修复点2: package.xml / branchDescription 输出

```typescript
// 修复前
return `${lines.join('\n')}\n`;

// 修复后
return `${lines.join(NL)}${NL}`;
```

### 修复点3: renderXmlNode 模板

```typescript
// 修复前
return node.map(...).join('\n');
return `${indent}<${tagName}...>\n${childLines.join('\n')}\n${indent}</${tagName}>`;

// 修复后
return node.map(...).join(NL);
return `${indent}<${tagName}...>${NL}${childLines.join(NL)}${NL}${indent}</${tagName}>`;
```

### 修复点4: 组件XML（fast-xml-parser XMLBuilder输出）

`fast-xml-parser` 的 `XMLBuilder` 内部硬编码使用 `\n`，无法配置。采用后处理替换：

```typescript
// 修复前
await fs.writeFile(path, builder.build(xmlObj) as string);

// 修复后
await fs.writeFile(path, (builder.build(xmlObj) as string).replace(/(?<!\r)\n/g, '\r\n'));
```

正则 `(?<!\r)\n` 确保只替换纯LF，不重复替换已有的CRLF。

## 验证

- Roundtrip测试通过: 205文件，201匹配，0差异，4缺失（孤立组件）
- FairyGUI编辑器正常打开还原项目，包列表完整显示
- 所有输出文件确认使用CRLF换行

## 教训

1. Windows平台的.NET应用通常要求CRLF换行，生成文件时需注意平台兼容性
2. 第三方库（如fast-xml-parser）可能硬编码LF，需要后处理转换
3. 换行符差异在diff工具中不可见，容易遗漏，应纳入项目测试
