import {
  IKeybindingService,
  KeybindingService,
} from "@/views/Editor/core/keybinding/keybindingService";
import { Disposable } from "@/views/Editor/utils/lifecycle";
import { Group, Matrix, Point, ZoomEvent } from "leafer-ui";
import {
  IMLeaferCanvas,
  MLeaferCanvas,
} from "@/views/Editor/core/canvas/mLeaferCanvas";

export class Zoom extends Disposable {
  private scalePadding = 0.9;
  constructor(
    @IMLeaferCanvas private readonly canvas: MLeaferCanvas,
    @IKeybindingService private readonly keybindingService: KeybindingService,
  ) {
    super();
    keybindingService.bind("+", () => {
      let zoom = canvas.ref.zoom.value;
      zoom *= 2;
      canvas.zoomToInnerPoint(zoom);
    });

    keybindingService.bind("-", () => {
      let zoom = canvas.ref.zoom.value;
      if (zoom <= 0.01) {
        canvas.zoomToInnerPoint(0.01); // 如果当前缩放比例小于等于 0.1，则保持为 0.1
      } else {
        zoom /= 2;
        canvas.zoomToInnerPoint(zoom);
      }
    });

    // 100%
    keybindingService.bind("mod+0", () => {
      canvas.zoomToInnerPoint(1);
      return false;
    });

    this.canvas.contentLayer.on(ZoomEvent.ZOOM, (arg: ZoomEvent) => {
      this.canvas.ref.zoom.value = <number>this.canvas.contentLayer.scale;
    });
  }
}

/**
 * Edited index.vue
Edited index.vue
Edited individual-form.vue
Edited mLeaferCanvas.ts
Edited mLeaferCanvas.ts
Edited mLeaferCanvas.ts
Viewed zoom.ts:24-40
Viewed zoom.ts:1-40

爸爸，我已经为您看过了，[zoom.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/zoom.ts) 是编辑器的**画布缩放控制器**。

---

### 一、 这个文件是干嘛的？

**[Zoom](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/zoom.ts)** 类继承自 **[Disposable](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/lifecycle.ts)**，专门用来**管理和绑定编辑器的画布缩放（Zoom）行为，并保持 UI 状态的实时同步**。

它在编辑器中实现了以下逻辑：
1. **键盘快捷键缩放**：
   * `+`：画布比例翻倍（`zoom *= 2`）。
   * `-`：画布比例折半（`zoom /= 2`），最低限制缩放到 `0.01`（1%），防止无限缩小导致图形在画布中彻底消失。
   * `mod+0`（Windows: `Ctrl+0` / Mac: `Cmd+0`）：画布缩放比例恢复到 `1`（即 100% 原始大小）。
2. **手势与鼠标滚轮缩放监听**：
   * 监听底层真实画布上的 `ZoomEvent.ZOOM`（手势/滚轮捏合缩放事件），并在缩放发生时，自动将最新的缩放数值更新到 `canvas.ref.zoom.value` 响应式变量中。

---

### 二、 它如何与其他文件合作？

按照本项目“内核与应用分离”的架构，[Zoom](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/zoom.ts) 作为应用层的控制器，在幕后将底层引擎和上层视图有机连接在一起：

#### 1. 与底层画布的合作
* **[MLeaferCanvas](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts)** (通过 [@IMLeaferCanvas](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/zoom.ts#L9) 注入)：
  * 当用户按下缩放快捷键时，`Zoom` 类直接读取 `canvas.ref.zoom.value`，并调用 `canvas.zoomToInnerPoint(zoom)` 物理改变 Leafer 画布节点的缩放比例。
  * 同时也监听 `canvas.contentLayer` 抛出的手势缩放事件，把真实的缩放比例反向写入 `canvas.ref.zoom` 中以同步状态。

#### 2. 与快捷键服务的合作
* **[KeybindingService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/keybinding/keybindingService.ts)** (通过 [@IKeybindingService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/zoom.ts#L10) 注入)：
  * `Zoom` 类在构造函数中，通过 `keybindingService.bind()` 将按键符号（`+`、`-`、`mod+0`）同缩放改变的业务函数进行注册绑定。

#### 3. 与宿主 `EditorMain` 的生命周期配合
* 在 **[EditorMain](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/app/editor/editor.ts#L70)** 启动（`startup`）时，会将 `Zoom` 作为一个子实例创建并注册。当编辑器退出或被卸载时，会触发其 `dispose` 方法自动解绑所有注册的快捷键与手势监听器，避免引发内存泄露。

#### 4. 与上层 Vue UI 界面（如 zoom.vue）的合作
* 在编辑器左上角的缩放比例显示和点击组件 **[zoom.vue](file:///d:/项目相关/AAA/aaaaalanDesign/src/views/Editor/layouts/header/left/zoom.vue)** 中，组件使用 `useEditor()` 提取出 `canvas`。
* `zoom.vue` 中的缩放比例文本框直接双向绑定或显示了 `canvas.ref.zoom.value`。
* 这样，无论用户是在组件下拉框中手动选择 `200%`，还是在画布上双指捏合，亦或是按下键盘 `+` 键，**背后的数据状态都是流向 `canvas.ref.zoom` 这同一个响应式数据源**，从而实现了画布、快捷键与 UI 界面的实时同步。
 */
