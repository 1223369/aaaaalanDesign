<template>
  <div class="layout-box">
    <a-spin
      :loading="loading"
      dot
      class="flex items-center justify-center h-screen"
    >
      <a-layout style="height: 100%">
        <a-layout-header>
          <headerBar />
        </a-layout-header>
        <a-layout>
          <a-layout-content>
            <a-layout class="editor-box">
              <a-layout-content class="dea-main-container">
                <div style="background-color: #fff">
                  <canvas-edit />
                </div>
              </a-layout-content>
              <footerBar />
            </a-layout>
          </a-layout-content>
        </a-layout>
      </a-layout>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import HeaderBar from "@/views/Editor/layouts/header/headerBar.vue";
import FooterBar from "@/views/Editor/layouts/footer/footerBar.vue";
import CanvasEdit from "@/views/Editor/layouts/canvasEdit/canvasEdit.vue";
import { getActiveCore } from "./core";
import { EditorMain } from "./app/editor";
import { appInstance } from "./app";
const loading = ref(false);

onBeforeMount(() => {
  loading.value = false;
  const { service } = getActiveCore();
  appInstance.editor = service.createInstance(EditorMain);
  appInstance.editor.startup();
});

onBeforeUnmount(() => {
  appInstance.editor.dispose();
  appInstance.editor = null!;
});
</script>

<style scoped lang="less">
@import "./styles/layouts";
.editor-box {
  height: calc(100vh - @contentLayoutPadding*2);
}
.dea-main-container {
  background-color: #f1f2f4;
  max-width: 100%;
  padding: @contentLayoutPadding;
  overflow: hidden;
  height: 100%;
  position: relative;
}
/*马赛克背景样式，和.contentBox一起使用，用起来有点晃眼*/
.dea-main-container-wrap {
  --offsetX: 0px;
  --offsetY: 0px;
  --size: 14px;
  --color: #dedcdc;
  background-image:
    linear-gradient(
      45deg,
      var(--color) 25%,
      transparent 0,
      transparent 75%,
      var(--color) 0
    ),
    linear-gradient(
      45deg,
      var(--color) 25%,
      transparent 0,
      transparent 75%,
      var(--color) 0
    );
  background-position:
    var(--offsetX) var(--offsetY),
    calc(var(--size) + var(--offsetX)) calc(var(--size) + var(--offsetY));
  background-size: calc(var(--size) * 2) calc(var(--size) * 2);
}

.layout-box {
  height: 100vh;
  overflow: hidden;
}
/**
# `editor.vue` 文件详细分析与解释

`editor.vue` 是编辑器的 **主入口视图与布局组件**。它负责整合编辑器的各个区域（顶部导航、左侧工具栏、右侧属性栏、底部状态栏、中央画布区），并在生命周期中完成编辑器核心服务（Core Engine）的**初始化与销毁**。

---

## 1. 布局结构 (Template Layout)

组件基于 `Arco Design` 的布局组件（`a-layout`）搭建，呈现经典的 **国字型 / 三栏式** 编辑器布局：

```
+-------------------------------------------------------------+
|                      HeaderBar (顶部导航)                    |
+------------------+-----------------------+------------------+
|                  |  CanvasEdit (画布区)  |                  |
|  LeftPanel       |                       |  RightPanel      |
|  (左侧工具栏/    +-----------------------+  (右侧属性面板)  |
|   图层/素材)     |  FooterBar (底部状态) |                  |
+------------------+-----------------------+------------------+
```

1. **`a-spin`**: 包裹整个界面，在编辑器初始化完成前展示“正在初始化”的 loading 加载动画。
2. **`leftPanel`**: 左侧操作面板，包含模板选择、素材、文字、图层等功能。
3. **`rightPanel`**: 右侧属性面板，根据当前选中的元素动态展示并修改其位置、尺寸、颜色、字体等属性。
4. **`canvas-edit`**: 位于中央核心区域，即我们上一节分析的画布容器。
5. **`footerBar`**: 底部工具栏，通常用于控制画布缩放比例、显示网格快捷键等。

---

## 2. 核心初始化逻辑 (Script Setup)

在 `<script setup>` 中，该组件执行了编辑器最核心的 **IOC（控制反转）/ DI（依赖注入）** 容器实例化和生命周期挂载：

```typescript
import { getActiveCore } from '@/views/Editor/core'
import { appInstance } from '@/views/Editor/app'
import { EditorMain } from '@/views/Editor/app/editor'

const loading = ref(true)

onBeforeMount(() => {
    loading.value = false
    
    // 1. 获取全局唯一的核心 IOC 依赖注入容器 (service)
    const { service } = getActiveCore()
    
    // 2. 利用依赖注入容器创建 EditorMain 实例
    // EditorMain 内部会自动实例化并关联所有核心 Service（如 Canvas、快捷键、撤销重做等）
    appInstance.editor = service.createInstance(EditorMain)
    
    // 3. 启动编辑器服务，激活事件监听
    appInstance.editor.startup()
})

onBeforeUnmount(() => {
    // 4. 组件卸载前释放编辑器资源，避免内存泄漏
    appInstance.editor.dispose()
    appInstance.editor = null!
})
```

### 关键架构概念解析：
* **`getActiveCore()`**:
  获取底层的核心服务管理器。本项目采用了类似 VS Code 的依赖注入架构（Instantiation Service），各服务之间高度解耦。
* **`EditorMain`**:
  编辑器的核心引擎入口类。当通过 `service.createInstance(EditorMain)` 创建它时，它依赖的所有下属子服务（如 `IKeybindingService` 快捷键服务、`IEditorUndoRedoService` 历史记录服务）都会被自动注入并实例化。
* **`appInstance.editor`**:
  将实例挂载到全局单例的 `appInstance` 上，以便其他子组件或 Vue 挂载钩子能够通过 `useEditor()` 简便地共享、调用编辑器状态。

---

## 3. 样式与视觉细节 (Style)

1. **整体视口锁定**:
   `.layout-box` 的高度设置为 `100vh` 且 `overflow: hidden`，确保整个编辑器是一个全屏应用，不会因为内容过多而导致浏览器窗口本身出现滚动条。
2. **`.dea-main-container`**:
   定义了编辑区域的底色（轻微的灰白色 `#f1f2f4`），并使用了 `overflow: hidden`。
3. **网格/棋盘格背景 (Mosaic Background)**:
   代码中注释掉的 `.dea-main-container-wrap` 是一段纯 CSS 实现的马赛克/棋盘格背景（常用于设计软件中表示透明图层）。利用 `linear-gradient` 的双重交错渐变实现：
   ```css
   background-image: linear-gradient(45deg, var(--color) 25%, transparent 0, ...);
   background-size: calc(var(--size) * 2) calc(var(--size) * 2);
   ```
   *注释说明指出其有些晃眼，所以目前使用单色背景代替。*
 */
</style>
