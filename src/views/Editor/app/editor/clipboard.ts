import {
  MLeaferCanvas,
  IMLeaferCanvas,
} from "@/views/Editor/core/canvas/mLeaferCanvas";
import { Disposable } from "@/views/Editor/utils/lifecycle";
import {
  IKeybindingService,
  KeybindingService,
} from "@/views/Editor/core/keybinding/keybindingService";
import {
  ClipboardService,
  IClipboardService,
} from "@/views/Editor/core/clipboard/clipboardService";
import {
  IEditorUndoRedoService,
  EditorUndoRedoService,
} from "@/views/Editor/app/editor/undoRedo/undoRedoService";
import { clamp, clone } from "lodash";
import { appInstance } from "@/views/Editor/app";
import { PointerEvent, Point, Group, LeafList } from "leafer-ui";
import { IGroup, IUI } from "@leafer-ui/interface";
import { typeUtil } from "@/views/Editor/utils/utils";
import { EditorHelper } from "@leafer-in/editor/src/helper/EditorHelper";
import { MEditorHelper } from "@/views/Editor/utils/MEditorHelper";
import { Matrix } from "@leafer-ui/core";

export class Clipboard extends Disposable {
  private pointer = new Point();
  private activeObject: IUI;
  private group: IGroup;

  constructor(
    @IMLeaferCanvas private readonly canvas: MLeaferCanvas,
    @IKeybindingService readonly keybinding: KeybindingService,
    @IClipboardService private readonly clipboard: ClipboardService,
    @IEditorUndoRedoService private readonly undoRedo: EditorUndoRedoService,
  ) {
    super();

    keybinding.bind({
      "mod+x": this.clip.bind(this),
      "mod+c": this.copy.bind(this),
      "mod+v": this.paste.bind(this, false),
      "mod+shift+v": this.paste.bind(this, true),
    });
    canvas.app.tree.on(PointerEvent.MOVE, (arg: PointerEvent) => {
      this.pointer = new Point(arg.x, arg.y);
    });
  }

  private async copy() {
    const _activeObject = this.canvas.getActiveObject();
    if (!_activeObject || typeUtil.isBottomCanvas(_activeObject)) return;
    this.activeObject = clone(_activeObject);

    // 不管怎样都进组，最后再拆
    if (typeUtil.isVirtualElement(this.activeObject)) {
      // 选中元素进组
      let list: IUI[] = [];
      const objects = this.canvas.getActiveObjects();
      objects.forEach((value) => {
        const clo = value.clone();
        clo.parent = value.parent;
        list.push(clo);
      });
      this.group = MEditorHelper.group(list, objects[0]);
    } else {
      const cloneObj = this.activeObject.clone();
      this.group = MEditorHelper.group([cloneObj], this.activeObject);
    }
    // 转json
    const json = JSON.stringify(this.group.toJSON());

    // 写剪贴板
    this.clipboard.writeText(json);
  }

  private paste(currentLocation = false) {
    this.clipboard.readBlob().then((blobs) => {
      if (!blobs) return;
      blobs.forEach(async (blob) => {
        // 读取json
        const json = await blob.text();
        let serialized: any | undefined;

        if (json) {
          try {
            serialized = JSON.parse(json);
          } catch (error) {
            //
          }
        }
        // 插入元素到画板内
        const addObjects = (groupData: object) => {
          const group = new Group(groupData);
          // 粘贴到当前位置
          if (currentLocation) {
            const { x, y } =
              appInstance.editor.contextMenu?.pointer || this.pointer;
            const point = this.activeObject.parent
              ? this.activeObject.parent.getInnerPoint({
                  x: x,
                  y: y,
                })
              : this.canvas.contentFrame.getInnerPoint({ x: x, y: y });
            group.x = point.x;
            group.y = point.y;
          } else {
            // 略微在原基础上偏移粘贴
            group.x += 15;
            group.y += 15;
          }
          this.canvas.add(group);
          // 选中元素
          this.canvas.setActiveObjects(group.children);
          // 解组
          MEditorHelper.ungroup([group]);
        };
        addObjects(serialized);
        // this.undoRedo.saveState()
        currentLocation &&
          (appInstance.editor.contextMenu!.pointer = undefined);
      });
    });
  }

  private clip() {
    this.copy();
    this.keybinding.trigger("del");
  }

