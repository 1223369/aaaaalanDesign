<template>
  <a-space size="mini">
    <a-tooltip effect="dark" content="撤销" mini>
      <a-button class="icon-btn pd-5px" @click="undo()">
        <icon-undo :size="18" />
      </a-button>
    </a-tooltip>
    <a-tooltip effect="dark" content="恢复" mini>
      <a-button class="icon-btn pd-5px" @click="redo()">
        <icon-redo :size="18" />
      </a-button>
    </a-tooltip>
  </a-space>
</template>

<script setup lang="ts">
import { useEditor } from "@/views/Editor/app";

const { canvas, keybinding, undoRedo } = useEditor();
const undo = () => {
  keybinding.trigger("mod+z");
};

const redo = () => {
  keybinding.trigger("mod+y");
};
</script>

<style scoped lang="less"></style>
