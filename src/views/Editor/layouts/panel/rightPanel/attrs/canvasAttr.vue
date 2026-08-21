<template>
  <div>
    <div class="p2">
      <a-row :gutter="[4, 4]" align="center">
        <a-col :span="10">
          <SwipeNumber size="small" :min="0.5" label="宽" v-bind="width" />
        </a-col>
        <a-col :span="10">
          <SwipeNumber size="small" :min="0.5" label="高" v-bind="height" />
        </a-col>
        <a-col :span="16">
          <a-checkbox v-model="overflowCheck">超出画布隐藏</a-checkbox>
        </a-col>
      </a-row>
    </div>
    <panel title="背景" @click-add="addFill">
      <a-space direction="vertical">
        <a-row :gutter="[8, 4]" v-for="(item, index) in fillArray" :key="index">
          <a-col :span="20">
            <a-col :span="20">
              <a-input
                size="mini"
                :model-value="formatValue(index)"
                :readonly="readonly"
                @change="changeColor"
                class="pl0!"
              >
                <template #prefix>
                  <a-button
                    size="mini"
                    class="icon-btn"
                    @click="openColorPicker(index)"
                  >
                    <template #icon>
                      <div v-bind="colorBlock(index)"></div>
                    </template>
                  </a-button>
                </template>
              </a-input>
            </a-col>
          </a-col>
        </a-row>
      </a-space>
    </panel>
  </div>
</template>

<script setup lang="ts">
import SwipeNumber from "@/components/swipeNumber/swipeNumber.vue";
import { useActiveObjectModel } from "@/views/Editor/hooks/useActiveObjectModel";
import Panel from "./panel.vue";
import { useColor } from "@/views/Editor/hooks/useActiveObjectColor";

const width = useActiveObjectModel("width");
const height = useActiveObjectModel("height");
const overflow = useActiveObjectModel("overflow");
const fill = useActiveObjectModel("fill");

const overflowCheck = ref(false);
const fillArray = ref([]);

const {
  formatValue,
  colorBlock,
  changeColor,
  closeColorPicker,
  openColorPicker,
  readonly,
} = useColor(
  computed(() => fill.value.modelValue),
  {
    attr: "fill",
    onChange() {
      fill.value.onChange(fillArray.value);
    },
  },
);

const refreshFill = () => {
  fill.value.onChange([]);
  fill.value.onChange(fillArray.value.length <= 0 ? [] : fillArray.value);
};
const addFill = () => {
  fill.value.onChange([]);
  fillArray.value.push({
    type: "solid",
    color: "rgba(151,151,151,1)",
  });
  refreshFill();
};

const removeFill = (index: any) => {
  fillArray.value.splice(index, 1);
  refreshFill();
};

watchEffect(() => {
  if (fill.value.modelValue) {
    fillArray.value = <any>fill.value.modelValue;
  } else {
    fillArray.value = [];
  }
});

watchEffect(() => {
  if (overflow.value.modelValue === "hide") {
    overflowCheck.value = true;
  } else {
    overflowCheck.value = false;
  }
});

watchEffect(() => {
  if (overflowCheck.value) {
    overflow.value.onChange("hide");
  } else {
    overflow.value.onChange("show");
  }
});

