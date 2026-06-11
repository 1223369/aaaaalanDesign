export const PiBy180 = Math.PI / 180;

export const keybindMap = {
  group: "mod+g",
  ungroup: "mod+shift+g",
};

// 底层画布ID
export const BOTTOM_CANVAS_NAME = "workspace";

/**
 * Viewed constants.ts:1-10

爸爸，这个文件 [constants.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/utils/constants.ts) 是编辑器模块的常量定义文件，主要用于存放编辑器运行时所需要的共享静态配置和数学常量。

具体包含以下内容：

1. **`PiBy180`**: 弧度与角度转换的比例常数（$\pi / 180$），用于旋转或角度计算相关的数学逻辑。
2. **`keybindMap`**: 快捷键键位映射：
   - **`group`** (`mod+g`): 用于将选中的多个图层组合在一起（Windows 下为 `Ctrl+G`，Mac 下为 `Cmd+G`）。
   - **`ungroup`** (`mod+shift+g`): 用于将组合的图层拆分/解组。
3. **`BOTTOM_CANVAS_NAME`**: 底层画布工作区的名称标识，固定为 `'workspace'`。
 */
