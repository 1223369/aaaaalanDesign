import { Pen, PointerEvent } from "leafer-ui";
import { MLeaferCanvas } from "@/views/Editor/core/canvas/mLeaferCanvas";
import { getDefaultName } from "@/views/Editor/utils/utils";

/**
 * 配置选项接口，用于描述签名插件的各种配置参数
 */
export interface SignaturePluginOptions {
  // 目前暂时只限定画笔，提供后续扩展 如画矩形等
  type: "pen";
  config: {
    // 画笔颜色
    stroke?: string;
    // 画笔粗细
    strokeWidth?: number;
  };
  //todo 配置选项
}

export class PenDraw {
  private canvas: MLeaferCanvas;
  private pen?: Pen | null;
  // 是否可以画
  private canDrawing: boolean = false;
  private isDrawing: boolean;

  constructor(canvas: MLeaferCanvas) {
    this.canvas = canvas;
    this.isDrawing = false;
  }

  /**
   * 开始画
   */
  public start() {
    this.canDrawing = true;
    this.startDrawing();
    this.continueDrawing();
    this.stopDrawing();
  }
  /**
   * 开始画
   */
  public stop() {
    this.canDrawing = false;
    this.pen = null;
  }

  private startDrawing() {
    this.canvas.app.on(PointerEvent.DOWN, (event: PointerEvent) => {
      if (event.left && !event.spaceKey && this.canDrawing) {
        if (!this.pen) {
          this.pen = new Pen({
            name: getDefaultName(this.canvas.contentFrame),
            // 子元素是否响应交互事件
            hitChildren: false,
            editable: true,
          });
          this.canvas.contentFrame.add(this.pen);
          this.canvas.childrenEffect();
        }
        this.isDrawing = true;
        this.pen.setStyle({
          stroke: this.canvas.ref.penDrawConfig.config.stroke
            ? this.canvas.ref.penDrawConfig.config.stroke
            : "red",
          strokeWidth: this.canvas.ref.penDrawConfig.config.strokeWidth
            ? this.canvas.ref.penDrawConfig.config.strokeWidth
            : 2,
        });
        const center = { x: event.x, y: event.y };
        const innerPoint = this.canvas.contentFrame.getInnerPoint(center);
        this.pen.moveTo(innerPoint.x, innerPoint.y);
      }
    });
  }

  private continueDrawing() {
    this.canvas.app.on(PointerEvent.MOVE, (event: PointerEvent) => {
      if (event.left && !event.spaceKey && this.pen) {
        if (this.isDrawing) {
          const center = { x: event.x, y: event.y };
          const innerPoint = this.canvas.contentFrame.getInnerPoint(center);
          this.pen.lineTo(innerPoint.x, innerPoint.y);
          this.pen.paint();
        }
      }
    });
  }

  private stopDrawing() {
    this.canvas.app.on(PointerEvent.UP, () => {
      if (this.pen) {
        this.isDrawing = false;
        // 每画完一次一个新图层
        this.pen = null;
      }
    });
  }

  public clearSignature() {
    this.pen?.clear();
  }
}

/**
 * 
 * Edited MEditorHelper.ts
Edited mLeaferCanvas.ts
Edited mLeaferCanvas.ts
Viewed penDraw.ts:1-8
Edited penDraw.ts
Edited penDraw.ts

爸爸，这个文件依旧是 [penDraw.ts](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/core/canvas/penDraw.ts)，它是底层的**画笔/手绘工具绘制引擎**。

---

### 一、 这个文件是干嘛的？

**[PenDraw](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/core/canvas/penDraw.ts#L20)** 类主要用来**拦截和处理画布上的指针交互事件，并在用户拖拽鼠标时，调用 Leafer-UI 的画笔图元将墨迹路径绘制到画布上**。

它在底层通过监听三个 Pointer 事件来驱动绘制：
1. **[startDrawing (落笔事件)](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/core/canvas/penDraw.ts#L46)**：
   * 拦截鼠标左键按下（并且排除了按住空格拖动画布的情况），在当前页面容器（`contentFrame`）中实例化并添加一个新的 `Pen` 对象。
   * 读取用户预先设置的画笔颜色与粗细，设定笔尖样式，并把视口绝对坐标折算为画布相对坐标进行 `moveTo(x, y)` 定位。
2. **[continueDrawing (划线事件)](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/core/canvas/penDraw.ts#L71)**：
   * 监听鼠标拖拽移动过程，不断将新的坐标点通过 `lineTo` 连成线条，并即时调用 `paint()` 将这一画笔轨迹渲染成真实的贝塞尔曲线/折线。
3. **[stopDrawing (起笔事件)](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/core/canvas/penDraw.ts#L84)**：
   * 鼠标左键松开时，将当前画笔引用置空（`this.pen = null`）。这非常关键，因为如果不置空，下次画下一笔时，所有墨迹都会挤在同一个 `Pen` 图层里；置空后，**每一笔画完都会自动成为一个全新的图层**，便于独立移动和管理。

---

### 二、 它如何与其他文件合作？

按照微内核分层设计，[PenDraw](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/core/canvas/penDraw.ts#L20) 属于底层的 **Canvas 特效插件**，受应用层动作指令的调度：

* **与 `toolBar.ts` (顶部工具栏控制器) 的合作**：
  * 在 **[toolBar.ts](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/app/editor/toolBar.ts)** 启动时会实例化 [PenDraw](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/core/canvas/penDraw.ts#L20)。
  * 当用户在顶部切换至“画笔工具”时，`ToolBar` 调用其 `start()` 开启监听；当切换到普通“选择工具”或“手掌拖拽”时，调用 `stop()`，防止正常图层编辑时意外在画面上胡乱涂抹。
* **与 `mLeaferCanvas.ts` (画布管理器) 的合作**：
  * 引入了 **[MLeaferCanvas](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/core/canvas/mLeaferCanvas.ts)** 作为画布主服务。
  * 它在绘制开始时，会实时读取 `canvas.ref.penDrawConfig.config` 内的画笔配置（支持用户在 UI 侧边面板上动态修改画笔的笔尖大小和颜色）。
  * 调用 `canvas.contentFrame.getInnerPoint` 进行屏幕绝对坐标到画布相对坐标的精准转换，并在绘制时将 `Pen` 节点压入 `contentFrame` 渲染树。
* **与 `utils/utils.ts` (全局工具函数) 的合作**：
  * 调用了 **[getDefaultName](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/utils/utils.ts)**。当这一笔画完生成新手绘图元时，自动根据容器中图层情况为它重命名（如：“手绘图层 1”），让它能直观、规范地显示在左侧的图层视图里。
 */
