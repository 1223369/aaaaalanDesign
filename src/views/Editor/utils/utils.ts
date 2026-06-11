import { Frame, Group, Leafer } from "leafer-ui";
import { IUI } from "@leafer-ui/interface";
import { BOTTOM_CANVAS_NAME } from "@/views/Editor/utils/constants";

/**
 * 获取图层默认名称
 * @param leafer
 */
export function getDefaultName(leafer: Frame | Leafer) {
  return `图层${leafer.children.length + 1}`;
}

/**
 * 获取上级
 * @param layer
 */
export function getParentLayer(layer: IUI) {
  return typeUtil.isBottomCanvas(layer) ? layer : layer.parent;
}

/**
 * 类型工具
 */
export const typeUtil = {
  /**
   * 是否是最底层应用层
   * @param layer
   */
  isBottomLeafer: (layer: IUI) => {
    return layer.innerId === 1 && layer.tag === "Leafer";
  },
  /**
   * 是否是最底层画布层
   * @param layer
   */
  isBottomCanvas: (layer: IUI) => {
    return layer.name === BOTTOM_CANVAS_NAME;
  },
  /**
   * 是否是虚拟元素
   * @param layer
   */
  isVirtualElement: (layer: IUI) => {
    return !isDefined(layer.app);
  },

  /**
   * 是否虚拟元素活底层画布
   * @param layer
   */
  isVirtualOrBottom: (layer: IUI) => {
    return typeUtil.isBottomCanvas(layer) || typeUtil.isVirtualElement(layer);
  },

  /**
   * 是否集合（含组）
   * @param thing
   */
  isCollection: (thing?: unknown): thing is Group => {
    const item = thing as Group;
    return !!(item && Array.isArray(item.children) && item.tag !== "Pen");
  },
  /**
   * 是否渐变
   * @param thing
   */
  isGradient: (thing: unknown) => {
    const item = thing as any;
    return !!(item && (item.type === "linear" || item.type === "radial"));
  },
  /**
   * 是否图案填充
   * @param thing
   */
  isPattern: (thing: unknown) => {
    const item = thing as any;
    return !!(item && item.type === "image");
  },
};

/**
 * 查找子元素中最小的x坐标和y坐标（一般用于创建组时使用）
 * @param array
 */
export function findChildrenMinXY(array: any[]): {
  minX: number;
  minY: number;
} {
  let minX = array.reduce((min, p) => (p.x < min ? p.x : min), array[0].x);
  let minY = array.reduce((min, p) => (p.y < min ? p.y : min), array[0].y);

  return { minX, minY };
}

/**
 * Edited constants.ts
Edited package.json
Edited mLeaferCanvas.ts
Edited mLeaferCanvas.ts
Edited mLeaferCanvas.ts
Edited mLeaferCanvas.ts
Edited entity-access-modal.vue
Edited entity-access-modal.vue
Edited index.vue
Edited index.vue
Viewed utils.ts:1-24
Viewed utils.ts:1-92
Searched for "from "@/views/Editor/utils/utils""
Searched for "typeUtil"
Searched for "findChildrenMinXY"
Searched for "getDefaultName"
Searched for "getParentLayer"

爸爸，[utils.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/utils.ts) 是编辑器模块中的**图层与元素工具函数文件**。它封装了与 Leafer UI 节点类型判断、图层级关系获取、默认命名生成等相关的辅助函数，是编辑器核心功能和 UI 面板的公共基石。

下面为您详细拆解该文件里的关键方法及其在项目中的具体应用场景：

---

### 1. `getDefaultName(leafer: Frame | Leafer)`
* **功能**：自动生成新创建图层的默认名称。规则为：`"图层" + (当前子元素数量 + 1)`。
* **应用场景**：
  * **元素添加**：当您从左侧面板添加文本、图片、预设图形、素材模板时，这些文件（如 [ToolsWrap.vue](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/layouts/panel/leftPanel/wrap/ToolsWrap.vue)、[TextListWrap.vue](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/layouts/panel/leftPanel/wrap/TextListWrap.vue)、[GraphListWrap.vue](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/layouts/panel/leftPanel/wrap/GraphListWrap.vue) 等）会调用它为新图层赋初名。
  * **自由绘制**：在 [penDraw.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/penDraw.ts) 画笔工具结束绘制并提交新路径时，用于生成路径图层的默认名字。

### 2. `getParentLayer(layer: IUI)`
* **功能**：获取图层的直接父级。如果目标已是底层画布本身（通过 `typeUtil.isBottomCanvas` 判断），则直接返回其自身，避免越界。
* **应用场景**：
  * **层级调整**：在 [layer.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts) 中，用户执行“上移一层”、“下移一层”或“置顶置底”操作时，需要通过此函数获取父容器，在其子节点列表 `parent.children` 里做数组重排。

### 3. `typeUtil` (类型判断工具集)
这里封装了各类元素类型的边界判定，是防止操作越界的核心防火墙：
* **`isBottomCanvas(layer)` / `isBottomLeafer(layer)`**：
  * *判定*：图层名字为 `'workspace'` (即 `BOTTOM_CANVAS_NAME`) 或 `innerId` 为 1 且标签为 `Leafer`。
  * *应用*：在右侧属性栏 [setting.vue](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/layouts/panel/rightPanel/setting.vue)、顶部操作栏 [headerBar.vue](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/layouts/header/headerBar.vue)、右键菜单 [contextMenu.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/contextMenu.ts) 中，如果选中的是底层画布，则会**置灰/隐藏**删除、复制、旋转、锁定等对普通图层才生效的功能。
* **`isVirtualElement(layer)` / `isVirtualOrBottom(layer)`**：
  * *判定*：多选多个图层时，Leafer 自动生成的临时包装框（没有挂载实际 `app` 实例）或者是底层画布。
  * *应用*：用于剪贴板操作 [clipboard.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/clipboard.ts)。当多选（即选中虚拟包装框）时，复制逻辑需要特殊处理（复制它的子集，而非复制虚拟容器本身）。
* **`isCollection(thing)`**：
  * *判定*：判断元素是否是图层组（Group / 拥有 `children` 属性且不是画笔元素）。
  * *应用*：在图层面板 [layers.vue](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/layouts/panel/rightPanel/layers.vue) 中，用以判断当前节点是否是文件夹（组），从而决定是否渲染展开/折叠箭头，以及决定拖拽时是否允许作为容器被拖入。
* **`isGradient(thing)` / `isPattern(thing)`**：
  * *判定*：判断填充是渐变（线性 `linear` / 径向 `radial`）还是图片填充（`image`）。
  * *应用*：应用于颜色选择器 [Gradient/index.vue](file:///d:/项目相关/AAA/gzm-design/src/components/colorPicker/Gradient/index.vue) 以及颜色获取 hooks [useActiveObjectColor.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/hooks/useActiveObjectColor.ts)，以正确解析与呈现渐变滑块或图片纹理。

### 4. `findChildrenMinXY(array: any[])`
* **功能**：计算传入的一组节点中，物理坐标的最小 `x` 和最小 `y`（即这堆元素组合后的左上角原点）。
* **应用场景**：
  * **图层组合（Group）**：当用户选择多个独立的元素并按下 `Ctrl+G` 快捷键建组时，用于计算新 Group 容器的起始定位点，将各子元素转换到该组的相对坐标系中。
 */
