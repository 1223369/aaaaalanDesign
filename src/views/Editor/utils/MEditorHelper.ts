import { IGroup, ILeaf, IUI } from "@leafer-ui/interface";
import { Group, Matrix } from "@leafer-ui/core";

const order = (a: ILeaf, b: ILeaf) =>
  a.parent.children.indexOf(a) - b.parent.children.indexOf(b);
const reverseOrder = (a: ILeaf, b: ILeaf) =>
  b.parent.children.indexOf(b) - a.parent.children.indexOf(a);

export const MEditorHelper = {
  group(list: IUI[], element?: IUI, group?: IGroup): IGroup {
    list.sort(reverseOrder);
    // const { app, parent } = list[0]
    const { app, parent } = element;
    if (!group) group = new Group();
    // parent.addAt(group, parent.children.indexOf(list[0]))
    list.sort(order);

    const matrx = new Matrix(element.worldTransform);
    matrx.divideParent(parent.worldTransform);
    group.setTransform(matrx);
    group.editable = true;
    group.hitChildren = false;

    app.lockLayout();
    list.forEach((child) => child.dropTo(group));
    app.unlockLayout();

    return group;
  },
  ungroup(list: IUI[]): IUI[] {
    const { app } = list[0];
    const ungroupList: IUI[] = [];

    app.lockLayout();
    list.forEach((leaf) => {
      if (leaf.isBranch) {
        const { parent, children } = leaf;
        while (children.length) {
          ungroupList.push(children[0]);
          children[0].dropTo(parent, parent.children.indexOf(leaf));
        }
        leaf.remove();
      } else {
        ungroupList.push(leaf);
      }
    });
    app.unlockLayout();

    return ungroupList;
  },

  /**
   * 设置为蒙版
   * @param element
   * @param group
   */
  setAsMask(element: IUI, group?: Group): IGroup {
    if (!group) group = new Group();

    const { app, parent } = element;

    const matrx = new Matrix(element.worldTransform);
    matrx.divideParent(parent.worldTransform);
    group.setTransform(matrx);
    group.editable = true;
    group.hitChildren = false;

    // 将element元素移动到group.children数组的第一位
    const eleIndex = group.children.indexOf(element);
    if (eleIndex > -1) {
      group.children.splice(eleIndex, 1);
    }
    element.mask = true;
    group.addAt(element, eleIndex);
    // group.children.unshift(element);

    // app.lockLayout()
    // list.forEach(child => child.dropTo(group))
    // app.unlockLayout()

    return group;
  },

  /**
   * 移除蒙版
   * @param element
   * @param group
   */
  removeMask(element: IUI) {
    element.mask = false;
  },
};
/**
 * Edited clipboardService.ts
Viewed MEditorHelper.ts:83-93
Viewed MEditorHelper.ts:1-93

爸爸，我已经仔细阅读了 [MEditorHelper.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/MEditorHelper.ts) 的完整代码，它是编辑器的**图元成组、解组与蒙版关系运算辅助工具类**。

---

### 一、 这个文件是干嘛的？

**[MEditorHelper](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/MEditorHelper.ts#L8)** 是一个工具类，它直接对底层 Leafer-UI 图元节点的世界变换矩阵（`worldTransform`）及节点树拓扑结构进行操作，封装了图形编辑器中非常关键的三个物理级操作：

1. **[group (打组)](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/MEditorHelper.ts#L10-L29)**：
   * 将选中的多个图层合并到一个新建的 `Group` 组容器里。
   * **矩阵坐标对齐**：通过 `Matrix` 运算计算出目标图层的世界坐标矩阵，除以其父容器矩阵，使新建的 `Group` 能够不偏不倚地“刚刚好”精准包裹住这批选中的图层。
   * **防抖控制**：通过 `app.lockLayout()` 和 `app.unlockLayout()` 在子图层物理转移（`dropTo`）的过程中锁定画布重排，防止图层树高频刷新导致卡顿闪烁。
2. **[ungroup (解组 / 拆群组)](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/MEditorHelper.ts#L30-L50)**：
   * 拆散群组。它会遍历传入的节点，若是组容器（`isBranch`），则在保持其子元素物理绝对坐标不变的情况下，调用 `dropTo(parent)` 将子元素一个接一个“释放”到原本 `Group` 所处的外部父容器中，随后物理移除并销毁多余的空 `Group` 外壳。
3. **[setAsMask (设为蒙版 / 剪切遮罩)](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/MEditorHelper.ts#L57-L82)** 与 **[removeMask (取消蒙版)](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/MEditorHelper.ts#L89-L91)**：
   * **遮罩裁切**：在图形学中，蒙版（Mask）能根据当前图层的形状裁切上层元素。它将传入的图元设为 `mask = true`，并移动到 `Group` 容器的第 0 位（最底层），从而将整个组的其他兄弟节点都纳入该图层形状的剪切裁切范围内。

---

### 二、 它如何与其他文件合作？

按照我们之前的“分层模型”，[MEditorHelper](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/MEditorHelper.ts#L8) 属于通用的 **底层画布工具库（Utils）**。它不关心键盘按下、也不关心 UI 按钮，只是在幕后被各类业务控制器调用，充当物理操纵图元结构的“手术刀”：

#### 1. 与 `clipboard.ts`（复制粘贴控制器）的合作
* 在 **[clipboard.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/clipboard.ts)** 中：
  * 用户按 `Ctrl+C` 复制多个选中图层时，需要临时“打包”保存。它调用了 `MEditorHelper.group()` 将克隆的子图层拼成一个组并存入剪贴板文本中。
  * 用户按 `Ctrl+V` 粘贴时，它调用 `MEditorHelper.ungroup([group])` 在指定坐标处将组拆开，使粘贴出来的元素重新成为独立的各个图层，还原复制时的相对层级。

#### 2. 与 `layer.ts`（快捷键图层控制器）的合作
* 在 **[layer.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts)** 中：
  * 当用户按下打组快捷键（`Ctrl+G`）或解组快捷键（`Ctrl+Shift+G`）时，`Layer` 在快捷键回调中通过画布引擎调用底层类似的成组解组方法，而 `MEditorHelper` 正是这套机制中用于进行底层节点变换的核心工具模块。

#### 3. 与右侧属性面板（Vue UI）的合作
* 当用户在页面右侧的属性面板中点击“开启蒙版/遮罩”的开关时，Vue 组件会通过 `useEditor()` 拿到当前的画布句柄，接着在 Vue 的点击事件中直接调取 `MEditorHelper.setAsMask(activeObject)`，实现“**UI 交互触发 ➡️ 辅助工具进行拓扑转换 ➡️ 画布即时呈现裁剪视觉效果**”的联动。
 */
