/**
 * 配置选项接口，用于描述签名插件的各种配置参数
 */
export interface SignaturePluginOptions {
  // 目前暂时只限定画笔，提供后续扩展 如画矩形等
  type: "pen";
  config: {
    // 画笔颜色
    stroke?: string;
    // 画笔粗细
    strokeWidth?: number;
  };
  //todo 配置选项
}
