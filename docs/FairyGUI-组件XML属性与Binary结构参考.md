# FairyGUI 组件 XML 属性与 Binary 结构参考

> 基于 FairyGUI C# 源码（3rdCode/FairyGUI）整理，供 OpenFairyGUI 还原/发布逻辑开发参考。

---

## 一、DisplayList 子元素通用属性（GObject 基类）

所有 displayList 子元素共享以下属性，由 GObject.Setup_BeforeAdd 读取。

### Binary 格式（Tag 0）

| 属性 | Binary 读取 | 条件 | 默认值 |
|------|------------|------|--------|
| src | readS() | 始终 | '' |
| packageId | readS() | 始终 | null |
| id | readS() | 始终 | '' |
| name | readS() | 始终 | '' |
| x | readInt32() | 始终 | 0 |
| y | readInt32() | 始终 | 0 |
| width | readInt32() | readBool()==true | 0 |
| height | readInt32() | readBool()==true | 0 |
| minWidth/maxWidth/minHeight/maxHeight | readInt32() x4 | readBool()==true | 0,0,0,0 |
| scaleX | readFloat32() | readBool()==true | 1 |
| scaleY | readFloat32() | readBool()==true | 1 |
| skewX | readFloat32() | readBool()==true | 0 |
| skewY | readFloat32() | readBool()==true | 0 |
| pivotX | readFloat32() | readBool()==true | 0 |
| pivotY | readFloat32() | readBool()==true | 0 |
| pivotAsAnchor | readBool() | readBool()==true | false |
| alpha | readFloat32() | 始终 | 1 |
| rotation | readFloat32() | 始终 | 0 |
| visible | readBool() | 始终 | true |
| touchable | readBool() | 始终 | true |
| grayed | readBool() | 始终 | false |
| blendMode | readUint8() | 始终 | 0 |
| filter | readUint8() | ==1时读 4个 readFloat32 | - |
| customData | readS() | 始终 | '' |

### XML 属性映射

| XML 属性 | Binary 字段 | 格式 |
|----------|------------|------|
| id | id | 字符串 |
| name | name | 字符串 |
| xy | x, y | "x,y" |
| size | width, height | "w,h" |
| restrictSize | minWidth, maxWidth, minHeight, maxHeight | "minW,maxW,minH,maxH" |
| scale | scaleX, scaleY | "sx,sy" |
| skew | skewX, skewY | "kx,ky" |
| pivot | pivotX, pivotY | "px,py" |
| anchor | pivotAsAnchor | "true" |
| alpha | alpha | 数字 |
| rotation | rotation | 数字 |
| visible | visible | "true"/"false" |
| touchable | touchable | "true"/"false" |
| grayed | grayed | "true" |
| filter | filter | 字符串 |
| filterData | filterData | 字符串 |
| customData | customData | 字符串 |
| group | groupId (通过索引映射) | 字符串ID |

### Tag 1 (Setup_AfterAdd)

| 属性 | 读取方式 | 含义 |
|------|---------|------|
| tooltips | readS() | 提示文本 |
| groupId | readInt16() -> 子索引映射 | 所属组 |

---

## 二、GImage（图片）

### Tag 5 专有属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| color | readColor() | readBool()==true | color |
| flip | readUint8() (FlipType) | 始终 | flip |
| fillMethod | readUint8() (FillMethod) | 始终 | fillMethod |
| fillOrigin | readUint8() | fillMethod!=None | fillOrigin |
| fillClockwise | readBool() | fillMethod!=None | fillClockwise |
| fillAmount | readFloat32() | fillMethod!=None | fillAmount |

### FlipType 枚举

0=None, 1=Horizontal, 2=Vertical, 3=Both

### FillMethod 枚举

0=None, 1=Horizontal, 2=Vertical, 3=Radial90, 4=Radial180, 5=Radial360

### XML 示例

```xml
<image id="n0" name="bg" src="abc123" xy="0,0" size="100,100"
       color="#ffffff" flip="horizontal" fillMethod="horizontal" fillAmount="0.5"/>
```

---

## 三、GMovieClip（动画剪辑）

### Tag 5 专有属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| color | readColor() | readBool()==true | color |
| flip | readUint8() (FlipType) | 始终 | flip |
| frame | readInt32() | 始终 | frame |
| playing | readBool() | 始终 | playing |

### XML 示例

```xml
<movieclip id="n1" name="anim" src="mc001" xy="10,10" frame="0" playing="true" color="#ffffff"/>
```

---

## 四、GGraph（图形）

