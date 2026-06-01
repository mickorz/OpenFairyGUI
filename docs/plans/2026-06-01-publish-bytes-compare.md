# FairyGUI 发布二进制对比实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 自动化对比 restore->publish 的 roundtrip 二进制输出与原始文件的差异，定位并修复 bug

**Architecture:** 三步流水线：还原(Source->RestoreFguiProject)->发布(RestoreFguiProject->PublishBytes)->二进制对比(compare.cjs)。对比脚本解析两个 .bytes 文件，逐块、逐字段输出差异。

**Tech Stack:** Node.js, TypeScript/JavaScript, pako (解压), @openfairygui/core (BinaryReader/ByteBuffer)

---

### Task 1: 清理 RestoreFguiProject 和 PublishBytes 目录

**Files:**
- 清理: `TestProject/PublishBytesCompare/RestoreFguiProject/`
- 清理: `TestProject/PublishBytesCompare/PublishBytes/` (仅保留 Source 内容)

**Step 1: 清理 RestoreFguiProject**

```powershell
Remove-Item "D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare\RestoreFguiProject\*" -Recurse -Force -ErrorAction SilentlyContinue
```

**Step 2: 清理 PublishBytes 中之前生成的文件**

只删除 `UI_fui.bytes`（重新发布的），保留 `UI_fui_Source.bytes`（原始的）

```powershell
Remove-Item "D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare\PublishBytes\UI_fui.bytes" -Force -ErrorAction SilentlyContinue
```

**Step 3: 验证目录状态**

```powershell
ls "D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare\RestoreFguiProject"
ls "D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare\PublishBytes"
```

Expected: RestoreFguiProject 为空, PublishBytes 只剩 UI_fui_Source.bytes

---

### Task 2: 执行 ofgui restore 从 Source 还原到 RestoreFguiProject

**Files:**
- 输入: `TestProject/PublishBytesCompare/Source/`
- 输出: `TestProject/PublishBytesCompare/RestoreFguiProject/`

**Step 1: 执行还原命令**

```powershell
cd D:\CrackALL\OpenFairyGUI
npx ofgui restore "D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare\Source" --output "D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare\RestoreFguiProject" --force --lang-dir "D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare\Source"
```

**Step 2: 验证还原结果**

```powershell
ls "D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare\RestoreFguiProject"
```

Expected: 应该看到 .fairy 文件和 assets/ 目录结构

**Step 3: 检查还原的项目文件**

确认 `RestoreFguiProject` 中有 `.fairy` 文件可以打开

---

### Task 3: 执行 ofgui publish 从还原项目发布到 PublishBytes

**Files:**
- 输入: `TestProject/PublishBytesCompare/RestoreFguiProject/`
- 输出: `TestProject/PublishBytesCompare/PublishBytes/UI_fui.bytes`

**Step 1: 执行发布命令**

```powershell
cd D:\CrackALL\OpenFairyGUI
npx ofgui publish "D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare\RestoreFguiProject" --output "D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare\PublishBytes"
```

注意: 发布时会同时生成图集 PNG 文件，但我们只关心 `UI_fui.bytes`

**Step 2: 验证发布结果**

```powershell
$s = Get-Item "D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare\PublishBytes\UI_fui.bytes"
$o = Get-Item "D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare\Source\UI_fui_Source.bytes"
Write-Output "Published: $($s.Length) bytes"
Write-Output "Source:    $($o.Length) bytes"
Write-Output "Diff:      $($s.Length - $o.Length) bytes"
```

Expected: 两个文件大小应该接近，如果有明显差异则确认了 bug 存在

---

### Task 4: 编写 compare.cjs 二进制对比脚本

**Files:**
- Create: `TestProject/PublishBytesCompare/compare.cjs`

**Step 1: 创建对比脚本**

