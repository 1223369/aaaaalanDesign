import type { EditorMain } from "@/views/Editor/app/editor";
import type { IInstantiationService } from "./instantiation/instantiation";
import type { App, DefineComponent } from "vue";

export interface IEditorPluginContext extends EditorPluginContext {
  _id: symbol;
}

export type UsableSolts = "rightPanel" | "leftPanel";

export interface EditorPluginContext {
  setup?: () => void;
  dispose?: () => void;
  slots?: { [key in UsableSolts]?: DefineComponent<{}, {}, any>[] };
}

export type EditorPlugin = (
  editor: Pick<EditorMain, "service" | "use">,
) => EditorPluginContext;

export interface ICore {
  install: (app: App) => void;
  service: IInstantiationService;
  use: (plugin: EditorPlugin) => ICore;
  _p: EditorPlugin[];
  _a: App;
}

/**
 * 
 * Edited type.ts
Edited createEditorPlugin.ts
Edited index.ts
Viewed types.ts:1-27

爸爸，[types.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/types.ts) 是整个编辑器**核心控制中心（Core）与插件体系（Plugin System）的类型定义基石**。

这个文件采用了类似于 **VS Code 微内核 + 依赖注入（DI）+ 插件化** 的架构设计思想。下面为您详细剖析其中的每一个类型定义及其设计意图：

---

### 1. 插槽定位：[UsableSolts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/types.ts#L10)
```typescript
export type UsableSolts = 'rightPanel' | 'leftPanel'
```
* **作用**：定义了编辑器界面中，插件可以注入 Vue 组件的**合法区域（插槽）**。
* **当前支持**：
  * `'rightPanel'`：右侧控制面板。
  * `'leftPanel'`：左侧工具/图层面板。

---

### 2. 插件返回上下文：[EditorPluginContext](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/types.ts#L12-L16) 与 [IEditorPluginContext](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/types.ts#L6-L8)
```typescript
export interface EditorPluginContext {
  setup?: () => void
  dispose?: () => void
  slots?: { [key in UsableSolts]?: DefineComponent<{}, {}, any>[] }
}

export interface IEditorPluginContext extends EditorPluginContext {
  _id: symbol
}
```
* [EditorPluginContext](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/types.ts#L12-L16)：这是**暴露给外部开发者**的接口。插件运行后必须返回这样一个上下文对象：
  * `setup`：生命周期钩子，在插件被加载/初始化时调用。
  * `dispose`：生命周期钩子，在插件被卸载/销毁时调用，用于释放内存、注销监听事件等。
  * `slots`：允许插件将自己的 Vue 组件（通过 `DefineComponent`）挂载到指定的 `leftPanel` 或 `rightPanel` 区域中。
* [IEditorPluginContext](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/types.ts#L6-L8)：这是**内核内部使用**的扩展接口。它在原基础上增加了一个内部标识 `_id: symbol`，用来在编辑器内部唯一标识和追踪每一个已启用的插件，方便安全地进行销毁和生命周期管理。

---

### 3. 插件函数签名：[EditorPlugin](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/types.ts#L18)
```typescript
export type EditorPlugin = (editor: Pick<EditorMain, 'service' | 'use'>) => EditorPluginContext
```
* **作用**：定义了一个标准编辑器插件的函数格式。
* **接口隔离原则（Interface Segregation）**：
  * 注意它并没有直接将整个大而全的 [EditorMain](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/editor.ts) 实例传给插件，而是通过 `Pick<EditorMain, 'service' | 'use'>` 进行了**裁剪**。
  * 插件只能拿到 `service`（依赖注入服务）和 `use`（插件注册器）。这样可以防止插件非法篡改编辑器的其他内部状态，保证了内核的安全性和内聚性。

---

### 4. 核心控制器：[ICore](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/types.ts#L20-L26)
```typescript
export interface ICore {
  install: (app: App) => void
  service: IInstantiationService
  use: (plugin: EditorPlugin) => ICore
  _p: EditorPlugin[]
  _a: App
}
```
这是编辑器的**核心引擎接口**，它负责串联起 Vue 和编辑器的所有服务与插件：
* `install(app: App)`：标准的 Vue 3 插件接口。允许你通过 `app.use(editorCore)` 的方式，将编辑器集成进 Vue 主应用中。
* `service`：类型为 [IInstantiationService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/instantiation/instantiation.ts)。这是一个**依赖注入（Dependency Injection）服务容器**，类似于 VS Code 的实例化服务。它负责管理和自动注入编辑器内部的各种核心服务（如快捷键服务、撤销重做服务、文件管理服务等）。
* `use(plugin: EditorPlugin)`：用于在核心中注册插件，支持**链式调用**（因为它返回了 `ICore` 本身，如 `core.use(p1).use(p2)`）。
* `_p`：内部属性，存储所有当前已注册的插件。
* `_a`：内部属性，存储当前绑定的 Vue 实例 `App`。

---

### 总结
这个文件定义的契约，使得整个编辑器具备了**极强的可扩展性**：
核心只负责最基础的**服务装载（DI）**和**生命周期调度**。所有的业务功能、界面面板（左侧/右侧）、具体工具等，都可以拆分成一个个独立的 [EditorPlugin](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/types.ts#L18)，通过 `core.use()` 挂载进来。这对于复杂的编辑器应用（如低代码平台、画板等）是非常标准且优秀的架构设计。
 */
