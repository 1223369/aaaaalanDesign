import { useAppStore } from "./modules/app/app";
import { useFontStore } from "./modules/font/font";

const pinia = createPinia();

export default pinia;

export { useAppStore, useFontStore };
/**
 * Ran command: `npm i`

I will list the contents of the `src/store` folder and inspect the files to understand the store structure and modules.

Listed directory store

I will list the files inside the `src/store/modules` directory to see all the available modules.

Listed directory modules

I will list the files in `src/store/modules/app` and `src/store/modules/font` to understand their structure.

Listed directory app

I will list the files in `src/store/modules/font`.

Listed directory font

I will view the contents of `src/store/index.ts` to see how the main store is set up and exported.

Viewed index.ts:1-9

I will view `src/store/modules/app/app.ts` to see what the `app` store handles.

Viewed app.ts:1-11

I will view `src/store/modules/font/font.ts` to see the structure and what it handles.

Viewed font.ts:1-181

这两个文件的划分和它们之间的关系，是前端项目中非常经典的 **Pinia 状态管理模块化（Module-based）设计模式**。下面为您详细梳理它们各自的职责以及它们之间的协作关系：

---

### 一、 `src/store/modules` 文件夹是干嘛的？

该文件夹用于存放**各个独立的业务子 Store（模块）**。在复杂前端项目中，将全局状态按照“业务领域”或“功能模块”进行拆分，可以避免单个 Store 文件体积过大，更易于维护和扩展。

在您的项目中，目前包含两个子模块：

#### 1. `modules/app/app.ts`（应用全局基础状态）
*   **职责**：管理应用级别的基础状态。
*   **主要内容**：
    *   定义并管理了当前编辑器中激活/选中的工具：`activeTool`（默认为 `'select'`，如选择工具、画笔工具等）。

#### 2. `modules/font/font.ts`（字体状态与加载管理）
*   **职责**：专门用于管理设计编辑器中所需的**字体数据及其动态下载加载逻辑**。
*   **主要内容**：
    *   **字体数据存储**：维护 `fontList`（当前支持的字体列表，包含 Arial、微软雅黑等默认字体和从接口获取的系统字体）和 `skipLoadFonts`（跳过加载的字体列表）。
    *   **本地缓存与初始化**：`initFonts` 方法用于从本地 `localStorage` 或后端 API 获取字体数据并进行初始化。
    *   **模板字体提取**：`extractTemplateFonts` 用于解析画布/模板的 JSON 树状结构，并提取出 `Text` 或 `HTMLText` 节点中所用到的所有字体名称（`styleFonts` 和 `richTextFonts`）。
    *   **异步加载与通知**：`loadFonts` 方法结合了 `fontfaceobserver` 库，支持**并发控制**去下载远程字体文件，并通过 Arco Design 的 `Message` / `Notification` 实时展示字体加载进度及结果。

---

### 二、 与 `src/store/index.ts` 是什么关系？

`src/store/index.ts` 是 Pinia 的**根入口文件**与**统一导出（聚合）中心**。它的源码如下：

```typescript
import { useAppStore } from "./modules/app/app";
import { useFontStore } from "./modules/font/font";

const pinia = createPinia();

export default pinia;

export { useAppStore, useFontStore };
```

它与 `modules` 文件夹下的子模块存在以下两层关系：

#### 1. 实例初始化与挂载关系（默认导出）
*   `src/store/index.ts` 负责创建整个应用的 Pinia 根实例：`const pinia = createPinia()`。
*   在应用的入口文件（通常是 `src/main.ts`）中，会引入这个默认导出的 `pinia` 实例，并通过 `app.use(pinia)` 挂载到 Vue 应用上，使整个项目能够使用状态管理。

#### 2. 统一出口与解耦关系（命名导出）
*   `index.ts` 将子模块中的 `useAppStore` 和 `useFontStore` 导入，再统一通过 `export { ... }` 导出。
*   **好处**：这起到了“门面（Facade）”的作用。其他组件（如视图组件、 canvas 控制逻辑等）需要调用 Store 时，**不需要写很深的相对路径**去分别引入不同的模块，而是可以直接统一从 `@/store` 根路径引入：
    ```typescript
    // 在其他组件或文件中引入
    import { useAppStore, useFontStore } from '@/store';
    ```
    这既简化了代码的导入路径，也使得后续如果对子模块的文件名或结构进行重构时，外部组件的引入路径无需发生任何改变。
 */