```javascript
// compare.cjs - FairyGUI 二进制对比工具
// 解析两个 .bytes 文件并逐块对比差异

const fs = require('fs');
const path = require('path');
const { inflateRaw } = require('pako');

const FGUI_MAGIC = 0x46475549;
const NULL_STRING_INDEX = 65534;
const EMPTY_STRING_INDEX = 65533;

const BIN_ITEM_TYPES = {
  0: 'Image', 1: 'MovieClip', 2: 'Sound', 3: 'Component',
  4: 'Atlas', 5: 'Font', 6: 'Swf', 7: 'Misc', 8: 'Spine', 9: 'DragonBones',
};

// ========== ByteBuffer (读取器) ==========
class ByteBuffer {
  constructor(buffer, byteOffset = 0, byteLength) {
    const len = byteLength ?? buffer.byteLength - byteOffset;
    this._view = new DataView(buffer, byteOffset, len);
    this._pos = 0;
    this.version = 0;
    this.stringTable = [];
  }
  get pos() { return this._pos; }
  set pos(v) { this._pos = v; }
  get byteLength() { return this._view.byteLength; }
  get buffer() { return this._view.buffer; }
  get byteOffset() { return this._view.byteOffset; }

  skip(count) { this._pos += count; }
  getUint8() { return this._view.getUint8(this._pos++); }
  getUint16() { const v = this._view.getUint16(this._pos, false); this._pos += 2; return v; }
  getInt16() { const v = this._view.getInt16(this._pos, false); this._pos += 2; return v; }
  getUint32() { const v = this._view.getUint32(this._pos, false); this._pos += 4; return v; }
  getInt32() { const v = this._view.getInt32(this._pos, false); this._pos += 4; return v; }
  getFloat32() { const v = this._view.getFloat32(this._pos, false); this._pos += 4; return v; }
  readBool() { return this.getUint8() === 1; }

  readUTFString() {
    const len = this.getUint16();
    const bytes = new Uint8Array(this._view.buffer, this._view.byteOffset + this._pos, len);
    this._pos += len;
    return new TextDecoder('utf-8').decode(bytes);
  }

  getCustomString(len) {
    const bytes = new Uint8Array(this._view.buffer, this._view.byteOffset + this._pos, len);
    this._pos += len;
    return new TextDecoder('utf-8').decode(bytes);
  }

  readS() {
    const index = this.getUint16();
    if (index === NULL_STRING_INDEX) return null;
    if (index === EMPTY_STRING_INDEX) return '';
    return this.stringTable[index] ?? null;
  }

  readBuffer() {
    const count = this.getUint32();
    const ba = new ByteBuffer(this._view.buffer, this._view.byteOffset + this._pos, count);
    this._pos += count;
    ba.stringTable = this.stringTable;
    ba.version = this.version;
    return ba;
  }

  seek(indexTablePos, blockIndex) {
    const saved = this._pos;
    this._pos = indexTablePos;
    const segCount = this.getUint8();
    if (blockIndex < segCount) {
      const useShort = this.getUint8() === 1;
      let newPos;
      if (useShort) {
        this._pos += 2 * blockIndex;
        newPos = this.getUint16();
      } else {
        this._pos += 4 * blockIndex;
        newPos = this.getUint32();
      }
      if (newPos > 0) {
        this._pos = indexTablePos + newPos;
        return true;
      }
    }
    this._pos = saved;
    return false;
  }
}

// ========== 解析 .fui 文件 ==========
function parseFui(filePath) {
  const raw = fs.readFileSync(filePath);
  const outer = new ByteBuffer(raw.buffer, raw.byteOffset, raw.byteLength);

  // Header
  const magic = outer.getUint32();
  if (magic !== FGUI_MAGIC) throw new Error(`Invalid magic: 0x${magic.toString(16)}`);

  const version = outer.getInt32();
  outer.version = version;
  const compressed = outer.readBool();
  const packageId = outer.readUTFString();
  const packageName = outer.readUTFString();
  outer.skip(20);

  // Decompress
  let buf;
  if (compressed) {
    const remaining = new Uint8Array(outer.buffer, outer.byteOffset + outer.pos, outer.byteLength - outer.pos);
    const decompressed = inflateRaw(remaining);
    buf = new ByteBuffer(decompressed.buffer, 0, decompressed.byteLength);
    buf.version = version;
  } else {
    buf = outer;
  }

  const indexTablePos = buf.pos;
  const ver2 = version >= 2;

  // Block 4: String table
  buf.seek(indexTablePos, 4);
  const strCnt = buf.getInt32();
  const stringTable = [];
  for (let i = 0; i < strCnt; i++) stringTable[i] = buf.readUTFString();
  buf.stringTable = stringTable;

  // Block 5: Long strings
  if (buf.seek(indexTablePos, 5)) {
    const cnt = buf.readInt32();
    for (let i = 0; i < cnt; i++) {
      const index = buf.readUint16();
      const len = buf.readInt32();
      stringTable[index] = buf.getCustomString(len);
    }
  }

  // Block 0: Dependencies
  buf.seek(indexTablePos, 0);
  const depCnt = buf.getInt16();
  const dependencies = [];
  for (let i = 0; i < depCnt; i++) {
    dependencies.push({ id: buf.readS() ?? '', name: buf.readS() ?? '' });
  }
  const branches = [];
  if (ver2) {
    const branchCnt = buf.getInt16();
    for (let i = 0; i < branchCnt; i++) {
      branches.push(buf.readS() ?? '');
    }
  }

  // Block 1: Package Items
  buf.seek(indexTablePos, 1);
  const itemCount = buf.getUint16();
  const items = [];
  for (let i = 0; i < itemCount; i++) {
    const dataLen = buf.getInt32();
    const itemEnd = buf.pos + dataLen;
    const itemType = buf.getUint8();
    const itemId = buf.readS();
    const itemName = buf.readS();
    const itemPath = buf.readS();
    const itemFile = buf.readS();
    const exported = buf.readBool();
    const width = buf.getInt32();
    const height = buf.getInt32();

    const item = {
      index: i,
      type: BIN_ITEM_TYPES[itemType] ?? `Unknown(${itemType})`,
      typeCode: itemType,
      id: itemId,
      name: itemName,
      path: itemPath,
      file: itemFile,
      exported,
      width,
      height,
      extra: {},
    };

    // Type-specific fields
    if (itemType === 0) { // Image
      const scaleOpt = buf.getUint8();
      item.extra.scaleOption = scaleOpt;
      if (scaleOpt === 1) {
        item.extra.scale9Grid = [buf.getInt32(), buf.getInt32(), buf.getInt32(), buf.getInt32()];
        item.extra.tileGridIndice = buf.getInt32();
      }
      item.extra.smoothing = buf.readBool();
    } else if (itemType === 1) { // MovieClip
      item.extra.smoothing = buf.readBool();
      // frame data as raw buffer reference
      const frameBufStart = buf.pos;
      item.extra.frameDataPos = frameBufStart;
      // Read frame data buffer size for later comparison
    } else if (itemType === 3) { // Component
      const extType = buf.getUint8();
      item.extra.extensionType = extType;
      const compBuf = buf.readBuffer();
      item.extra.componentData = compBuf;
    } else if (itemType === 4) { // Atlas
      // Atlas uses file field
    } else if (itemType === 5) { // Font
      const fontBuf = buf.readBuffer();
      item.extra.fontData = fontBuf;
    } else if (itemType === 8 || itemType === 9) { // Spine/DragonBones
      item.extra.anchorX = buf.getFloat32();
      item.extra.anchorY = buf.getFloat32();
    }

    // v2 trailer
    if (ver2) {
      const branchName = buf.readS();
      const branchItemCount = buf.getUint8();
      const branchItemIds = [];
      for (let j = 0; j < branchItemCount; j++) {
        branchItemIds.push(buf.readS());
      }
      const highResCount = buf.getUint8();
      item.extra.branchName = branchName;
      item.extra.branchItemIds = branchItemIds;
      item.extra.highResCount = highResCount;
    }

    items.push(item);
    buf.pos = itemEnd;
  }

  // Block 2: Sprites
  buf.seek(indexTablePos, 2);
  const spriteCount = buf.getUint16();
  const sprites = [];
  for (let i = 0; i < spriteCount; i++) {
    const dataLen = buf.getUint16();
    const spriteEnd = buf.pos + dataLen;
    const sprite = {
      index: i,
      itemId: buf.readS(),
      atlasId: buf.readS(),
      x: buf.getInt32(),
      y: buf.getInt32(),
      w: buf.getInt32(),
      h: buf.getInt32(),
      rotated: buf.readBool(),
    };
    if (ver2) {
      const hasOriginal = buf.readBool();
      if (hasOriginal) {
        sprite.offsetX = buf.getInt32();
        sprite.offsetY = buf.getInt32();
        sprite.originalWidth = buf.getInt32();
        sprite.originalHeight = buf.getInt32();
      }
    }
    sprites.push(sprite);
    buf.pos = spriteEnd;
  }

  // Block 3: PixelHitTest
  const pixelHitTests = [];
  if (buf.seek(indexTablePos, 3)) {
    const hitCount = buf.getInt16();
    for (let i = 0; i < hitCount; i++) {
      const dataLen = buf.getInt32();
      const hitEnd = buf.pos + dataLen;
      const hitTest = {
        index: i,
        itemId: buf.readS(),
        deprecatedOffset: buf.getInt32(),
        pixelWidth: buf.getInt32(),
        scaleDenominator: buf.getUint8(),
      };
      const pixelLen = buf.getInt32();
      hitTest.pixelByteLength = pixelLen;
      // Save pixel data as hex for comparison
      const pixels = [];
      for (let j = 0; j < Math.min(pixelLen, 32); j++) {
        pixels.push(buf.getUint8().toString(16).padStart(2, '0'));
      }
      hitTest.pixelDataPreview = pixels.join(' ');
      hitTest.pixelDataFullLength = pixelLen;
      pixelHitTests.push(hitTest);
      buf.pos = hitEnd;
    }
  }

  return {
    header: { magic, version, compressed, packageId, packageName },
    dependencies,
    branches,
    items,
    sprites,
    pixelHitTests,
    stringTable: [...stringTable],
    // 保存原始字节用于快速字节级对比
    rawBytes: new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength),
  };
}

// ========== 对比逻辑 ==========
function compare(source, publish) {
  const diffs = [];

  function diff(label, expected, actual, context = '') {
    if (expected !== actual) {
      diffs.push({ label, expected: String(expected), actual: String(actual), context });
    }
  }

  // Header
  diff('magic', `0x${source.header.magic.toString(16)}`, `0x${publish.header.magic.toString(16)}`, 'Header');
  diff('version', source.header.version, publish.header.version, 'Header');
  diff('compressed', source.header.compressed, publish.header.compressed, 'Header');
  diff('packageId', source.header.packageId, publish.header.packageId, 'Header');
  diff('packageName', source.header.packageName, publish.header.packageName, 'Header');

  // Dependencies
  diff('depCount', source.dependencies.length, publish.dependencies.length, 'Dependencies');
  const depLen = Math.min(source.dependencies.length, publish.dependencies.length);
  for (let i = 0; i < depLen; i++) {
    diff(`dep[${i}].id`, source.dependencies[i].id, publish.dependencies[i].id, 'Dependencies');
    diff(`dep[${i}].name`, source.dependencies[i].name, publish.dependencies[i].name, 'Dependencies');
  }

  // Branches
  diff('branchCount', source.branches.length, publish.branches.length, 'Branches');
  const brLen = Math.min(source.branches.length, publish.branches.length);
  for (let i = 0; i < brLen; i++) {
    diff(`branch[${i}]`, source.branches[i], publish.branches[i], 'Branches');
  }

  // Items
  diff('itemCount', source.items.length, publish.items.length, 'PackageItems');
  const itemLen = Math.min(source.items.length, publish.items.length);
  for (let i = 0; i < itemLen; i++) {
    const si = source.items[i];
    const pi = publish.items[i];
    const ctx = `Items[${i}]`;
    diff(`type`, si.type, pi.type, `${ctx} "${si.name}"`);
    diff(`id`, si.id, pi.id, `${ctx}`);
    diff(`name`, si.name, pi.name, `${ctx}`);
    diff(`path`, si.path, pi.path, `${ctx}`);
    diff(`file`, si.file, pi.file, `${ctx}`);
    diff(`exported`, si.exported, pi.exported, `${ctx}`);
    diff(`width`, si.width, pi.width, `${ctx}`);
    diff(`height`, si.height, pi.height, `${ctx}`);

    // Type-specific extra
    for (const key of Object.keys(si.extra)) {
      const sv = si.extra[key];
      const pv = pi.extra[key];
      if (sv === pv) continue;
      if (typeof sv === 'object' && sv !== null && typeof pv === 'object' && pv !== null) {
        // Deep compare arrays
        if (Array.isArray(sv) && Array.isArray(pv)) {
          if (sv.length !== pv.length || !sv.every((v, j) => v === pv[j])) {
            diff(`extra.${key}`, JSON.stringify(sv), JSON.stringify(pv), `${ctx}`);
          }
        } else if (sv instanceof ByteBuffer && pv instanceof ByteBuffer) {
          // Binary data comparison
          const sBytes = new Uint8Array(sv.buffer, sv.byteOffset, sv.byteLength);
          const pBytes = new Uint8Array(pv.buffer, pv.byteOffset, pv.byteLength);
          if (sBytes.length !== pBytes.length) {
            diff(`extra.${key}.length`, sBytes.length, pBytes.length, `${ctx}`);
          } else {
            let firstDiffByte = -1;
            let diffCount = 0;
            for (let j = 0; j < sBytes.length; j++) {
              if (sBytes[j] !== pBytes[j]) {
                diffCount++;
                if (firstDiffByte === -1) firstDiffByte = j;
              }
            }
            if (diffCount > 0) {
              diff(`extra.${key}`, `${diffCount} bytes differ, first at byte ${firstDiffByte}`,
                `total ${sBytes.length} bytes`, `${ctx}`);
            }
          }
        }
        continue;
      }
      diff(`extra.${key}`, JSON.stringify(sv), JSON.stringify(pv), `${ctx}`);
    }

    // v2 extra
    if (si.extra.branchName !== undefined) {
      diff('branchName', si.extra.branchName, pi.extra.branchName, `${ctx}`);
      diff('branchItemCount', si.extra.branchItemIds?.length, pi.extra.branchItemIds?.length, `${ctx}`);
    }
  }

  // Sprites
  diff('spriteCount', source.sprites.length, publish.sprites.length, 'Sprites');
  const spLen = Math.min(source.sprites.length, publish.sprites.length);
  for (let i = 0; i < spLen; i++) {
    const ss = source.sprites[i];
    const ps = publish.sprites[i];
    const ctx = `Sprite[${i}] "${ss.itemId}"`;
    diff('itemId', ss.itemId, ps.itemId, ctx);
    diff('atlasId', ss.atlasId, ps.atlasId, ctx);
    diff('x', ss.x, ps.x, ctx);
    diff('y', ss.y, ps.y, ctx);
    diff('w', ss.w, ps.w, ctx);
    diff('h', ss.h, ps.h, ctx);
    diff('rotated', ss.rotated, ps.rotated, ctx);
    diff('offsetX', ss.offsetX ?? 0, ps.offsetX ?? 0, ctx);
    diff('offsetY', ss.offsetY ?? 0, ps.offsetY ?? 0, ctx);
    diff('originalWidth', ss.originalWidth ?? 0, ps.originalWidth ?? 0, ctx);
    diff('originalHeight', ss.originalHeight ?? 0, ps.originalHeight ?? 0, ctx);
  }

  // PixelHitTest
  diff('hitTestCount', source.pixelHitTests.length, publish.pixelHitTests.length, 'PixelHitTest');

  // String table
  diff('stringCount', source.stringTable.length, publish.stringTable.length, 'StringTable');
  const stLen = Math.min(source.stringTable.length, publish.stringTable.length);
  let stringDiffs = 0;
  for (let i = 0; i < stLen; i++) {
    if (source.stringTable[i] !== publish.stringTable[i]) {
      stringDiffs++;
      if (stringDiffs <= 10) {
        diff(`string[${i}]`, source.stringTable[i], publish.stringTable[i], 'StringTable');
      }
    }
  }
  if (stringDiffs > 10) {
    diff('stringDiffs.summary', `${stringDiffs} strings differ`, `(showing first 10)`, 'StringTable');
  }

  return diffs;
}

// ========== 字节级快速对比 ==========
function byteLevelDiff(sourceBytes, publishBytes) {
  const minLen = Math.min(sourceBytes.length, publishBytes.length);
  const diffs = [];
  let inDiff = false;
  let diffStart = 0;

  for (let i = 0; i < minLen; i++) {
    if (sourceBytes[i] !== publishBytes[i]) {
      if (!inDiff) { diffStart = i; inDiff = true; }
    } else {
      if (inDiff) {
        diffs.push({ start: diffStart, end: i - 1, length: i - diffStart });
        inDiff = false;
      }
    }
  }
  if (inDiff) {
    diffs.push({ start: diffStart, end: minLen - 1, length: minLen - diffStart });
  }
  if (sourceBytes.length !== publishBytes.length) {
    diffs.push({
      start: minLen,
      end: Math.max(sourceBytes.length, publishBytes.length) - 1,
      length: Math.abs(sourceBytes.length - publishBytes.length),
      type: sourceBytes.length > publishBytes.length ? 'source_trailing' : 'publish_trailing',
    });
  }
  return diffs;
}

// ========== Main ==========
const sourcePath = path.resolve(__dirname, 'Source', 'UI_fui_Source.bytes');
const publishPath = path.resolve(__dirname, 'PublishBytes', 'UI_fui.bytes');

console.log('=== FairyGUI Binary Diff Report ===\n');

const sourceParsed = parseFui(sourcePath);
const publishParsed = parseFui(publishPath);

console.log(`Source:  ${sourcePath} (${sourceParsed.rawBytes.length} bytes)`);
console.log(`Publish: ${publishPath} (${publishParsed.rawBytes.length} bytes)`);
console.log(`Size diff: ${publishParsed.rawBytes.length - sourceParsed.rawBytes.length} bytes\n`);

// 结构化对比
const diffs = compare(sourceParsed, publishParsed);

if (diffs.length === 0) {
  console.log('No differences found!');
} else {
  console.log(`Found ${diffs.length} differences:\n`);

  // 按 context 分组
  const groups = {};
  for (const d of diffs) {
    if (!groups[d.context]) groups[d.context] = [];
    groups[d.context].push(d);
  }

  for (const [ctx, items] of Object.entries(groups)) {
    console.log(`--- ${ctx} (${items.length} diffs) ---`);
    for (const d of items) {
      const label = d.label ? `${d.label}: ` : '';
      console.log(`  [DIFF] ${label}`);
      console.log(`    source: ${d.expected}`);
      console.log(`    publish: ${d.actual}`);
    }
    console.log();
  }
}

// 字节级对比
console.log('\n--- Byte-level diff ---');
const byteDiffs = byteLevelDiff(sourceParsed.rawBytes, publishParsed.rawBytes);
if (byteDiffs.length === 0) {
  console.log('Byte-identical!');
} else {
  console.log(`${byteDiffs.length} diff regions:`);
  for (const d of byteDiffs.slice(0, 50)) {
    const type = d.type ? ` (${d.type})` : '';
    console.log(`  offset ${d.start}-${d.end} (${d.length} bytes)${type}`);
  }
  if (byteDiffs.length > 50) {
    console.log(`  ... and ${byteDiffs.length - 50} more regions`);
  }
}

// 总结
console.log('\n--- Summary ---');
console.log(`Structural diffs: ${diffs.length}`);
console.log(`Byte diff regions: ${byteDiffs.length}`);
const totalByteDiffs = byteDiffs.reduce((sum, d) => sum + d.length, 0);
console.log(`Total differing bytes: ${totalByteDiffs}`);
console.log(`Match rate: ${((1 - totalByteDiffs / Math.max(sourceParsed.rawBytes.length, publishParsed.rawBytes.length)) * 100).toFixed(2)}%`);
```

