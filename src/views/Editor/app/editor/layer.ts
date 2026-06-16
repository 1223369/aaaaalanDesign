import {
  IMLeaferCanvas,
  MLeaferCanvas,
} from "@/views/Editor/core/canvas/mLeaferCanvas";
import {
  IKeybindingService,
  KeybindingService,
} from "@/views/Editor/core/keybinding/keybindingService";
import { Disposable } from "@/views/Editor/utils/lifecycle";
import {
  EventbusService,
  IEventbusService,
} from "@/views/Editor/core/eventbus/eventbusService";
import { keybindMap } from "@/views/Editor/utils/constants";
import { getParentLayer } from "@/views/Editor/utils/utils";
import { IUI } from "@leafer-ui/interface";
import {
  IEditorUndoRedoService,
  EditorUndoRedoService,
} from "@/views/Editor/app/editor/undoRedo/undoRedoService";
import {
  IHierarchyService,
  HierarchyService,
} from "@/views/Editor/core/layer/hierarchyService";
import {
  Box,
  DragEvent,
  DropEvent,
  PropertyEvent,
  ChildEvent,
} from "leafer-ui";
import { v4 as uuidv4 } from "uuid";
import { Message } from "@arco-design/web-vue";

export class Layer extends Disposable {
  constructor(
    @IMLeaferCanvas private readonly canvas: MLeaferCanvas,
    @IKeybindingService private readonly keybinding: KeybindingService,
    @IEventbusService readonly eventbus: EventbusService,
    @IEditorUndoRedoService private readonly undoRedo: EditorUndoRedoService,
    @IHierarchyService private readonly hierarchyService: HierarchyService,
  ) {
    super();
    canvas.contentLayer.on(ChildEvent.ADD, (e) => {
      hierarchyService.addItem({
        key: e.target.innerId,
        zIndex: e.target.zIndex,
      });
    });
    canvas.contentLayer.on(PropertyEvent.CHANGE, (e: PropertyEvent) => {
      if (e.attrName === "zIndex") {
        hierarchyService.updateOrAddItem({
          key: e.target.innerId,
          zIndex: <number>e.newValue,
        });
      }
    });
    this.keybinding.bind(["del", "backspace"], () => {
      const objects = canvas.getActiveObjects();
      if (objects.length === 0) return;
      this.deleteLayer(objects);
      canvas.discardActiveObject();
      return false;
    });

    // 重命名
    this.keybinding.bind("mod+r", () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      eventbus.emit("layerRename", {
        id: activeObject.innerId,
      });
      return false;
    });

