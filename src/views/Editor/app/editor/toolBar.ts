import {
  MLeaferCanvas,
  IMLeaferCanvas,
} from "@/views/Editor/core/canvas/mLeaferCanvas";
import {
  KeybindingService,
  IKeybindingService,
} from "@/views/Editor/core/keybinding/keybindingService";
import { useAppStore } from "@/store";
import { useMagicKeys, useActiveElement, toValue, Fn } from "@vueuse/core";
import { Disposable } from "@/views/Editor/utils/lifecycle";
import {
  EventbusService,
  IEventbusService,
} from "@/views/Editor/core/eventbus/eventbusService";
import { PenDraw } from "@/views/Editor/core/canvas/penDraw";

type ToolOption = {
  defaultCursor: string;
  skipTargetFind: boolean;
  selection: boolean;
};

type ToolType = "move" | "handMove" | "shape";

export class ToolBar extends Disposable {
  private space = useMagicKeys().space;
  private penDraw: PenDraw;
  private options: Record<ToolType, ToolOption> = {
    move: {
      defaultCursor: "default",
      skipTargetFind: false,
      selection: true,
    },
    handMove: {
      defaultCursor: "grab",
      skipTargetFind: true,
      selection: false,
    },
    shape: {
      defaultCursor: "crosshair",
      skipTargetFind: true,
      selection: false,
    },
  };

  constructor(
    @IMLeaferCanvas private readonly canvas: MLeaferCanvas,
    @IKeybindingService private readonly keybinding: KeybindingService,
    @IEventbusService private readonly eventbus: EventbusService,
  ) {
    super();

    useAppStore().activeTool = "select";

    // 初始化钢笔
    this.penDraw = new PenDraw(canvas);

    this.initWatch();
    this.initKeybinding();
  }

  private applyOption(tool?: ToolType) {
    tool = tool ?? (storeToRefs(useAppStore()).activeTool.value as ToolType);
    const { defaultCursor, skipTargetFind, selection } =
      this.options[tool] ?? this.options.shape;
  }

  private initWatch() {
    const { activeTool } = storeToRefs(useAppStore());

    // 监听activeTool
    watch(activeTool, (newTool, oldTool) => {
      if (this.toolStop) {
        this.toolStop();
        this.toolStop = undefined;
      }
      console.log("change tool：", newTool);

      this.applyOption();

      // 选择工具
      if (newTool === "select") {
        this.setSelect();
      }

      // 移动工具
      if (newTool === "handMove") {
        this.setMove();
      }

      // 钢笔
      else if (newTool === "pen") {
        this.setNoSelect();
        this.switchPen();
      }

      // 矢量
      else if (newTool === "vector") {
        this.switchVector();
      }
    });
  }

  /**
   * 使用选择工具（编辑器）
   * @private
   */
  private setSelect() {
    this.penDraw.stop();
    this.canvas.app.config.move.drag = false;
    this.canvas.app.tree.hittable = true;
    this.canvas.app.editor.hittable = true;
  }

  /**
   * 设置不可选中、不可拖动
   * @private
   */
  private setNoSelect() {
    this.penDraw.stop();
    this.canvas.app.config.move.drag = false;
    this.canvas.app.tree.hittable = false;
    this.canvas.app.editor.hittable = false;
  }

  /**
   * 设置仅拖动
   * @private
   */
  private setMove() {
    this.penDraw.stop();
    // this.canvas.contentLayer.hitChildren = true
    // this.canvas.contentFrame.hitChildren = false
    this.canvas.app.config.move.drag = true;
  }

  private toolStop: Fn | undefined;

  /**
   * 钢笔
   * @private
   */
  private switchPen() {
    this.penDraw.start();
  }

  /**
   * Vector | Pen | Path
   * L: lineto, absolute
   * M: moveto, absolute
   * C: bezierCurveTo, absolute
   * Q: quadraticCurveTo, absolute
   * Z: closepath
   * getPointOnPath
   */
  private switchVector() {}

