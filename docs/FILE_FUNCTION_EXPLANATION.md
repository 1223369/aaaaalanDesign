# Gzm Design 按文件梳理函数说明

本文档按文件解释项目里的核心函数、方法和模块职责，不再采用“第几行导入什么”的逐行解释方式。阅读时可以先看文件整体职责，再看里面每个函数负责什么。

## 1. `src/main.ts`

这个文件是整个 Vue 应用的启动入口。它负责创建 Vue 应用、注册全局插件、注册编辑器 core、挂载应用。

### `createCore()`

创建编辑器核心对象。这个 core 后续会通过 `app.use(core)` 注册到 Vue 应用里。它不是画布本身，而是编辑器的全局核心环境，里面包含依赖注入服务、插件列表和 Vue 插件安装逻辑。

### `core.use(myPlugin)`

把测试插件注册到编辑器 core。插件会先存到 core 的插件列表里，等编辑器真正启动时再由 `EditorMain` 安装。如果编辑器已经启动，再调用 `core.use` 也可以立即安装插件。

### `createApp(App)`

创建 Vue 应用实例。这里创建的是 Vue 的应用，不是 Leafer 的画布应用。Vue 应用负责渲染页面组件，Leafer 应用负责画布渲染。

### `app.use(...)`

依次注册 Pinia、Router、Arco、编辑器 core、图标插件和自定义图标字体插件。注册顺序整体是先基础能力，再业务核心，再 UI 图标能力。

### `app.mount('#app')`

把 Vue 应用挂载到页面上的 `#app` 节点。执行后，浏览器才真正开始渲染 Vue 组件。

## 2. `src/App.vue`

这个文件是根组件，职责很简单：提供全局 Arco 配置容器，并渲染当前路由对应的页面。

### `router-view`

根据当前 URL 渲染不同页面。例如访问 `/#/editor` 时，会渲染编辑器页面 `src/views/Editor/editor.vue`。

### 动态组件 `<component :is="Component" />`

把 `router-view` 解析出来的当前页面组件渲染出来。它让根组件不用关心当前具体是什么页面。

## 3. `src/router/index.ts`

这个文件定义项目路由。它决定访问哪个路径时显示哪个页面。

### `createRouter(...)`

创建路由实例。配置里包含 history 模式和 routes 路由表。

### `createWebHashHistory()`

使用 hash 路由模式。URL 会带 `#`，例如 `/#/editor`。这种方式部署更简单，不需要服务器专门配置 history fallback。

### 路由表 `routes`

定义项目页面：

1. `/` 显示首页。
2. `/editor` 显示海报编辑器。
3. `/psParser` 显示 PSD 解析页面。
4. `/components` 显示自定义组件页面。

## 4. `src/views/Editor/editor.vue`

这个文件是编辑器页面的外壳。它负责布局编辑器页面，并在页面进入时创建和启动 `EditorMain`。

### `onBeforeMount(...)`

编辑器页面挂载前执行。它会获取当前 active core，然后通过 core 的依赖注入服务创建 `EditorMain` 实例，并调用 `startup()` 启动编辑器。

这个函数做了三件关键事：

1. 关闭初始化 loading。
2. 创建 `appInstance.editor`。
3. 启动编辑器核心功能。

### `appInstance.editor.startup()`

真正启动编辑器。它会初始化服务、创建默认工作区、创建画布服务、注册工具栏/图层/菜单等模块。

### `onBeforeUnmount(...)`

编辑器页面销毁前执行。它会调用 `appInstance.editor.dispose()` 释放编辑器资源，然后把全局 editor 引用置空。

这个函数非常重要。如果不销毁，可能残留快捷键、事件监听、画布实例，导致切换页面后仍然响应编辑器操作。

## 5. `src/views/Editor/core/createCore.ts`

这个文件负责创建编辑器 core。core 可以理解为“编辑器全局核心对象”，它连接 Vue 插件系统、依赖注入系统和插件系统。

### `createServices()`

创建根级依赖注入服务容器。它会读取已经注册的全局单例服务描述符，并放进 `ServiceCollection`，最后创建 `InstantiationService`。

这个函数的作用是给后续服务创建提供统一容器，让项目不用在各处手动 `new` 服务。

