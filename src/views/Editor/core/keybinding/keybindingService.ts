import mousetrap from "mousetrap";
import type { ExtendedKeyboardEvent } from "mousetrap";
import { createDecorator } from "@/views/Editor/core/instantiation/instantiation";
import { isArray, isFunction, isObject, isString } from "lodash";
import {
  InstantiationType,
  registerSingleton,
} from "@/views/Editor/core/instantiation/extensions";
import { runWhenIdle } from "@/views/Editor/utils/async";

export const IKeybindingService =
  createDecorator<KeybindingService>("keybindingServices");

type Callback = (e: ExtendedKeyboardEvent, combo: string) => void;

export class KeybindingService extends mousetrap {
  declare readonly _serviceBrand: undefined;

  public mod = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";

  constructor() {
    super();
  }

  /**
   * Overwrites default Mousetrap.bind method to optionally accept
   * an object to bind multiple key events in a single call
   *
   * You can pass it in like:
   *
   * Mousetrap.bind({
   *     'a': function() { console.log('a'); },
   *     'b': function() { console.log('b'); }
   * });
   *
   * And can optionally pass in 'keypress', 'keydown', or 'keyup'
   * as a second argument
   *
   */
  bind(keys: string | string[], callback: Callback, action?: string): this;
  bind(keys: { [key: string]: Callback }, action?: string): this;
  bind(
    keys: string | string[] | { [key: string]: Callback },
    callbackOrAction?: string | Callback,
    action?: string,
  ) {
    if ((isString(keys) || isArray(keys)) && isFunction(callbackOrAction)) {
      return super.bind(keys, callbackOrAction, action);
    }

    if (
      isObject(keys) &&
      !isArray(keys) &&
      (!callbackOrAction || isString(callbackOrAction))
    ) {
      for (const key in keys) {
        // @ts-ignore
        super.bind(key, keys[key], callbackOrAction);
      }
    }

    return this;
  }

  trigger(keys: string, action?: string | undefined) {
    runWhenIdle(() => {
      super.trigger(keys, action);
    });
    return this;
  }
}

registerSingleton(
  IKeybindingService,
  KeybindingService,
  InstantiationType.Eager,
);

/**
 * 
 * Edited mLeaferCanvas.ts
Edited mLeaferCanvas.ts
Edited mLeaferCanvas.ts
Edited mLeaferCanvas.ts
Edited individual-form.vue
Edited enterprise-form.vue
Edited utils.ts
Edited contextMenu.ts
Edited contextMenu.ts
Edited contextMenu.ts
Viewed keybindingService.ts:32-56
Viewed keybindingService.ts:1-65
Searched for "IKeybindingService"

爸爸，[keybindingService.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/keybinding/keybindingService.ts) 是编辑器的**全局快捷键管理服务**。

它继承自知名的键盘事件绑定库 `mousetrap`，并结合了当前项目的**依赖注入 (DI) 架构**，对多键绑定以及执行调度做了增强。

以下是该文件的详细解析：

---

### 一、 核心功能与设计

#### 1. 跨平台修饰键适配 (`mod` 属性)
```typescript
public mod = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'
```
* **解释**：自动检测用户的操作系统。如果是 macOS/iOS 设备，修饰键符号设为 `⌘`；如果是 Windows/Linux 设备，则设为 `Ctrl`。
* **作用**：常用于菜单、右键菜单（如 [contextMenu.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/contextMenu.ts)）的快捷键文本渲染，自动适配并优雅地向用户展示符合其操作系统的键位符号。

#### 2. 增强型快捷键绑定 (`bind` 方法)
```typescript
bind(keys: string | string[], callback: Callback, action?: string): this
bind(keys: { [key: string]: Callback }, action?: string): this
```
* **解释**：对默认的 `mousetrap.bind` 方法进行了重载。
* **作用**：
  * 支持传统的单键/键数组绑定（如 `bind('ctrl+c', callback)`）。
  * 额外支持**对象字典绑定**（如 `bind({ 'ctrl+c': copyCallback, 'ctrl+v': pasteCallback })`），可以用单次调用批量完成多个快捷键映射，使代码编写更加简洁优雅。

#### 3. 空闲时触发调度 (`trigger` 方法)
```typescript
trigger(keys: string, action?: string | undefined) {
    runWhenIdle(() => {
        super.trigger(keys, action)
    })
    return this
}
```
* **解释**：拦截并重写了 `trigger` 方法，将按键的底层响应回调放到了 `runWhenIdle`（浏览器空闲时间调度器）中执行。
* **作用**：当用户通过右键菜单或代码逻辑主动触发某个快捷键对应的行为时，确保其在下一帧空闲时排队执行，**避免阻塞主渲染线程**，提升页面渲染的流畅度。

---

### 二、 架构层集成（依赖注入）

```typescript
export const IKeybindingService = createDecorator<KeybindingService>('keybindingServices')
...
registerSingleton(IKeybindingService, KeybindingService, InstantiationType.Eager)
```
* 项目中使用了类似于 VS Code 源码的**依赖注入体系**（IOC 容器）。
* 该文件创建了 `IKeybindingService` 装饰器，并使用 `registerSingleton` 将其注册为**全局单例服务**，类型为 `Eager`（在编辑器初始化时立即实例化）。

---

### 三、 具体在项目中的应用场景

其他编辑器模块可以通过注入 `IKeybindingService` 轻松实现按键捕获。主要应用在：

1. **撤销与重做 ([undoRedoService.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/undoRedo/undoRedoService.ts))**：
   * 绑定 `mod+z` 触发撤销（Undo）。
   * 绑定 `mod+y` 或 `mod+shift+z` 触发重做（Redo）。
2. **剪贴板操作 ([clipboard.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/clipboard.ts))**：
   * 绑定 `mod+c` (复制)、`mod+x` (剪切)、`mod+v` (粘贴)。
3. **图层层级调整与成组 ([layer.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/layer.ts))**：
   * 绑定 `mod+g` 进行图层成组，`mod+shift+g` 进行解组。
   * 绑定 `mod+]` (上移一层)、`]` (置顶)、`mod+[` (下移一层)、`[` (置底)。
4. **画布缩放 ([zoom.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/zoom.ts))**：
   * 绑定 `mod+=` / `mod+-` 放大或缩小画布，绑定 `mod+0` 缩放至适应窗口。
5. **右键菜单触发机制 ([contextMenu.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/contextMenu.ts))**：
   * 比如右键点击“创建分组”菜单项时，菜单项不需要自己写成组逻辑，而是直接调用 `keybindingService.trigger('mod+g')` 来复用已绑定的成组快捷键逻辑。
 */
