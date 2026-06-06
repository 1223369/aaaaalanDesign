# Gzm Design 函数级详细说明

本文档不做逐行解释，而是按“函数/方法”解释项目核心逻辑。每个函数会尽量说明：

1. 它解决什么问题。
2. 它的输入是什么。
3. 它的输出是什么。
4. 它会修改哪些状态或产生哪些副作用。
5. 它通常被谁调用。
6. 新手阅读时要注意什么。

## 1. 阅读函数前先理解项目主线

Gzm Design 是一个在线海报设计器。项目中最关键的不是某一个 Vue 组件，而是下面这条协作主线：

```text
Vue 应用启动
  -> 创建编辑器 core
  -> 进入 /editor 页面
  -> 创建 EditorMain
  -> EditorMain 初始化服务
  -> MLeaferCanvas 创建 Leafer 画布
  -> canvasEdit.vue 把画布 DOM 挂到页面
  -> 左侧/右侧/顶部组件通过 useEditor 操作画布
```

所以函数级理解建议从入口函数、编辑器生命周期函数、画布服务函数开始。

## 2. 应用启动相关函数

### 2.1 `createApp(App)`

所在文件：`src/main.ts`

职责：创建 Vue 应用实例。

输入：根组件 `App`。

输出：Vue 应用对象 `app`。

副作用：暂时没有挂载 DOM，只是创建应用实例。

调用场景：项目启动时执行一次。

注意点：它创建的是 Vue 应用，不是 Leafer 画布应用。项目里还有一个 Leafer 的 `new App()`，两者不是同一个概念。

### 2.2 `app.use(pinia)`

所在文件：`src/main.ts`

职责：把 Pinia 注册到 Vue 应用。

输入：Pinia 实例。

输出：返回 Vue app 本身，支持链式调用。

副作用：组件中可以使用 Pinia store。

调用场景：应用启动时执行。

注意点：如果不注册 Pinia，`useAppStore()`、`useFontStore()` 等 store 无法正常使用。

### 2.3 `app.use(router)`

所在文件：`src/main.ts`

职责：注册 Vue Router。

输入：路由实例。

输出：返回 Vue app。

副作用：`router-view` 可以根据 URL 渲染页面。

调用场景：应用启动时执行。

注意点：项目使用 hash 路由，访问编辑器一般是 `/#/editor`。

### 2.4 `app.use(core)`

所在文件：`src/main.ts`

职责：把编辑器 core 注册为 Vue 插件。

输入：`createCore()` 创建的 core 对象。

输出：返回 Vue app。

副作用：执行 core 的 `install` 方法，并设置 active core。

调用场景：应用启动时执行。

注意点：这是 Vue 应用和编辑器核心系统建立联系的关键步骤。

### 2.5 `app.mount('#app')`

所在文件：`src/main.ts`

职责：把 Vue 应用挂载到浏览器 DOM。

输入：CSS 选择器 `#app`。

输出：根组件实例。

副作用：页面开始渲染。

调用场景：所有插件注册完成后执行。

注意点：如果 HTML 中没有 `id="app"` 的元素，应用无法挂载。

## 3. 路由相关函数

### 3.1 `createRouter(options)`

所在文件：`src/router/index.ts`

职责：创建路由实例。

输入：history 模式和 routes 路由表。

输出：router 实例。

副作用：本身不直接渲染页面，注册到 Vue 后才生效。

调用场景：路由模块初始化时执行。

注意点：路由表里 `/editor` 对应编辑器主页面。

### 3.2 `createWebHashHistory()`

所在文件：`src/router/index.ts`

职责：创建 hash 模式路由历史对象。

输入：通常无参数。

输出：history 对象。

副作用：URL 中会出现 `#`。

调用场景：创建 router 时传入。

注意点：hash 路由对服务器配置要求低，适合静态部署。

## 4. Core 创建与插件系统函数

### 4.1 `createServices()`

所在文件：`src/views/Editor/core/createCore.ts`

职责：创建编辑器根级依赖注入服务容器。

输入：无显式入参。

输出：`IInstantiationService` 实例。

副作用：读取全局已注册的单例服务描述符，并放进 `ServiceCollection`。

调用场景：`createCore()` 内部调用。

注意点：它只创建根服务容器。进入编辑器页面后，`EditorMain` 还会创建自己的子服务容器。

### 4.2 `createCore()`

所在文件：`src/views/Editor/core/createCore.ts`

职责：创建编辑器 core 对象。

输入：无显式入参。

输出：`ICore` 对象。

副作用：创建服务容器，并返回一个可以被 Vue 安装的插件对象。

调用场景：`main.ts` 中执行 `const core = createCore()`。

注意点：`createCore` 只是创建编辑器核心环境，不等于真正创建画布。画布在进入 `/editor` 并启动 `EditorMain` 后才创建。

### 4.3 `core.install(vueApp)`

所在文件：`src/views/Editor/core/createCore.ts`

职责：作为 Vue 插件的安装函数。

输入：Vue app 实例。

输出：无显式返回。

副作用：保存 Vue app 到 `core._a`，并调用 `setActiveCore(core)` 设置当前激活 core。

调用场景：执行 `app.use(core)` 时由 Vue 自动调用。

注意点：没有安装 core 时，`getActiveCore()` 无法拿到当前编辑器核心。

### 4.4 `core.use(plugin)`

所在文件：`src/views/Editor/core/createCore.ts`

职责：注册编辑器插件。

输入：插件函数。

输出：core 自身。

副作用：把插件放入 `core._p` 插件数组；如果 editor 已经存在，会立即调用 `appInstance.editor.use(plugin)`。

调用场景：`main.ts` 里注册测试插件，或后续业务扩展插件。

注意点：它支持编辑器启动前注册，也支持编辑器启动后注册。

## 5. Active Core 相关函数

### 5.1 `setActiveCore(core)`

所在文件：`src/views/Editor/core/root.ts`

职责：记录当前激活的编辑器 core。

输入：core 对象。

输出：无显式返回。

副作用：修改模块内部保存的 active core 引用。

调用场景：core 安装到 Vue 应用时调用。

注意点：这个函数类似全局上下文设置，后续 `getActiveCore()` 依赖它。