### Tag 5 专有属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| graphType | readUint8() | 始终 | type |
| lineSize | readInt32() | type!=0 | lineSize |
| lineColor | readColor() | type!=0 | lineColor |
| fillColor | readColor() | type!=0 | fillColor |
| cornerRadius | readFloat32() x4 | type!=0 && roundedRect | cornerRadius |
| points | readInt16()/2, 然后 x,y=readFloat32() x2/点 | type==3 | points |
| sides | readInt16() | type==4 | sides |
| startAngle | readFloat32() | type==4 | startAngle |
| distances | readInt16(), readFloat32() x N | type==4 | distances |

### GraphType 枚举

0=Empty, 1=Rect, 2=Ellipse, 3=Polygon, 4=RegularPolygon

### XML 示例

```xml
<!-- 矩形 -->
<graph id="n0" name="bg" xy="0,0" size="100,100" type="rect" lineSize="0" fillColor="#ff000000"/>
<!-- 椭圆 -->
<graph id="n1" name="circle" xy="50,50" size="80,80" type="ellipse" fillColor="#ffffffff"/>
<!-- 多边形 -->
<graph id="n2" name="poly" xy="0,0" size="100,100" type="polygon" points="0,0,50,100,100,0"/>
<!-- 正多边形 -->
<graph id="n3" name="hex" xy="0,0" size="50,50" type="regularpolygon" sides="6" startAngle="0"/>
```

---

## 五、GLoader（加载器）

### Tag 5 专有属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| url | readS() | 始终 | url |
| align | readUint8() (AlignType) | 始终 | align |
| vAlign | readUint8() (VertAlignType) | 始终 | vAlign |
| fill | readUint8() (FillType) | 始终 | fill |
| shrinkOnly | readBool() | 始终 | shrinkOnly |
| autoSize | readBool() | 始终 | autoSize |
| showErrorSign | readBool() | 始终 | showErrorSign |
| playing | readBool() | 始终 | playing |
| frame | readInt32() | 始终 | frame |
| color | readColor() | readBool()==true | color |
| fillMethod | readUint8() | 始终 | fillMethod |
| fillOrigin | readUint8() | fillMethod!=None | fillOrigin |
| fillClockwise | readBool() | fillMethod!=None | fillClockwise |
| fillAmount | readFloat32() | fillMethod!=None | fillAmount |

### AlignType 枚举

0=Left, 1=Center, 2=Right

### VertAlignType 枚举

0=Top, 1=Middle, 2=Bottom

### FillType 枚举

0=None, 1=Scale, 2=ScaleMatchHeight, 3=ScaleMatchWidth, 4=ScaleFree, 5=ScaleNoBorder, 6=ScaleShowAll

### XML 示例

```xml
<loader id="n0" name="icon" xy="0,0" size="50,50" url="ui://pkgid/resid"
        align="center" vAlign="middle" fill="scaleFree" playing="true"/>
```

---

## 六、GLoader3D（3D加载器）

### Tag 5 专有属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| url | readS() | 始终 | url |
| align | readUint8() | 始终 | align |
| vAlign | readUint8() | 始终 | vAlign |
| fill | readUint8() | 始终 | fill |
| shrinkOnly | readBool() | 始终 | shrinkOnly |
| autoSize | readBool() | 始终 | autoSize |
| animationName | readS() | 始终 | animationName |
| skinName | readS() | 始终 | skinName |
| playing | readBool() | 始终 | playing |
| frame | readInt32() | 始终 | frame |
| loop | readBool() | 始终 | loop |
| color | readColor() | readBool()==true | color |

---

## 七、GGroup（组）

### Tag 5 专有属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| layout | readUint8() (GroupLayoutType) | 始终 | layout |
| lineGap | readInt32() | 始终 | lineGap |
| columnGap | readInt32() | 始终 | columnGap |
| excludeInvisibles | readBool() | version>=2 | excludeInvisibles |
| autoSizeDisabled | readBool() | version>=2 | autoSizeDisabled |
| mainGridIndex | readInt16() | version>=2 | mainGridIndex |

### GroupLayoutType 枚举

0=None, 1=Horizontal, 2=Vertical

### XML 示例

```xml
<group id="n0" name="grp" xy="0,0" size="100,50" layout="horizontal" lineGap="5" columnGap="0"/>
```

---

## 八、GTextField（文本）