    // 水平翻转
    this.keybinding.bind("shift+h", () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      activeObject.flip("x");
      // this.undoRedo.saveState()
      return false;
    });

    // 垂直翻转
    this.keybinding.bind("shift+v", () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      activeObject.flip("y");
      return false;
    });

    // 移至底层
    this.keybinding.bind("[", () => {
      canvas.app.editor.toBottom();
      // this.hierarchyService.moveToBottom(keys)
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      this.objForEach((obj) => {
        const group = obj.parent;
        // 排除已经在最底层的元素
        if (
          group.children?.indexOf(obj) === activeObject.children?.indexOf(obj)
        ) {
          return;
        }
        obj.zIndex = this.hierarchyService.getBottomLevel().zIndex - 1;
      });
      canvas.childrenEffect();
      // this.undoRedo.saveState()
      return false;
    });

    // 移至顶层
    this.keybinding.bind("]", () => {
      canvas.app.editor.toTop();
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      this.objForEach((obj) => {
        const group = obj.parent;
        // 排除已经在最底层的元素
        if (
          group.children?.indexOf(obj) === activeObject.children?.indexOf(obj)
        ) {
          return;
        }
        obj.zIndex = this.hierarchyService.getTopLevel().zIndex + 1;
      });
      canvas.childrenEffect();
      // this.undoRedo.saveState()
      return false;
    });

    // 向下移动一层
    this.keybinding.bind("mod+[", () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;

      const keys = this.canvas.getActiveObjects().map((value) => {
        return value.innerId;
      });
      let nextLevel = this.hierarchyService.getNextLevel(keys);
      this.objForEach((obj) => {
        const group = obj.parent;
        // 排除已经在最底层的元素
        if (
          group.children?.indexOf(obj) === activeObject.children?.indexOf(obj)
        ) {
          return;
        }
        obj.zIndex = nextLevel.zIndex - 1;
      });
      // canvas.childrenEffect()
      // this.undoRedo.saveState()
      return false;
    });

    // 向上移动一层
    this.keybinding.bind("mod+]", () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      const keys = this.canvas.getActiveObjects().map((value) => {
        return value.innerId;
      });
      let previousLevel = this.hierarchyService.getPreviousLevel(keys);

      this.objForEach((obj) => {
        const group = obj.parent;
        // 排除已经在最顶层的元素
        if (
          group.children.indexOf(obj) + activeObject.children?.length ===
          activeObject.children?.indexOf(obj) + group.children.length
        ) {
          return;
        }
        obj.zIndex = previousLevel.zIndex + 1;
      }, true);
      // canvas.requestRenderAll()
      // this.undoRedo.saveState()
      return false;
    });

    // 创建分组
    this.keybinding.bind(keybindMap.group, () => {
      // 创建组
      /**
       * 为什么打组使用Box而不是Group？因为Group本身是不支持任何样式的，比如想给某个组添加边框时使用Group就实现不了，所以这里采用功能更多的Box来实现打组
       */
      // const box = new Box()
      // canvas.app.editor.group(box)
      // box不支持蒙版/擦除效果，所以这里暂时先继续使用Group 有需要的可以自行实现一个Box的自定义组
      const group = canvas.app.editor.group();
      group.zIndex = this.hierarchyService.getTopLevel().zIndex + 1;
      canvas.bindDragDrop(group);
      canvas.childrenEffect();
      return false;
    });

    // 解除分组
    this.keybinding.bind(keybindMap.ungroup, () => {
      canvas.app.editor.ungroup();
      canvas.childrenEffect();
      // this.undoRedo.saveState()
      return false;
    });

    // 选择全部
    this.keybinding.bind("mod+a", () => {
      const activeObject = canvas.getActiveObject();
      const parent = getParentLayer(activeObject);
      // const parent = activeObject?.parent || canvas.app.tree
      canvas.setActiveObjects(parent.children);
      return false;
    });

    // 显示/隐藏
    this.keybinding.bind("mod+shift+h", () => {
      this.objForEach((obj) => {
        obj.visible = !obj.visible;
      });
      // this.undoRedo.saveState()
      return false;
    });

    // 锁定/解锁
    this.keybinding.bind("mod+shift+l", () => {
      if (this.canvas.app.editor.editing) {
        // 统一多选状态，多选以第一个元素状态为准
        const firstLocked = this.canvas.app.editor.list[0].locked;
        if (firstLocked) {
          this.canvas.app.editor.unlock();
        } else {
          this.canvas.app.editor.lock();
        }
      }
      // this.undoRedo.saveState()
      return false;
    });

    // 另存为PNG
    this.keybinding.bind("mod+shift+k", () => {
      if (this.canvas.app.editor.element) {
        this.canvas.app.editor.element
          .export(`${uuidv4()}.png`)
          .catch((reason) => {
            Message.error(`导出失败：${reason}`);
          });
      }
      return false;
    });
  }

  private objForEach(fn: (obj: any) => void, reverse = false) {
    const objects = this.canvas.getActiveObjects();
    if (reverse) {
      objects.reverse();
    }
    const length = objects.length - 1;
    for (let i = length; i >= 0; i--) {
      fn(objects[length - i]);
    }
  }

  private deleteLayer(objects: (IUI | undefined)[]) {
    const removed = objects?.flatMap((obj) => obj?.remove());
    return removed;
  }
}

