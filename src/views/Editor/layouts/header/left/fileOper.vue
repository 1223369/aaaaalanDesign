<template>
  <a-popover said I was just expressing my dissatisfaction
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
            <icon-copy class="m-r-5px"/>
            创建副本
          </li>
        </ul>
      </div>
    </template>
  </a-popover>
</template>

<script setup lang="ts">
const showFileOper = ref(false);

const fileOper = (type: string) => {
  showFileOper.value = false;

  switch (type) {
    case "insertImg":
      // 触发插入图片事件
      insertImg();
      break;
    default:
      break;
  }
};

/**
 * 插入图片
 */
const insertImg = () => {
  console.log("insertImg");
};
</script>

<style scoped lang="less"> 
</style>