### 5.2 `getActiveCore()`

所在文件：`src/views/Editor/core/root.ts`

职责：获取当前激活的编辑器 core。

输入：无。

输出：active core。

副作用：通常无。

调用场景：`editor.vue` 创建 `EditorMain` 时使用。

注意点：必须在 `app.use(core)` 后调用，否则拿不到有效 core。

## 6. EditorMain 生命周期函数

### 6.1 `new EditorMain(instantiationService)`

所在文件：`src/views/Editor/app/editor/editor.ts`

职责：创建编辑器主应用对象。

输入：根依赖注入服务。

输出：`EditorMain` 实例。

副作用：构造函数本身只保存依赖，不真正启动编辑器。

调用场景：`editor.vue` 中通过 `service.createInstance(EditorMain)` 创建。

注意点：真正初始化服务和画布发生在 `startup()`。

### 6.2 `EditorMain.startup()`

所在文件：`src/views/Editor/app/editor/editor.ts`

职责：启动编辑器。

输入：无。

输出：无显式返回。

副作用：

1. 初始化编辑器子服务容器。
2. 创建默认工作区。
3. 创建 Layer、ToolBar、Zoom、ContextMenu、Clipboard、FollowButton 等模块。
4. 通过 provide 暴露 `useEditor`。
5. 安装已经注册到 core 的插件。

调用场景：`editor.vue` 的 `onBeforeMount` 中调用。

注意点：这是编辑器从“存在一个对象”变成“可用”的关键函数。

### 6.3 `EditorMain.initServices()`

所在文件：`src/views/Editor/app/editor/editor.ts`

职责：初始化编辑器级服务集合。

输入：无显式入参。

输出：编辑器子依赖注入容器。

副作用：注册以下服务：

1. `IEventbusService`
2. `IWorkspacesService`
3. `IMLeaferCanvas`
4. `IEditorUndoRedoService`
5. `IKeybindingService`

调用场景：`startup()` 内部调用。

注意点：画布服务 `MLeaferCanvas` 是在这个服务容器中注册的，后续通过 `useEditor()` 获取。

### 6.4 `define(id, ctor)`

所在文件：`src/views/Editor/app/editor/editor.ts`

职责：`initServices` 内部的辅助函数，用于注册服务。

输入：服务标识 id 和服务构造函数 ctor。

输出：无显式返回。

副作用：如果服务集合中不存在该服务，就把它包装成 `SyncDescriptor` 放入集合。

调用场景：`initServices()` 内部连续调用。

注意点：这是一个局部函数，目的是减少重复代码。

### 6.5 `EditorMain.use(plugin)`

所在文件：`src/views/Editor/app/editor/editor.ts`

职责：安装一个编辑器插件。

输入：插件函数。

输出：无显式返回。

副作用：

1. 执行插件函数，生成插件上下文。
2. 为插件实例生成 Symbol id。
3. 保存插件实例。
4. 浏览器空闲时调用插件 `setup`。
5. 注册插件销毁逻辑。

调用场景：`startup()` 安装 core 中已有插件，或 `core.use(plugin)` 在 editor 已启动时调用。

注意点：插件不是立即同步 setup，而是通过 `runWhenIdle` 延后安装，减少启动阶段压力。

### 6.6 `EditorMain.dispose()`

所在文件：`src/views/Editor/app/editor/editor.ts`

职责：销毁编辑器实例。

输入：无。

输出：无显式返回。

副作用：

1. 取消 provide 的 `useEditor`。
2. 调用父类销毁逻辑。
3. 重置快捷键服务。
4. 重置撤销恢复服务。
5. 销毁工作区服务。
6. 清空事件总线。
7. 清空 service 引用。

调用场景：编辑器页面卸载时调用。

注意点：如果不调用，可能残留事件、快捷键、画布对象，造成内存泄漏或路由切换后仍响应快捷键。

### 6.7 `EditorMain.getPluginSlots(name)`

所在文件：`src/views/Editor/app/editor/editor.ts`

职责：获取指定插槽位置的插件组件。

输入：插槽名称。

输出：Vue 组件数组。

副作用：无明显副作用。

调用场景：需要在工具栏、面板等位置渲染插件扩展内容时使用。

注意点：这是插件化 UI 扩展的入口之一。

## 7. useEditor 相关函数

### 7.1 `useEditor()`

所在文件：`src/views/Editor/app/index.ts`

职责：给 Vue 组件提供访问编辑器服务的统一入口。

输入：无。

输出：包含 `editor`、`canvas`、`keybinding`、`undoRedo`、`event`、`workspaces` 的对象。

副作用：如果 editor 未准备好，会打印警告。

调用场景：左侧面板、右侧面板、画布挂载组件、工具栏等组件中调用。

注意点：`editor` 和 `canvas` 当前都指向 `MLeaferCanvas`。组件不要自己 new 画布，应该通过 `useEditor()` 获取已有画布服务。

## 8. 依赖注入函数

### 8.1 `createDecorator(serviceId)`

所在文件：`src/views/Editor/core/instantiation/instantiation.ts`

职责：创建服务标识装饰器。

输入：服务 id 字符串。

输出：服务标识函数。

副作用：把 serviceId 和对应标识函数保存到内部 Map；当装饰器用在构造函数参数上时，会记录该参数依赖哪个服务。

调用场景：定义服务标识时使用，例如 `IMLeaferCanvas`、`IWorkspacesService`。

注意点：这是项目依赖注入机制的核心。看起来像函数，本质上也被当成参数装饰器使用。

### 8.2 `storeServiceDependency(id, target, index)`

所在文件：`src/views/Editor/core/instantiation/instantiation.ts`

职责：记录某个类构造函数第几个参数依赖哪个服务。

输入：服务 id、目标构造函数、参数索引。

输出：无显式返回。

副作用：往构造函数的静态属性上写入依赖信息。

调用场景：`createDecorator` 返回的装饰器函数内部调用。

注意点：新手不需要频繁改它，但理解它有助于理解为什么构造函数里的 `@IService` 能生效。

### 8.3 `getServiceDependencies(ctor)`

所在文件：`src/views/Editor/core/instantiation/instantiation.ts`