### `createCore()`

创建 core 对象。这个对象包含：

1. `install`：Vue 插件安装函数。
2. `use`：插件注册函数。
3. `service`：依赖注入服务容器。
4. `_p`：插件列表。
5. `_a`：Vue app 引用。

它使用 `markRaw`，目的是避免 Vue 把 core 变成深度响应式对象。core 里有服务容器和复杂实例，不适合被 Vue proxy。

### `install(vueApp)`

当执行 `app.use(core)` 时，Vue 会自动调用这个函数。它保存 Vue app，并设置当前 active core。

### `use(plugin)`

注册编辑器插件。插件会先进入 core 的插件数组。如果编辑器已经存在，还会立即调用 editor 的 `use` 方法安装插件。

## 6. `src/views/Editor/core/root.ts`

这个文件通常用于保存和获取当前激活的 core。

### `setActiveCore(core)`

设置当前 active core。它在 core 被 Vue 安装时调用。

### `getActiveCore()`

获取当前 active core。编辑器页面创建 `EditorMain` 时会调用它。

这两个函数让项目可以在不层层传参的情况下拿到当前编辑器核心对象。

## 7. `src/views/Editor/app/index.ts`

这个文件提供编辑器应用实例和 `useEditor()` 方法。它是 Vue 组件访问编辑器服务的统一入口。

### `appInstance`

保存当前编辑器实例。进入编辑器页面时，`editor.vue` 会创建 `EditorMain` 并赋值给 `appInstance.editor`。离开页面时会清空它。

### `useEditor()`

给 Vue 组件使用的核心函数。它从 `appInstance.editor.service` 里取出各种编辑器服务，并返回给组件。

返回内容包括：

1. `editor`：画布服务。
2. `canvas`：同样是画布服务。
3. `keybinding`：快捷键服务。
4. `undoRedo`：撤销恢复服务。
5. `event`：事件总线服务。
6. `workspaces`：工作区服务。

新手要记住：组件想操作画布，不要自己创建画布实例，而是调用 `useEditor()`。

## 8. `src/views/Editor/app/editor/editor.ts`

这个文件定义 `EditorMain`，它是编辑器主应用类。它管理编辑器生命周期、服务初始化、插件安装和资源销毁。

### `constructor(...)`

构造函数接收根依赖注入服务。它只保存依赖，不做复杂初始化。真正初始化发生在 `startup()`。

### `startup()`

启动编辑器。它是编辑器生命周期里最关键的方法。

它主要做这些事：

1. 调用 `initServices()` 创建编辑器子服务容器。
2. 检查是否有工作区，没有就创建默认工作区。
3. 创建 Layer、ToolBar、Zoom、ContextMenu、Clipboard、FollowButton 等模块。
4. 把这些模块注册到生命周期管理器。
5. 通过 `provide` 暴露 `useEditor`。
6. 安装 core 中已经注册的插件。

可以把 `startup()` 理解为“编辑器初始化总开关”。

### `use(plugin)`

安装一个编辑器插件。它会执行插件函数，传入当前 service 和 use 方法，然后保存插件实例。

插件安装不是立即同步执行完整 setup，而是通过 `runWhenIdle` 放到浏览器空闲时执行。这样可以减少编辑器启动时的压力。

插件销毁逻辑也会被注册起来，编辑器销毁时会调用插件自己的 `dispose()`。

### `initServices()`

初始化编辑器级服务容器。它会注册这些服务：

1. `EventbusService`：事件总线。
2. `WorkspacesService`：多页面工作区。
3. `MLeaferCanvas`：画布核心服务。
4. `EditorUndoRedoService`：撤销恢复。
5. `KeybindingService`：快捷键。

最后它会基于根服务容器创建一个子容器。这样编辑器内部服务和全局服务可以分层管理。

### `define(id, ctor)`

这是 `initServices()` 内部的小工具函数。它的作用是避免重复注册服务。如果服务集合里没有某个服务，就用 `SyncDescriptor` 包装它并放进集合。

### `dispose()`

销毁编辑器。它会清理 provide、调用父类 dispose、重置快捷键和撤销恢复、销毁工作区、清空事件总线、清空 service 引用。

