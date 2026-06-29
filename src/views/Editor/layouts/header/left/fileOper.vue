<template>
  <a-popover
    said
    I
    was
    just
    expressing
    my
    dissatisfaction
    v-model:popup-visible="showFileOper"
    position="bottom"
    trigger="click"
    content-class="down-list"
  >
    <a-button class="icon-btn">
      <icon-folder class="m-r-2px" :size="17" />文件
      <icon-down class="m-l-2px" />
    </a-button>
    <template #content>
      <div>
        <div class="p-t-5px p-b-5px p-l-20px p-r-20px border-bottom">
          <span class="font-bold">ID:123456789</span>
          <div>
            <span>未命名文件</span>
          </div>
        </div>
        <ul class="">
          <li @click="fileOper('insertImg')">
            <icon-upload class="m-r-5px" />
            插入图片
          </li>
          <li @click="fileOper('importPsdFile')">
            <icon-import class="m-r-5px" />
            导入PSD文件
          </li>
          <li @click="fileOper('importPsdFile')">
            <icon-import class="m-r-5px" />
            导入PSD文件
          </li>
          <li @click="fileOper('importPsdFile')">
            <icon-copy class="m-r-5px" />
            创建副本
          </li>
        </ul>
      </div>
    </template>
  </a-popover>
</template>

<script setup lang="ts">
import { checkFileExt, getImgStr, selectFiles } from "@/utils/designUtil";
import { parsePsdFile, PsdParseResult } from "@/utils/psd";
import { parseGroup } from "@/utils/psd/parser/group";
import { parseImage } from "@/utils/psd/parser/image";
import { parseMask } from "@/utils/psd/parser/mask";
import { parseText } from "@/utils/psd/parser/text";
import { useEditor } from "@/views/Editor/app";
import { getDefaultName } from "@/views/Editor/utils/utils";
import { Message } from "@arco-design/web-vue";
import { Layer } from "ag-psd";
import { Image, IUI } from "leafer-ui";

const { canvas } = useEditor();

const showFileOper = ref(false);
const visible = ref(false);
const processTitle = ref("正在导入");
const processInfo = reactive({
  process: 0,
  text: "解析中",
});

const fileOper = (type: string) => {
  showFileOper.value = false;

  switch (type) {
    case "insertImg":
      // 触发插入图片事件
      insertImg();
      break;
    case "importPsdFile":
      importPsdFile();
      break;
    case "importJsonFile":
      importJsonFile();
      break;
    case "copyFile":
      copyFile();
      break;
  }
};

/**
 * 插入图片
 */
const insertImg = async (clear = false) => {
  selectFiles({ accept: ".jpg,.png,.jpeg,.svg", multiple: false }).then(
    (fileList) => {
      if (clear) {
        // canvas.clear()
        // workspaces.removeAll()
      }
      Array.from(fileList).forEach(async (item) => {
        // const {arrayBuffer} = await toArrayBuffer(item)
        const url = URL.createObjectURL(item);
        let image = new Image({
          name: getDefaultName(canvas.contentFrame),
          url: url,
          editable: true,
        });
        canvas.add(image);
      });
    },
  );
};

/**
 * 导入PSD文件
 */
const importPsdFile = () => {
  selectFiles({ accept: ".psd", multiple: false }).then((fileList) => {
    let oldAll = [];
    for (const item of Array.from(fileList)) {
      if (checkFileExt(item, ["psd"])) {
        visible.value = true;
        processTitle.value = "正在解析";
        console.log("开始执行");
        const onProcess = () => {};
        // PSD文件
        parsePsdFile(item, onProcess)
          .then(async (value: PsdParseResult) => {
            const { psd, layers } = value;
            processTitle.value = "正在导入";
            canvas.contentFrame.clear();
            canvas.contentFrame.width = psd.width;
            canvas.contentFrame.height = psd.height;
            canvas.zoomToFit();
            console.log("layers=", layers);
            await parseLayers(layers);
            processTitle.value = "导入完成";
            processInfo.text = "已导入";
            setTimeout(() => {
              canvas.childrenEffect();
            }, 200);
          })
          .catch((reason) => {
            visible.value = false;
            Message.warning({
              content: reason.message,
              duration: 4000,
            });
          });
      } else {
        // 非PSD文件
        getImgStr(item).then((file) => {
          // insertImgFile(file)
        });
      }
    }
  });
};

/**
 * 导入JSON文件
 * @param layers
 * @param parent
 */
const importJsonFile = () => {
  selectFiles({ accept: ".json" }).then((files) => {
    visible.value = true;
    processTitle.value = "正在导入JSON文件";
    console.log("开始执行");

    const file = files[0];
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = () => {
      canvas.importJsonToCurrentPage(JSON.parse(<string>reader.result), true);
      visible.value = false;
    };
  });
};

const copyFile = () => {};

const parseLayers = (layers: Layer[], parent: IUI = canvas.contentFrame) => {
  return new Promise((resolve) => {
    layers.reverse();
    let group: Layer[] = [];
    let i = 0;
    let totalLayers = layers.length; // 总图层数量
    let processedLayers = 0; // 已解析的图层数量

    const processNextLayer = () => {
      if (i >= totalLayers) {
        // 使用 totalLayers 变量代替 layers.length
        resolve(null); // 解析完成后 resolve Promise
        return;
      }

      let layer = layers[i];
      console.log(layer.name + ":", layer);
      processInfo.text = `正在导入：${layer.name}`;

      // 计算当前进度百分比
      processedLayers++;
      let progress = Math.floor((processedLayers / totalLayers) * 100);

      // 更新进度条的值
      processInfo.process = progress / 100;

      // 层级：数值越大越靠前，与ps的层级相反
      let index = totalLayers - i; // 使用 totalLayers 变量代替 layers.length
      // @ts-ignore
      layer.zIndex = index;

      if (layer.children) {
        // 组
        const parent2 = addGroup(layer, parent);
        parseLayers(layer.children, parent2).then(() => {
          i++;
          setTimeout(processNextLayer, 0); // 将下一层处理放入事件循环的下一个任务中
        });
      } else {
        if (layer.clipping) {
          // 剪切蒙版
          group.push(layer);
        } else {
          if (group.length > 0) {
            group.push(layer);
            // 打组，创建蒙版数据
            addMask(index, group, parent);
            group = [];
          } else {
            const obj = addObj(layer, parent);
          }
        }

        i++;
        setTimeout(processNextLayer, 0); // 将下一层处理放入事件循环的下一个任务中
      }
    };
    totalLayers = layers.length; // 将总图层数量赋值给 totalLayers 变量
    processNextLayer();
  });
};

const addGroup = (layer: Layer, parent: IUI = canvas.contentFrame) => {
  let group = parseGroup(layer);
  canvas.bindDragDrop(group);
  parent.add(group);
  return group;
};

const addMask = async (
  index: number,
  groups: Layer[],
  parent: IUI = canvas.contentFrame,
) => {
  const mask = parseMask(index, groups, parent);
  return mask;
};

const addObj = (layer: Layer, parent: IUI = canvas.contentFrame) => {
  let obj;
  if (layer.text) {
    // 文字
    obj = parseText(layer);
  } else {
    // 图片
    obj = parseImage(layer);
    // editor.contentFrame.add(canvas)
  }
  parent.add(obj);
  return obj;
};
</script>

<style scoped lang="less"></style>