职责：获取某个构造函数声明的服务依赖。

输入：构造函数。

输出：依赖数组，每项包含服务 id 和参数索引。

副作用：无。

调用场景：实例化服务时由依赖注入容器使用。

注意点：它读取的是装饰器之前写到构造函数上的依赖元数据。

## 9. 画布服务 MLeaferCanvas 函数

### 9.1 `new MLeaferCanvas(workspacesService, eventbus, hierarchyService)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：创建画布服务实例。

输入：工作区服务、事件总线服务、层级服务。

输出：`MLeaferCanvas` 实例。

副作用：

1. 创建 Leafer App。
2. 创建标尺。
3. 保存画布 DOM。
4. 初始化工作区事件监听。
5. 初始化底层画板。
6. 监听工具状态。
7. 初始化字体。

调用场景：依赖注入容器创建 `IMLeaferCanvas` 服务时调用。

注意点：这是项目真正创建画布的地方。

### 9.2 `initWatch()`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：监听全局工具状态变化。

输入：无显式入参。

输出：无显式返回。

副作用：当 `activeTool` 不是 `select` 时，调用 `discardActiveObject()` 取消当前选中。

调用场景：构造函数中调用。

注意点：这是避免画笔、拖拽等工具状态和选中状态冲突的保护逻辑。

### 9.3 `initWorkspace()`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：初始化工作区和页面 JSON 的同步逻辑。

输入：无。

输出：无。

副作用：注册多个事件监听，包括新增页面、删除页面、页面切换前、页面切换后、页面刷新。

调用场景：构造函数中调用。

注意点：多页面能力主要靠这个函数和 `WorkspacesService` 协作实现。

### 9.4 `initPageEditor()`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：初始化可编辑画板。

输入：无。

输出：无。

副作用：

1. 创建底层 `Frame`。
2. 把 Frame 加入内容层。
3. 设置当前 activeObject。
4. 监听选择事件。
5. 监听子元素添加和删除。
6. 监听属性变化。
7. 监听 resize。

调用场景：构造函数中调用。

注意点：`contentFrame` 是用户真正编辑的海报画板，大多数元素都加到它里面。

### 9.5 `setPageJSON(id, json)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：保存某个页面的 JSON 数据。

输入：页面 id、页面 JSON。

输出：无。

副作用：修改内部 `pages` Map。

调用场景：新增页面、切换页面前保存、获取当前页前保存等。

注意点：id 为空时直接返回，避免写入无效页面。

### 9.6 `getPageJSON(id)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：获取指定页面的 JSON。

输入：页面 id。

输出：页面 JSON 或 undefined。

副作用：通常无。

调用场景：导出、页面预览、多页面管理等。

注意点：如果获取的是当前页，会用最新的 `ref._children.value` 覆盖 children，保证数据新。

### 9.7 `getCurrentPage()`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：保存并返回当前页面 JSON。

输入：无。

输出：当前页面数据。

副作用：先调用 `contentFrame.toJSON()` 更新当前页缓存。

调用场景：导出当前页、保存模板等。

注意点：它会产生保存副作用，不只是单纯读取。

### 9.8 `getPages()`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：保存当前页后返回所有页面数据。

输入：无。

输出：`pages` Map。

副作用：更新当前页 JSON。

调用场景：多页面导出或保存。

注意点：返回的是 Map，不是普通数组。如果要传给后端，通常需要转换成数组或对象。

### 9.9 `setActiveObjectValue(object)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：更新当前选中对象状态。

输入：Leafer 对象或 null。

输出：无。

副作用：修改 `activeObject.value`；如果对象是二维码，会锁定编辑器宽高比例。

调用场景：选中事件、取消选中、初始化底层画板。

注意点：如果传入 null，会默认设置为 `contentFrame`。

### 9.10 `setActiveObjects(objects)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：批量设置选中对象。

输入：对象数组或 undefined。

输出：无。

副作用：修改 Leafer 编辑器的 `target`。

调用场景：多选、框选、批量操作。

注意点：多选时属性面板通常需要特殊处理，因为不同对象的属性可能不同。

### 9.11 `activeObjectIsType(...types)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：判断当前选中对象是否属于某些类型。

输入：类型列表。

输出：布尔值。

副作用：无。

调用场景：属性面板判断应该展示哪个表单。

注意点：它依赖对象的 `tag` 字段。

### 9.12 `objectIsTypes(object, ...types)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：判断任意对象是否属于某些类型。

输入：对象和类型列表。

输出：布尔值。

副作用：无。

调用场景：添加元素、素材面板、属性判断。

注意点：和 `activeObjectIsType` 的区别是它不只判断当前选中对象。

### 9.13 `selectObject(target)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：选中画布对象。

输入：目标对象或 null。

输出：无。

副作用：设置 Leafer 编辑器选中目标，并更新 `activeObject`。

调用场景：添加元素后自动选中、用户点击元素。

注意点：只有当前工具是 `select` 时才会执行选中逻辑。

### 9.14 `discardActiveObject()`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：取消当前选中对象。

输入：无。

输出：无。

副作用：清空 Leafer editor target，并把 activeObject 设置为底层画板。

调用场景：切换工具、切换页面、导入 JSON。

注意点：取消选中后右侧属性面板通常会显示画布属性。

### 9.15 `add(_child, _index?)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：向当前画板添加一个元素。

输入：Leafer UI 对象和可选插入索引。

输出：无。

副作用：

1. 如果是 Group 或 Box，绑定拖放事件。
2. 如果没有 zIndex，自动设置到顶层。
3. 加入 `contentFrame`。
4. 自动选中新元素。
5. 刷新 children 列表。

调用场景：左侧添加文字、图片、图形、二维码等。

注意点：新增元素应该优先走这个函数，不建议组件直接 `contentFrame.add`，否则可能漏掉选中、层级和图层更新逻辑。

### 9.16 `addMany(..._children)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：批量添加多个元素。

输入：多个 Leafer UI 对象。

输出：无。

副作用：把元素加入 contentFrame，并刷新 children。

调用场景：批量导入素材或解析 PSD 后批量添加。