这个方法负责避免内存泄漏和路由切换后的残留行为。

### `getPluginSlots(name)`

获取插件提供的插槽组件。插件可以通过 slots 向编辑器某些位置注入组件，例如工具栏扩展按钮、面板扩展区域。

## 9. `src/views/Editor/core/instantiation/instantiation.ts`

这个文件是依赖注入系统的基础。它让服务之间可以通过构造函数声明依赖，而不是手动 import 后 new。

### `createDecorator(serviceId)`

创建服务标识。比如 `IMLeaferCanvas`、`IWorkspacesService` 都是通过它创建的。

它有两个作用：

1. 作为服务 id，让容器知道要取哪个服务。
2. 作为构造函数参数装饰器，记录某个类依赖哪个服务。

### `storeServiceDependency(id, target, index)`

记录服务依赖关系。比如某个类构造函数第 0 个参数写了 `@IWorkspacesService`，这个函数就会把“第 0 个参数依赖工作区服务”记录下来。

### `_util.getServiceDependencies(ctor)`

读取某个类的构造函数依赖列表。依赖注入容器创建实例时，会通过它知道需要先准备哪些服务。

## 10. `src/views/Editor/core/canvas/mLeaferCanvas.ts`

这个文件是整个项目最核心的文件。`MLeaferCanvas` 封装了 Leafer 画布，统一管理元素添加、选中、缩放、多页面、JSON 导入、字体加载等能力。

### `constructor(...)`

创建画布服务实例。

它主要做这些事：

1. 创建 Leafer `App`。
2. 配置编辑器选中框、旋转点、控制点。
3. 保存 Leafer canvas DOM 到 `wrapperEl`。
4. 创建标尺 `Ruler`。
5. 获取内容层 `contentLayer`。
6. 保存当前工作区 id。
7. 调用 `initWorkspace()`。
8. 调用 `initPageEditor()`。
9. 调用 `initWatch()`。
10. 初始化字体。

它是画布真正被创建的地方。

### `initWatch()`

监听当前激活工具 `activeTool`。如果工具不是 `select`，就取消当前选中对象。

这样做是为了避免选择工具和画笔、拖拽等工具冲突。

### `initWorkspace()`

初始化多页面工作区和画布 JSON 的同步关系。

它会监听这些事件：

1. `workspaceAddAfter`：新增页面后创建空 JSON。
2. `workspaceRemoveAfter`：删除页面后删除对应 JSON。
3. `workspaceChangeBefore`：切换页面前保存当前页面 JSON。
4. `workspaceChangeAfter`：切换页面后恢复目标页面 JSON。
5. `workspaceChangeRefresh`：刷新当前页面 JSON。

这个函数是多页面能力的核心。

### `initPageEditor()`

初始化当前页面的实际可编辑画板。

它会创建一个底层 `Frame`，这个 Frame 就是用户看到的白色海报画板。用户添加的文字、图片、图形最终都放进这个 Frame。

它还会监听：

1. 选择事件：更新当前选中对象。
2. 子元素添加事件：刷新图层数据。
3. 子元素删除事件：刷新图层数据。
4. 属性变化事件：通知布局移动。
5. resize 事件：初始化画布尺寸并触发布局 resize。

### `setPageJSON(id, json)`

把某个页面的画布数据保存到内部 `pages` Map。它会补充默认结构，例如 `children`、`name`、`id`。

通常在新增页面、切换页面前、导出页面前使用。

### `getPageJSON(id)`

获取某个页面的 JSON。如果获取的是当前页面，会使用最新的 children，避免拿到旧数据。

### `getCurrentPage()`

保存当前画布 JSON，然后返回当前页面数据。它不是单纯读取，会先调用 `contentFrame.toJSON()` 更新缓存。

### `getPages()`

保存当前页面 JSON，然后返回全部页面 Map。一般用于多页面导出或保存。

### `setActiveObjectValue(object)`

设置当前选中对象。如果传入空对象，就默认选中底层画板 `contentFrame`。

如果对象是二维码，会锁定宽高比例，防止二维码被拉伸变形。

### `setActiveObjects(objects)`