### Tag 5 专有属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| font | readS() | 始终 | font |
| fontSize | readInt16() | 始终 | fontSize |
| color | readColor() | 始终 | color |
| align | readUint8() | 始终 | align |
| vAlign | readUint8() | 始终 | vAlign |
| leading | readInt16() | 始终 | leading |
| letterSpacing | readInt16() | 始终 | letterSpacing |
| ubbEnabled | readBool() | 始终 | ubb |
| autoSize | readUint8() (AutoSizeType) | 始终 | autoSize |
| underline | readBool() | 始终 | underline |
| italic | readBool() | 始终 | italic |
| bold | readBool() | 始终 | bold |
| singleLine | readBool() | 始终 | singleLine |
| strokeColor | readColor() | readBool()==true | strokeColor |
| strokeSize | readFloat32() | readBool()==true | strokeSize |
| shadowColor | readColor() | readBool()==true | shadowColor |
| shadowOffsetX | readFloat32() | readBool()==true | shadowOffsetX |
| shadowOffsetY | readFloat32() | readBool()==true | shadowOffsetY |
| templateVars | readBool() | readBool()==true | vars |
| strikethrough | readBool() | version>=3 | strikethrough |
| faceDilate | (skip 4 bytes) | version>=3 | faceDilate |
| outlineSoftness | (skip 4 bytes) | version>=3 | - |
| underlaySoftness | (skip 4 bytes) | version>=3 | underlaySoftness |

### Tag 6 专有属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| text | readS() | 始终 | text |

### AutoSizeType 枚举

0=None, 1=Both, 2=Height, 3=Shrink, 4=Ellipsis

### XML 示例

```xml
<text id="n0" name="label" xy="0,0" size="100,30"
      text="Hello" font="Arial" fontSize="14" color="#000000"
      align="center" vAlign="middle" autoSize="none" singleLine="true"/>
```

---

## 九、GRichTextField（富文本）

继承自 GTextField，无额外 Binary 字段。XML 使用 `<richtext>` 标签。

### 与 GTextField 的区别

- 支持富文本标签（UBB/HTML 标签）
- 可包含 `<img>`、`<a>` 等内联元素
- 边距/间距等属性可能从不同 panel 读取

---

## 十、GTextInput（输入文本）

继承自 GTextField。

### Tag 4 专有属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| promptText | readS() | 始终 | prompt |
| restrict | readS() | 始终 | restrict |
| maxLength | readInt32() | 始终 | maxLength |
| keyboardType | readInt32() | 始终 | keyboardType |
| password | readBool() | 始终 | password |

### XML 示例

```xml
<text id="n0" name="input" xy="0,0" size="200,30" input="true"
      prompt="请输入..." maxLength="50" password="false"/>
```

---

## 十一、GComponent（组件实例）

### Tag 0 根元素属性（ConstructFromResource header）

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| sourceWidth | readInt32() | 始终 | size 的宽度 |
| sourceHeight | readInt32() | 始终 | size 的高度 |
| minWidth/maxWidth/minHeight/maxHeight | readInt32() x4 | readBool()==true | restrictSize |
| pivotX/pivotY/pivotAsAnchor | readFloat32()+readBool() | readBool()==true | pivot, anchor |
| margin | readInt32() x4 (top,bottom,left,right) | readBool()==true | margin |
| overflow | readUint8() (OverflowType) | 始终 | overflow |
| clipSoftness | readInt32() x2 | readBool()==true | clipSoftness |

### Tag 4 高级属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| opaque | readBool() | 始终 | opaque |
| maskId | readInt16() | 始终 | mask |
| reversedMask | readBool() | maskId!=-1 | reversedMask |
| hitTestId | readS() | 始终 | hitTest |
| hitTest i1 | readInt32() | 始终 | - |
| hitTest i2 | readInt32() | 始终 | - |

### Tag 6 子组件后置属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| pageController | readInt16() -> 控制器索引 | >=0 | pageController |
| controllerOverrides | readInt16()+readS()+readS() 循环 | count>0 | controllerOverrides |

### OverflowType 枚举

0=Visible, 1=Hidden, 2=Scroll

---

## 十二、GList（列表）

继承自 GComponent。

### Tag 5 列表核心属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| layout | readUint8() (ListLayoutType) | 始终 | layout |
| selectionMode | readUint8() (ListSelectionMode) | 始终 | selectionMode |
| align | readUint8() (AlignType) | 始终 | align |
| vAlign | readUint8() (VertAlignType) | 始终 | vAlign |
| lineGap | readInt16() | 始终 | lineGap |
| columnGap | readInt16() | 始终 | colGap |
| lineCount | readInt16() | 始终 | lineCount |
| columnCount | readInt16() | 始终 | columnCount |
| autoResizeItem | readBool() | 始终 | autoItemSize |
| childrenRenderOrder | readUint8() | 始终 | childrenRenderOrder |
| apexIndex | readInt16() | 始终 | apexIndex |
| margin | readInt32() x4 | readBool()==true | margin |
| overflow | readUint8() (OverflowType) | 始终 | overflow |
| clipSoftness | readInt32() x2 | readBool()==true | clipSoftness |
| scrollItemToViewOnClick | readBool() | version>=2 | scrollItemToViewOnClick |
| foldInvisibleItems | readBool() | version>=2 | foldInvisibleItems |

