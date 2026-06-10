import type { EditorPlugin } from "./type";

export const createEditorPlugin = (plugin: EditorPlugin) => plugin;

/**
 * Viewed createEditorPlugin.ts:1-4
Viewed types.ts:1-27

爸爸，这个文件 [createEditorPlugin.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/createEditorPlugin.ts) 是一个**类型推导辅助文件**，它的核心作用是为定义编辑器插件提供 TypeScript 的类型提示与约束。

具体来说，它的作用和优势如下：

1. **类型辅助与推导**：
   函数 [createEditorPlugin](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/createEditorPlugin.ts) 是一个标识函数（Identity Function），它接受一个符合 [EditorPlugin](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/types.ts) 类型的插件函数并直接将其返回。
   
2. **提升开发体验**：
   在编写具体插件时，通过包裹此函数，TypeScript 可以自动推断出插件函数入参 `editor` 的类型（包含 `service` 和 `use` 等属性），而不需要你手动去编写繁琐的类型声明，从而让 IDE 提供完整的代码补全（Auto-complete）和参数校验。

### 使用示例
当你要编写一个编辑器插件时，通常会这样使用它：
```typescript
import { createEditorPlugin } from './createEditorPlugin'

export const myPlugin = createEditorPlugin((editor) => {
  // 这里 editor 能够被自动推导为 Pick<EditorMain, 'service' | 'use'>
  
  return {
    setup() {
      // 插件初始化逻辑
    },
    dispose() {
      // 插件销毁逻辑
    }
  }
})
```
 * 
 */
