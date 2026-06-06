# Gzm Design 项目新手完整导读

本文档面向刚接触前端工程、Vue 3、TypeScript、画布编辑器的新手程序员。它的目标不是只告诉你“这个项目有什么文件”，而是帮助你建立一套理解项目的顺序：先知道项目要解决什么问题，再知道架构如何拆分，再看模块之间怎样合作，最后进入关键文件逐行理解。

> 说明：本仓库源码和资源文件很多，真正做到“每个文件每一行代码逐行解释”会远超一份普通 Markdown 文档的体量。本文先覆盖项目架构、设计思想、核心协作链路，并对最关键的入口、路由、编辑器核心、画布服务、工作区服务、事件总线、字体管理、PSD 解析、左侧文本面板等文件做逐行解释。后续如果需要，可以按本文最后的“全量逐行解释扩展索引”继续扩展为多卷文档。

## 1. 项目是什么

Gzm Design 是一个开源的在线海报设计器。用户可以在浏览器里完成类似轻量版设计工具的操作，例如添加文字、图片、图形、二维码、条形码，调整元素位置、层级、样式，导入模板，导入 PSD，导出图片或 JSON。

从技术上看，它是一个基于 Vue 3 和 Vite 的前端项目，但核心能力不是普通页面展示，而是“可视化编辑器”。因此它的架构由三部分共同组成：

1. Vue 负责页面结构、面板、按钮、属性表单等 UI。
2. Leafer UI 负责画布、元素、选中框、缩放、拖拽、渲染等编辑能力。
3. TypeScript 服务层负责把 UI 操作、画布对象、工作区、多页面、事件、插件等连接起来。

如果你是新手，可以先把项目想象成一个桌面设计软件：

1. 顶部工具栏是 Vue 组件。
2. 左侧素材栏是 Vue 组件。
3. 中间画布是 Leafer 创建出来的真实画布。
4. 右侧属性面板是 Vue 组件。
5. 所有组件都通过 `useEditor()` 拿到同一个编辑器服务，然后调用服务去操作画布。

## 2. 技术栈总览

项目主要技术如下：

| 技术 | 作用 |
| --- | --- |
| Vue 3 | 构建页面组件和响应式 UI |
| TypeScript | 提供类型约束，减少大型项目维护成本 |
| Vite | 开发服务器、构建工具、插件集成 |
| Pinia | 全局状态管理，例如当前激活工具、字体列表 |
| Vue Router | 路由管理，切换首页、编辑器、PSD 解析页等 |
| Arco Design Vue | UI 组件库，提供布局、按钮、表单、消息提示 |
| UnoCSS | 原子化 CSS 工具 |
| Leafer UI | 画布编辑核心，负责对象渲染、拖拽、选中、缩放等 |
| ag-psd | 解析 Photoshop PSD 文件 |
| Axios | HTTP 请求封装 |
| MockJS | 本地模拟接口数据 |
| TinyMCE | 富文本编辑相关能力 |
| fontfaceobserver | 字体加载状态检测 |

## 3. 项目运行入口

浏览器访问项目时，整体启动链路如下：

```text
index.html
  -> src/main.ts
    -> createApp(App)
    -> 注册 pinia、router、Arco、图标、编辑器 core
    -> App.vue
      -> router-view
        -> /editor 对应 src/views/Editor/editor.vue
          -> 创建 EditorMain
          -> 初始化服务
          -> 初始化画布
          -> 渲染编辑器布局
```

这条链路非常重要。新手看项目时不要一开始就陷进某个按钮文件，而应该先看：

1. `package.json`
2. `vite.config.ts`
3. `src/main.ts`
4. `src/App.vue`
5. `src/router/index.ts`
6. `src/views/Editor/editor.vue`
7. `src/views/Editor/core/createCore.ts`
8. `src/views/Editor/app/editor/editor.ts`
9. `src/views/Editor/core/canvas/mLeaferCanvas.ts`

## 4. 目录结构解释

项目根目录的重要文件：

| 文件或目录 | 作用 |
| --- | --- |
| `package.json` | 记录依赖、脚本、项目名、模块类型 |
| `vite.config.ts` | Vite 构建配置，配置 Vue、自动导入、组件自动注册、UnoCSS、SVG 图标 |
| `tsconfig.json` | TypeScript 编译配置 |
| `uno.config.ts` | UnoCSS 原子样式配置 |
| `index.html` | 浏览器加载的 HTML 入口 |
| `src/main.ts` | Vue 应用入口 |
| `src/App.vue` | 根组件 |
| `src/router` | 路由定义 |
| `src/store` | Pinia 状态管理 |
| `src/views` | 页面级组件 |
| `src/views/Editor` | 编辑器页面和编辑器核心逻辑 |
| `src/components` | 通用组件，例如颜色选择器、树组件、瀑布流、菜单等 |
| `src/api` | 后端接口封装 |
| `src/mock` | 本地 mock 接口数据 |
| `src/utils` | 工具函数，例如 PSD 解析、请求封装、字体加载、数学计算 |
| `src/assets` | 图片、图标、素材 JSON |
| `public/tinymce` | TinyMCE 静态资源 |

## 5. 编辑器架构分层

编辑器不是单文件组件堆起来的，而是分层设计。

### 5.1 UI 层

UI 层主要在 `src/views/Editor/layouts` 下：

| 区域 | 代表文件 | 作用 |
| --- | --- | --- |
| 顶部栏 | `layouts/header/headerBar.vue` | 文件操作、撤销恢复、缩放、工具栏、保存导出 |
| 左侧栏 | `layouts/panel/leftPanel` | 素材列表、文字、图片、图形、背景、工具 |
| 中间画布 | `layouts/canvasEdit/canvasEdit.vue` | 把 Leafer 画布 DOM 挂进页面 |
| 右侧栏 | `layouts/panel/rightPanel` | 图层列表、属性编辑面板 |
| 底部栏 | `layouts/footer/footerBar.vue` | 页脚和辅助操作 |

UI 层的思想是“只负责显示和触发动作”。例如点击“添加普通文字”，组件不会自己渲染画布，而是创建一个 `Text` 对象，然后调用 `editor.add(text)`。

### 5.2 应用服务层

应用服务层主要在 `src/views/Editor/app` 下。

这一层的职责是管理编辑器生命周期。核心类是 `EditorMain`。

它负责：

1. 初始化服务集合。
2. 创建画布服务、工作区服务、事件总线、快捷键服务、撤销恢复服务。
3. 创建图层、工具栏、缩放、右键菜单、剪贴板等功能模块。
4. 安装插件。
5. 在页面销毁时释放资源。

### 5.3 Core 核心层

核心层主要在 `src/views/Editor/core` 下。

它包括：

| 子目录 | 作用 |
| --- | --- |
| `canvas` | Leafer 画布封装，是编辑器最关键的服务 |
| `instantiation` | 依赖注入系统，用装饰器声明服务依赖 |
| `eventbus` | 事件总线，各服务之间解耦通信 |
| `workspaces` | 多页面/工作区管理 |
| `layer` | 图层层级辅助服务 |
| `keybinding` | 快捷键服务 |
| `undoRedo` | 撤销恢复基础能力 |
| `shapes` | 自定义图形，例如二维码、条形码、HTMLText、Image2 |

### 5.4 数据和状态层

状态层主要有两类：

1. Pinia 全局状态，例如 `activeTool` 和字体列表。
2. 编辑器服务内部状态，例如当前选中对象、多页面 JSON、Leafer app、contentFrame。

新手容易误以为所有状态都应该放 Pinia。这个项目没有这么做。原因是画布对象本身非常复杂，很多状态和 Leafer 实例强相关，如果全部塞进 Pinia 反而更难维护。项目采用“业务 UI 状态进 Pinia，画布实例状态留在画布服务里”的设计。

## 6. 核心设计思想

### 6.1 编辑器服务是中心

绝大多数编辑器功能都会通过 `useEditor()` 获取服务：

```ts
const { editor, canvas, keybinding, undoRedo, event, workspaces } = useEditor()
```

这里的 `editor` 和 `canvas` 实际上都指向 `MLeaferCanvas`。它是对 Leafer 画布的一层封装。

这样设计的好处是：

1. Vue 组件不需要知道画布内部细节。
2. 新增组件时，只要调用统一 API 就能操作画布。
3. 画布逻辑集中在服务里，便于维护。

### 6.2 依赖注入让服务解耦

项目使用了类似 VS Code 的依赖注入写法。例如：

```ts
constructor(
  @IWorkspacesService private readonly workspacesService: WorkspacesService,
  @IEventbusService private readonly eventbus: EventbusService,
  @IHierarchyService private readonly hierarchyService: HierarchyService,
) {}
```

这表示 `MLeaferCanvas` 需要工作区服务、事件总线、层级服务。它不用自己 `new WorkspacesService()`，而是由依赖注入容器创建并传入。

这样做的好处是：

1. 服务创建顺序由容器统一管理。
2. 服务之间依赖关系更清楚。
3. 后续替换实现或测试更容易。

### 6.3 事件总线让模块不用直接互相调用

例如切换页面时，`WorkspacesService` 只发事件：

```ts
eventbus.emit('workspaceChangeBefore', param)
eventbus.emit('workspaceChangeAfter', param)
```

画布服务监听这些事件，负责保存旧页面和恢复新页面。这样工作区服务不需要知道画布细节，画布服务也不需要直接控制工作区内部数组。

### 6.4 画布 JSON 是页面数据的核心格式

每个页面最终都会对应一份 JSON。画布中的对象可以从 JSON 导入，也可以导出 JSON。

关键方法包括：

1. `contentFrame.toJSON()`：把当前画布内容转成 JSON。
2. `contentFrame.set(json)`：把 JSON 恢复到画布。
3. `importJsonToCurrentPage(json, clearHistory)`：导入 JSON 到当前页。
4. `importPages(json, clearHistory)`：导入多页面数据。

### 6.5 插件系统提供扩展点

`createCore()` 返回的 core 有 `use(plugin)` 方法。主入口里执行：

```ts
core.use(myPlugin)
```

编辑器启动后会遍历插件并安装。插件可以提供 `setup`、`dispose`、`slots` 等能力。

## 7. 模块协作流程

### 7.1 用户添加一个普通文字

流程如下：