### ListLayoutType 枚举

0=SingleColumn, 1=SingleRow, 2=FlowHorizontal, 3=FlowVertical, 4=Pagination

### ListSelectionMode 枚举

0=Single, 1=Multiple, 2=Multiple_SingleClick, 3=None

### Tag 6 列表后置属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| selectionController | readInt16() -> 控制器索引 | 始终 | selectionController |

### Tag 7 滚动面板（当 overflow==Scroll）

见 ScrollPane 部分。

### Tag 8 列表项

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| defaultItem | readS() | 始终 | defaultItem |
| items | readUint16()+循环 | count>0 | item 子元素 |

### XML 示例

```xml
<list id="n0" name="功能列表" xy="0,0" size="500,300"
      layout="pagination" lineGap="-9" colGap="65" align="center"
      lineItemCount="7" autoItemSize="false" selectionMode="none"
      defaultItem="ui://pkgid/resid">
  <item/>
  <item/>
</list>
```

---

## 十三、GTree（树）

继承自 GList。

### Tag 9 树专有属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| indent | readInt32() | 始终 | indent |
| clickToExpand | readUint8() | 始终 | clickToExpand |

### clickToExpand 值

0=不展开, 1=单击展开, 2=双击展开

### 树节点额外属性（ReadItems 内部）

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| url | readS() | 始终 | url |
| isFolder | readBool() | 始终 | - |
| level | readUint8() | 始终 | - |

---

## 十四、ScrollPane（滚动面板）

### Tag 7 属性

| 属性 | Binary 读取 | 条件 | XML 属性 |
|------|------------|------|----------|
| scrollType | readUint8() (ScrollType) | 始终 | scrollType |
| scrollBarDisplay | readUint8() (ScrollBarDisplayType) | 始终 | scrollBarDisplay |
| scrollBarFlags | readInt32() (位标志) | 始终 | scrollBarFlags |
| scrollBarMargin | readInt32() x4 | readBool()==true | scrollBarMargin |
| vtScrollBarRes | readS() | 始终 | scrollBarRes (前半部分) |
| hzScrollBarRes | readS() | 始终 | scrollBarRes (后半部分) |
| headerRes | readS() | 始终 | ptrRes (前半部分) |
| footerRes | readS() | 始终 | ptrRes (后半部分) |

### ScrollType 枚举

0=Horizontal, 1=Vertical, 2=Both

### ScrollBarDisplayType 枚举

0=Default, 1=Visible, 2=Auto, 3=Hidden

### scrollBarFlags 位标志

| 位 | 值 | 含义 |
|----|-----|------|
| bit 0 | 0x001 | displayOnLeft（滚动条在左侧） |
| bit 1 | 0x002 | snapToItem（对齐到项） |
| bit 2 | 0x004 | displayInDemand（按需显示） |
| bit 3 | 0x008 | pageMode（分页模式） |
| bit 4 | 0x010 | touchEffect=true |
| bit 5 | 0x020 | touchEffect=false |
| bit 6 | 0x040 | bouncebackEffect=true |
| bit 7 | 0x080 | bouncebackEffect=false |
| bit 8 | 0x100 | inertiaDisabled（禁用惯性） |
| bit 9 | 0x200 | maskDisabled（禁用遮罩） |
| bit 10 | 0x400 | floating（浮动） |
| bit 11 | 0x800 | dontClipMargin（不裁剪边距） |

---

## 十五、Controller（控制器）

### Tag 0

| 属性 | Binary 读取 | XML 属性 |
|------|------------|----------|
| name | readS() | name |
| autoRadioGroupDepth | readBool() | autoRadioGroupDepth |

### Tag 1 页面列表

| 属性 | Binary 读取 | XML 属性 |
|------|------------|----------|
| pageIds | readS() x count | pages 的 ID 部分 |
| pageNames | readS() x count | pages 的名称部分 |
| homePageType | readUint8() | - |
| homePageIndex | readInt16() | selected |

### pages XML 格式

```
pages="pageId1,页面名1,pageId2,页面名2,..."
```

### Tag 2 Actions

| ActionType | 含义 | XML type |
|-----------|------|----------|
| 0 | PlayTransition | play_transition |
| 1 | ChangePage | change_page |

---

## 十六、Transition（动效）

### Tag 0