注意点：当前实现没有像 `add` 一样逐个处理 zIndex、拖放和选中逻辑，使用时要确认是否需要额外处理。

### 9.17 `reLoadFromJSON(json)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：重新加载 JSON 数据。

输入：页面 JSON。

输出：无。

副作用：导入 JSON，并设置缩放。

调用场景：切换页面或恢复页面数据。

注意点：它内部调用 `importJsonToCurrentPage(json, true)`，会清空当前内容。

### 9.18 `importJsonToCurrentPage(json, clearHistory?)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：把 JSON 导入当前页面。

输入：JSON 数据、是否清空旧内容。

输出：Promise。

副作用：

1. 可选清空当前画板。
2. 把 JSON 设置到 contentFrame。
3. 取消选中。
4. 切回选择工具。
5. 刷新 children。
6. 画布自适应缩放。
7. 提取并加载模板字体。
8. 字体加载后强制文本重绘。

调用场景：导入模板、切换页面恢复、导入多页面数据。

注意点：这是模板导入最重要的函数之一。它不只是 set JSON，还处理选中状态、工具状态、缩放和字体。

### 9.19 `importPages(json, clearHistory?)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：导入多页面 JSON。

输入：多页面 JSON 或 JSON 字符串、是否清空旧内容。

输出：Promise。

副作用：

1. 校验 JSON。
2. 清空工作区和页面缓存。
3. 重建 workspaces。
4. 逐页恢复页面数据。

调用场景：打开多页面模板或导入设计文件。

注意点：多页面数据必须包含 `workspaces` 和 `pages`，否则会 reject。

### 9.20 `getActiveObjects()`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：获取当前选中的对象列表。

输入：无。

输出：Leafer 对象数组。

副作用：无。

调用场景：批量操作、对齐、组合、删除。

注意点：单选时通常数组里只有一个对象。

### 9.21 `getActiveObject()`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：获取当前选中对象。

输入：无。

输出：当前 activeObject。

副作用：无。

调用场景：属性面板、工具栏操作。

注意点：没有选中元素时通常返回 contentFrame。

### 9.22 `zoomToInnerPoint(zoom?)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：设置画布缩放比例。

输入：缩放数值。

输出：无。

副作用：修改响应式 zoom，并调用 Leafer tree 的 zoom。

调用场景：顶部缩放控件。

注意点：需要保证 zoom 值合理，避免过大或过小影响体验。

### 9.23 `zoomToFit()`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：让画布自适应容器。

输入：无。

输出：无。

副作用：调用 Leafer 的 `zoom('fit')`，并更新响应式 zoom。

调用场景：初始化、导入 JSON、重置缩放。

注意点：导入模板后调用它可以让用户立即看到完整画板。

### 9.24 `childrenEffect()`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：刷新响应式 children 列表。

输入：无。

输出：无。

副作用：先清空 `ref._children.value`，再赋值为 `contentFrame.children`。

调用场景：添加元素、删除元素、导入 JSON。

注意点：图层面板依赖这个响应式列表更新。

### 9.25 `setZoom(scale)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：设置缩放比例。

输入：缩放比例。

输出：无。

副作用：内部调用 `zoomToInnerPoint`。

调用场景：恢复页面缩放状态。

注意点：它是一个薄封装。

### 9.26 `getZoom()`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：读取当前缩放比例。

输入：无。

输出：缩放数值。

副作用：无。

调用场景：初始化 zoom 状态、显示缩放比例。

注意点：如果 contentLayer 未初始化，返回 1。

### 9.27 `findObjectById(id)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：根据 id 查找画布对象。

输入：字符串或数字 id。

输出：对象或 undefined。

副作用：无。

调用场景：图层点击定位对象、外部数据定位元素。

注意点：它调用的是 `contentFrame.findOne(id)`。

### 9.28 `findObjectsByIds(idsToFind)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：根据多个 id 查找多个对象。

输入：id 数组。

输出：对象数组。

副作用：无。

调用场景：批量选中、批量操作。

注意点：当前实现使用 `innerId` 匹配。

### 9.29 `bindDragDrop(group)`

所在文件：`src/views/Editor/core/canvas/mLeaferCanvas.ts`

职责：给 Group 或 Box 绑定拖入、放置、拖出逻辑。

输入：组对象。

输出：无。

副作用：注册 DragEvent 和 DropEvent 事件监听。

调用场景：添加 Group 或 Box 时调用。

注意点：它让元素可以被拖进组内，也可以拖出组。复杂组嵌套时要小心事件边界。

## 10. 工作区服务函数

### 10.1 `getCurrentId()`

所在文件：`src/views/Editor/core/workspaces/workspacesService.ts`

职责：获取当前工作区 id。

输入：无。

输出：当前 id 字符串。

副作用：无。

调用场景：画布服务读取当前页面、保存当前页面。

注意点：如果还没创建工作区，可能是空字符串。

### 10.2 `reloadJSON()`

所在文件：`src/views/Editor/core/workspaces/workspacesService.ts`

职责：触发当前工作区 JSON 刷新。

输入：无。

输出：无。

副作用：发出 `workspaceChangeRefresh` 事件。

调用场景：需要强制重新加载当前页面数据时。

注意点：具体刷新逻辑由画布服务监听事件后执行。

### 10.3 `setCurrentId(workspaceId)`

所在文件：`src/views/Editor/core/workspaces/workspacesService.ts`

职责：切换当前工作区。

输入：目标工作区 id。

输出：无。

副作用：先发 `workspaceChangeBefore`，再更新 currentId，再发 `workspaceChangeAfter`。

调用场景：用户切换页面。

注意点：这是多页面切换的核心函数。before/after 顺序不能随意改。

### 10.4 `all()`

所在文件：`src/views/Editor/core/workspaces/workspacesService.ts`

职责：返回全部工作区。

输入：无。

输出：工作区数组。

副作用：无。

调用场景：页面列表、初始化画布页面缓存。

注意点：返回的是内部数组引用，外部直接修改可能影响服务状态。

### 10.5 `set(workspaceId, name)`

所在文件：`src/views/Editor/core/workspaces/workspacesService.ts`

职责：修改工作区名称。

输入：工作区 id、新名称。

输出：无。

