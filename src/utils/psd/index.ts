import { Layer, Psd, readPsd } from "ag-psd";
export interface PsdParseResult {
  psd: Psd;
  layers: Layer[];
}

/**
 * 解析psd文件
 * @param file
 * @param onProcess
 */

// 参数：file 为输入的 PSD 文件对象；onProcess 为解析过程中的进度/状态回调函数。
// 返回值：返回一个 Promise，解析成功后返回 类型的数据。
export async function parsePsdFile(
  file: File,
  onProcess: Function,
): Promise<PsdParseResult> {
  // 14行：返回一个新的 Promise 实例，以便使用 async/await 方式同步化调用
  return new Promise((resolve, reject) => {
    // 15行：实例化浏览器原生的 FileReader 对象，用于读取客户端文件内容
    const reader = new FileReader();

    // 17行：当 FileReader 成功将文件读取完毕时触发 onload 回调函数
    reader.onload = () => {
      // 18行：从 reader.result 获取读取到的文件二进制数据（类型为 ArrayBuffer）
      const arrayBuffer = reader.result;

      try {
        // 19行：进入异常捕获块，防止 PSD 文件损坏或格式不支持导致程序崩溃

        // 20-21行：使用 ag-psd 库的 readPsd 方法，将 ArrayBuffer 二进制流解析为结构化的 PSD 对象数据
        // @ts-ignore 用于忽略第三方库与 TypeScript 的某些类型不兼容警告
        const psd = readPsd(arrayBuffer);

        // 22行：调用传入的进度回调函数，通知外部“文件读取与初步解析已完成”
        onProcess();

        // 24行：提取 PSD 文件的根图层列表（对应 PSD 文件中的所有根文件夹和图层节点）
        const layers = psd.children;

        // 25行：成功解析，通过 resolve 返回包含 psd 头部信息和图层列表的对象
        resolve({ psd, layers });
      } catch (e) {
        // 26行：捕获解析过程中发生的异常错误
        console.error(e); // 27行：在控制台打印具体错误堆栈，方便开发者调试

        // 29-30行：判断错误信息中是否包含 "Color mode not supported: CMYK"
        // 因为前端的 canvas 等渲染引擎和大多数开源 PSD 解析库都不支持 CMYK 颜色模式
        // @ts-ignore 用于忽略 e.message 在 TS 默认 Error 类型下的缺失警告
        if (e.message.indexOf("Color mode not supported: CMYK") > -1) {
          // 若是 CMYK 模式，则拒绝 Promise 并返回友好的中文提示
          reject({
            message: "暂不支持CMYK色彩模式的文件，请先使用PS转换为RGB",
          });
        } else {
          // 31-33行：若为其他解析错误，直接将错误信息通过 reject 返回
          // @ts-ignore
          reject({ message: e.message });
        }
      }
    };

    // 37行：以二进制缓冲流（ArrayBuffer）的格式开始读取传入的 PSD 文件，读取完成后会触发 17 行的 onload
    reader.readAsArrayBuffer(file);
  });
}
