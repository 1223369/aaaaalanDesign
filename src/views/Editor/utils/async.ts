/**
 * A disposable object
 */
export interface IDisposable {
  /** 释放进程 */
  dispose(): void;
}

/**
 * Execute the callback the next time the browser is idle, returning an
 * {@link IDisposable} that will cancel the callback when disposed. This wraps
 * [requestIdleCallback] so it will fallback to [setTimeout] if the environment
 * doesn't support it.
 *
 * @param callback The callback to run when idle, this includes an
 * [IdleDeadline] that provides the time alloted for the idle callback by the
 * browser. Not respecting this deadline will result in a degraded user
 * experience.
 * @param timeout A timeout at which point to queue no longer wait for an idle
 * callback but queue it on the regular event loop (like setTimeout). Typically
 * this should not be used.
 *
 * [IdleDeadline]: https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline
 * [requestIdleCallback]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 * [setTimeout]: https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
 */
export let runWhenIdle: (
  callback: (idle: IdleDeadline) => void,
  timeout?: number,
) => IDisposable;

declare function requestIdleCallback(
  callback: (args: IdleDeadline) => void,
  options?: { timeout: number },
): number;
declare function cancelIdleCallback(handle: number): void;

if (
  typeof requestIdleCallback !== "function" ||
  typeof cancelIdleCallback !== "function"
) {
  runWhenIdle = (runner) => {
    setTimeout(() => {
      if (disposed) {
        return;
      }
      const end = Date.now() + 15; // one frame at 64fps
      runner(
        Object.freeze({
          didTimeout: true,
          timeRemaining() {
            return Math.max(0, end - Date.now());
          },
        }),
      );
    });
    let disposed = false;
    return {
      dispose() {
        if (disposed) {
          return;
        }
        disposed = true;
      },
    };
  };
} else {
  runWhenIdle = (runner, timeout?) => {
    const handle: number = requestIdleCallback(
      runner,
      typeof timeout === "number" ? { timeout } : undefined,
    );
    let disposed = false;
    return {
      dispose() {
        if (disposed) {
          return;
        }
        disposed = true;
        cancelIdleCallback(handle);
      },
    };
  };
}

/**
 * An implementation of the "idle-until-urgent"-strategy as introduced
 * 将计算过程推迟到浏览器空闲时运行，这可以避免在浏览器不空闲时执行计算操作，从而提高页面性能。
 * here: https://philipwalton.com/articles/idle-until-urgent/
 */
export class IdleValue<T> {
  private readonly _executor: () => void;
  private readonly _handle: IDisposable;

  private _didRun = false;
  private _value?: T;
  private _error: unknown;

  constructor(executor: () => T) {
    this._executor = () => {
      try {
        this._value = executor();
      } catch (err) {
        this._error = err;
      } finally {
        this._didRun = true;
      }
    };
    this._handle = runWhenIdle(() => this._executor());
  }

  /** 用于释放该对象 */
  dispose(): void {
    this._handle.dispose();
  }

  /** 用于获取计算后的值 */
  get value(): T {
    if (!this._didRun) {
      this._handle.dispose();
      this._executor();
    }
    if (this._error) {
      throw this._error;
    }
    return this._value!;
  }

  /** 用于检查该对象的值是否已经初始化过 */
  get isInitialized(): boolean {
    return this._didRun;
  }
}

//#endregion

/**
 * 
 * 该文件的核心目的是为了避免在主线程中执行耗时的非紧急计算，减少页面卡顿，保证编辑器交互的流畅性。

下面为您详细拆解该文件中的两大部分：

一、 runWhenIdle 调度函数（空闲时间执行）
runWhenIdle 主要是对浏览器原生 API requestIdleCallback 的一层封装与兼容处理：

基本机制

接收一个 callback 回调函数。当浏览器有空闲时间（没有高优先级的渲染、输入任务）时，会自动触发此回调，并传入 IdleDeadline 对象以告知本次空闲还剩余多少毫秒。
返回一个实现 IDisposable 接口的对象（包含 dispose 方法），用于在回调触发前手动取消调度。
多浏览器兼容降级（Polyfill）

支持 requestIdleCallback 的环境：直接使用原生 API，并在 dispose 时调用 cancelIdleCallback 取消。
不支持的环境（如旧版 Safari）：使用 setTimeout(..., 0) 降级模拟。通过 Date.now() + 15 模拟下一帧（约 60fps 下的 15ms 时间片）的剩余空闲时间 timeRemaining()，同样支持 dispose 手动取消。
二、 IdleValue<T> 类（空闲直到紧急策略）
这是该文件的核心设计，它实现了 "Idle-until-urgent" 机制。该设计常用于编辑器内大对象或重度配置的懒初始化。

1. 工作原理与生命周期
构造初始化 (constructor)： 在实例被创建时，会立即在后台通过 runWhenIdle 注册一个空闲任务去执行传入的 executor 构造器，默默进行计算并缓存结果，此时不阻塞当前的用户操作主线程。

“空闲执行”场景： 如果用户一直没有向该实例索要数据，且浏览器空闲了，executor 执行完毕，计算结果缓存进 _value，状态 _didRun 置为 true。

“紧急调用”场景 (Until-Urgent)： 如果用户行为突然触发了某项操作，急需读取这个值（即调用 get value()），但此时浏览器还没来得及空闲去执行后台任务：

它会立刻调用 this._handle.dispose() 取消还在排队的空闲任务。
在当前同步线程中立刻执行 this._executor() 获得结果并缓存。
从而保证业务代码能够立即同步拿到正确的数据，绝不拖延。
 */
