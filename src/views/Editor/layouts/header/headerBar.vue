<template>
  <div class="header-box">
    <div class="flex items-center h-40px px-2 header-bar">
      <!-- 左侧logo/工具 -->
      <div class="flex-1 flex items-center">
        <img
          src="/public/logo.png"
          alt=""
          style="width: 30px; border-radius: 25%"
        />
        <div class="text-center px-5px">
          <div style="width: max-content">
            <span class="black font-bold">aaaaalanDesign</span>
          </div>
        </div>
        <a-divider direction="vertical" />
        <file-oper />
        <a-divider direction="vertical" />
        <undo />
        <a-divider direction="vertical" />
        <a-space size="medium">
          <a-tooltip effect="dark" content="标尺" mini>
            <a-button class="icon-btn pd-5px" @click="changeLineGuides">
              <icon-paste :size="18" />
            </a-button>
          </a-tooltip>
        </a-space>
        <a-divider direction="vertical" />
        <operation />
        <a-divider direction="vertical" />
        <zoom />
      </div>
      <div class="truncate"></div>

      <div class="flex-1 flex justify-center">
        <div class="truncate">
          <tool-bar />
        </div>
      </div>
      <div class="flex-1 flex justify-end">
        <save-oper />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileOper from "./left/fileOper.vue";
import Undo from "./left/undo.vue";
import Operation from "./left/operation.vue";
import Zoom from "./left/zoom.vue";
import ToolBar from "./center/toolBar.vue";
import SaveOper from "./right/saveOper.vue";

const changeLineGuides = () => {
  console.log("切换标尺");
};
</script>

<style lang="less">
@import "../../styles/layouts";

.header-box {
  height: @headerBoxHeight;
}

.header-bar {
  border-bottom: 1px solid var(--color-border);
  border-radius: 2px 2px 0 0;
}

.down-list {
  padding: 0 !important;
  margin: 0 !important;
  min-width: 200px;

  ul {
    padding: 0;
    margin: 5px 0;
    list-style: none;
  }

  li {
    padding: 0 20px;
    cursor: pointer;
    color: #1b2337;
    display: block;
    font-size: 14px;
    line-height: 40px;
    overflow: hidden;
    position: relative;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  li:hover {
    cursor: pointer;
    background-color: #f1f2f4;
  }
}
</style>
