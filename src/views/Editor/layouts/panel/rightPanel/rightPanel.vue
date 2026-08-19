<template>
  <a-layout-sider class="sider-box active">
    <div ref="widgetPanel" id="s-widget-panel">
      <div ref="widgetWrap" class="s-widget-wrap">
        <div class="wrap" ref="tabBoxRef">
          <a-tabs default-active-key="1" class="" type="line" justify>
            <a-tab-pane key="1" title="设置">
              <setting />
            </a-tab-pane>
            <a-tab-pane key="2" title="图层">
              <!-- <layers /> -->
            </a-tab-pane>
          </a-tabs>
        </div>
      </div>
    </div>
  </a-layout-sider>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import Setting from "@/views/Editor/layouts/panel/rightPanel/setting.vue";
import { useResizeObserver } from "@vueuse/core";

const widgetWrap = ref<HTMLDivElement>();
const settingHeight = ref(0);

onMounted(() => {
  if (widgetWrap.value) {
    useResizeObserver(widgetWrap.value, (entries) => {
      const [entry] = entries;
      const { height } = entry.contentRect;
      settingHeight.value = height - 43;
    });
  }
});
</script>

<style lang="less" scoped>
@import "../../../styles/layouts";
.wrap {
  width: 100%;
  height: 100%;
}
@color1: #3e4651;
@menuWidth: 67px;
@maxMenuWidth: 200px;
@active-text-color: #2254f4;
.sider-box {
  width: @menuWidth !important;
  :deep(.arco-layout-sider-children) {
    overflow: initial;
  }
}
.sider-box.active {
  width: calc(@menuWidth + @maxMenuWidth) !important;
}
#s-widget-panel {
  transition: all 1s;
  display: flex;
  flex-direction: row;
  height: 100%;
  .s-widget-wrap {
    width: @maxMenuWidth + 65px;
    background-color: #fff;
    flex: 1;
    height: 100%;
  }
}
:deep(.arco-input-wrapper) {
  padding-right: 4px;
  padding-left: 6px;
  height: 28px;

  .arco-input {
    font-size: 12px !important;
  }

  .arco-input-suffix {
    padding-left: 6px;
  }
}
:deep(.arco-select-view-value) {
  line-height: initial !important;
  font-size: 12px !important;
}
:deep(.arco-select-view-suffix) {
  padding-left: 4px;
}

:deep(.arco-input-prefix) {
  padding-right: 0 !important;
  margin-right: 4px;
  justify-content: center;

  .arco-btn {
    height: 26px;
    width: 26px;
  }
}
</style>