副作用：修改 workspaces 数组中对应项的 name。

调用场景：页面重命名。

注意点：当前没有发重命名事件，如果 UI 依赖事件刷新，需要补充。

### 10.6 `get(workspaceId)`

所在文件：`src/views/Editor/core/workspaces/workspacesService.ts`

职责：根据 id 查找工作区。

输入：工作区 id。

输出：工作区对象或 undefined。

副作用：无。

调用场景：切换、删除、重命名前校验。

注意点：找不到时返回 undefined。

### 10.7 `add(name, id?)`

所在文件：`src/views/Editor/core/workspaces/workspacesService.ts`

职责：新增工作区。

输入：名称和可选 id。

输出：新工作区 id。

副作用：

1. 没有 id 时生成 uuid。
2. 发 `workspaceAddBefore`。
3. 往数组 push 新工作区。
4. 发 `workspaceAddAfter`。

调用场景：新增页面、导入多页面模板。

注意点：新增后不一定自动切换，是否切换由调用方决定。

### 10.8 `remove(workspaceId)`

所在文件：`src/views/Editor/core/workspaces/workspacesService.ts`

职责：删除指定工作区。

输入：工作区 id。

输出：无。

副作用：发删除前后事件，删除数组项。如果删除的是当前工作区，会尝试切换到后一个或前一个工作区。

调用场景：删除页面。

注意点：需要考虑只剩一个页面时删除后的状态。

### 10.9 `removeAll()`

所在文件：`src/views/Editor/core/workspaces/workspacesService.ts`

职责：删除所有工作区。

输入：无。

输出：无。

副作用：遍历发删除事件并修改数组。

调用场景：清空项目或重置编辑器。

注意点：遍历数组同时 splice 要小心索引变化，当前实现可以进一步优化。

### 10.10 `size()`

所在文件：`src/views/Editor/core/workspaces/workspacesService.ts`

职责：返回工作区数量。

输入：无。

输出：数字。

副作用：无。

调用场景：初始化默认工作区时判断是否为空。

注意点：简单读取函数。

### 10.11 `clear()`

所在文件：`src/views/Editor/core/workspaces/workspacesService.ts`

职责：清空工作区数据。

输入：无。

输出：无。

副作用：workspaces 变为空数组，currentId 变为空字符串。

调用场景：导入多页面前重置、dispose。

注意点：当前 clear 不发删除事件。

### 10.12 `dispose()`

所在文件：`src/views/Editor/core/workspaces/workspacesService.ts`

职责：销毁工作区服务。

输入：无。

输出：无。

副作用：调用父类 dispose 并清空数据。

调用场景：EditorMain 销毁时。

注意点：释放编辑器时必须执行。

## 11. 事件总线函数

### 11.1 `eventbus.emit(eventName, payload)`

所在文件：`src/views/Editor/core/eventbus/mitt.ts`、`eventbusService.ts`

职责：发布事件。

输入：事件名称和事件参数。

输出：无。

副作用：触发所有监听该事件的回调。

调用场景：工作区切换、新增、删除、布局移动、布局 resize。

注意点：事件名和 payload 应该符合 `Events` 类型定义。

### 11.2 `eventbus.on(eventName, handler)`

所在文件：`src/views/Editor/core/eventbus/mitt.ts`、`eventbusService.ts`

职责：监听事件。

输入：事件名称和回调函数。

输出：通常无或取消监听函数，取决于 Mitt 实现。

副作用：注册事件监听。

调用场景：画布服务监听工作区事件。

注意点：如果监听没有随生命周期清理，可能造成内存泄漏。

### 11.3 `eventbus.all.clear()`

所在文件：`src/views/Editor/app/editor/editor.ts`

职责：清空事件总线所有监听。

输入：无。

输出：无。

副作用：所有事件监听被移除。

调用场景：编辑器销毁时。

注意点：这是一种粗粒度清理方式，适合编辑器整体销毁。

## 12. 图层层级函数

### 12.1 `addItem(item)`

所在文件：`src/views/Editor/core/layer/hierarchyService.ts`

职责：新增层级记录。

输入：包含 key 和 zIndex 的对象。

输出：无。

副作用：把 item 加入内部数组，并按 zIndex 排序。

调用场景：新增元素或初始化层级时。

注意点：排序是后续获取顶层、底层、上下层的前提。

### 12.2 `updateOrAddItem(item)`

所在文件：`src/views/Editor/core/layer/hierarchyService.ts`

职责：更新或新增层级记录。

输入：层级 item。

输出：无。

副作用：如果存在 key 相同的项就替换，否则新增。

调用场景：元素 zIndex 变化时。

注意点：当前更新后没有重新 sort，严格来说可继续优化。

### 12.3 `removeItem(key)`

所在文件：`src/views/Editor/core/layer/hierarchyService.ts`

职责：删除层级记录。

输入：元素 key。

输出：无。

副作用：从内部数组移除匹配项。

调用场景：删除元素时。

注意点：如果删除元素时忘记调用，层级数据会不准确。

### 12.4 `getPreviousLevel(keys)`

所在文件：`src/views/Editor/core/layer/hierarchyService.ts`

职责：获取指定元素上一级层级。

输入：单个 key 或 key 数组。

输出：层级 item。

副作用：无。

调用场景：上移一层、层级调整。

注意点：多选时会取传入元素中最大的 zIndex 再判断。

### 12.5 `getNextLevel(keys)`

所在文件：`src/views/Editor/core/layer/hierarchyService.ts`

职责：获取指定元素下一级层级。

输入：单个 key 或 key 数组。

输出：层级 item。

副作用：无。

调用场景：下移一层。

注意点：命名上 previous/next 要结合当前排序方向理解。

### 12.6 `getTopLevel()`

所在文件：`src/views/Editor/core/layer/hierarchyService.ts`

职责：获取当前最高层级。

输入：无。

输出：层级 item。

副作用：无。

调用场景：添加元素时给新元素设置 zIndex。

注意点：如果没有任何元素，返回默认层级。

### 12.7 `getBottomLevel()`

所在文件：`src/views/Editor/core/layer/hierarchyService.ts`

职责：获取当前最低层级。

输入：无。

输出：层级 item。

