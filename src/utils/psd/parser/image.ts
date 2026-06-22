/**
 * 图片
 */

import Image2 from "@/views/Editor/core/shapes/Image2";

// 从同级的公共配置模块中，引入公共属性获取函数 [getCommonOptions](file:///d:/项目相关/AAA/gzm-design/src/utils/psd/parser/common.ts#L20) 和图层接口 [LayerInfo](file:///d:/项目相关/AAA/gzm-design/src/utils/psd/parser/common.ts#L13)
import { getCommonOptions, LayerInfo } from "./common";

// 从 '@leafer-ui/interface' 中引入混合模式的 TypeScript 类型定义 IBlendMode
import { IBlendMode } from "@leafer-ui/interface";

/**
 * @param layer: 传入的 PSD 图层信息对象
 * @param options: 允许外部传入的额外覆盖/扩展属性，默认为空对象 {}
 */
export function parseImage(layer: LayerInfo, options = {}) {
  // 15-20行：实例化我们自定义的 Image2 类
  const image = new Image2({
    ...getCommonOptions(layer), // 16行：使用解构赋值，引入并展开通用的图层基本属性（如坐标 x, y、名字 name、透明度 opacity、层级 zIndex 等）
    ...options, // 17行：展开外部传入的额外覆盖属性
    // 混合模式
    blendMode: <IBlendMode>layer.blendMode, // 19行：将 PSD 图层自带的混合模式强转为 Leafer 的 IBlendMode 类型并赋予组件
  });

  // 21行：判断当前 PSD 图层是否包含 canvas 数据（ag-psd 解析器会将图片图层的像素内容渲染到 layer.canvas 上）
  if (layer.canvas) {
    // 22行：将图层 canvas 中的像素数据导出为 Base64 格式的 PNG 编码 URL
    const url = layer.canvas.toDataURL("image/png");

    // 23行：把生成的 Base64 URL 赋值给图像组件，此时内部 setter 会自动将其设置为 Rect 的 image 填充
    image.url = url;

    // 24行：把 PSD 内部的填充透明度（fillOpacity）应用到图像组件上，精确还原原 PSD 效果
    image.fillOpacity = layer.fillOpacity;

    // 25-26行：设置图像组件的宽高为图层 canvas 的实际像素宽高
    image.width = layer.canvas.width;
    image.height = layer.canvas.height;
  } // 27行：if 块结束

  return image; // 28行：返回配置完毕并包含图片像素数据的 [Image2](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/shapes/Image2.ts) 实例
} // 29行：parseImage 函数结束

// 31行：导出一个空的 imageUtil 对象，为后续工具方法扩展预留接口占位
export const imageUtil = {};
