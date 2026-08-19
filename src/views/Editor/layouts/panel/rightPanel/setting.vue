<template>
  <div ref="splitRef" class="ovf">
    <div>
      <template v-for="(com, index) in componentList" :key="com.name">
        <template v-if="com.visual">
          <a-divider v-if="index !== 0" :margin="0" />
          <component :is="com.component" />
        </template>
      </template>
      <!-- <template v-for="(com, index) in pluginSolts" :key="index">
        <a-divider v-if="index !== com.length - 1" :margin="0" />
        <component :is="com" />
      </template> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useEditor } from "@/views/Editor/app";
import CanvasAttr from "./attrs/canvasAttr.vue";
import { typeUtil } from "@/views/Editor/utils/utils";

const componentList = computed(() => {
  const editorApi = useEditor();
  const activeObject = editorApi?.editor?.activeObject?.value;
  return [
    {
      name: "CanvasAttr",
      component: CanvasAttr,
      visual: typeUtil.isBottomCanvas(activeObject),
    },
  ];
});
</script>