副作用：无。

调用场景：置底、层级计算。

注意点：依赖内部数组排序。

### 12.8 `getItemByKey(key)`

所在文件：`src/views/Editor/core/layer/hierarchyService.ts`

职责：根据 key 获取层级项。

输入：key。

输出：item 或 undefined。

副作用：无。

调用场景：HierarchyService 内部使用。

注意点：私有函数，不对外暴露。

## 13. 字体 Store 函数

### 13.1 `initFonts()`

所在文件：`src/store/modules/font/font.ts`

职责：初始化字体列表。

输入：无。

输出：字体列表 Promise。

副作用：

1. 读取 localStorage 字体缓存。
2. 缓存版本不匹配时清理缓存。
3. 缓存为空时请求接口。
4. 写入 localStorage。
5. 更新 `fontList`。

调用场景：画布服务构造函数中调用。

注意点：字体列表初始化和字体真正加载不是一回事。列表只是知道有哪些字体，加载还要调用 `loadFonts` 或 `addCustomFonts`。

### 13.2 `extractTemplateFonts(jsonData, load?)`

所在文件：`src/store/modules/font/font.ts`

职责：从模板 JSON 中提取使用到的字体。

输入：模板 JSON，是否立即加载。

输出：包含 `styleFonts` 和 `richTextFonts` 的对象。

副作用：如果 `load` 为 true，会调用 `loadFonts` 加载字体。

调用场景：导入 JSON 后。

注意点：普通 `Text` 读取 `fontFamily`，`HTMLText` 从 HTML 字符串中的 `font-family` 提取。

### 13.3 `loadFonts(fonts, maxConcurrent?)`

所在文件：`src/store/modules/font/font.ts`

职责：加载模板中使用到的字体。

输入：字体集合和最大并发数。

输出：Promise。

副作用：显示 Arco 通知和消息；使用 FontFaceObserver 加载字体；更新加载进度。

调用场景：导入模板后需要保证文本渲染一致。

注意点：字体加载失败不应该让整个编辑器崩溃，但要提示用户。

### 13.4 `loadFont(fontName)`

所在文件：`src/store/modules/font/font.ts`

职责：加载单个字体。

输入：字体名称。

输出：Promise。

副作用：显示 loading、success、error 消息，更新已加载数量。

调用场景：`loadFonts` 内部。

注意点：这是内部函数，不直接暴露。

## 14. 请求封装函数

### 14.1 `axios.interceptors.request.use(success, error)`

所在文件：`src/utils/request.ts`

职责：注册请求拦截器。

输入：请求成功处理函数、请求错误处理函数。

输出：拦截器 id。

副作用：所有 axios 请求发出前都会经过这个拦截器。

调用场景：导入 `request.ts` 时执行。

注意点：当前 token 逻辑是注释状态，后续接登录态时可以在这里统一加 Authorization。

### 14.2 请求成功处理函数 `(config) => config`

所在文件：`src/utils/request.ts`

职责：处理请求配置。

输入：AxiosRequestConfig。

输出：处理后的 config。

副作用：当前没有实际修改，只预留 token 注释。

调用场景：每个请求发出前。

注意点：如果后续加 token，要确保 headers 存在。

### 14.3 请求错误处理函数 `(error) => Promise.reject(error)`

所在文件：`src/utils/request.ts`

职责：处理请求阶段错误。

输入：错误对象。

输出：rejected Promise。

副作用：打印错误。

调用场景：请求配置阶段出错。

注意点：它不会吞掉错误，而是继续抛给调用方。

### 14.4 `axios.interceptors.response.use(success, error)`

所在文件：`src/utils/request.ts`

职责：注册响应拦截器。

输入：响应成功处理函数、响应错误处理函数。

输出：拦截器 id。

副作用：所有 axios 响应都会经过这里。

调用场景：导入 `request.ts` 时执行。

注意点：统一响应处理能减少业务组件重复判断。

### 14.5 响应成功处理函数 `(response) => ...`

所在文件：`src/utils/request.ts`

职责：处理后端返回。

输入：AxiosResponse。

输出：业务成功时返回 `res`，二进制返回原 response，失败时返回 rejected Promise。

副作用：失败时弹出 Message.error；401 时跳转登录。

调用场景：每个接口响应成功进入 then 之前。

注意点：blob 和 arraybuffer 必须特殊处理，否则文件下载会被业务 JSON 逻辑破坏。

### 14.6 响应错误处理函数 `(error) => ...`

所在文件：`src/utils/request.ts`

职责：处理网络错误或 HTTP 错误。

输入：错误对象。

输出：rejected Promise。

副作用：打印错误并弹出错误提示。

调用场景：请求失败。

注意点：当前代码默认 `error.response.data` 存在，弱网或跨域错误时可能需要更稳健的可选链保护。

## 15. PSD 解析函数

### 15.1 `parsePsdFile(file, onProcess)`

所在文件：`src/utils/psd/index.ts`

职责：读取并解析 PSD 文件。

输入：File 对象和进度回调。

输出：Promise，resolve 时包含 `psd` 和 `layers`。

副作用：使用 FileReader 读取文件；解析失败时打印错误。

调用场景：用户导入 PSD 文件。

注意点：它只负责把 PSD 文件解析成数据结构，不负责把图层变成 Leafer 对象。后续转换由 parser 目录里的函数完成。

### 15.2 `reader.onload` 回调

所在文件：`src/utils/psd/index.ts`

职责：FileReader 读取完成后执行 PSD 解析。

输入：FileReader 内部读取结果。

输出：通过 Promise resolve/reject 返回。

副作用：调用 `readPsd`，调用 `onProcess`。

调用场景：`reader.readAsArrayBuffer(file)` 完成后自动执行。

注意点：PSD 解析可能抛异常，所以放在 try/catch 中。

### 15.3 `parseText(layer, options?)`

所在文件：`src/utils/psd/parser/text.ts`

职责：把 PSD 文字图层转换为 Leafer 文本对象。

输入：PSD 图层信息和额外配置。

输出：`Text` 或 `HTMLText` 对象。

副作用：无明显外部副作用。

调用场景：PSD parser 处理文字图层时。

