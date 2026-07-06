import { appInstance } from "../app";
import { getSingletonServiceDescriptors } from "./instantiation/extensions";
import { IInstantiationService } from "./instantiation/instantiation";
import { InstantiationService } from "./instantiation/instantiationService";
import { ServiceCollection } from "./instantiation/serviceCollection";
import { setActiveCore } from "./root";
import { ICore } from "./types";

const createServices = (): IInstantiationService => {
  const services = new ServiceCollection();

  // 获取全局单例服务
  for (const [id, descriptor] of getSingletonServiceDescriptors()) {
    services.set(id, descriptor);
  }

  return new InstantiationService(services, true);
};

export const createCore = (): ICore => {
  const service = createServices();
  const core: ICore = markRaw({
    install(vueApp) {
      this._a = vueApp;
      setActiveCore(core);
    },
    use(plugin) {
      // todo 插件管理和生命周期
      this._p.push(plugin);
      appInstance.editor?.use(plugin);
      return this;
    },
    service,
    _p: [],
    _a: null,
  });

  return core;
};

/**
 * Edited index.vue
Edited footerBar.vue
Edited footerBar.vue
Edited footerBar.vue
Edited footerBar.vue
Edited footerBar.vue
Edited root.ts
Edited createCore.ts
Viewed createCore.ts:1-33
Viewed createCore.ts:1-40

`createCore.ts` 文件是整个编辑器系统（Editor Core）的**初始化入口**与**依赖注入控制中心（IoC Container）**。

它借鉴了类似 VSCode 架构的**依赖注入（Dependency Injection, DI）**与**控制反转（IoC）**设计模式，用于管理编辑器中各种核心服务的生命周期与相互调用关系。

---

### 一、 文件的核心作用

1. **统一注册全局服务**：在系统启动时，收集并注入所有的单例服务（例如：画布管理服务、工作区服务、快捷键服务等），避免手动传递复杂的对象引用。
2. **挂载 Vue 应用生态**：提供了符合 Vue 插件标准的 `install` 方法，使得编辑器能够作为插件直接通过 `app.use(core)` 挂载到 Vue 实例上。
3. **全局状态锚定**：在创建核心后，通过 `setActiveCore` 锁定了当前的全局核心实例，方便其他非组件文件（如纯 TS 工具函数或类）通过 `getActiveCore()` 随时获取当前编辑器上下文。
4. **插件化扩展机制**：提供 `use` 接口，允许外部开发者为编辑器开发扩展插件（Plugin），并负责插件的收集和与实际编辑器实例的生命周期绑定。

---

### 二、 代码逐段解析

#### 1. 依赖注入服务的构建：`createServices`
```typescript
const createServices = (): IInstantiationService => {
  const services = new ServiceCollection()

  // 1. 获取通过装饰器或扩展注册的全局单例服务描述符
  for (const [id, descriptor] of getSingletonServiceDescriptors()) {
    services.set(id, descriptor)
  }

  // 2. 实例化依赖注入容器，true 代表开启严格的依赖图解析或延迟加载支持
  return new InstantiationService(services, true)
}
```
* **`ServiceCollection`**：服务收集器，本质上是一个 Map 容器，用来存储 **服务标识符 (Service Identifier)** 和 **服务描述符 (Service Descriptor)** 的映射。
* **`getSingletonServiceDescriptors()`**：获取整个项目中注册过的单例服务（比如键盘监听、历史记录撤销重做等服务）。
* **`InstantiationService`**：依赖注入容器的核心实现。当后续需要实例化某个类时，这个服务会自动分析该类构造函数所声明的依赖（通过 TS 装饰器注入），并自动将对应的单例注入进去。

---

#### 2. 创建核心实例：`createCore`
```typescript
export const createCore = (): ICore => {
  const service = createServices()
  
  // markRaw 用于告诉 Vue 编译器这个 core 对象是普通 JS 对象，不需要进行深度响应式代理，提升性能
  const core: ICore = markRaw({
    
    // Vue 插件接口：当 Vue 应用 app.use(core) 时自动触发
    install(vueApp) {
      this._a = vueApp      // 暂存 Vue 应用实例
      setActiveCore(core)   // 将当前核心实例设为全局活动 Core
    },
    
    // 插件注册接口：供外部加载编辑器插件使用
    use(plugin) {
      // todo 插件管理和生命周期
      this._p.push(plugin)  // 缓存自定义插件
      appInstance.editor?.use(plugin) // 若编辑器底层引擎已初始化，同步挂载插件
      return this
    },
    
    service, // 暴露出依赖注入服务容器
    _p: [],  // 存储已注册插件的数组
    _a: null, // 存储 Vue App 实例的指针
  })

  return core
}
```

* **`markRaw`**：这是 Vue 3 的 API（此处由打包工具/Vite 插件自动导入）。因为编辑器的 Core 包含了大量的底层逻辑、类实例和 DI 容器，如果对其进行深度响应式代理（Proxy），会导致严重的性能损耗。`markRaw` 标记能阻断响应式。
* **`install(vueApp)`**：使得该核心与 Vue 应用建立链接。
* **`use(plugin)`**：提供了链式调用的插件注册方法，支持在编辑器初始化前后动态扩展功能。
 */
