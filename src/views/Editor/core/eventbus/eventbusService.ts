import { createDecorator } from "@/views/Editor/core/instantiation/instantiation";
import {
  InstantiationType,
  registerSingleton,
} from "@/views/Editor/core/instantiation/extensions";
import { Mitt } from "./mitt";
import { PropertyEvent, ResizeEvent } from "leafer-ui";

type WworkspaceParam = {
  oldId: string | undefined;
  newId: string;
};

export type Events = {
  undoRedoStackChange: undefined;
  layerRename: { id: string | number };
  setEdgeMoveStatus: boolean;
  workspaceChangeBefore: WworkspaceParam;
  workspaceChangeAfter: WworkspaceParam;
  workspaceChangeRefresh: WworkspaceParam;
  workspaceAddBefore: WworkspaceParam;
  workspaceAddAfter: WworkspaceParam;
  workspaceRemoveBefore: string;
  workspaceRemoveAfter: string;
  layoutMoveEvent: PropertyEvent; // 基础画布移动事件（组件库的move和手动修改的move都会触发）
  layoutResizeEvent: ResizeEvent; // 基础画布resize事件
};

export class EventbusService extends Mitt<Events> {}

export const IEventbusService =
  createDecorator<EventbusService>("eventbusService");

registerSingleton(IEventbusService, Mitt, InstantiationType.Eager);

/**
 * Edited penDraw.ts
Edited contextMenu.ts
Edited math.ts
Edited mLeaferCanvas.ts
Edited package.json
Edited workspacesService.ts
Viewed eventbusService.ts:1-28

爸爸，[eventbusService.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/eventbus/eventbusService.ts) 是整个编辑器的**全局事件总线（Event Bus）服务**。

它在微内核架构中扮演着“通信枢纽”和“解耦桥梁”的角色。通过采用 TypeScript 强类型，它不仅提供了一个全局的消息发布与订阅（Pub/Sub）通道，而且对所有可以发送的事件以及它们携带的数据进行了严格约束。

以下是该文件的详细拆解：

---

### 一、 核心部分拆解

#### 1. 强类型事件字典：[Events](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/eventbus/eventbusService.ts#L11-L24)
这是该文件最核心的定义。它规定了编辑器内部所有可以发布和监听的事件，并且定义了这些事件对应的数据类型（Data Payload）：

| 事件名称 (Event Key) | 参数类型 (Payload) | 作用描述 (Description) |
| :--- | :--- | :--- |
| **`undoRedoStackChange`** | `undefined` | 撤销（Undo）/ 重做（Redo）栈发生变化时触发（例如撤销按钮状态需要置灰/亮起）。 |
| **`layerRename`** | `{ id: string \| number }` | 图层重命名事件。当图层树上的节点重命名时，会派发该事件通知相关组件。 |
| **`setEdgeMoveStatus`** | `boolean` | 设置边缘移动状态。常用于拖动边缘时触发。 |
| **`workspaceChangeBefore`** | `WworkspaceParam` | 切换工作区/页面**之前**触发。通常用于在画布清空前，自动把当前页面所有图层保存为 JSON 存入缓存。 |
| **`workspaceChangeAfter`** | `WworkspaceParam` | 切换工作区/页面**之后**触发。通常用于在新页面被载入后，重置编辑器工具并把新页面的 JSON 渲染到画布上。 |
| **`workspaceChangeRefresh`** | `WworkspaceParam` | 刷新工作区事件。用于刷新并同步当前页面的元素数据。 |
| **`workspaceAddBefore`** | `WworkspaceParam` | 新增工作区/页面之前触发。 |
| **`workspaceAddAfter`** | `WworkspaceParam` | 新增工作区/页面之后触发。 |
| **`workspaceRemoveBefore`** | `string` (工作区ID) | 删除工作区/页面之前触发。 |
| **`workspaceRemoveAfter`** | `string` (工作区ID) | 删除工作区/页面之后触发。通常用于清理该页面的缓存。 |
| **`layoutMoveEvent`** | `PropertyEvent` (Leafer UI 事件) | 基础画板移动事件。当画布或者底图发生 `x`/`y` 坐标位移时触发，**用来让标尺（Ruler）辅助线和网格自动跟住画布做对应移动**。 |
| **`layoutResizeEvent`** | `ResizeEvent` (Leafer UI 事件) | 基础画板 Resize 事件。当画布大小发生拉伸或改变时触发，用于重置网格和辅助线布局。 |

#### 2. 事件总线服务实现：[EventbusService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/eventbus/eventbusService.ts#L26)
```typescript
export class EventbusService extends Mitt<Events> {}
```
* 它继承自一个类型化的 **[Mitt](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/eventbus/mitt.ts)** 事件管理基类。
* 由于继承了 `Mitt<Events>`，在其他组件或服务里通过 `on` 监听或 `emit` 发布事件时，IDE 能提供非常精准的代码提示，如果不符合 [Events](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/eventbus/eventbusService.ts#L11-L24) 中定义的数据类型，编译时会直接报错。

#### 3. 依赖注入装饰器：[IEventbusService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/eventbus/eventbusService.ts#L28)
```typescript
export const IEventbusService = createDecorator<EventbusService>('eventbusService')
```
* 这是该服务在系统中的唯一标识。
* 其他服务（比如 [workspacesService.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/workspaces/workspacesService.ts) 和 [mLeaferCanvas.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts)）只需要在它们的 `constructor` 里声明 `@IEventbusService`，就可以非常简单地拿到同一个单例事件总线，实现跨组件、跨服务的通信。

---

### 二、 大白话还原工作流程

有了这个文件，编辑器里的很多行为都可以被**完全解耦**：

* **比如你新增了一个页面**：
  1. [workspacesService.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/workspaces/workspacesService.ts) 中调用了 `add` 方法，它会通过 `eventbus.emit('workspaceAddAfter', ...)` 喊一嗓子：“新页面已经加好啦！”。
  2. 此时，[mLeaferCanvas.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts) 正在用 `eventbus.on('workspaceAddAfter', ...)` 听着呢，听到后立马在内存里开辟一块新空间，用来给这个新页面存图层 JSON 数据。
  3. 页面上的 Vue 侧边栏列表也听到了，立马在底部的页面缩略图列表里，新增了一个空白小卡片。

这三个组件/类之间**不需要互相强行引用对方的代码**，仅仅通过 [IEventbusService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/eventbus/eventbusService.ts#L28) 这个无线电台，就可以协调一致地完成所有业务逻辑。
 */