设置多个选中对象。它直接修改 Leafer 编辑器的 target，用于多选场景。

### `activeObjectIsType(...types)`

判断当前选中对象是否属于某些类型。例如判断当前选中的是 Text、Image、Group、QrCode。

右侧属性面板常用这种方法决定展示哪个属性配置组件。

### `objectIsTypes(object, ...types)`

判断任意对象是否属于某些类型。它和 `activeObjectIsType` 的区别是：这个方法不依赖当前选中对象，可以判断传进来的任意对象。

### `selectObject(target)`

选中某个对象。只有当前工具是 `select` 时才会真正选中。

它会设置 Leafer editor 的 target，并同步更新 `activeObject`。

### `discardActiveObject()`

取消当前选中对象。它会清空 Leafer editor target，并把当前 activeObject 设置为底层画板。

### `add(_child, _index?)`

添加一个元素到当前画板。

它不是简单地 `contentFrame.add`，而是额外做了很多事情：

1. 如果是 Group 或 Box，绑定拖放逻辑。
2. 如果没有 zIndex，自动放到顶层。
3. 添加到 contentFrame。
4. 自动选中新元素。
5. 刷新 children，驱动图层面板更新。

所以组件添加元素时应该优先调用 `editor.add()`。

### `addMany(..._children)`

批量添加多个元素。适合一次性导入多个对象，比如 PSD 解析后批量加入画布。

当前它比 `add` 简单，没有逐个处理选中和 zIndex，所以使用时要注意是否需要补充逻辑。

### `reLoadFromJSON(json)`

重新加载 JSON 数据。它内部会调用 `importJsonToCurrentPage(json, true)`，然后恢复缩放比例。

### `importJsonToCurrentPage(json, clearHistory?)`

把 JSON 导入当前页面。

它会做这些事：

1. 根据参数决定是否清空当前画板。
2. 用 `contentFrame.set(json)` 恢复画布对象。
3. 取消当前选中。
4. 切回选择工具。
5. 刷新 children。
6. 自适应缩放。
7. 提取模板字体。
8. 字体加载完成后强制 Text 和 HTMLText 重新渲染。

这个函数是模板导入和页面恢复的核心。

### `importPages(json, clearHistory?)`

导入多页面 JSON。

它会先校验 JSON 是否包含 `workspaces` 和 `pages`，然后清空旧工作区和旧页面缓存，再重建工作区并逐页恢复页面数据。

### `getActiveObjects()`

获取当前选中的对象列表。适合多选、组合、删除、对齐等操作。

### `getActiveObject()`

获取当前选中对象。属性面板经常使用它读取当前对象。

### `zoomToInnerPoint(zoom?)`

设置画布缩放比例。它会同步更新响应式 zoom，并调用 Leafer 的 zoom 方法。

### `zoomToFit()`

让画布自适应容器。导入模板、初始化画布、重置视图时常用。

### `children` getter 和 setter

读取或设置当前工作区页面的 children。它们把当前工作区 id 和页面数据关联起来。

### `childrenEffect()`

刷新响应式 children 列表。图层面板依赖这个列表渲染，所以添加、删除、导入元素后都要调用。

### `setZoom(scale)`

设置缩放比例，是 `zoomToInnerPoint` 的薄封装。

### `getZoom()`

读取当前缩放比例。如果内容层还没初始化，则返回 1。

### `findObjectById(id)`

根据 id 查找当前画板中的对象。

### `findObjectsByIds(idsToFind)`

根据多个 id 查找多个对象，适合批量操作。

### `bindDragDrop(group)`

给 Group 或 Box 绑定拖入和拖出逻辑。它让元素可以被拖进组内，也可以从组里拖出来。

## 11. `src/views/Editor/core/workspaces/workspacesService.ts`

这个文件管理多页面工作区。它不直接操作画布，而是通过事件总线告诉画布服务“页面要切换了”。

### `getCurrentId()`

返回当前工作区 id。

### `reloadJSON()`

触发当前页面 JSON 刷新。它会发出 `workspaceChangeRefresh` 事件，具体刷新由画布服务处理。

### `setCurrentId(workspaceId)`

切换当前工作区。

它会先发 `workspaceChangeBefore`，再修改 currentId，然后发 `workspaceChangeAfter`。