注意点：根据 `layer.text.styleRuns` 判断是富文本还是普通文本。

### 15.4 `parseStyledText(layer, options?)`

所在文件：`src/utils/psd/parser/text.ts`

职责：解析 PSD 富文本。

输入：图层信息和额外配置。

输出：`HTMLText` 对象。

副作用：无明显外部副作用。

调用场景：`parseText` 判断有 styleRuns 时调用。

注意点：它会把不同样式片段拼成 HTML span 字符串。

### 15.5 `parseSimpleText(layer, options?)`

所在文件：`src/utils/psd/parser/text.ts`

职责：解析 PSD 普通文本。

输入：图层信息和额外配置。

输出：Leafer `Text` 对象。

副作用：无明显外部副作用。

调用场景：`parseText` 判断没有 styleRuns 时调用。

注意点：它会设置文字内容、宽高、字体、字号、填充、段落、效果等。

### 15.6 `textUtil.getWidth(layer)`

所在文件：`src/utils/psd/parser/text.ts`

职责：获取文字图层宽度。

输入：PSD layer。

输出：数字。

副作用：无。

调用场景：创建 Text 或 HTMLText 时。

注意点：当前实现基于 `layer.canvas.width + 35`，说明为了视觉兼容做了额外补偿。

### 15.7 `textUtil.getHeight(layer)`

所在文件：`src/utils/psd/parser/text.ts`

职责：获取文字图层高度。

输入：PSD layer。

输出：数字。

副作用：无。

调用场景：创建文本对象时。

注意点：没有 canvas 时返回 0。

### 15.8 `textUtil.getFontSize(layer)`

所在文件：`src/utils/psd/parser/text.ts`

职责：计算文字字号。

输入：PSD layer。

输出：字号数字。

副作用：无。

调用场景：普通文本解析。

注意点：字号会乘以 transform 的平均缩放比例。

### 15.9 `textUtil.getFontFamily(layer)`

所在文件：`src/utils/psd/parser/text.ts`

职责：获取文字字体名。

输入：PSD layer。

输出：字体名称字符串。

副作用：无。

调用场景：普通文本解析。

注意点：如果 PSD 字体不存在或浏览器未加载，会出现视觉偏差。

### 15.10 `textUtil.getFill(layer)`

所在文件：`src/utils/psd/parser/text.ts`

职责：获取文字填充颜色对象。

输入：PSD layer。

输出：Leafer paint 数组。

副作用：无。

调用场景：普通文本解析。

注意点：没有颜色时默认黑色。

### 15.11 `textUtil.getFillStr(layer)`

所在文件：`src/utils/psd/parser/text.ts`

职责：获取文字填充颜色字符串。

输入：PSD layer。

输出：颜色字符串。

副作用：无。

调用场景：富文本 HTML span style 拼接。

注意点：和 `getFill` 的区别是返回字符串，而不是 paint 数组。

### 15.12 `textUtil.getLetterSpacing(layer)`

所在文件：`src/utils/psd/parser/text.ts`

职责：计算字间距。

输入：PSD layer。

输出：数字。

副作用：无。

调用场景：设置 Text 的 letterSpacing。

注意点：PSD tracking 和 CSS/Leafer 字间距单位不同，需要转换。

### 15.13 `textUtil.getAverageScale(transform)`

所在文件：`src/utils/psd/parser/text.ts`

职责：计算文字 transform 的平均缩放比例。

输入：transform 数组。

输出：缩放数值。

副作用：无。

调用场景：字号、行高、字间距计算。

注意点：只取 scaleX 和 scaleY 平均值，是一种简化处理。

### 15.14 `textUtil.mapJustificationToTextAlign(justification)`

所在文件：`src/utils/psd/parser/text.ts`

职责：把 PSD 段落对齐方式转换成 Leafer 文本对齐方式。

输入：PSD justification。

输出：Leafer textAlign。

副作用：不支持的值会抛错。

调用场景：设置段落样式。

注意点：遇到新枚举值时需要扩展 mapping。

### 15.15 `setTxtStyle(layer, text)`

所在文件：`src/utils/psd/parser/text.ts`

职责：设置普通文本样式。

输入：PSD layer 和 Leafer Text。

输出：无。

副作用：修改 Text 对象的 letterSpacing、textDecoration、lineHeight 等属性。

调用场景：`parseSimpleText` 内部。

注意点：Leafer 不支持同时存在删除线和下划线时，代码选择保留下划线。

### 15.16 `setTxtParagraphStyle(paragraphStyle, text)`

所在文件：`src/utils/psd/parser/text.ts`

职责：设置段落样式。

输入：PSD paragraphStyle 和 Text 对象。

输出：无。

副作用：修改 textAlign、verticalAlign、paraIndent。

调用场景：普通文本解析。

注意点：默认垂直居中。

### 15.17 `setTextEff(effects, text)`

所在文件：`src/utils/psd/parser/text.ts`

职责：设置普通文本特效。

输入：PSD effects 和 Text 对象。

输出：无。

副作用：修改 Text 的 stroke 和 fill。

调用场景：普通文本解析。

注意点：当前主要处理描边和纯色填充，复杂特效可继续扩展。

### 15.18 `setStyleTextEff(effects, text)`

所在文件：`src/utils/psd/parser/text.ts`

职责：设置富文本特效。

输入：PSD effects 和 HTMLText 对象。

输出：无。

副作用：修改 HTMLText 的 stroke 和 fill。

调用场景：富文本解析。

注意点：和普通文本特效逻辑类似，但对象类型不同。

## 16. 画布挂载组件函数

### 16.1 `setup()`

所在文件：`src/views/Editor/layouts/canvasEdit/canvasEdit.vue`

职责：初始化画布挂载组件状态。

输入：无。

输出：返回模板需要的 `divRef`。

副作用：注册 onMounted。

调用场景：Vue 创建组件时自动执行。

注意点：它不创建画布，只负责拿已有画布 DOM 并挂载。

### 16.2 `onMounted(() => ...)`

所在文件：`src/views/Editor/layouts/canvasEdit/canvasEdit.vue`

职责：组件挂载后把 Leafer canvas DOM 插入页面。

输入：无。

输出：无。

副作用：