  public dispose(): void {
    super.dispose();
    this.keybinding.unbind(["mod+x", "mod+c", "mod+v", "mod+shift+v"]);
  }
}

/**
 * Edited penDraw%20copy.ts
Viewed clipboard.ts:15-38
Viewed clipboard.ts:1-122

爸爸，我已经为您看过了，[clipboard.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/clipboard.ts) 是编辑器的**复制、剪切、粘贴（剪贴板）逻辑控制器**。

---

### 一、 这个文件是干嘛的？

**[Clipboard](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/clipboard.ts#L15)** 类继承自 **[Disposable](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/lifecycle.ts)**，属于应用层控制器。它通过拦截系统拷贝按键和右键菜单指令，**管理画布上被选中图层元素的克隆、序列化存储（写剪贴板）与反序列化还原（读剪贴板并绘制）**。

它支持四套快捷键行为：
1. **`mod+c` (复制)**：
   * 排除底层画布背景。
   * **进组克隆**：若当前多选，则克隆所有选中元素并利用 `MEditorHelper.group` 组成一个临时 `Group`；若为单选，则直接克隆并组成单元素 `Group`。
   * **转为 JSON**：将克隆组调用 `toJSON()` 转为 JSON 格式并写入物理剪贴板中（以便实现跨标签页甚至是跨应用的拷贝）。
2. **`mod+v` (常规粘贴)**：
   * 从剪贴板读取 JSON 并解析。
   * **偏移粘贴**：在原有的 X、Y 坐标基础上向右下方**偏移 15 像素**进行粘贴，随之在画布上解散该临时 `Group`，让它们重新成为独立的物理图层，并默认设为当前选中态。
3. **`mod+shift+v` (原位粘贴 / 指针处粘贴)**：
   * 从剪贴板读取 JSON 并解析。
   * **原位粘贴**：以用户右键点击的指针位置（或最后鼠标移动的坐标）为目标原点，将其逆向转换为画布的内部坐标（`getInnerPoint`）并粘贴，随后自动解组。
4. **`mod+x` (剪切)**：
   * 自动先调用 `copy()` 记录入剪贴板，然后触发 `KeybindingService` 绑定的删除按键 `del` 指令，从而删除选中元素。

---

### 二、 它如何与其他文件合作？

[Clipboard](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/clipboard.ts#L15) 处于应用控制层，在幕后将**系统剪贴板、快捷键引擎、编辑框组装辅助类以及右键菜单**联通在一起：

#### 1. 与底层剪贴板服务的合作（数据读写）
* 注入了 **[ClipboardService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/clipboard/clipboardService.ts)**：
  * `ClipboardService` 负责去调用浏览器原生的 `navigator.clipboard` 规范 API 来读写系统文本。而 `Clipboard` 专注于处理 Leafer 图元的 JSON 转换、克隆和位置运算，实现底层数据抽象和交互逻辑的分离。

#### 2. 与底层画布的配合（渲染树操纵）
* 注入了 **[MLeaferCanvas](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts)**：
  * 通过 `canvas.getActiveObject()` 提取被拷贝图层。
  * 将粘贴出的新图层使用 `canvas.add(group)` 压入画布帧，并通过 `canvas.setActiveObjects()` 对粘贴出来的新图层进行选中高亮。

#### 3. 与快捷键与其它控制器的合作
* 注入 **[KeybindingService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/keybinding/keybindingService.ts)** 注册按键映射。
* 并在剪切（`clip`）时，通过调用 `this.keybinding.trigger('del')` 直接复用了在 [layer.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts) 中注册过的删除图层动作，避免重复实现。

#### 4. 与图层组装工具类的配合
* 引入了 **[MEditorHelper](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/MEditorHelper.ts)**：
  * 因为在多选图层进行拷贝和解开粘贴时，需要精确计算多选外包装框的坐标，因此它调用了 `MEditorHelper.group()` 和 `ungroup()` 来处理拷贝时的“打包”和粘贴后的“拆包还原”操作。

#### 5. 与右键菜单的合作（精确定位粘贴）
* 引入了全局实例中的 **[ContextMenu (右键菜单)](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/contextMenu.ts)**：
  * 当用户在画布上点右键，点击菜单上的“粘贴至此处”时，`Clipboard` 会去读取 `appInstance.editor.contextMenu?.pointer` 获取右键点击时刻的绝对坐标，完成光标点位贴图。
 */