这样设计是为了让画布服务有机会在切换前保存旧页面，在切换后恢复新页面。

### `all()`

返回全部工作区列表。

### `set(workspaceId, name)`

修改某个工作区的名称。

### `get(workspaceId)`

根据 id 查找工作区。

### `add(name, id?)`

新增工作区。如果没有传 id，就自动生成 uuid。新增前后会分别发出 `workspaceAddBefore` 和 `workspaceAddAfter` 事件。

### `remove(workspaceId)`

删除工作区。删除前后会发事件。如果删除的是当前工作区，会尝试切换到后一个或前一个工作区。

### `removeAll()`

删除所有工作区，并发出删除事件。

### `size()`

返回当前工作区数量。

### `clear()`

清空工作区列表和当前 id。

### `dispose()`

销毁工作区服务。它会调用父类销毁逻辑，并清空工作区数据。

## 12. `src/views/Editor/core/eventbus/eventbusService.ts`

这个文件定义编辑器事件总线服务。它的价值是让模块之间不直接互相调用。

### `EventbusService`

继承 `Mitt<Events>`，提供 `on`、`emit`、`off` 等事件能力。

工作区服务通过它发事件，画布服务通过它监听事件。

### `IEventbusService`

事件总线服务标识，用于依赖注入。

### `registerSingleton(...)`

把事件总线注册成单例服务。这样其他服务可以通过依赖注入拿到同一个事件总线。

## 13. `src/views/Editor/core/layer/hierarchyService.ts`

这个文件管理图层层级，主要围绕 zIndex 做计算。

### `addItem(item)`

新增层级项，并按 zIndex 排序。

### `updateOrAddItem(item)`

如果层级项已存在就更新，不存在就新增。

### `removeItem(key)`

删除指定 key 的层级项。

### `getPreviousLevel(keys)`

获取指定元素的上一级层级。多选时会基于多个 key 计算。

### `getNextLevel(keys)`

获取指定元素的下一级层级。

### `getTopLevel()`

获取当前最高层级。添加新元素时会用它计算新元素 zIndex。

### `getBottomLevel()`

获取当前最低层级。

### `getItemByKey(key)`

根据 key 查找层级项。它是私有方法，只在服务内部使用。

## 14. `src/store/index.ts`

这个文件创建并导出 Pinia，同时统一导出项目 store。

### `createPinia()`

创建 Pinia 实例。

### `export default pinia`

导出 Pinia 实例，供 `main.ts` 注册。

### `useAppStore` 和 `useFontStore`

统一导出业务 store，方便其他文件从 `@/store` 引入。

## 15. `src/store/modules/app/app.ts`

这个文件保存编辑器全局 UI 状态。

### `useAppStore`

定义 app store。

### `activeTool`

当前激活工具，默认是 `select`。画布服务会监听它，工具切换时可能取消选中对象。

## 16. `src/store/modules/font/font.ts`

这个文件负责字体列表、模板字体提取、字体加载。

### `initFonts()`

初始化字体列表。它会先查 localStorage 缓存，如果缓存不存在，就请求接口获取字体列表，然后写入缓存。

### `extractTemplateFonts(jsonData, load?)`

从模板 JSON 中提取字体。

它会遍历 JSON 树：

1. 遇到 `Text`，读取 `fontFamily`。
2. 遇到 `HTMLText`，用正则从 HTML 字符串里提取 `font-family`。

如果 `load` 为 true，会继续调用 `loadFonts()` 加载字体。

### `loadFonts(fonts, maxConcurrent?)`

按并发批次加载字体。它会用 Arco 通知显示总进度，用 Message 显示每个字体加载结果。

### `loadFont(fontName)`

加载单个字体。它使用 `FontFaceObserver` 检测字体是否加载完成。这个函数定义在 `loadFonts` 内部，不对外暴露。

## 17. `src/utils/request.ts`

这个文件统一配置 axios。

### 请求拦截器

请求发出去之前执行。当前主要预留了 token 注入逻辑，后续如果接登录态，可以在这里统一添加 Authorization。

### 响应拦截器

接口返回后统一处理。

它会区分：