/**
 * Viewed layer.ts:85-108
Viewed layer.ts:1-241

爸爸，原来您指的是 [layer.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts) 文件。抱歉刚才理解错了，接下来我为您详细剖析它的职责以及它与项目中其他文件的配合机制！

---

### 一、 这个文件是干嘛的？

**[Layer](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts)** 类继承自 **[Disposable](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/lifecycle.ts)**，主要负责**管理图层的操作（如移动层级、翻转、成组、删除、重命名等）并将其与对应的键盘快捷键进行绑定**。

它在编辑器的运行中实现了以下快捷键交互逻辑：
1. **层级排序调整**：
   * `[`：将选中图层移至最底层。
   * `]`：将选中图层移至最顶层。
   * `mod + [` (Mac: `Cmd+[`, Win: `Ctrl+[`)：将选中图层向下移动一层。
   * `mod + ]` (Mac: `Cmd+]`, Win: `Ctrl+]`)：将选中图层向上移动一层。
2. **元素操作与编组**：
   * `del` / `backspace`：删除选中元素（调用 [deleteLayer](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts#L235-L238) 方法）。
   * `mod + g`（由 `keybindMap.group` 传入）：对多选元素进行编组。
   * `mod + shift + g`（由 `keybindMap.ungroup` 传入）：对选中组进行解散编组。
   * `mod + a`：仅在当前激活图层所属的父容器下选择全部兄弟元素。
3. **状态翻转与显隐**：
   * `shift + h` / `shift + v`：实现水平 / 垂直镜像翻转。
   * `mod + shift + h`：控制选中元素的显示与隐藏（切换 `visible` 属性）。
   * `mod + shift + l`：控制选中元素的锁定与解锁。
4. **单图层导出**：
   * `mod + shift + k`：将当前选中元素单独导出为 PNG 格式并保存。
5. **感知图层结构变化**：
   * 监听底层画布（`canvas.contentLayer`）上子节点的添加（`ChildEvent.ADD`）与 `zIndex` 属性修改（`PropertyEvent.CHANGE`），同步更新层级记录表。

---

### 二、 如何与其他文件配合的？

[Layer](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts) 通过系统的**依赖注入（DI）**、**事件总线**以及**公共工具类**与周围其他模块实现了高度解耦的配合：

#### 1. 与底层画布的配合
* **[MLeaferCanvas](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts)** (通过 [@IMLeaferCanvas](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts#L16) 注入)：
  * `Layer` 所有的操作都直接作用在 [MLeaferCanvas](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts) 上，如：通过 `canvas.getActiveObjects()` 拿到选中的节点列表；通过 `canvas.app.editor.group()` 进行编组；最后通过 `canvas.childrenEffect()` 来应用图形改变效果。

#### 2. 与快捷键服务的配合
* **[KeybindingService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/keybinding/keybindingService.ts)** (通过 [@IKeybindingService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts#L17) 注入)：
  * 提供了快捷键注册器。`Layer` 在构造函数中，通过 `this.keybinding.bind('快捷键键位', 回调函数)` 将快捷按键（如 `mod+[`）跟内部的图层位移操作绑定起来。

#### 3. 与层级拓扑服务的配合
* **[HierarchyService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/layer/hierarchyService.ts)** (通过 [@IHierarchyService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts#L20) 注入)：
  * 频繁地在真实 Canvas 树上查找前后图层并计算它们的相对 `zIndex` 非常昂贵。
  * `HierarchyService` 提供了一个轻量级的层级字典。当画布上有子元素添加或 `zIndex` 改变时，`Layer` 会在构造函数内监听并调用 `hierarchyService.updateOrAddItem(...)` 同步层级数据。
  * 在图层上下移动时，调用 `hierarchyService.getNextLevel(...)` 和 `getPreviousLevel(...)` 得到上下图层的 zIndex 值，以此更新节点在底层画布中的渲染次序。

#### 4. 与事件总线的配合
* **[EventbusService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/eventbus/eventbusService.ts)** (通过 [@IEventbusService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts#L18) 注入)：
  * 用于底层行为与 Vue 视图界面的通信。
  * 比如按下 `mod+r` 时，`Layer` 并不直接渲染输入框，而是通过 `eventbus.emit('layerRename', { id })` 广播事件，上层 Vue 界面（例如图层列表组件）监听到此事件后，才会在对应的图层上展示编辑输入框。

#### 5. 与宿主 `EditorMain` 的生命周期配合
* 在 **[EditorMain](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/app/editor/editor.ts#L68)** 启动（`startup`）时，会将 `Layer` 作为一个子实例创建并利用 `_register(instance)` 注册。
* 这样，当编辑器销毁时，[Layer](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts) 会随着宿主一起被释放，它绑定在快捷键管理器（`KeybindingService`）和 Canvas 事件源上的监听器会被统一清空，避免因为没有解绑而导致内存泄漏。

#### 6. 与公共工具类的配合
* 引入了 **[getParentLayer](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/utils.ts#L129)**（在 [utils.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/utils.ts) 中）用于在执行 `mod+a` 全选操作时，快速定位到当前选中图层所属的最接近物理容器，确保“全选”是在局部层级内进行而不是跨越边界。
 */