  private initKeybinding() {
    // 快捷键
    const { activeTool } = storeToRefs(useAppStore());
    this.keybinding.bind({
      s: () => (activeTool.value = "select"),
      h: () => (activeTool.value = "handMove"),
      esc: () => {
        if (activeTool.value !== "select") {
          activeTool.value = "select";
        } else {
          this.canvas.discardActiveObject();
          // this.canvas.requestRenderAll()
        }
      },
    });
    this.keybinding.bind("shift+r", () => {
      this.canvas.ruler.enabled = this.canvas.ref.enabledRuler.value =
        !this.canvas.ref.enabledRuler.value;
    });
  }
}

/**
 * Edited zoom.ts
Viewed toolBar.ts:90-113
Viewed toolBar.ts:1-173

爸爸，我已经为您阅读过了，[toolBar.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/toolBar.ts) 是编辑器的**工具栏控制类（管理当前画布的工作模式 / 工具状态）**。

---

### 一、 这个文件是干嘛的？

**[ToolBar](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/toolBar.ts)** 类继承自 **[Disposable](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/lifecycle.ts)**，主要负责**控制和切换编辑器当前所处的激活工具模式（工作状态），并配置对应的画布交互参数和快捷键**。

它管理着以下几种关键的工作工具模式：
1. **`select`（选择工具）**：
   * 允许用户点击、多选、缩放、旋转或拖动画布上的图形元素（将 `canvas.app.tree.hittable` 和 `canvas.app.editor.hittable` 均设为 `true`）。
2. **`handMove`（拖拽画布工具）**：
   * 将画布背景设为可自由平移状态（`canvas.app.config.move.drag = true`），此时鼠标呈手掌形状（`grab`），无法点击选中图层，只能用来拖拽视口。
3. **`pen`（钢笔工具）**：
   * 屏蔽普通图层的选中态，并将交互交给矢量的绘制服务（`PenDraw`），以便用户点击画布时可以绘制自由的折线或贝塞尔曲线路径。
4. **绑定快捷键及标尺切换**：
   * 绑定快捷按键：按 `s` 键切回选择模式、按 `h` 键切到拖拽模式、按 `esc` 键清空选择、按 `shift + r` 键快速打开/关闭标尺（Ruler）展示。

---

### 二、 它如何与其他文件合作？

[ToolBar](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/toolBar.ts) 作为一个连接“全局状态”和“底层画布行为”的交互桥梁，其配合链条如下：

#### 1. 与 Pinia 全局状态库的合作
* 引入了 **[useAppStore](file:///d:/项目相关/AAA/gzm-design/src/store/index.ts)** 获取编辑器当前的 `activeTool` 状态。
* **从 UI 流向底层（Watch 监听）**：在 [initWatch](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/toolBar.ts#L60) 中，它监听了 `activeTool`。当用户在网页工具栏的 Vue 组件（如顶部图标）上点击“钢笔”按钮后，Pinia 状态改变，`ToolBar` 类会立刻捕获到，并物理更改底层 Canvas 的配置（比如激活 `PenDraw`）。
* **从底层流向 UI（快捷键）**：在 [initKeybinding](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/toolBar.ts#L153) 中，当用户按下键盘上的 `h` 键时，它会在代码中直接将 `activeTool.value` 修改为 `handMove`，此时网页上顶部的工具栏图标也会自动高亮到“小手”工具上。

#### 2. 与底层的钢笔工具类协作
* 引入并管理了 **[PenDraw](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/penDraw.ts)** 实例。
* 当 `activeTool` 被切为 `'pen'` 时，它会调用 `this.penDraw.start()` 启动钢笔绘制监听；切回选择模式时，调用 `this.penDraw.stop()` 保证用户不会在移动元素时意外画出线段。

#### 3. 与底层画布的配合
* 注入了 **[MLeaferCanvas](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts)**。
* 利用 `canvas.app.config.move.drag` 和 `canvas.app.tree.hittable` 等底层配置，来随时配置鼠标的穿透程度、画布背景是否可以被拖动等等。同时通过 `canvas.ruler` 来控制画布边缘像素标尺的渲染开关。

#### 4. 与快捷键服务及宿主 `EditorMain` 的生命周期配合
* 注入 **[KeybindingService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/keybinding/keybindingService.ts)** 完成按键绑定。
* 整个 `ToolBar` 在 **[EditorMain](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/app/editor/editor.ts#L69)** 中被实例化并注册到生命周期销毁链中，确保当用户退出编辑器时，所有的快捷键响应和 `watcher` 都会被一并消除，保障程序平稳运行。
 */