1. blob 或 arraybuffer：直接返回原 response。
2. 业务成功：返回 `response.data`。
3. 业务失败：弹出错误提示并 reject。
4. 401：跳转登录页。

这个文件的作用是让业务组件不用每次都重复写响应判断。

## 18. `src/utils/psd/index.ts`

这个文件负责读取 PSD 文件并调用 `ag-psd` 解析。

### `parsePsdFile(file, onProcess)`

接收用户选择的 PSD 文件，用 FileReader 读取为 ArrayBuffer，然后调用 `readPsd` 解析。

解析成功后返回：

1. `psd`：完整 PSD 数据。
2. `layers`：PSD 子图层数组。

如果文件是 CMYK 色彩模式，会返回中文提示，因为当前项目主要支持 RGB PSD。

## 19. `src/utils/psd/parser/text.ts`

这个文件负责把 PSD 文字图层转换成 Leafer 文字对象。

### `parseText(layer, options?)`

文字解析入口。它根据 `styleRuns` 判断文字是普通文本还是富文本。

有 `styleRuns` 时调用 `parseStyledText()`，否则调用 `parseSimpleText()`。

### `parseStyledText(layer, options?)`

解析富文本。它会把 PSD 中不同样式片段转成 HTML span 字符串，然后创建 `HTMLText` 对象。

### `parseSimpleText(layer, options?)`

解析普通文本。它会创建 Leafer `Text` 对象，并设置文本内容、宽高、字体、字号、填充、段落样式和文字特效。

### `textUtil.getWidth(layer)`

获取文字宽度。

### `textUtil.getHeight(layer)`

获取文字高度。

### `textUtil.getFontSize(layer)`

计算字体大小，会考虑 PSD transform 缩放。

### `textUtil.getFontFamily(layer)`

获取字体名称。如果 PSD 字体浏览器没有加载，导入后的视觉效果可能不一致。

### `textUtil.getFill(layer)`

获取 Leafer 需要的填充颜色数组。

### `textUtil.getFillStr(layer)`

获取颜色字符串，主要给 HTMLText 的 span style 使用。

### `textUtil.getLetterSpacing(layer)`

计算字间距。PSD 的 tracking 和前端文本属性单位不同，所以需要转换。

### `textUtil.getAverageScale(transform)`

根据 transform 计算平均缩放比例，常用于字号和行高换算。

### `textUtil.mapJustificationToTextAlign(justification)`

把 PSD 的段落对齐方式转换成 Leafer 的 textAlign。

### `setTxtStyle(layer, text)`

设置普通文本样式，例如字间距、下划线、删除线、行高。

### `setTxtParagraphStyle(paragraphStyle, text)`

设置段落样式，例如水平对齐、垂直对齐、首行缩进。

### `setTextEff(effects, text)`

设置普通文本特效，例如描边、填充。

### `setStyleTextEff(effects, text)`

设置富文本特效，逻辑和普通文本类似，只是对象是 HTMLText。

## 20. `src/views/Editor/layouts/canvasEdit/canvasEdit.vue`

这个组件负责把 Leafer 画布 DOM 挂载到 Vue 页面中。

### `setup()`

创建 `divRef`，并注册 mounted 生命周期。

### `onMounted(...)`

组件挂载后执行。

它会：

1. 调用 `useEditor()` 获取画布服务。
2. 把 `canvas.wrapperEl` 添加到页面 div 中。
3. 设置 canvas DOM 的 display。
4. 监听容器尺寸变化。

### `useResizeObserver(...)`

监听画布容器尺寸变化。容器宽高变化后，调用 `canvas.app.resize({ width, height })`，让 Leafer 画布适配当前区域。

## 21. `src/views/Editor/layouts/panel/leftPanel/wrap/TextListWrap.vue`

这个组件负责展示文字素材，并在用户点击时添加文字到画布。

### `handleClick(item)`

点击文字素材时执行。

它会根据素材类型创建不同对象：

1. `Text`：普通文字。
2. `HTMLText`：富文本。
3. `Group`：其他组合素材。

创建对象后调用 `editor.add(text)` 添加到画布。

### `fetchData()`

