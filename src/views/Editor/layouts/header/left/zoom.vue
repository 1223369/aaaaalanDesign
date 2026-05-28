<script setup lang="ts">
import NP from "number-precision";
// import { useEditor } from '@/views/Editor/app'
// const { canvas, keybinding } = useEditor()

const handleFitZoom = () => {
  // canvas.zoomToFit()
};

// 计算属性，根据number的值动态生成格式化的字符串
const formattedNumber = (val: any) => {
  if (Number.isInteger(val)) {
    return String(val); // 如果是整数，直接返回字符串形式
  } else {
    return NP.round(val, 2); // 如果有小数，使用 number-precision 的 round 方法保留两位小数
  }
};

// const openMenu
</script>

<template>
  <a-tooltip effect="dark" content="自适应画布" mini>
    <a-button ref="button" class="icon-btn px2!" @click="handleFitZoom">
      <icon-fullscreen />
    </a-button>
    <!-- <a-button ref="button" class="icon-btn px2!" @click="openMenu">
      {{ formattedNumber(NP.times(zoom, 100)) }}%
      <icon-down class="ml1" />
    </a-button> -->
  </a-tooltip>
</template>
