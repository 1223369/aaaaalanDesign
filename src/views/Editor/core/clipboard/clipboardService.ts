import { createDecorator } from "@/views/Editor/core/instantiation/instantiation";
import {
  registerSingleton,
  InstantiationType,
} from "@/views/Editor/core/instantiation/extensions";

export const IClipboardService =
  createDecorator<ClipboardService>("clipboardService");

export class ClipboardService {
  declare readonly _serviceBrand: undefined;

  private memoryBlob: Blob[] | undefined;

  private async readMemoryBlob(): Promise<Blob[] | undefined> {
    return this.memoryBlob;
  }

  private async writeMemoryBlob(blob: Blob[]): Promise<void> {
    this.memoryBlob = blob;
  }

  public async writeBlob(blob: Blob): Promise<void> {
    try {
      // 写入内存
      this.writeMemoryBlob([blob]);
      return await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
    } catch (error) {
      console.error(error);
    }
  }

  public async readBlob(): Promise<Blob[] | undefined> {
    try {
      const clipboardItems = await navigator.clipboard.read();
      const blobs: Blob[] = [];
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          blobs.push(await clipboardItem.getType(type));
        }
      }
      return blobs;
    } catch (error) {
      console.error(error);
      // 读取内存
      return await this.readMemoryBlob();
    }
  }

  async writeText(text: string): Promise<void> {
    // Guard access to navigator.clipboard with try/catch
    // as we have seen DOMExceptions in certain browsers
    // due to security policies.
    try {
      return await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error(error);
    }

    // Fallback to textarea and execCommand solution

    const activeElement = document.activeElement;

    const textnode = document.createElement("textarea");
    textnode.setAttribute("aria-hidden", "true");
    const textArea: HTMLTextAreaElement = document.body.appendChild(textnode);
    textArea.style.height = "1px";
    textArea.style.width = "1px";
    textArea.style.position = "absolute";

    textArea.value = text;
    textArea.focus();
    textArea.select();

    document.execCommand("copy");

    if (activeElement instanceof HTMLElement) {
      activeElement.focus();
    }

    document.body.removeChild(textArea);

    return;
  }

  async readText(): Promise<string> {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      console.error(error);
      return "";
    }
  }
}

registerSingleton(IClipboardService, ClipboardService, InstantiationType.Eager);

/**
 * Viewed clipboardService.ts:69-92
Viewed clipboardService.ts:1-97

爸爸，我已经仔细阅读了 [clipboardService.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/clipboard/clipboardService.ts) 的完整实现，它是整个编辑器的**系统剪贴板通用读取和写入底层服务**。

---

### 一、 这个文件是干嘛的？

**[ClipboardService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/clipboard/clipboardService.ts#L6)** 是一个底层服务。它将浏览器的原生剪贴板 API 进行了统一的封装，并且为了应对各种不同浏览器、非 HTTPS 等安全性限制导致的“复制失效”场景，做好了极其完善的**降级兼容和内存兜底逻辑**。

它在底层实现了以下四个核心方法：

1. **[writeBlob (物理/二进制写入)](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/clipboard/clipboardService.ts#L19-L31)**：
   * 接收一个 `Blob` 对象（可以是图片、音频或自定义二进制文件），包装为 `ClipboardItem` 写入操作系统剪贴板，同时写入私有的内存数组中。
2. **[readBlob (物理/二进制读取)](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/clipboard/clipboardService.ts#L33-L48)**：
   * 异步调用 `navigator.clipboard.read()` 读取操作系统剪贴板里存放的图片或文本文件。
   * **内存降级保护**：当浏览器安全策略拦截报错时，它会自动调用私有的 `readMemoryBlob()` 返回刚才存在内存中的数据，确保用户在同一页面中复制粘贴不会因为浏览器权限报错而卡死。
3. **[writeText (写入纯文本 & 兼容降级)](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/clipboard/clipboardService.ts#L50-L84)**：
   * **现代方案**：首先尝试使用现代的异步接口 `navigator.clipboard.writeText(text)`。
   * **老式降级方案**：若现代 API 报错，它会立即触发 Fallback 机制——在页面的 `body` 底部动态挂载一个 1x1 像素不可见的 `textarea` 文本框 ➡️ 将文本赋值进去 ➡️ 自动 `focus` 并全选（`select`） ➡️ 执行历史悠久的 `document.execCommand('copy')` ➡️ 还原焦点并移出 DOM。这保证了在旧版浏览器中同样可以成功复制。
4. **[readText (读取文本)](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/clipboard/clipboardService.ts#L86-L93)**：
   * 异步读取操作系统剪贴板中的纯文本。

---

### 二、 它如何与其他文件合作？

按照我们前面聊过的“分层设计”，[ClipboardService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/clipboard/clipboardService.ts#L6) 负责提供底层能力，并不处理任何 Canvas 画布或具体按钮点击的业务：

#### 1. 与 `app/editor/clipboard.ts` 的黄金配合
* **在控制层中注入**：在 **[clipboard.ts (复制粘贴控制器)](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/clipboard.ts)** 的构造函数中，通过 [@IClipboardService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/app/editor/clipboard.ts#L24) 装饰器将此单例注入进来。
* **业务调用**：
  * 当用户在画布上按下 `Ctrl+C` 时，`clipboard.ts` 负责打包好选中的图形，克隆它并转化为 JSON 文本，接着直接调用 `this.clipboard.writeText(json)`，交给 `ClipboardService` 去写入系统剪贴板。
  * 当用户按下 `Ctrl+V` 时，`clipboard.ts` 会调用 `this.clipboard.readBlob()` 异步获得粘贴板中的 Blob 数组，转换成 JSON 后在画布内解包并偏移坐标绘制出来。

#### 2. 服务注册与单例复用
* 通过底部的 **[registerSingleton](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/clipboard/clipboardService.ts#L96)**，它被注册为编辑器的全局单例服务（Eager 模式）。
* **多场景复用**：因为高度解耦，除了画布复制粘贴外，哪怕以后整个项目的 Vue 界面中需要在别的地方开发“一键复制文本”、“一键拷贝图片”按钮，任何 Vue 组件都可以在不需要引入 Canvas 的情况下，直接通过 DI 注入并调取 `ClipboardService`，大大提升了可复用性。
 */