分页获取文本素材列表。它调用 `queryTextMaterialList(page)`，成功后把返回数据追加到 `page.dataList`，并更新页码和是否还有更多数据。

## 22. `src/views/Editor/layouts/panel/leftPanel/wrap/mixins/pageMixin.ts`

这个文件通常用于封装素材列表分页状态。

### `usePageMixin()`

返回分页数据对象。不同素材面板可以复用它，避免每个组件都重复写 pageNum、pageSize、dataList、noMore 等状态。

## 23. `src/api/editor/*.ts`

这些文件负责封装编辑器相关接口。

### 字体接口函数

获取字体列表，供 `fontStore.initFonts()` 使用。

### 素材接口函数

获取文字、图片、模板、背景等素材列表，供左侧素材面板使用。

### 上传接口函数

上传图片或文件素材，通常返回文件 id、路径、类型等信息。

这些函数的共同特点是：只负责请求后端，不直接操作画布。

## 24. `src/mock/*.ts`

这些文件提供本地模拟数据。

### mock 注册函数

把模拟接口挂到 MockJS 中，让开发环境可以在没有后端接口时继续调试页面。

mock 的作用是支撑前后端并行开发，但真实接口结构变化后，mock 也要同步更新。

## 25. `src/views/Editor/core/shapes/*.ts`

这些文件定义自定义画布元素。

### `QrCode.ts`

封装二维码元素。它会把二维码内容转换成可渲染对象，并支持在画布中编辑位置和大小。

### `BarCode.ts`

封装条形码元素。

### `Image2.ts`

封装自定义图片元素，通常用于增强官方 Image 能力。

### `HTMLText2.ts`

封装富文本元素。它让项目可以把 HTML 字符串作为富文本内容渲染到画布上。

## 26. `src/views/Editor/utils/*.ts`

这些文件是编辑器工具函数集合。

### `utils.ts`

通常包含对象类型判断、默认命名、画布对象辅助判断等函数。

### `jsonParse.ts`

通常用于 JSON 导入导出相关格式处理。

### `fill.ts`

处理填充相关逻辑，例如纯色、渐变、图片填充。

### `contextMenu.ts`

处理右键菜单相关工具逻辑。

### `lifecycle.ts`

封装可销毁对象、生命周期注册、dispose 等逻辑。

### `async.ts`

封装异步调度，例如空闲时执行任务。

## 27. 典型函数调用链

### 添加普通文字

```text
TextListWrap.handleClick
  -> 创建 Text 对象
  -> editor.add(text)
  -> MLeaferCanvas.add
  -> contentFrame.add
  -> selectObject
  -> childrenEffect
  -> 图层面板刷新
  -> 属性面板显示文字属性
```

### 切换页面

```text
WorkspacesService.setCurrentId
  -> workspaceChangeBefore
  -> MLeaferCanvas 保存旧页面 JSON
  -> 修改 currentId
  -> workspaceChangeAfter
  -> MLeaferCanvas 导入新页面 JSON
```

### 导入模板 JSON

```text
业务组件拿到 JSON
  -> MLeaferCanvas.importJsonToCurrentPage
  -> contentFrame.clear
  -> contentFrame.set(json)
  -> discardActiveObject
  -> childrenEffect
  -> zoomToFit
  -> extractTemplateFonts
  -> forceRender 文本
```

### 导入 PSD

```text
用户选择 PSD 文件
  -> parsePsdFile
  -> readPsd
  -> parser/text、image、group、mask
  -> 转成 Leafer 对象
  -> editor.add 或 addMany
```

## 28. 阅读建议

如果你是新手，不建议从所有 Vue 组件开始逐个看。推荐顺序是：

1. `main.ts`
2. `router/index.ts`
3. `views/Editor/editor.vue`
4. `core/createCore.ts`
5. `app/editor/editor.ts`
6. `app/index.ts`
7. `core/canvas/mLeaferCanvas.ts`
8. `core/workspaces/workspacesService.ts`
9. `layouts/canvasEdit/canvasEdit.vue`
10. `leftPanel/wrap/TextListWrap.vue`
11. `utils/psd/index.ts`
12. `utils/psd/parser/text.ts`

按这个顺序读，你会先理解项目主线，再理解具体组件。