```text
用户点击左侧“添加普通文字”
  -> TextListWrap.vue 的 handleClick 执行
  -> 创建 leafer-ui 的 Text 对象
  -> 调用 editor.add(text)
  -> MLeaferCanvas.add 把对象加入 contentFrame
  -> 选中新对象
  -> 更新 childrenEffect
  -> 图层面板和属性面板响应变化
```

### 7.2 用户切换页面

流程如下：

```text
用户点击另一个页面
  -> WorkspacesService.setCurrentId(newId)
  -> 发 workspaceChangeBefore
  -> MLeaferCanvas 保存旧页面 JSON
  -> WorkspacesService 更新 currentId
  -> 发 workspaceChangeAfter
  -> MLeaferCanvas 清空旧内容并导入新页面 JSON
```

### 7.3 用户导入 PSD

流程如下：

```text
用户选择 PSD 文件
  -> parsePsdFile 使用 FileReader 读取 ArrayBuffer
  -> ag-psd readPsd 解析文件
  -> parser/group、image、text、mask 等模块转换图层
  -> 转成 Leafer 可识别的 Text、HTMLText、Image、Group 等对象
  -> 添加到当前画布
```

### 7.4 用户导入模板 JSON

流程如下：

```text
获取模板 JSON
  -> MLeaferCanvas.importJsonToCurrentPage
  -> contentFrame.set(json)
  -> 清空选中对象
  -> 切回 select 工具
  -> childrenEffect 更新图层数据
  -> useFontStore.extractTemplateFonts 提取字体
  -> 加载字体后强制文本重新渲染
```

## 8. 关键文件逐行解释

下面开始逐行解释关键文件。新手建议按顺序阅读。

## 8.1 `package.json` 逐行解释