**Step 2: 运行脚本验证**

```powershell
cd D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare
node compare.cjs
```

Expected: 输出结构化差异报告，列出所有字段级差异

---

### Task 5: 分析差异报告并定位 bug

**Files:**
- 读取: `compare.cjs` 输出
- 分析: `packages/functions/src/restore.ts`
- 分析: `packages/functions/src/publish.ts`
- 分析: `packages/core/src/io/binary-writer.ts`
- 分析: `packages/core/src/io/binary-reader.ts`

**Step 1: 运行对比脚本，查看差异**

```powershell
cd D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare
node compare.cjs > diff-report.txt 2>&1
```

**Step 2: 分析 diff-report.txt**

根据报告中的差异类型，归类为以下可能的 bug 来源:

| 差异位置 | 可能的 bug | 修复文件 |
|---------|-----------|---------|
| Header: version 不一致 | restore 丢失了原始版本号 | restore.ts |
| Items: 数量不一致 | restore 丢失了某些资源（如分支资源） | restore.ts |
| Items: path/name 不一致 | 路径规范化差异 | restore.ts |
| Items: Component data 不同 | component encoder/decoder 不一致 | component-encoder.ts / component-decoder.ts |
| Sprites: 数量不一致 | sprite 数据丢失或多余 | restore.ts / binary-writer.ts |
| Sprites: 坐标不一致 | sprite 坐标未正确还原 | restore.ts |
| String table: 内容不同 | 字符串表顺序差异 | binary-writer.ts |

