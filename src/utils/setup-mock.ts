/**
 * @function successResponseWrap
 * @description 包装成功响应结构，与 request 拦截器约定一致
 * @param data 业务数据
 */
export function successResponseWrap<T = unknown>(data: T) {
  return {
    success: true,
    code: 200,
    msg: "success",
    data,
    timestamp: String(Date.now()),
  };
}

/**
 * @function failResponseWrap
 * @description 包装失败响应结构
 * @param data 业务数据
 * @param msg 错误信息
 * @param code 状态码
 */
export function failResponseWrap<T = unknown>(data: T, msg = "error", code = 500) {
  return {
    success: false,
    code,
    msg,
    data,
    timestamp: String(Date.now()),
  };
}

/**
 * @function setupMock
 * @description 开发环境执行 mock 注册
 * @param options.setup mock 注册函数
 * @param options.mock 是否启用，默认 true
 */
export default function setupMock(options: { setup: () => void; mock?: boolean }) {
  const { setup, mock = true } = options;
  // 仅开发环境启用 mock，避免影响正式接口
  if (mock && import.meta.env.DEV) {
    setup();
  }
}