/**
 * Viewed canvasAttr.vue:1-139

这个文件是 [canvasAttr.vue](file:///d:/chenxuan/Front/adDesignn/gzm-design/src/views/Editor/layouts/panel/rightPanel/attrs/canvasAttr.vue)，属于图形编辑器右侧属性面板中的**画布属性配置组件**。

主要功能包括：
1. **画布尺寸设置**：修改画布的宽度（`width`）和高度（`height`）。
2. **溢出裁切控制**：设置画布内容超出边界时是否隐藏（`overflow`）。
3. **画布背景颜色管理**：支持多层背景颜色/填充（`fill`）的添加、修改、格式化预览和删除。

---

### 一、 `<script setup>` 逻辑层逐行解析 (Line 1 ~ 73)

```ts
1: <script setup lang="ts">
```
* **第 1 行**：Vue 3 的 `<script setup>` 组合式 API 语法糖，指定使用 TypeScript 语言。

```ts
2: import Panel from './panel.vue'
3: import {useActiveObjectModel} from '@/views/Editor/hooks/useActiveObjectModel'
4: import {useEditor} from '@/views/Editor/app'
5: import {useColor} from '@/views/Editor/hooks/useActiveObjectColor'
6: import {watch} from "vue";
7: import SwipeNumber from "@/components/swipeNumber/swipeNumber.vue";
```
* **第 2 行**：导入自定义面板组件 [panel.vue](file:///d:/chenxuan/Front/adDesignn/gzm-design/src/views/Editor/layouts/panel/rightPanel/attrs/panel.vue)，用于将属性按块（如“背景”）分组折叠显示。
* **第 3 行**：导入自定义 Hook `useActiveObjectModel`，用于将当前编辑器选中对象（此处为画布节点）的某个属性包装为可读取/修改的双向绑定对象。
* **第 4 行**：导入编辑器核心 API Hook `useEditor`，用于获取当前编辑器实例及 `canvas` 实例。
* **第 5 行**：导入颜色管理 Hook [useActiveObjectColor.ts](file:///d:/chenxuan/Front/adDesignn/gzm-design/src/views/Editor/hooks/useActiveObjectColor.ts)，获取颜色处理方法（如格式化颜色、调色盘打开/关闭、修改颜色等）。
* **第 6 行**：从 Vue 中导入 `watch` 侦听器 API。
* **第 7 行**：导入数字滑动输入框组件 `SwipeNumber`，支持拖拽和输入调整数值。

```ts
9: const {canvas} = useEditor()
```
* **第 9 行**：从 `useEditor()` 获取当前编辑器的主画布 `canvas` 对象。

```ts
11: const rotation = useActiveObjectModel('rotation')
12: const width = useActiveObjectModel('width')
13: const height = useActiveObjectModel('height')
14: const fill = useActiveObjectModel('fill')
15: const overflow = useActiveObjectModel('overflow')
```
* **第 11~15 行**：分别为画布的旋转角度 (`rotation`)、宽度 (`width`)、高度 (`height`)、填充背景 (`fill`) 和溢出显示/隐藏 (`overflow`) 创建双向模型对象。

```ts
17: const {formatValue, colorBlock, changeColor, closeColorPicker, openColorPicker, readonly} =
18:     useColor(
19:         computed(() => fill.value.modelValue),
20:         {
21:             attr: 'fill',
22:             onChange() {
23:                 fill.value.onChange(fillArray.value)
24:             },
25:         },
26:     )
```
* **第 17~26 行**：调用 `useColor` 颜色辅助函数：
  * 将当前 `fill.value.modelValue` 作为颜色数据源。
  * 当颜色变动触发 `onChange` 时，将本地修改后的 `fillArray.value` 同步写回到画布的 `fill` 模型中。
  * 解构获取：`formatValue`（格式化颜色值文本）、`colorBlock`（获取预览色块样式）、`changeColor`（手动修改颜色）、`closeColorPicker`/`openColorPicker`（开关拾色盘）、`readonly`（只读状态）。

```ts
28: watch(canvas.activeObject, () => closeColorPicker())
```
* **第 28 行**：侦听画布上选中对象的变化。当用户切换选中不同图层或对象时，自动关闭已打开的颜色选择盘。

```ts
31: const fillArray = ref([])
32: watchEffect(() => {
33:     if (fill.value.modelValue) {
34:         fillArray.value = <any>fill.value.modelValue
35:     } else {
36:         fillArray.value = []
37:     }
38: })
```
* **第 31~38 行**：声明响应式变量 `fillArray` 用于管理多重背景填充项；`watchEffect` 会在 `fill.value.modelValue` 改变时更新 `fillArray`。如果画布没有背景数据则置为空数组。

```ts
40: const refreshFill = () => {
41:     fill.value.onChange([])
42:     fill.value.onChange(fillArray.value.length <= 0 ? [] : fillArray.value)
43: }
```
* **第 40~43 行**：刷新背景填充的方法。先将背景清空 (`[]`)，再重新传入 `fillArray.value`，借此强制画布刷新并重绘最新的背景图层。

```ts
44: const addFill = () => {
45:     fill.value.onChange([])
46:     fillArray.value.push({
47:         type: 'solid',
48:         color: 'rgba(151,151,151,1)',
49:     })
50:     refreshFill()
51: }
```
* **第 44~51 行**：点击添加背景层时的响应函数：向 `fillArray` 追加一个默认的灰色纯色填充项（`rgba(151,151,151,1)`），随后触发 `refreshFill()` 更新画布。

```ts
52: const removeFill = (index) => {
53:     fillArray.value.splice(index, 1)
54:     refreshFill()
55: }
```
* **第 52~55 行**：删除指定索引 `index` 位置的背景填充项，并重新刷新背景。

```ts
56: const overflowCheck = ref(false)
57: 
58: watchEffect(() => {
59:     if (overflow.value.modelValue === 'hide') {
60:         overflowCheck.value = true
61:     } else {
62:         overflowCheck.value = false
63:     }
64: })
65: 
66: watchEffect(() => {
67:     if (overflowCheck.value) {
68:         overflow.value.onChange('hide')
69:     } else {
70:         overflow.value.onChange('show')
71:     }
72: })
```
* **第 56~72 行**：
  * 声明 `overflowCheck` 布尔变量绑定 UI 上的“超出画布隐藏”复选框。
  * 第 58~64 行的 `watchEffect`：当画布底层的 `overflow` 为 `'hide'` 时，把复选框设为勾选状态。
  * 第 66~72 行的 `watchEffect`：当用户手动勾选/取消勾选复选框时，调用 `overflow.value.onChange` 切换画布模式为 `'hide'`（隐藏超出部分）或 `'show'`（显示超出部分）。

---

### 二、 `<template>` 视图层逐行解析 (Line 75 ~ 136)

```html
75: <template>
76:     <div>
77:         <div class="p2">
78:             <a-row :gutter="[4, 4]" align="center">
```
* **第 75~78 行**：模板根布局，使用 Arco Design 的 `a-row` 栅格行容器，设置元素间距为 4px，垂直居中对齐。

```html
79:                 <a-col :span="10">
80:                     <SwipeNumber size="small" :min="0.5" label="宽" v-bind="width"/>
81:                 </a-col>
```
* **第 79~81 行**：宽度输入框，占 10/24 栅格。`v-bind="width"` 将 `width` 模型的 `modelValue` 和 `onChange` 绑定到 `SwipeNumber` 上，允许通过拖拽或直接编辑修改宽度。

```html
82:                 <a-col :span="10">
83:                     <SwipeNumber size="small" :min="0.5" label="高" v-bind="height"/>
84:                 </a-col>
```
* **第 82~84 行**：高度输入框，占 10/24 栅格，逻辑与宽度一致。

```html
85:                 <a-col :span="16">
86:                     <a-checkbox v-model="overflowCheck">超出画布隐藏</a-checkbox>
87:                 </a-col>
```
* **第 85~87 行**：复选框，双向绑定 `overflowCheck` 变量，控制画布内容超出视口时是否裁剪隐藏。

```html
88: <!--                <a-col :span="10"> ... </a-col>-->
```
* **第 88~97 行**：旋转角度调节组件（暂时被注释屏蔽）。

```html
98:             </a-row>
99:         </div>
```
* **第 98~99 行**：闭合顶部尺寸控制区域。

```html
100:         <Panel
101:                 title="背景"
102:                 @click-add="addFill"
103:         >
```
* **第 100~103 行**：使用 `Panel` 面板包裹背景设置项，面板标题为“背景”，点击右侧添加图标时触发 `@click-add="addFill"` 添加背景颜色层。

```html
104:             <a-space direction="vertical">
105:                 <a-row :gutter="[8, 4]" v-for="(item,index) in fillArray" :key="index">
```
* **第 104~105 行**：使用垂直方向的 `a-space` 容器，`v-for` 循环遍历 `fillArray` 填充项列表，渲染每一层背景颜色配置。

```html
106:                     <a-col :span="20">
107:                         <a-col :span="20">
108:                             <a-input
109:                                     size="mini"
110:                                     :model-value="formatValue(index)"
111:                                     :readonly="readonly"
112:                                     @change="changeColor"
113:                                     class="pl0!"
114:                             >
```
* **第 106~114 行**：显示/编辑颜色值的单行文本框 `a-input`：
  * `:model-value="formatValue(index)"`：渲染第 `index` 项颜色的格式化文本（如 `#FFFFFF`）。
  * `:readonly="readonly"`：是否为只读模式。
  * `@change="changeColor"`：修改文本值时触发颜色变更。

```html
115:                                 <template #prefix>
116:                                     <a-button size="mini" class="icon-btn" @click="openColorPicker(index)">
117:                                         <template #icon>
118:                                             <div v-bind="colorBlock(index)"></div>
119:                                         </template>
120:                                     </a-button>
121:                                 </template>
122:                             </a-input>
```
* **第 115~122 行**：输入框左侧的前缀插槽：一个小色块按钮，用 `div` 展示当前的颜色效果（`colorBlock(index)`），点击调用 `openColorPicker(index)` 弹出调色盘。

```html
125:                     <a-col :span="3.5" class="mlauto">
126:                         <a-button size="small" class="icon-btn" v-if="index!==0" @click="removeFill(index)">
127:                             <template #icon>
128:                                 <icon-minus/>
129:                             </template>
130:                         </a-button>
131:                     </a-col>
```
* **第 125~131 行**：右侧删除按钮：如果不是第 0 层背景（`v-if="index!==0"`），显示带有减号图标（`<icon-minus/>`）的删除按钮，点击调用 `removeFill(index)` 移除此层背景。

```html
132:                 </a-row>
133:             </a-space>
134:         </Panel>
135:     </div>
136: </template>
```
* **第 132~136 行**：依次闭合循环行、间距容器、面板和根 DOM 节点。

---

### 三、 `<style>` 样式层 (Line 138 ~ 139)

```html
138: <style scoped lang="less"></style>
```
* **第 138 行**：局部作用域的 Less 样式块（当前暂未写自定义样式，使用全局原子类如 `p2`, `pl0!`, `mlauto`）。
 */
</script>