**Step 3: 记录差异根因**

将分析结果记录到 diff-report.txt 的末尾，包括:
- 每个 diff 的根因
- 需要修改的文件
- 建议的修复方案

---

### Task 6: 修复发现的 bug

**Files:**
- 根据差异报告动态确定

**Step 1: 根据差异报告修复 restore.ts 中的 bug**

具体修复取决于差异报告的结果。常见问题：
- 丢失的资源属性 → 在 restore 的解析/写入流程中补充
- 路径格式差异 → 规范化路径处理

**Step 2: 根据差异报告修复 publish.ts / binary-writer.ts 中的 bug**

常见问题：
- 字符串表顺序不一致 → 调整写入顺序
- 组件数据编码差异 → 修复 component-encoder.ts

**Step 3: 运行对比脚本验证修复**

```powershell
cd D:\CrackALL\OpenFairyGUI\TestProject\PublishBytesCompare
node compare.cjs
```

Expected: 差异数量减少

**Step 4: 迭代直到差异可接受**

重复 Task 1 → Task 2 → Task 3 → Task 5 → Task 6 直到:
- 字节匹配率达到目标
- 所有结构性差异被修复或记录为已知限制

**Step 5: 提交修复**

```bash
git add -A
git commit -m "fix: 修复 restore/publish roundtrip 二进制差异"
```