```json
{
  "name": "gzm-design",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

第 1 行：JSON 文件开始。

第 2 行：项目名称是 `gzm-design`。

第 3 行：`private: true` 表示这个包不希望被发布到 npm。

第 4 行：版本号是 `0.0.0`，说明仓库没有把版本管理作为重点。

第 5 行：`type: module` 表示 Node 按 ESM 模块规则理解 `.js` 文件。

第 6 行：`scripts` 开始定义命令。

第 7 行：`npm run dev` 会启动 Vite 开发服务器。

第 8 行：`npm run build` 会执行生产构建。

第 9 行：`npm run preview` 会预览构建后的产物。

第 10 行：脚本定义结束。

第 11 行到第 46 行：`dependencies` 是运行时依赖，也就是项目在浏览器里真正需要的库。

第 12 行到第 25 行：大量 `@leafer-in/*` 和 `@leafer-ui/*` 依赖说明项目核心是 Leafer 画布编辑器。

第 26 行：`@tinymce/tinymce-vue` 是 Vue 版 TinyMCE，用于富文本能力。

第 27 行：`@unocss/reset` 是样式重置。

第 28 行：`@vueuse/core` 提供常用 Vue 组合式工具，例如 resize observer。

第 29 行：`ag-psd` 用于解析 PSD 文件。

第 30 行：`axios` 用于网络请求。

第 31 行：`convert-units` 用于单位转换。

第 32 行：`fontfaceobserver` 用于观察字体是否加载完成。

第 33 行：`jsbarcode` 用于生成条形码。

第 34 行：`leafer-ui` 是画布 UI 核心库。

第 35 行：`leafer-x-ruler` 提供标尺能力。

第 36 行：`lodash` 是常用工具库。

第 37 行：`mousetrap` 用于快捷键绑定。

第 38 行：`number-precision` 用于减少浮点数精度问题。

第 39 行：`pinia` 是 Vue 状态管理。

第 40 行：`qrcode` 用于二维码生成。

第 41 行：`tinycolor2` 用于颜色转换和处理。

第 42 行：`tinymce` 是富文本编辑器本体。

第 43 行：`uuid` 用于生成唯一 id。

第 44 行：`vue` 是前端框架。

第 45 行：`vue-router` 是路由库。

第 47 行到第 67 行：`devDependencies` 是开发和构建时依赖。

第 48 行：`@arco-design/web-vue` 是 UI 组件库。

第 49 行到第 56 行：`@types/*` 是 TypeScript 类型声明。

第 57 行：`@vitejs/plugin-vue` 让 Vite 支持 Vue 单文件组件。

第 58 行：`less` 让项目能写 Less 样式。

第 59 行：`mockjs` 用于模拟接口数据。

第 60 行：`typescript` 是 TS 编译器。

第 61 行：`unocss` 是原子化 CSS 引擎。

第 62 行：`unplugin-auto-import` 自动导入 Vue、Pinia 等 API。

第 63 行：`unplugin-vue-components` 自动注册组件。

第 64 行：`vite` 是构建工具。

第 65 行：`vite-plugin-svg-icons` 用于 SVG 图标雪碧图。

第 66 行：`vue-tsc` 用于 Vue 项目的类型检查。

## 8.2 `vite.config.ts` 逐行解释

第 1 行：从 Vite 导入 `defineConfig`，用于获得配置类型提示。

第 2 行：导入 Vue 插件，让 Vite 能处理 `.vue` 文件。

第 3 行：导入 UnoCSS 的 Vite 插件。

第 4 行：导入自动导入插件。

第 5 行：导入组件自动注册插件。

第 6 行：导入 Arco 组件解析器。

第 7 行：导入 SVG 图标插件。

第 8 行：导入 Node 的 `resolve`，用于拼接绝对路径。

第 9 行：注释，指向 Vite 官方配置文档。

第 10 行：定义 `config` 函数，Vite 会传入 `mode` 等信息。

第 11 行：返回配置对象开始。

第 12 行：`plugins` 数组开始。

第 13 行：注册 Vue 插件。

第 14 行：注释说明下面是自动按需引入组件。

第 15 行：注册 AutoImport 插件。

第 16 行到第 20 行：配置 ArcoResolver，使 Arco 相关 API 能被自动处理。

第 21 行：声明自动导入 `vue`、`vue-router`、`pinia`、`@vueuse/core`。这就是为什么很多文件能直接写 `ref`、`watch`、`defineStore` 而不显式 import。

第 22 行到第 24 行：让插件生成 ESLint 配置，避免自动导入变量被 ESLint 误判未定义。

第 25 行：AutoImport 配置结束。

第 26 行：注册 Components 插件。

第 27 行：`directoryAsNamespace` 表示组件路径可以作为命名空间。

第 28 行到第 34 行：配置 Arco 组件和图标自动解析。

第 35 行：Components 配置结束。

第 36 行：启用 UnoCSS。

第 37 行：启用 SVG 图标插件。

第 38 行：注释说明要指定图标文件夹。

第 39 行：把 `src/assets/icons` 作为 SVG 图标目录。

第 40 行：注释说明 symbolId 格式。

第 41 行：定义 SVG symbol id，例如 `icon-folder-name`。

第 42 行：SVG 插件配置结束。

第 43 行：plugins 数组结束。

第 44 行：`resolve` 配置开始。

第 45 行：`alias` 配置开始。

第 46 行：把 `@` 指向 `src`。因此 `@/router` 等价于 `src/router`。

第 47 行：alias 结束。

第 48 行：resolve 结束。

第 49 行：返回配置对象结束。

第 50 行：config 函数结束。

第 51 行：导出 Vite 配置。

## 8.3 `src/main.ts` 逐行解释

第 1 行：从 Vue 导入 `createApp`，用于创建 Vue 应用实例。

第 3 行：导入根组件 `App.vue`。

第 4 行：导入路由实例。

第 5 行：导入 Pinia 实例。

第 6 行：导入 Arco Vue 组件库。

第 7 行：导入 Arco 样式。

第 8 行：注释，说明下面是 CSS。

第 9 行：导入 UnoCSS 的 Tailwind 兼容 reset 样式。

第 10 行：导入 UnoCSS 生成的虚拟 CSS。

第 11 行：导入 SVG 图标注册模块。

第 12 行：导入项目全局 Less 样式。

第 13 行：导入 mock 模块，使本地模拟接口生效。

第 14 行：导入 request 模块，执行 axios 默认配置和拦截器注册。

第 15 行：注释，说明额外引入图标库。

第 16 行：导入 Arco 图标组件。

第 17 行：导入自定义图标字体插件。

第 19 行：从编辑器 core 导入 `createCore`。

第 20 行：创建编辑器核心对象。这个对象会作为 Vue 插件安装。

第 21 行：导入测试插件 `myPlugin`。

第 22 行：把测试插件注册到 core。

第 23 行：创建 Vue 应用实例。

第 24 行：安装 Pinia。

第 25 行：安装路由。

第 26 行：安装 Arco 组件库。

第 27 行：安装编辑器 core。安装时会调用 `setActiveCore(core)`。

第 28 行：安装 Arco 图标。

第 29 行：安装自定义图标字体插件。

第 30 行：把 Vue 应用挂载到 HTML 里的 `#app` 节点。

## 8.4 `src/App.vue` 逐行解释

第 1 行：开启 `<script setup>`，语言是 TypeScript。

第 2 行：脚本为空，说明根组件没有自己的逻辑。

第 4 行：模板开始。

第 5 行：使用 Arco 的 `a-config-provider` 包裹应用，方便统一配置 UI。

第 6 行：渲染当前路由对应的组件，并通过插槽拿到 `Component`。

第 7 行：动态渲染当前路由组件。

第 8 行：`router-view` 结束。

第 9 行：`a-config-provider` 结束。

第 10 行：模板结束。

第 12 行到第 14 行：scoped 样式为空。

## 8.5 `src/router/index.ts` 逐行解释

第 1 行：从 Vue Router 导入创建路由和 hash history 的函数。

第 3 行：导入编辑器页面。

第 4 行：导入 PSD 解析页面。

第 5 行：导入自定义组件展示页面。

第 6 行：导入首页。

第 8 行：创建路由实例。

第 9 行：使用 hash 路由。URL 会包含 `#/editor`，部署时更简单。

第 10 行：路由数组开始。

第 11 行到第 16 行：定义 `/` 首页路由，渲染 `Home`。

第 15 行：注释掉的代码说明以前可能想让首页直接进入编辑器。

第 17 行到第 21 行：定义 `/editor`，渲染编辑器页面。

第 22 行到第 26 行：定义 `/psParser`，渲染 PSD 解析页面。

第 27 行到第 31 行：定义 `/components`，渲染自定义组件页面。

第 32 行：路由数组结束。

第 33 行：createRouter 配置结束。

第 35 行：导出路由实例。

## 8.6 `src/views/Editor/editor.vue` 逐行解释

第 1 行：模板开始。

第 2 行：外层 `layout-box`，用于占满视口和隐藏溢出。

第 3 行：Arco 的 loading 组件，初始化时显示“正在初始化”。

第 4 行：Arco 布局容器，高度占满。

第 5 行：布局头部。

第 6 行：渲染顶部栏 `headerBar`。

第 7 行：头部结束。

第 8 行：主体横向布局开始。

第 9 行：渲染左侧面板。

第 10 行：中间内容区开始。

第 11 行：编辑器中间区域布局。

第 12 行：主要画布容器。

第 13 行：白色背景容器。

第 14 行：渲染 `canvas-edit`，这里会把 Leafer canvas DOM 挂进去。

第 15 行：白色背景容器结束。

第 16 行：主内容区结束。

第 17 行：渲染底部栏。

第 18 行：中间布局结束。

第 19 行：内容区结束。

第 20 行：渲染右侧面板。

第 21 行：主体布局结束。

第 22 行：外层布局结束。

第 23 行：loading 包裹结束。

第 24 行：最外层结束。

第 25 行：模板结束。

第 27 行：脚本开始，使用 setup 和 TypeScript。

第 29 行到第 33 行：导入编辑器布局组件。

第 34 行：导入 `getActiveCore`，用于获取当前安装的编辑器 core。

第 35 行：导入全局 appInstance。

第 36 行：导入 `EditorMain`，它是编辑器主类。

第 39 行：定义 `position` 响应式变量，但当前未实际使用。

第 40 行：定义 loading 状态，默认 true。

第 42 行：组件挂载前执行初始化。

第 43 行：把 loading 设为 false。

第 44 行：从 active core 中取出依赖注入服务。

第 45 行：通过服务容器创建 `EditorMain` 实例，并放到全局 `appInstance.editor`。

第 46 行：调用 `startup()` 启动编辑器。

第 47 行：初始化生命周期结束。

第 49 行：组件卸载前执行清理。

第 50 行：调用编辑器 dispose，释放服务、事件、快捷键等资源。

第 51 行：把全局 editor 置空。

第 52 行：卸载生命周期结束。

第 55 行到第 57 行：普通 style 为空。

第 58 行：scoped Less 样式开始。

第 59 行：导入布局变量。

第 60 行到第 62 行：设置编辑器中间区域高度。

第 63 行到第 70 行：设置画布主容器背景、padding、overflow、高度和定位。

第 71 行到第 80 行：定义马赛克透明背景样式，目前作为可选样式。

第 82 行到第 85 行：让最外层占满视口并隐藏滚动。

第 86 行：样式结束。

## 8.7 `src/views/Editor/core/createCore.ts` 逐行解释

第 1 行：导入全局单例服务描述符获取函数。

第 2 行：导入依赖注入服务接口。

第 3 行：导入依赖注入服务实现。

第 4 行：导入服务集合。

第 5 行：导入设置 active core 的方法。

第 6 行：导入 core 类型。

第 7 行：导入 `appInstance`，用于插件注册时访问当前编辑器。

第 9 行：定义创建服务容器的函数。

第 10 行：创建空服务集合。

第 12 行：注释说明下面获取全局单例服务。

第 13 行：遍历所有已注册的单例服务描述符。

第 14 行：把服务 id 和描述符放进服务集合。

第 15 行：遍历结束。

第 17 行：创建 InstantiationService，并开启严格模式。

第 18 行：函数结束。

第 20 行：定义创建 core 的函数。

第 21 行：创建依赖注入服务。

第 22 行：创建 core 对象，并用 `markRaw` 避免 Vue 把它深度响应式化。

第 23 行：定义 Vue 插件安装函数。

第 24 行：保存 Vue app 实例。

第 25 行：设置当前 active core。

第 26 行：install 结束。

第 27 行：定义插件使用函数。

第 28 行：注释说明后续还可以完善插件生命周期。

第 29 行：把插件保存到 core 的插件数组。

第 30 行：如果编辑器已经创建，则立即把插件安装给当前 editor。

第 31 行：返回 this，支持链式调用。

第 32 行：use 结束。

第 33 行：暴露服务容器。

第 34 行：初始化插件数组。

第 35 行：初始化 Vue app 引用为空。

第 36 行：core 对象结束。

第 38 行：返回 core。

第 39 行：函数结束。

## 8.8 `src/views/Editor/app/index.ts` 逐行解释

第 2 行到第 9 行：导入编辑器会暴露给组件使用的服务接口。

第 11 行到第 13 行：定义全局 app 实例类型，目前只包含 `editor`。

第 15 行到第 17 行：创建全局 `appInstance`，初始 editor 是空。

第 19 行：定义 `useEditor` 函数。

第 20 行：如果编辑器还没准备好，进入保护分支。

第 21 行：打印警告。

第 22 行：返回 undefined。

第 24 行：通过编辑器的依赖注入服务执行函数。

第 25 行到第 32 行：从服务容器取出画布、快捷键、撤销恢复、事件总线、工作区服务，并返回给调用方。

第 27 行：`canvas` 和 `editor` 都取 `IMLeaferCanvas`，说明当前核心编辑能力集中在同一个类。

第 34 行：函数结束。

## 8.9 `src/views/Editor/app/editor/editor.ts` 逐行解释

第 1 行到第 21 行：导入编辑器主类需要的模块，包括上下文菜单、图层、依赖注入、服务接口、插件类型、生命周期工具、Vue 类型、异步调度、画布、缩放、工具栏、撤销恢复、剪贴板、跟随按钮。

第 22 行：声明 `EditorMain` 类，继承 `BaseApp`。

第 23 行：声明 `service` 属性，保存当前编辑器自己的服务容器。

第 25 行：创建插件实例 Map，用 Symbol 作为 key。

第 27 行：声明上下文菜单实例。

第 29 行：构造函数接收根依赖注入服务。

第 30 行：调用父类构造逻辑。

第 33 行：定义 `startup`，编辑器启动入口。

第 34 行：用 `scopeRun` 包裹启动逻辑，方便统一管理生命周期资源。

第 35 行：初始化编辑器服务容器。

第 36 行：通过服务容器访问工作区服务。

第 37 行：取出工作区服务。

第 38 行：如果没有任何工作区，创建默认工作区。

第 39 行：添加名为 `1` 的工作区，并设置为当前工作区。

第 40 行到第 41 行：工作区初始化结束。

第 42 行：创建功能模块实例数组。

第 43 行：创建图层模块。

第 44 行：创建工具栏模块。

第 45 行：创建缩放模块。

第 46 行：创建上下文菜单，并保存到 `this.contextMenu`。

第 47 行：创建剪贴板模块。

第 48 行：创建跟随按钮模块。

第 50 行：遍历这些模块。

第 51 行：注册到生命周期管理器，编辑器销毁时会一并 dispose。

第 54 行：注释说明下面是插件载入。

第 55 行：通过 Vue provide 暴露 `useEditor`。

第 56 行：获取当前 active core。

第 57 行：遍历 core 里保存的插件。

第 58 行：安装插件。

第 60 行：scopeRun 结束。

第 63 行：定义 `use(plugin)`。

第 64 行到第 67 行：执行插件函数，把 service 和 use 方法作为上下文传入。

第 69 行：给插件实例生成 Symbol id。

第 70 行：把插件实例保存到 Map。

第 72 行：等浏览器空闲时安装插件。

第 74 行：调用插件的 `setup`。

第 75 行到第 80 行：注册插件销毁逻辑。

第 78 行：调用插件的 `dispose`。

第 79 行：从 Map 删除插件实例。

第 85 行：定义 `initServices`。

第 86 行：创建新的服务集合。

第 88 行：定义内部函数 `define`，用于注册服务。

第 89 行：如果服务集合里没有该服务，才注册。

第 90 行：用 `SyncDescriptor` 包装构造函数，表示同步创建。

第 93 行到第 97 行：注册事件总线、工作区、画布、撤销恢复、快捷键服务。

第 99 行：基于根服务容器创建子容器。子容器会继承根服务，同时拥有编辑器自己的服务。

第 102 行：定义销毁方法。

第 103 行：用 try 捕获销毁异常。

第 104 行：取消 provide 的 useEditor。

第 105 行：调用父类销毁逻辑。

第 106 行到第 111 行：重置快捷键、撤销恢复、工作区、事件总线。

第 112 行：清空 service 引用。

第 113 行到第 115 行：捕获并打印错误。

第 118 行：定义获取插件插槽组件的方法。

第 119 行：创建组件数组。

第 120 行：遍历插件实例。

第 121 行：如果插件没有 slots，跳过。

第 122 行：按插槽名称取插件组件。

第 123 行：如果存在，就追加到返回数组。

第 125 行：返回插件插槽组件数组。

第 127 行：类结束。

## 8.10 `src/views/Editor/core/canvas/mLeaferCanvas.ts` 核心解释

`MLeaferCanvas` 是项目中最重要的类。它是 Vue UI 和 Leafer 画布之间的桥梁。理解这个文件，基本就理解了编辑器如何工作。

它做了这些事：

1. 创建 Leafer `App`。
2. 创建内容层 `contentLayer`。
3. 创建实际海报画板 `contentFrame`。
4. 保存当前选中对象 `activeObject`。
5. 管理多页面 JSON。
6. 监听工作区切换事件。
7. 提供添加、删除、选中、导入 JSON、缩放等方法。
8. 初始化字体。
9. 处理组内拖放。

逐段解释如下：

第 1 行到第 11 行：导入依赖注入装饰器和 Leafer 接口类型。

第 12 行到第 23 行：导入 Leafer 的实际类和事件，例如 `App`、`Frame`、`ChildEvent`、`ResizeEvent`。

第 24 行：导入 Leafer 配置。

第 25 行到第 31 行：导入 Leafer 插件，开启编辑、文本编辑、视口、导出、查找、状态等能力。

第 32 行：导入滚动条插件，但当前没有启用。

第 33 行：导入标尺插件。

第 34 行到第 36 行：导入工作区、事件总线、层级服务。

第 37 行：导入类型判断工具。

第 38 行：导入自定义字体加载方法。

第 39 行：导入 Pinia store。

第 40 行：导入编辑工具类型。

第 41 行：导入数字格式化方法。

第 43 行到第 45 行：导入全局修改 Leafer 数据代理和初始化属性的模块。这类文件导入后会产生副作用。

第 46 行：导入 Leafer 编辑器事件。

第 47 行：导入底层画布名称常量。

第 48 行：导入 uuid。

第 49 行：导入画笔绘制配置类型。

第 52 行到第 56 行：定义扩展配置类型，包括宽高和名称。

第 58 行到第 77 行：定义对象类型联合类型，既包含 Leafer 官方元素，也包含自定义元素。

第 78 行到第 89 行：定义页面 JSON 的基本结构。

第 92 行到第 94 行：定义缩放数据类型。

第 96 行：创建画布服务装饰器 `IMLeaferCanvas`，用于依赖注入。

第 98 行：声明 `MLeaferCanvas` 类。

第 99 行：服务品牌字段，用于类型识别。

第 101 行：当前选中对象，使用 shallowRef 避免深层响应式化复杂 Leafer 对象。

第 103 行：扩展数据，也是 shallowRef。

第 108 行：当前页面 id。

第 113 行：页面 Map。key 是页面 id，value 是该页面 JSON。

第 116 行：画布 DOM 包装元素。

第 119 行：Leafer 主应用实例。

第 121 行：内容层。

第 124 行：标尺对象。

第 127 行：内容画板，也就是用户真正编辑的白色画板。

第 129 行：当前激活工具，例如选择、画笔等。

第 137 行到第 150 行：集中保存响应式状态，包括缩放、子元素列表、标尺开关、画笔配置。

第 152 行：背景色。

第 154 行到第 158 行：构造函数声明依赖工作区、事件总线、层级服务。

第 159 行：创建 Leafer `App`。

第 160 行到第 161 行：设置初始宽高。

第 162 行到第 168 行：配置 Leafer 编辑器选中点、旋转点、虚线框、按钮方向。

第 172 行：把 Leafer canvas 视图保存为 `wrapperEl`，后续 Vue 组件会 append 到 DOM。

第 173 行到第 176 行：创建标尺对象。

第 177 行：取 app 的 tree 作为内容层。

第 178 行：内容层填充透明。

第 184 行到第 185 行：保存内容层和 app。

第 186 行：读取当前工作区 id。

第 187 行：初始化工作区监听。

第 188 行：初始化页面编辑器。

第 189 行：初始化 watch。

第 190 行到第 192 行：初始化字体列表，并添加自定义字体。

第 195 行到第 206 行：监听 Pinia 中的 `activeTool`，当工具不是选择工具时取消当前选中。

第 209 行到第 253 行：初始化工作区和页面数据之间的同步。

第 210 行到第 214 行：为已有工作区创建空页面 JSON。

第 215 行到第 219 行：监听工作区新增后，为新页面创建空 JSON。

第 220 行到第 222 行：监听工作区删除后，从 pages Map 删除对应页面。

第 223 行到第 231 行：切换页面前保存旧页面 JSON，并清空当前画板。

第 232 行到第 243 行：切换页面后恢复新页面 JSON。

第 244 行到第 252 行：刷新当前工作区时重新设置 JSON。

第 256 行到第 308 行：初始化页面编辑器。

第 258 行到第 267 行：创建底层白色 Frame，作为实际海报画板。

第 268 行：把 Frame 加到内容层。

第 269 行：保存 contentFrame。

第 270 行：默认选中底层画板。

第 272 行到第 275 行：监听 Leafer 选择事件，更新 activeObject。

第 277 行到第 285 行：监听子元素添加和移除，更新 childrenEffect。

第 288 行到第 294 行：监听属性变化，如果底层画布位置变化，则发出布局移动事件。

第 296 行到第 307 行：监听 resize，第一次 resize 时让 contentFrame 尺寸适应视口，并执行 zoom fit。

第 311 行到第 319 行：`setPageJSON` 根据页面 id 保存页面 JSON。

第 326 行到第 334 行：`getPageJSON` 获取页面 JSON。如果请求当前页，会用最新 children 覆盖。

第 337 行到第 340 行：`getCurrentPage` 保存当前画布 JSON 并返回当前页。

第 342 行到第 345 行：`getPages` 保存当前页并返回所有页面。

第 347 行到第 359 行：设置当前选中对象。如果对象为空，默认选中 contentFrame。如果是二维码，则锁定比例。

第 361 行到第 363 行：批量设置选中对象。

第 365 行到第 388 行：contentFrame、contentLayer、app 的 getter 和 setter。

第 390 行到第 400 行：对象类型判断辅助方法。

第 406 行到第 413 行：选中对象。只有当前工具是 `select` 时才允许选中。

第 418 行到第 421 行：取消选中对象，并回到选中底层画板。

第 428 行到第 441 行：添加单个元素。组和盒子会绑定拖放；没有 zIndex 时自动放到顶层；添加后选中并刷新 children。

第 446 行到第 449 行：添加多个元素。

第 455 行到第 458 行：重新加载 JSON 并恢复缩放。

第 465 行到第 488 行：导入 JSON 到当前页。它会清空历史内容、设置 JSON、取消选中、切回选择工具、更新 children、自动适配缩放、提取并加载字体。

第 510 行到第 545 行：导入多页面 JSON。它会解析字符串或对象，校验 workspaces 和 pages，清空旧数据，再逐页恢复。

第 547 行到第 553 行：获取当前选中对象列表和单个选中对象。

第 555 行到第 562 行：缩放方法，包括指定缩放和适配缩放。

第 564 行到第 579 行：children 的 getter/setter，用于当前工作区页面数据。

第 584 行到第 587 行：`childrenEffect` 手动刷新响应式 children 列表。

第 590 行到第 600 行：设置和读取缩放。

第 607 行到第 610 行：按 id 查找对象。

第 617 行到第 622 行：按 id 数组查找多个对象。

第 628 行到第 645 行：给组绑定拖入、放置、拖出逻辑，实现组内容器效果。

## 8.11 `src/views/Editor/core/workspaces/workspacesService.ts` 逐行解释

第 1 行：导入依赖注入装饰器。

第 2 行：导入事件总线。

第 3 行：导入生命周期基类。

第 4 行：导入 uuid。

第 6 行：创建工作区服务标识。

第 8 行：定义工作区类型，包含 id、name、cover。

第 10 行：声明工作区服务类，继承 Disposable。

第 13 行：保存工作区数组。

第 15 行：保存当前工作区 id。

第 17 行：构造函数注入事件总线。

第 21 行到第 23 行：返回当前工作区 id。

第 25 行到第 31 行：重新加载当前 JSON，本质是发刷新事件。

第 33 行到第 42 行：切换当前工作区。切换前发事件，更新 id 后再发事件。

第 44 行到第 46 行：返回全部工作区。

第 48 行到第 52 行：修改工作区名称。

第 54 行到第 56 行：按 id 查找工作区。

第 58 行到第 70 行：添加工作区。没有 id 时生成 uuid，并发添加前后事件。

第 72 行到第 85 行：删除工作区。删除后如果删的是当前页，会尝试切换到后一个或前一个工作区。

第 86 行到第 93 行：删除所有工作区，并发删除事件。

第 95 行到第 97 行：返回工作区数量。

第 99 行到第 106 行：清空工作区和 currentId。

第 108 行到第 111 行：销毁服务时调用父类 dispose 并清空数据。

## 8.12 `src/views/Editor/core/eventbus/eventbusService.ts` 逐行解释

第 1 行：导入依赖注入装饰器。

第 2 行：导入单例注册工具。

第 3 行：导入 Mitt 事件总线实现。

第 4 行：导入 Leafer 事件类型。

第 6 行到第 9 行：定义工作区切换事件参数。

第 11 行到第 24 行：定义所有事件名称和事件参数类型。

第 12 行：撤销恢复栈变化事件。

第 13 行：图层重命名事件。

第 14 行：边缘移动状态事件。

第 15 行到第 21 行：工作区切换、新增、删除事件。

第 22 行：基础画布移动事件。

第 23 行：基础画布 resize 事件。

第 26 行：事件总线服务继承 Mitt。

第 28 行：创建事件总线服务标识。

第 30 行：注册事件总线单例。注意这里注册的是 `Mitt`，但类型使用 `EventbusService`，这说明实现上有一定宽松性。

## 8.13 `src/store/modules/app/app.ts` 逐行解释

第 1 行：导入编辑工具类型。

第 3 行：定义 Pinia store，名字是 `app`。

第 4 行：定义当前激活工具，默认是 `select`。

第 6 行到第 9 行：返回可被组件和服务使用的状态。

## 8.14 `src/store/modules/font/font.ts` 逐行解释

第 1 行：导入获取字体列表的 API。

第 2 行：导入 Arco 消息和通知组件。

第 3 行：导入字体加载观察器。

第 5 行到第 18 行：定义默认字体列表。

第 20 行到第 26 行：定义模板节点类型，用于遍历模板 JSON。

第 27 行到第 30 行：定义模板字体提取结果，包括普通文本字体和富文本字体。

第 32 行到第 33 行：定义 localStorage key。

第 34 行：定义字体 store。

第 35 行：保存字体列表。

第 38 行：保存跳过加载的默认字体名称。

第 44 行到第 60 行：初始化字体。优先读 localStorage，没有缓存再调用接口。

第 66 行到第 100 行：从模板 JSON 中提取字体。普通 Text 看 `fontFamily`，HTMLText 用正则从 `font-family` CSS 中提取。

第 102 行到第 171 行：加载字体，并用 Arco 消息显示进度。

第 118 行到第 151 行：内部 `loadFont` 函数，负责单个字体加载。

第 153 行到第 160 行：按批次控制并发加载。

第 162 行到第 170 行：关闭通知并提示最终结果。

第 173 行到第 179 行：暴露状态和方法。

## 8.15 `src/utils/request.ts` 逐行解释

第 1 行：导入 axios。

第 2 行：导入 axios 类型。

第 3 行：导入 Arco 消息提示。

第 4 行：导入路由相关函数和类型。

第 6 行：调用 `useRouter()` 获取 router。严格来说，这种在组件外直接调用 composition API 的写法需要谨慎。

第 8 行到第 11 行：如果环境变量配置了接口地址，就设置 axios baseURL 和超时时间。

第 14 行到第 33 行：注册请求拦截器。目前没有真正加 token，只是预留了注释。

第 35 行到第 41 行：定义统一 HTTP 响应结构。

第 44 行到第 81 行：注册响应拦截器。

第 48 行到第 53 行：如果是 blob 或 arraybuffer，直接返回原 response。

第 56 行到第 59 行：如果后端返回 success 为 true，直接返回业务数据。

第 61 行到第 64 行：失败时弹出错误提示。

第 66 行到第 69 行：如果状态码是 401，跳转登录页。

第 70 行：返回 rejected promise。

第 72 行到第 80 行：处理网络错误并弹出提示。

## 8.16 `src/utils/psd/index.ts` 逐行解释

第 1 行：从 `ag-psd` 导入 Layer、Psd、readPsd。

第 3 行到第 6 行：定义 PSD 解析结果，包含原始 psd 和图层数组。

第 7 行到第 11 行：注释说明函数用途和参数。

第 13 行：定义异步函数 `parsePsdFile`，接收文件和进度回调。

第 14 行：返回 Promise，因为 FileReader 是异步的。

第 15 行：创建 FileReader。

第 17 行：定义读取完成后的回调。

第 18 行：拿到读取结果。

第 19 行：开始 try。

第 21 行：调用 `readPsd` 解析 ArrayBuffer。

第 22 行：调用进度回调。

第 24 行：读取 psd 的 children 作为图层列表。

第 25 行：resolve 解析结果。

第 26 行到第 35 行：捕获解析错误。

第 29 行到第 30 行：如果是 CMYK 色彩模式，返回中文提示。

第 32 行到第 33 行：其他错误直接返回错误信息。

第 37 行：以 ArrayBuffer 方式读取文件。

第 38 行到第 39 行：Promise 和函数结束。

## 8.17 `src/utils/psd/parser/text.ts` 设计解释

这个文件负责把 PSD 的文字图层转换成 Leafer 可显示的文字对象。它区分两类文字：

1. 简单文字：转换成 Leafer `Text`。
2. 富文本：转换成 `HTMLText`。

核心函数是 `parseText(layer, options)`。如果 PSD 图层里有 `styleRuns`，说明文字不同片段可能有不同样式，于是走富文本解析；否则走普通文本解析。

`parseSimpleText` 会设置：

1. 通用位置和尺寸。
2. 填充颜色。
3. 文本内容。
4. 宽高。
5. 字体。
6. 字号。
7. 字间距。
8. 下划线或删除线。
9. 行高。
10. 段落对齐。
11. 描边和填充效果。

`parseStyledText` 会把不同样式片段拼成 `<span style="...">...</span>`，再放进 `HTMLText`。

该文件体现的思想是“格式转换”：PSD 和 Leafer 是两个不同的数据体系，中间需要一个 parser 把 Photoshop 的图层属性转成浏览器画布编辑器能理解的属性。

## 8.18 `src/views/Editor/layouts/canvasEdit/canvasEdit.vue` 逐行解释

第 1 行：模板开始。

第 2 行：外层设计区域，ref 是 `designRef`，class 是 `page-design`。

第 3 行：画布容器 div，ref 是 `divRef`。

第 4 行到第 5 行：模板结束。

第 6 行：脚本开始。

第 7 行：导入 `useEditor`。

第 8 行：导入 VueUse 的 resize observer。

第 10 行：导出组件。

第 11 行：setup 函数开始。

第 12 行：创建 divRef。

第 14 行：组件挂载后执行。

第 15 行：从编辑器获取 canvas 服务。

第 16 行：把 canvas.wrapperEl 追加到 divRef。这里是 Vue 和 Leafer 画布真正连接的地方。

第 17 行到第 20 行：注释说明 Firefox display none 问题。

第 21 行：强制 canvas DOM display 为 block。

第 22 行：监听容器尺寸变化。

第 23 行：取第一个 resize entry。

第 24 行：读取容器宽高。

第 25 行：调用 Leafer app resize，让画布尺寸跟随容器。

第 28 行：返回 divRef 给模板使用。

第 32 行到第 59 行：样式部分，主要让画布容器占满宽度、高度固定、隐藏溢出、设置浅色背景。

## 8.19 `src/views/Editor/layouts/panel/leftPanel/wrap/TextListWrap.vue` 逐行解释

第 1 行到第 42 行：模板部分。上方显示两个基础文本按钮，下方显示接口返回的文本素材列表。

第 5 行：遍历 `basicTextList`。

第 8 行到第 11 行：根据文本配置设置字号和字重。

第 13 行：点击时调用 `handleClick(item)`。

第 18 行到第 23 行：渲染 `CompList2Wrap`，用于展示更多文本素材。

第 44 行：script setup 开始。

第 45 行：导入 Leafer 的 Group 和 Text。

第 46 行：导入 `useEditor`。

第 47 行：导入默认命名工具。

第 48 行：导入列表组件。

第 49 行：导入懒加载图片组件，但当前模板注释中才用到。

第 50 行：导入查询文本素材接口。

第 51 行：导入分页 mixin。

第 52 行：导入自定义 HTMLText。

第 53 行：导入分类组件，但当前未使用。

第 54 行：导入文本列表类型。

第 56 行：从 useEditor 中取出 editor。

第 57 行：定义组件名称常量。

第 58 行到第 75 行：定义瀑布流配置，但当前注释中的旧组件才使用。

第 76 行到第 95 行：定义基础文本列表，一个普通 Text，一个 HTMLText。

第 96 行：定义点击处理函数。

第 99 行：判断 item.json 是否是 Text。

第 100 行到第 113 行：创建 Leafer Text 对象，设置名称、可编辑、位置、填充和传入 JSON 属性。

第 114 行：判断是否是 HTMLText。

第 115 行到第 121 行：创建 HTMLText 对象。

第 122 行到第 124 行：其他类型用 Group 包裹。

第 126 行：打印创建出的文本对象。

第 127 行：调用 editor.add(text)，把对象加入画布。

第 129 行：创建分页状态。

第 130 行：设置每页 30 条。

第 131 行到第 153 行：定义获取素材数据的方法。

第 132 行：调用文本素材接口。

第 133 行：接口成功后处理。

第 134 行：取 records。

第 136 行：追加到 dataList。

第 137 行：页码加一。

第 139 行到第 143 行：根据总数判断是否还有更多。

第 156 行到第 184 行：样式部分，设置基础文本按钮的间距、背景、鼠标手势等。

## 9. 其他文件如何协作

### 9.1 API 和 Mock

`src/api/editor` 下的文件负责把业务请求封装成函数，例如获取字体、素材、上传文件。`src/mock` 下模拟这些接口，使开发环境不依赖真实后端。

协作方式：

```text
Vue 组件
  -> 调用 api/editor/*.ts
  -> axios request.ts 拦截器处理
  -> 开发环境 mock 返回数据
  -> 组件更新列表或画布
```

### 9.2 右侧属性面板

右侧属性面板会读取 `editor.activeObject`。当画布选中对象变化，`MLeaferCanvas.setActiveObjectValue` 更新 shallowRef，属性面板就可以根据对象类型显示不同表单。

例如：

1. 选中 Text，显示 `textAttr.vue`。
2. 选中 Group，显示 `groupAttr.vue`。
3. 选中底层画布，显示 `canvasAttr.vue`。
4. 选中二维码，显示 `qrcodeAttr.vue`。

### 9.3 图层面板

图层面板依赖 `canvas.ref._children`。当添加、删除、导入 JSON 后，`childrenEffect()` 会刷新这个数组。图层面板根据它渲染图层树。

### 9.4 自定义图形

`src/views/Editor/core/shapes` 中的文件封装自定义元素。

| 文件 | 作用 |
| --- | --- |
| `QrCode.ts` | 二维码元素 |
| `BarCode.ts` | 条形码元素 |
| `Image2.ts` | 自定义图片元素 |
| `HTMLText2.ts` | 自定义富文本元素 |

这些文件让项目不局限于 Leafer 官方基础对象，而能扩展业务元素。

### 9.5 工具函数

`src/utils` 是基础工具层，常见类别包括：

1. `math.ts`：数字处理。
2. `dom.ts`：DOM 工具。
3. `designUtil.ts`：设计器业务工具。
4. `fonts/utils.ts`：字体样式注入。
5. `psd`：PSD 解析。
6. `request.ts`：请求拦截。

## 10. 新手阅读路线

建议按下面顺序学习：

1. 先跑起来项目，访问 `/#/editor`。
2. 看 `src/main.ts`，理解 Vue 应用如何启动。
3. 看 `src/router/index.ts`，理解页面如何切换。
4. 看 `src/views/Editor/editor.vue`，理解编辑器页面布局。
5. 看 `canvasEdit.vue`，理解画布 DOM 如何挂载。
6. 看 `createCore.ts` 和 `app/index.ts`，理解编辑器 core 和 useEditor。
7. 看 `EditorMain`，理解服务如何初始化。
8. 看 `MLeaferCanvas`，理解真正的画布操作。
9. 看左侧任意素材组件，例如 `TextListWrap.vue`，理解 UI 如何调用画布服务。
10. 看右侧属性面板，理解选中对象如何驱动属性编辑。
11. 看 `WorkspacesService`，理解多页面。
12. 看 `psd` 目录，理解 PSD 导入。

## 11. 常见概念解释

### 11.1 什么是 contentLayer

`contentLayer` 是 Leafer app 的 tree。可以理解为画布应用的根内容层。

### 11.2 什么是 contentFrame

`contentFrame` 是真正的海报画板。用户添加的文字、图片、图形都放在它里面。

### 11.3 为什么用 shallowRef

Leafer 对象很复杂，里面有大量属性、循环引用和方法。如果用普通 `ref` 深度响应式化，性能和行为都会变复杂。`shallowRef` 只让外层引用响应式，适合保存复杂实例。

### 11.4 为什么导入文件有副作用

例如：

```ts
import './proxyData'
import './initAttr'
```

这些文件可能不是为了导出函数，而是执行一次全局扩展或重写逻辑。导入即生效。

### 11.5 为什么很多 API 没有 import ref

因为 `vite.config.ts` 配置了 `unplugin-auto-import`，会自动导入 Vue、Vue Router、Pinia、VueUse 的常用 API。

## 12. 项目优点

1. 编辑器核心和 Vue UI 有明显分层。
2. 使用依赖注入管理服务，适合复杂编辑器。
3. 使用事件总线降低服务之间耦合。
4. 画布能力集中在 `MLeaferCanvas`，便于统一维护。
5. 支持插件扩展。
6. 支持多页面和 JSON 导入导出。
7. PSD 解析模块单独拆分，方向清晰。

## 13. 新手容易踩的坑

1. 不要直接在所有组件里 new Leafer App，项目只有一个主画布服务。
2. 不要把 Leafer 对象深度放进 Pinia。
3. 不要绕过 `editor.add` 直接操作 contentFrame，除非你知道不会影响图层和选中状态。
4. 修改页面切换逻辑时要同时考虑 `workspaceChangeBefore` 和 `workspaceChangeAfter`。
5. 修改字体逻辑时要考虑 HTMLText 和普通 Text 两种来源。
6. 修改 PSD 解析时要记住 Photoshop 图层属性和 Leafer 属性并不是一一对应。
7. 修改请求封装时要注意 blob 和 arraybuffer 不能走普通业务响应逻辑。

## 14. 架构图

同目录下提供了 HTML 版架构图：`docs/PROJECT_ARCHITECTURE.html`。

## 15. 全量逐行解释扩展索引

如果要继续扩展到真正“每个文件每行代码解释”，建议拆成下面几卷：

1. 第一卷：工程入口和构建配置，包括 `package.json`、`vite.config.ts`、`tsconfig.json`、`uno.config.ts`、`main.ts`、`App.vue`、`router`。
2. 第二卷：编辑器核心，包括 `core/instantiation`、`core/createCore.ts`、`core/root.ts`、`core/types.ts`。
3. 第三卷：画布服务，包括 `MLeaferCanvas`、`initAttr`、`proxyData`、`penDraw`。
4. 第四卷：应用服务，包括 `EditorMain`、`Layer`、`Zoom`、`ToolBar`、`Clipboard`、`ContextMenu`、`FollowButton`。
5. 第五卷：布局组件，包括 header、leftPanel、rightPanel、footer、canvasEdit。
6. 第六卷：属性面板，包括 textAttr、fillAttr、strokeAttr、shadowAttr、canvasAttr 等。
7. 第七卷：PSD 解析，包括 common、group、image、mask、text。
8. 第八卷：通用组件，包括颜色选择器、树组件、右键菜单、瀑布流、上传组件。
9. 第九卷：API、Mock、Store、Hooks、Utils。
10. 第十卷：资源文件和素材 JSON 的数据结构说明。

## 16. 总结

Gzm Design 的本质是一个“Vue 组件驱动的 Leafer 画布编辑器”。Vue 负责交互界面，Leafer 负责画布渲染，Core/App 服务层负责把二者组织起来。理解这个项目的关键不是背每个组件，而是抓住几个中心点：

1. `main.ts` 负责装配应用。
2. `createCore.ts` 创建编辑器核心。
3. `EditorMain` 管理编辑器生命周期和服务。
4. `MLeaferCanvas` 封装所有画布操作。
5. `useEditor()` 是 Vue 组件访问编辑器能力的统一入口。
6. `WorkspacesService` 和 `EventbusService` 支撑多页面切换。
7. `PSD parser` 把外部设计文件转换成内部画布对象。

只要你按这些主线阅读，再回头看具体组件，就不会迷失在大量文件中。

## 17. 逐行解释对应源码附录

前面的逐行解释已经按文件说明了每一行的作用，但为了方便新手对照阅读，这里把重点文件源码附在下面。建议阅读方式是：先看代码块，再回到上面的逐行解释逐行对照。

### 17.1 `package.json` 对照源码

```json
{
  "name": "gzm-design",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@leafer-in/arrow": "^2.0.0",
    "@leafer-in/editor": "^2.0.0",
    "@leafer-in/flow": "^2.0.0",
    "@leafer-in/html": "^2.0.0",
    "@leafer-in/scroll": "^2.0.0",
    "@leafer-in/state": "^2.0.0",
    "@leafer-in/text-editor": "^2.0.0",
    "@leafer-in/view": "^2.0.0",
    "@leafer-ui/core": "^2.0.0",
    "@leafer-in/resize": "^2.0.0",
    "@leafer-in/viewport": "^2.0.0",
    "@leafer-ui/interface": "^2.0.0",
    "@leafer-in/find": "^2.0.0",
    "@leafer-in/export": "^2.0.0",
    "@tinymce/tinymce-vue": "^5.1.1",
    "@unocss/reset": "^0.57.7",
    "@vueuse/core": "^10.11.1",
    "ag-psd": "^20.2.3",
    "axios": "^1.13.3",
    "convert-units": "3.0.0-beta.6",
    "fontfaceobserver": "^2.3.0",
    "jsbarcode": "^3.12.3",
    "leafer-ui": "^2.0.0",
    "leafer-x-ruler": "^1.0.14",
    "lodash": "^4.17.23",
    "mousetrap": "^1.6.5",
    "number-precision": "^1.6.0",
    "pinia": "^2.3.1",
    "qrcode": "^1.5.4",
    "tinycolor2": "^1.6.0",
    "tinymce": "^6.8.6",
    "uuid": "^9.0.1",
    "vue": "^3.5.27",
    "vue-router": "^4.6.4"
  },
  "devDependencies": {
    "@arco-design/web-vue": "^2.57.0",
    "@types/fontfaceobserver": "^2.1.3",
    "@types/lodash": "^4.17.23",
    "@types/mockjs": "^1.0.10",
    "@types/mousetrap": "^1.6.15",
    "@types/node": "^20.19.30",
    "@types/qrcode": "^1.5.6",
    "@types/tinycolor2": "^1.4.6",
    "@types/uuid": "^9.0.8",
    "@vitejs/plugin-vue": "^4.6.2",
    "less": "^4.5.1",
    "mockjs": "^1.1.0",
    "typescript": "^5.9.3",
    "unocss": "^0.53.6",
    "unplugin-auto-import": "^0.16.7",
    "unplugin-vue-components": "^0.25.2",
    "vite": "^4.5.14",
    "vite-plugin-svg-icons": "^2.0.1",
    "vue-tsc": "^1.8.27"
  }
}
```

### 17.2 `vite.config.ts` 对照源码

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { resolve } from 'path'

const config=({mode})=>{
    return{
        plugins: [
            vue(),
            AutoImport({
                resolvers: [
                    ArcoResolver({
                    }),
                ],
                imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
                eslintrc: {
                    enabled: true,
                },
            }),
            Components({
                directoryAsNamespace: true,
                resolvers: [
                    ArcoResolver({
                        resolveIcons: true,
                    }),
                ],
            }),
            UnoCSS(),
            createSvgIconsPlugin({
                iconDirs: [resolve(process.cwd(), 'src/assets/icons')],
                symbolId: 'icon-[dir]-[name]',
            }),
        ],
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
            },
        },
    }
}
export default defineConfig(config)
```

### 17.3 `src/main.ts` 对照源码

```ts
import {createApp} from 'vue'

import App from './App.vue'
import router from '@/router'
import pinia from '@/store'
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import '@unocss/reset/tailwind-compat.css'
import 'virtual:uno.css'
import 'virtual:svg-icons-register'
import './style.less'
import './mock';
import '@/utils/request';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import IconFontPlugin from './plugins/iconFontPlugin';

import {createCore} from '@/views/Editor/core'
const core = createCore()
import { myPlugin } from '@/views/testPlugin'
core.use(myPlugin)
const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(ArcoVue);
app.use(core)
app.use(ArcoVueIcon);
app.use(IconFontPlugin);
app.mount('#app')
```

### 17.4 `src/App.vue` 对照源码

```vue
<script setup lang="ts">
</script>

<template>
    <a-config-provider>
        <router-view v-slot="{ Component }">
            <component :is="Component" />
        </router-view>
    </a-config-provider>
</template>

<style scoped>

</style>
```

### 17.5 `src/router/index.ts` 对照源码

```ts
import { createRouter, createWebHashHistory } from 'vue-router'

import Editor from '@/views/Editor/editor.vue'
import PsParser from '@/views/PsParser/index.vue'
import CusComponents from '@/views/CusComponents/index.vue'
import Home from '@/views/Home/home.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/editor',
      name: 'Editor',
      component: Editor,
    },
    {
      path: '/psParser',
      name: 'PsParser',
      component: PsParser,
    },
    {
      path: '/components',
      name: 'CusComponents',
      component: CusComponents,
    },
  ],
})

export default router
```

### 17.6 `src/views/Editor/editor.vue` 对照源码

```vue
<template>
    <div class="layout-box">
        <a-spin :loading="loading" tip="正在初始化" style="height: 100%;width: 100%">
            <a-layout style="height: 100%">
                <a-layout-header>
                    <headerBar/>
                </a-layout-header>
                <a-layout>
                    <leftPanel/>
                    <a-layout-content >
                        <a-layout class="editor-box">
                            <a-layout-content class="dea-main-container" >
                                <div style="background-color: #fff">
                                    <canvas-edit/>
                                </div>
                            </a-layout-content>
                            <footerBar/>
                        </a-layout>
                    </a-layout-content>
                    <rightPanel/>
                </a-layout>
            </a-layout>
        </a-spin>
    </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/views/Editor/layouts/header/headerBar.vue'
import LeftPanel from '@/views/Editor/layouts/panel/leftPanel'
import RightPanel from '@/views/Editor/layouts/panel/rightPanel'
import FooterBar from '@/views/Editor/layouts/footer/footerBar.vue'
import CanvasEdit from "@/views/Editor/layouts/canvasEdit/canvasEdit.vue";
import {getActiveCore} from '@/views/Editor/core'
import {appInstance} from '@/views/Editor/app'
import {EditorMain} from '@/views/Editor/app/editor'

const position = ref('1')
const loading = ref(true)

onBeforeMount(() => {
    loading.value = false
    const { service } = getActiveCore()
    appInstance.editor = service.createInstance(EditorMain)
    appInstance.editor.startup()
})

onBeforeUnmount(() => {
    appInstance.editor.dispose()
    appInstance.editor = null!
})
</script>

<style lang="less" scoped>
@import "./styles/layouts";
.editor-box{
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
.dea-main-container-wrap{
    --offsetX: 0px;
    --offsetY: 0px;
    --size: 14px;
    --color: #dedcdc;
    background-image: linear-gradient(45deg,var(--color) 25%,transparent 0,transparent 75%,var(--color) 0),linear-gradient(45deg,var(--color) 25%,transparent 0,transparent 75%,var(--color) 0);
    background-position: var(--offsetX) var(--offsetY),calc(var(--size) + var(--offsetX)) calc(var(--size) + var(--offsetY));
    background-size: calc(var(--size) * 2) calc(var(--size) * 2);
}
.layout-box {
    height: 100vh;
    overflow: hidden;
}
</style>
```

### 17.7 `src/views/Editor/core/createCore.ts` 对照源码

```ts
import { getSingletonServiceDescriptors } from '@/views/Editor/core/instantiation/extensions'
import { IInstantiationService } from '@/views/Editor/core/instantiation/instantiation'
import { InstantiationService } from '@/views/Editor/core/instantiation/instantiationService'
import { ServiceCollection } from '@/views/Editor/core/instantiation/serviceCollection'
import { setActiveCore } from '@/views/Editor/core/root'
import { ICore } from '@/views/Editor/core/types'
import { appInstance } from '@/views/Editor/app'

const createServices = (): IInstantiationService => {
  const services = new ServiceCollection()

  for (const [id, descriptor] of getSingletonServiceDescriptors()) {
    services.set(id, descriptor)
  }

  return new InstantiationService(services, true)
}

export const createCore = (): ICore => {
  const service = createServices()
  const core: ICore = markRaw({
    install(vueApp) {
      this._a = vueApp
      setActiveCore(core)
    },
    use(plugin) {
      this._p.push(plugin)
      appInstance.editor?.use(plugin)
      return this
    },
    service,
    _p: [],
    _a: null,
  })

  return core
}
```

### 17.8 `src/views/Editor/app/index.ts` 对照源码

```ts
import { IEditorUndoRedoService } from '@/views/Editor/app/editor/undoRedo/undoRedoService'
import { IKeybindingService } from '@/views/Editor/core/keybinding/keybindingService'
import { EditorMain } from '@/views/Editor/app/editor'
import {IMLeaferCanvas} from "@/views/Editor/core/canvas/mLeaferCanvas";
import {IWorkspacesService} from "@/views/Editor/core/workspaces/workspacesService";
import {IEventbusService} from "@/views/Editor/core/eventbus/eventbusService";

export interface ICoreApp {
  editor: EditorMain
}

export const appInstance: ICoreApp = {
  editor: null!,
}

export const useEditor = () => {
  if (!appInstance.editor) {
    console.warn('app is not ready')
    return undefined!
  }
  return appInstance.editor.service.invokeFunction((accessor) => {
    return {
      editor: accessor.get(IMLeaferCanvas),
      canvas: accessor.get(IMLeaferCanvas),
      keybinding: accessor.get(IKeybindingService),
      undoRedo: accessor.get(IEditorUndoRedoService),
      event: accessor.get(IEventbusService),
      workspaces: accessor.get(IWorkspacesService),
    }
  })
}
```

### 17.9 `src/views/Editor/app/editor/editor.ts` 对照源码

```ts
import {ContextMenu} from '@/views/Editor/app/editor/contextMenu'
import {Layer} from '@/views/Editor/app/editor/layer'
import {SyncDescriptor} from '@/views/Editor/core/instantiation/descriptors'
import {IInstantiationService, ServiceIdentifier} from '@/views/Editor/core/instantiation/instantiation'
import {ServiceCollection} from '@/views/Editor/core/instantiation/serviceCollection'
import {EditorPlugin, IEditorPluginContext, getActiveCore} from '@/views/Editor/core'
import {IKeybindingService, KeybindingService} from '@/views/Editor/core/keybinding/keybindingService'
import {IWorkspacesService, WorkspacesService} from '@/views/Editor/core/workspaces/workspacesService'
import {IEventbusService, EventbusService} from '@/views/Editor/core/eventbus/eventbusService'
import {BaseApp} from '@/views/Editor/app/baseApp'
import {UsableSolts} from '@/views/Editor/core/types'
import {toDisposable} from '@/views/Editor/utils/lifecycle'
import type {DefineComponent} from 'vue'
import {useEditor} from '@/views/Editor/app'
import {runWhenIdle} from '@/views/Editor/utils/async'
import {IMLeaferCanvas, MLeaferCanvas} from "@/views/Editor/core/canvas/mLeaferCanvas";
import {Zoom} from "@/views/Editor/app/editor/zoom";
import {ToolBar} from "@/views/Editor/app/editor/toolBar";
import { IEditorUndoRedoService, EditorUndoRedoService } from '@/views/Editor/app/editor/undoRedo/undoRedoService'
import { Clipboard } from '@/views/Editor/app/editor/clipboard'
import { FollowButton } from '@/views/Editor/app/editor/followButton'

export class EditorMain extends BaseApp {
    public service!: IInstantiationService
    private readonly pluginInstance = new Map<Symbol, IEditorPluginContext>()
    public contextMenu: ContextMenu | undefined

    constructor(@IInstantiationService private readonly instantiationService: IInstantiationService) {
        super()
    }

    public startup() {
        super.scopeRun(() => {
            this.service = this.initServices()
            this.service.invokeFunction((accessor) => {
                const workspacesService = accessor.get(IWorkspacesService)
                if (workspacesService.size() === 0) {
                    workspacesService.setCurrentId(workspacesService.add('1'))
                }
            })
            const instances = [
                this.service.createInstance(Layer),
                this.service.createInstance(ToolBar),
                this.service.createInstance(Zoom),
                (this.contextMenu = this.service.createInstance(ContextMenu)),
                this.service.createInstance(Clipboard),
                this.service.createInstance(FollowButton),
            ]
            instances.forEach((instance) => {
                this._register(instance)
            })

            provide('useEditor', useEditor)
            const core = getActiveCore()
            core._p.forEach((plugin) => {
                this.use(plugin)
            })
        })
    }

    public use(plugin: EditorPlugin) {
        const instance = plugin({
            service: this.service,
            use: this.use,
        }) as IEditorPluginContext
        instance._id = Symbol()
        this.pluginInstance.set(instance._id, instance)
        runWhenIdle(() => {
            instance.setup?.()
            this._register(
                toDisposable(() => {
                    instance.dispose?.()
                    this.pluginInstance.delete(instance._id)
                }),
            )
        })
    }

    private initServices() {
        const services = new ServiceCollection()

        const define = <T>(id: ServiceIdentifier<T>, ctor: new (...args: any[]) => T) => {
            if (!services.has(id)) {
                services.set(id, new SyncDescriptor(ctor))
            }
        }
        define(IEventbusService, EventbusService)
        define(IWorkspacesService, WorkspacesService)
        define(IMLeaferCanvas, MLeaferCanvas)
        define(IEditorUndoRedoService, EditorUndoRedoService)
        define(IKeybindingService, KeybindingService)

        return this.instantiationService.createChild(services)
    }

    public dispose() {
        try {
            provide('useEditor', undefined)
            super.dispose()
            this.service.invokeFunction((accessor) => {
                accessor.get(IKeybindingService).reset()
                accessor.get(IEditorUndoRedoService).reset()
                accessor.get(IWorkspacesService).dispose()
                accessor.get(IEventbusService).all.clear()
            })
            this.service = undefined!
        } catch (_e) {
            console.error(_e)
        }
    }

    public getPluginSlots(name: UsableSolts) {
        const pluginSlots: DefineComponent<{}, {}, any>[] = []
        this.pluginInstance.forEach((plugin) => {
            if (!plugin.slots) return
            const slots = plugin.slots[name]
            slots && pluginSlots.push(...slots)
        })
        return pluginSlots
    }
}
```

### 17.10 `src/views/Editor/core/workspaces/workspacesService.ts` 对照源码

```ts
import { createDecorator } from '@/views/Editor/core/instantiation/instantiation'
import { EventbusService, IEventbusService } from '@/views/Editor/core/eventbus/eventbusService'
import { Disposable } from '@/views/Editor/utils/lifecycle'
import {v4 as uuidv4 } from 'uuid'

export const IWorkspacesService = createDecorator<WorkspacesService>('workspacesService')

export type IWorkspace = { id: string; name: string,cover?:string }

export class WorkspacesService extends Disposable {
  declare readonly _serviceBrand: undefined
  private workspaces: IWorkspace[] = []
  private currentId = ''

  constructor(@IEventbusService private readonly eventbus: EventbusService) {
    super()
  }

  public getCurrentId(): string {
    return this.currentId
  }

  public reloadJSON(): void {
    const param = {
      oldId: this.currentId,
      newId: this.currentId,
    }
    this.eventbus.emit('workspaceChangeRefresh', param)
  }

  public setCurrentId(workspaceId: string): void {
    if (!this.get(workspaceId) || this.currentId === workspaceId) return
    const param = {
      oldId: this.currentId,
      newId: workspaceId,
    }
    this.eventbus.emit('workspaceChangeBefore', param)
    this.currentId = workspaceId
    this.eventbus.emit('workspaceChangeAfter', param)
  }

  public all(): IWorkspace[] {
    return this.workspaces
  }

  public set(workspaceId: string, name: string) {
    const workspace = this.get(workspaceId)
    if (!workspace || workspace.name === name) return
    workspace.name = name
  }

  public get(workspaceId: string) {
    return this.workspaces.find((workspace) => workspace.id === workspaceId)
  }

  public add(name: string, id?: string): string {
    if (!id) {
      id = uuidv4()
    }
    let param = {
      oldId: this.currentId,
      newId: id,
    }
    this.eventbus.emit('workspaceAddBefore', param)
    this.workspaces.push({ id, name })
    this.eventbus.emit('workspaceAddAfter', param)
    return id
  }

  public remove(workspaceId: string) {
    if (!this.get(workspaceId)) return
    this.eventbus.emit('workspaceRemoveBefore', workspaceId)
    const index = this.workspaces.findIndex((workspace) => workspace.id === workspaceId)
    this.workspaces.splice(index, 1)
    this.eventbus.emit('workspaceRemoveAfter', workspaceId)
    if (workspaceId === this.currentId) {
      if (this.workspaces[index]) {
        this.setCurrentId(this.workspaces[index].id)
      } else if (this.workspaces[index - 1]) {
        this.setCurrentId(this.workspaces[index - 1].id)
      }
    }
  }

  public removeAll() {
    this.all().forEach(value => {
      this.eventbus.emit('workspaceRemoveBefore', value.id)
      const index = this.workspaces.findIndex((workspace) => workspace.id === value.id)
      this.workspaces.splice(index, 1)
      this.eventbus.emit('workspaceRemoveAfter', value.id)
    })
  }

  public size(): number {
    return this.workspaces.length
  }

  public clear() {
    this.workspaces = []
    this.currentId = ''
  }

  public dispose() {
    super.dispose()
    this.clear()
  }
}
```

### 17.11 `src/views/Editor/core/eventbus/eventbusService.ts` 对照源码

```ts
import {createDecorator} from '@/views/Editor/core/instantiation/instantiation'
import {InstantiationType, registerSingleton} from '@/views/Editor/core/instantiation/extensions'
import {Mitt} from './mitt'
import {PropertyEvent, ResizeEvent} from "leafer-ui";

type WworkspaceParam = {
  oldId: string | undefined
  newId: string
}

export type Events = {
  undoRedoStackChange: undefined
  layerRename: { id: string | number }
  setEdgeMoveStatus: boolean
  workspaceChangeBefore: WworkspaceParam
  workspaceChangeAfter: WworkspaceParam
  workspaceChangeRefresh: WworkspaceParam
  workspaceAddBefore: WworkspaceParam
  workspaceAddAfter: WworkspaceParam
  workspaceRemoveBefore: string
  workspaceRemoveAfter: string
  layoutMoveEvent: PropertyEvent
  layoutResizeEvent: ResizeEvent
}

export class EventbusService extends Mitt<Events> {}

export const IEventbusService = createDecorator<EventbusService>('eventbusService')

registerSingleton(IEventbusService, Mitt, InstantiationType.Eager)
```

### 17.12 `src/store/modules/app/app.ts` 对照源码

```ts
import type { EditTool } from 'app'

export const useAppStore = defineStore('app', () => {
  const activeTool = ref<EditTool>('select')

  return {
    activeTool,
  }
})
```

### 17.13 `src/utils/psd/index.ts` 对照源码

```ts
import {Layer, Psd, readPsd} from "ag-psd";

export interface PsdParseResult {
    psd: Psd,
    layers: Layer[]
}

export async function parsePsdFile(file: File, onProcess: Function): Promise<PsdParseResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const arrayBuffer = reader.result;
            try {
                const psd = readPsd(arrayBuffer as ArrayBuffer);
                onProcess()
                const layers = psd.children;
                resolve({psd, layers})
            } catch (e: any) {
                console.error(e)
                if (e.message.indexOf('Color mode not supported: CMYK') > -1) {
                    reject({message: '暂不支持CMYK色彩模式的文件，请先使用PS转换为RGB'})
                } else {
                    reject({message: e.message})
                }
            }
        };
        reader.readAsArrayBuffer(file);
    })
}
```

### 17.14 `src/views/Editor/layouts/canvasEdit/canvasEdit.vue` 对照源码

```vue
<template>
  <div id="page-design" ref="designRef" class="page-design">
    <div ref="divRef" class="contentBox" id="divRef"></div>
  </div>
</template>

<script lang="ts">
import { useEditor } from "@/views/Editor/app";
import { useResizeObserver } from "@vueuse/core";

export default defineComponent({
  setup() {
    const divRef = ref();

    onMounted(() => {
      const { canvas } = useEditor();
      divRef.value.append(canvas.wrapperEl);
      canvas.wrapperEl.style.display = "block";
      useResizeObserver(divRef, (entries) => {
        const [entry] = entries;
        const { width, height } = entry.contentRect;
        canvas.app.resize({ width, height });
      });
    });
    return { divRef };
  },
});
</script>

<style scoped lang="less">
@import "../../styles/layouts";
.page-design {
  position: relative;
  overflow: hidden;
}
.contentBox {
  width: 100%;
  display: flex;
  overflow: hidden;
  height: @contentBoxHeight;
  background-color: rgb(245, 247, 253);
}
.ruler-pd {
  .contentBox {
    height: @contentBoxHeight;
  }
}
</style>
```

### 17.15 `MLeaferCanvas` 关键源码对照

`MLeaferCanvas` 文件较长，完整源码有 600 多行。前面第 8.10 节已经按行号解释了关键结构。这里附上最核心的几段，分别对应“创建画布”“初始化页面”“添加元素”“导入 JSON”“工作区切换”。

```ts
export const IMLeaferCanvas = createDecorator<MLeaferCanvas>('mLeaferCanvas')

export class MLeaferCanvas {
    declare readonly _serviceBrand: undefined

    public activeObject = shallowRef<IUI | null>()
    public extendedData = shallowRef<ExtendedOption>()
    public pageId?: string
    private readonly pages: Map<string, Page> = new Map()
    public wrapperEl: any
    private _app?: App
    private _contentLayer?: ILeafer
    public ruler: Ruler
    private _contentFrame: Frame
    private activeTool?: EditTool
}
```

```ts
constructor(
    @IWorkspacesService private readonly workspacesService: WorkspacesService,
    @IEventbusService private readonly eventbus: EventbusService,
    @IHierarchyService private readonly hierarchyService: HierarchyService,
) {
    const app = new App({
        width: 800,
        height: 800,
        editor: {
            point: { cornerRadius: 0 },
            middlePoint: {},
            rotatePoint: { width: 16, height: 16 },
            rect: { dashPattern: [3, 2] },
            buttonsDirection:'top',
        },
    })
    this.wrapperEl = app.canvas.view
    this.ruler = new Ruler(app,{
        enabled: this.ref.enabledRuler.value,
        theme:'light',
    })
    const contentLayer = app.tree
    contentLayer.fill = 'transparent'
    this._contentLayer = contentLayer
    this._app = app
    this.pageId = this.workspacesService.getCurrentId()
    this.initWorkspace()
    this.initPageEditor()
    this.initWatch()
    useFontStore().initFonts().then(value => {
        addCustomFonts(value)
    })
}
```

```ts
private initWorkspace() {
    this.workspacesService.all().forEach((workspace) => {
        this.setPageJSON(workspace.id, {
            children: [],
        })
    })
    this.eventbus.on('workspaceAddAfter', ({newId}) => {
        this.setPageJSON(newId, {
            children: [],
        })
    })
    this.eventbus.on('workspaceRemoveAfter', (id) => {
        this.pages.delete(id)
    })
    this.eventbus.on('workspaceChangeBefore', ({oldId}) => {
        if (!oldId || !this.pages.has(oldId)) return
        const page = this.pages.get(oldId)
        if (!page) return
        this.setPageJSON(oldId, this.contentFrame.toJSON())
        this.contentFrame.clear()
    })
    this.eventbus.on('workspaceChangeAfter', ({newId}) => {
        if (this.pageId !== newId) {
            useAppStore().activeTool = 'select'
            this.discardActiveObject()
            const page = this.pages.get(newId)
            this.pageId = newId
            if (page) {
                this.importJsonToCurrentPage(page, true)
            }
        }
    })
}
```

```ts
initPageEditor() {
    const frame = new Frame({
        id: uuidv4(),
        name: BOTTOM_CANVAS_NAME,
        width: this.contentLayer.width,
        height: this.contentLayer.height,
        fill:[{
            type:'solid',
            color:'#ffffff'
        }]
    })
    this.contentLayer.add(frame)
    this.contentFrame = frame
    this.setActiveObjectValue(this.contentFrame)

    this.app.editor.on(EditorEvent.SELECT, (arg: EditorEvent) => {
        this.setActiveObjectValue(arg.editor.element)
    })
    this.contentLayer.on(ChildEvent.ADD, () => {
        this.childrenEffect()
    })
    this.contentLayer.on(ChildEvent.REMOVE, () => {
        this.childrenEffect()
    })
}
```

```ts
public add(_child: IUI, _index?: number) {
    if (this.objectIsTypes(_child,'Group','Box')){
        this.bindDragDrop(_child)
    }
    if (!_child.zIndex){
        const topLevel = this.hierarchyService.getTopLevel().zIndex;
        _child.zIndex = topLevel + 1;
    }
    this.contentFrame.add(_child, _index)
    this.selectObject(_child)
    this.childrenEffect()
}
```

```ts
public async importJsonToCurrentPage(json: any, clearHistory?: boolean) {
    if (clearHistory) {
        this.contentFrame.clear()
    }
    if (json) {
        this.contentFrame.set(json)
        this.discardActiveObject()
        useAppStore().activeTool = 'select'
        this.childrenEffect()
    }
    this.zoomToFit()
    useFontStore().extractTemplateFonts(json, true).then(() => {
        const texts = this.contentFrame.findTag('Text')
        for (let i = 0; i < texts.length; i++) {
            texts[i].forceRender()
        }
        const htmls = this.contentFrame.findTag('HTMLText')
        for (let i = 0; i < htmls.length; i++) {
            htmls[i].forceRender()
        }
    })
}
```

### 17.16 `TextListWrap.vue` 添加文字核心源码对照

```ts
const {editor} = useEditor()

const basicTextList = ref<TextListType[]>([
    {
        title: '+ 添加普通文字',
        json: {
            tag: 'Text',
            text: '输入文本',
            fontSize: 40,
            fontWeight: 'normal',
        }
    },
    {
        title: '+ 添加富文本',
        json: {
            tag: 'HTMLText',
            name: '富文本',
            text: `<span style="font-size: 40px">输入文本</span>`,
            fontWeight: 'normal',
        }
    },
])

const handleClick = (item: any) => {
    let text
    if (editor.objectIsTypes(item.json, 'Text')) {
        text = new Text({
            name: getDefaultName(editor.contentFrame),
            editable: true,
            x: 0,
            y: 0,
            fill: [
                {
                    type: 'solid',
                    color: 'rgba(0,0,0,1)',
                },
            ],
            ...item.json,
        })
    } else if (editor.objectIsTypes(item.json, 'HTMLText')) {
        text = new HTMLText({
            name: getDefaultName(editor.contentFrame),
            editable: true,
            x: 0,
            y: 0,
            ...item.json,
        })
    } else {
        text = new Group(item.json)
    }

    editor.add(text)
}
```

### 17.17 如何继续补全“全项目每行代码 + 源码”

如果要把整个仓库两百多个文件都做成“源码 + 每行解释”，建议不要塞进一个 Markdown，而是拆成多个文件：

1. `docs/line-by-line/01-entry-and-config.md`
2. `docs/line-by-line/02-editor-core.md`
3. `docs/line-by-line/03-canvas-service.md`
4. `docs/line-by-line/04-layout-components.md`
5. `docs/line-by-line/05-right-panel.md`
6. `docs/line-by-line/06-psd-parser.md`
7. `docs/line-by-line/07-components.md`
8. `docs/line-by-line/08-api-store-utils.md`

这样阅读体验更好，也更适合后续持续维护。