1. 调用 `useEditor()` 获取 canvas。
2. `divRef.value.append(canvas.wrapperEl)`。
3. 设置 canvas DOM display。
4. 注册 ResizeObserver。

调用场景：组件挂载后由 Vue 自动调用。

注意点：这是 Vue DOM 和 Leafer DOM 连接的关键位置。

### 16.3 `useResizeObserver(divRef, callback)`

所在文件：`src/views/Editor/layouts/canvasEdit/canvasEdit.vue`

职责：监听画布容器尺寸变化。

输入：被监听元素 ref 和回调函数。

输出：停止监听函数或控制对象，取决于 VueUse 实现。

副作用：容器尺寸变化时调用 `canvas.app.resize`。

调用场景：画布挂载后。

注意点：没有 resize，画布可能无法正确适配编辑器中间区域。

## 17. 左侧文字素材函数

### 17.1 `handleClick(item)`

所在文件：`src/views/Editor/layouts/panel/leftPanel/wrap/TextListWrap.vue`

职责：点击文字素材后创建对应画布对象并添加到画布。

输入：文字素材配置 item。

输出：无。

副作用：

1. 创建 Text、HTMLText 或 Group。
2. 调用 `editor.add(text)` 添加到画布。

调用场景：用户点击“添加普通文字”“添加富文本”或远程文本素材。

注意点：它没有直接操作 DOM，而是创建 Leafer 对象交给画布服务。

### 17.2 `fetchData()`

所在文件：`src/views/Editor/layouts/panel/leftPanel/wrap/TextListWrap.vue`

职责：分页获取文本素材列表。

输入：无显式入参，使用 `page` 状态。

输出：无显式返回。

副作用：请求接口，追加 `page.dataList`，更新 `page.pageNum` 和 `page.noMore`。

调用场景：素材列表组件触发加载更多。

注意点：它只负责列表数据，不负责把素材添加到画布。

## 18. 右侧属性面板常见函数理解方式

右侧属性面板文件较多，例如 `textAttr.vue`、`fillAttr.vue`、`strokeAttr.vue`、`shadowAttr.vue`、`canvasAttr.vue` 等。虽然每个文件具体函数不同，但理解方式一致：

1. 获取当前选中对象。
2. 把对象属性映射成表单值。
3. 用户修改表单。
4. 把表单值写回画布对象。
5. 触发画布重绘或属性变化事件。

阅读这类函数时重点看：

1. 它读的是哪个对象属性。
2. 它写回时有没有做格式转换。
3. 是否需要更新历史记录。
4. 是否需要处理多选。
5. 是否需要处理不同对象类型。

## 19. 函数阅读建议

### 19.1 先判断函数属于哪一层

一个函数通常属于下面某一层：

1. 启动层：创建应用、注册插件。
2. UI 层：响应用户点击、表单输入、滚动。
3. 服务层：管理画布、工作区、事件、层级。
4. 数据层：请求接口、处理 mock、管理 store。
5. 转换层：PSD 转 Leafer、JSON 转画布对象。

先判断层级，就能知道它应该关心什么，不应该关心什么。

### 19.2 再看函数是否有副作用

设计器项目里很多函数不是纯函数。例如：

1. `editor.add` 会修改画布、选中对象、children。
2. `setCurrentId` 会发事件并切换页面。
3. `importJsonToCurrentPage` 会清空画布、导入 JSON、加载字体。
4. `dispose` 会清理服务和事件。

理解副作用比理解返回值更重要。

### 19.3 最后看调用链

不要孤立看函数。比如 `handleClick` 本身只是创建文字，但它调用 `editor.add`，而 `editor.add` 又会调用 `contentFrame.add`、`selectObject`、`childrenEffect`。真正的业务效果来自整条调用链。

## 20. 典型调用链总结

### 20.1 添加文字

```text
TextListWrap.handleClick
  -> new Text / new HTMLText
  -> MLeaferCanvas.add
  -> contentFrame.add
  -> selectObject
  -> childrenEffect
  -> 图层面板更新
  -> 属性面板显示当前对象
```

### 20.2 切换页面

```text
WorkspacesService.setCurrentId
  -> eventbus.emit('workspaceChangeBefore')
  -> MLeaferCanvas 保存旧页面 JSON
  -> currentId 改成新页面
  -> eventbus.emit('workspaceChangeAfter')
  -> MLeaferCanvas 导入新页面 JSON
  -> zoomToFit
```

### 20.3 导入模板 JSON

```text
业务组件拿到模板 JSON
  -> MLeaferCanvas.importJsonToCurrentPage
  -> contentFrame.clear
  -> contentFrame.set(json)
  -> discardActiveObject
  -> activeTool = select
  -> childrenEffect
  -> zoomToFit
  -> extractTemplateFonts
  -> forceRender 文本对象
```

### 20.4 导入 PSD

```text
用户选择 PSD 文件
  -> parsePsdFile
  -> FileReader.readAsArrayBuffer
  -> readPsd
  -> parser/text、image、group、mask
  -> 转成 Leafer 对象
  -> editor.add / addMany
```

## 21. 总结

这个项目的函数可以按一句话理解：Vue 组件函数负责响应用户行为，EditorMain 函数负责编辑器生命周期，MLeaferCanvas 函数负责画布状态和画布操作，WorkspacesService 函数负责多页面，Eventbus 函数负责解耦通信，PSD parser 函数负责格式转换。

新手不要从所有组件函数开始背，而应该先掌握这几个核心函数：

1. `createCore`
2. `EditorMain.startup`
3. `EditorMain.initServices`
4. `useEditor`
5. `MLeaferCanvas` 构造函数
6. `MLeaferCanvas.initWorkspace`
7. `MLeaferCanvas.initPageEditor`
8. `MLeaferCanvas.add`
9. `MLeaferCanvas.importJsonToCurrentPage`
10. `WorkspacesService.setCurrentId`
11. `parsePsdFile`
12. `parseText`
13. `fontStore.extractTemplateFonts`
14. `canvasEdit.vue` 的 `onMounted`
15. `TextListWrap.handleClick`

掌握这些函数后，再看其他属性面板、素材面板和工具栏函数，会容易很多。