| 属性 | Binary 读取 | XML 属性 |
|------|------------|----------|
| name | readS() | name |
| options | readInt32() | options |
| autoPlay | readBool() | autoPlay |
| autoPlayTimes | readInt32() | autoPlayTimes |
| autoPlayDelay | readFloat32() | autoPlayDelay |

### TransitionActionType 枚举

| 值 | 类型 | XML type | 值字段 |
|----|------|----------|--------|
| 0 | XY | XY | x, y |
| 1 | Size | Size | width, height |
| 2 | Scale | Scale | scaleX, scaleY |
| 3 | Pivot | Pivot | pivotX, pivotY |
| 4 | Alpha | Alpha | alpha |
| 5 | Rotation | Rotation | rotation |
| 6 | Color | Color | color |
| 7 | Animation | Animation | frame, playing |
| 8 | Visible | Visible | visible |
| 9 | Sound | Sound | sound, volume |
| 10 | Transition | Transition | transName, playTimes |
| 11 | Shake | Shake | amplitude, duration |
| 12 | ColorFilter | ColorFilter | brightness, contrast, saturation, hue |
| 13 | Skew | Skew | skewX, skewY |
| 14 | Text | Text | text |
| 15 | Icon | Icon | icon |

---

## 十七、ObjectType 枚举（DisplayList 子元素类型）

| 值 | 类型 | XML 标签 |
|----|------|----------|
| 0 | Image | image |
| 1 | MovieClip | movieclip / jta |
| 2 | Swf | swf |
| 3 | Graph | graph |
| 4 | Loader | loader |
| 5 | Group | group |
| 6 | Text | text |
| 7 | RichText | richtext |
| 8 | InputText | inputtext / text(input=true) |
| 9 | Component | component |
| 10 | List | list |
| 11 | Label | component (extention=Label) |
| 12 | Button | component (extention=Button) |
| 13 | ComboBox | component (extention=ComboBox) |
| 14 | ProgressBar | component (extention=ProgressBar) |
| 15 | Slider | component (extention=Slider) |
| 16 | ScrollBar | component (extention=ScrollBar) |
| 17 | Tree | tree / list(treeView=true) |
| 18 | Loader3D | loader3D |

---

## 十八、ExtensionType 枚举（组件扩展类型）

| 值 | 类型 | XML extention 属性 |
|----|------|-------------------|
| 0 | Component | - |
| 1 | Label | Label |
| 2 | Button | Button |
| 3 | ComboBox | ComboBox |
| 4 | ProgressBar | ProgressBar |
| 5 | Slider | Slider |
| 6 | ScrollBar | ScrollBar |

---

## 十九、Binary Tag 分布总结

| Tag | 用途 | 使用者 |
|-----|------|--------|
| 0 | GObject 基础属性 / GComponent header / Controller 基础 | 所有组件 |
| 1 | tooltips+groupId / Controller 页面列表 | GObject, Controller |
| 2 | gears / GComponent children+relations / Controller actions | GObject, GComponent, Controller |
| 3 | relations | GComponent |
| 4 | opaque+mask+hitTest / GTextInput input属性 | GComponent, GTextInput |
| 5 | 类型专有属性 | GImage/GMovieClip/GGraph/GLoader/GLoader3D/GGroup/GTextField/GList |
| 6 | text内容 / selectionController | GTextField, GList |
| 7 | 滚动面板 | GComponent(overflow==Scroll), GList(overflow==Scroll) |
| 8 | defaultItem+items | GList, GTree |
| 9 | indent+clickToExpand | GTree |

---

## 二十、已知 Binary 格式限制

FairyGUI publish binary 时，以下属性**不会写入**部分类型的 child block 0：

| 属性 | 受影响的类型 | 原因 |
|------|------------|------|
| scale | Text, RichText, InputText, Graph, Group, List, Tree | binary 中 hasScale=false |
| skew | Text, RichText, InputText, Graph, Group, List, Tree | binary 中 hasSkew=false |
| pivot | Text, RichText, InputText, Group, List, Tree | binary 中 hasPivot=false |
| group (引用) | Text, RichText, InputText | 需从 tag 1 的 groupId 索引映射 |

这些属性在 image, movieclip, loader, component 中**正常写入和还原**。

---

## 参考引用

- FairyGUI C# 源码: `D:\CrackALL\OpenFairyGUI\3rdCode\FairyGUI\Runtime\Scripts\UI\`
- OpenFairyGUI component-decoder: `packages/core/src/io/component-decoder.ts`
- OpenFairyGUI project-xml-protocol: `packages/core/src/io/project-xml-protocol.ts`
- OpenFairyGUI project-writer: `packages/core/src/io/project-writer.ts`
