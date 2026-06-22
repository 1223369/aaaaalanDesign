/**
 * 获取文件后缀
 * @param file 文件
 */
export function getFileExt(file: File | Blob) {
  let fileExtension = "";
  if ("name" in file && file.name.lastIndexOf(".") > -1) {
    fileExtension = file.name.slice(file.name.lastIndexOf(".") + 1);
  }
  return fileExtension;
}

/**
 * @description: 选择文件
 * @param {Object} options accept = '', capture = '', multiple = false
 * @return {Promise}
 */
export function selectFiles(options: {
  accept?: string; // 限制可选的文件类型，如 '.png,.jpg' 或 'image/*'
  capture?: string; // 用于移动端，指定捕获媒体的源（如摄像头、麦克风）
  multiple?: boolean; // 是否允许多选文件，默认为 false
}): Promise<FileList | null> {
  // 返回一个 Promise，成功时解析为 FileList 对象或 null
  return new Promise((resolve) => {
    // 1. 调用 VueUse 的 useFileDialog，传入配置项，解构出监听函数 onChange 和打开窗口函数 open
    const { onChange, open } = useFileDialog(options);

    // 2. 注册文件选择变化的回调。当用户在系统弹窗中确认选择文件后，会触发此回调
    onChange((files) => {
      // 3. 将选择的文件列表（FileList）作为 Promise 的成功返回值返回
      resolve(files);
    });

    // 4. 执行 open()，立即拉起系统的文件选择弹窗
    open();
  });
}

/**
 * 判断文件类型是否在列表内
 * @param file 文件
 * @param fileTypes 文件类型数组
 */
export function checkFileExt(file: File | Blob, fileTypes: any | []) {
  const ext = getFileExt(file);
  const isTypeOk = fileTypes.some((type: string) => {
    if (file.type.indexOf(type) > -1) return true;
    if (ext && ext.indexOf(type) > -1) return true;
    return false;
  });
  return isTypeOk;
}

/**
 * @description: 图片文件转字符串
 * @param {Blob|File} file 文件
 * @return {String}
 */
export function getImgStr(file: File | Blob): Promise<FileReader["result"]> {
  return useBase64(file).promise.value;
}
export function blobToBase64(blob: Blob) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      // @ts-ignore
      resolve(e.target.result);
    };
    // readAsDataURL
    fileReader.readAsDataURL(blob);
    fileReader.onerror = () => {
      reject(new Error("blobToBase64 error"));
    };
  });
}
