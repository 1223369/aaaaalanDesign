<template>
  <div class="wrap">
    <a-scrollbar
      :style="{ height: listHeight, overflow: 'auto' }"
      @scroll="onScroll"
    >
      <div class="list-inner">
        <Waterfall
          :list="props.data"
          :row-key="config.rowKey"
          :gutter="config.gutter"
          :has-around-gutter="config.hasAroundGutter"
          :width="config.width"
          :breakpoints="config.breakpoints"
          :img-selector="config.imgSelector"
          :background-color="config.backgroundColor"
          :animation-effect="config.animationEffect"
          :animation-duration="config.animationDuration"
          :animation-delay="config.animationDelay"
          :lazyload="config.lazyload"
          :load-props="config.loadProps"
          :cross-origin="config.crossOrigin"
          :delay="config.delay"
        >
          <template #item="{ item, url, index }">
            <slot name="item" :item="item" :index="index" :url="url"></slot>
          </template>
        </Waterfall>
        <div class="scroll-loading">
          <div v-if="props.noMore">没有更多了</div>
          <a-spin v-else />
        </div>
      </div>
    </a-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Waterfall } from "@/components/vue-waterfall-plugin-next";
import loading from "@/assets/icons/loading.svg";

const waterfallOptions = {
  rowKey: "id",
  gutter: 2,
  hasAroundGutter: true,
  width: 320,
  breakpoints: {
    1200: { rowPerView: 4 },
    800: { rowPerView: 3 },
    500: { rowPerView: 2 },
  },
  animationEffect: "animate__fadeInUp",
  animationDuration: 1000,
  animationDelay: 0,
  delay: 50,
  backgroundColor: "#fff",
  imgSelector: "url",
  loadProps: {
    loading,
    error: loading,
  },
  lazyload: true,
  crossOrigin: true,
};

const props = withDefaults(
  defineProps<{
    data: any;
    config?: Record<string, any>;
    maxHeight?: string | number;
    noMore?: boolean;
  }>(),
  {
    config: () => ({}),
    maxHeight: "calc(100vh - 115px)",
    noMore: false,
  },
);

const listHeight = computed(() => {
  const h = props.maxHeight;
  return typeof h === "number" ? `${h}px` : h;
});

const config = computed(() => {
  return Object.assign({}, waterfallOptions, props.config);
});

const emits = defineEmits(["fetchData"]);

const onScroll = (e: Event) => {
  if (props.noMore) return;
  const el = e.target as HTMLElement;
  if (!el) return;
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
  if (distance <= 40) {
    emits("fetchData");
  }
};
</script>

<style lang="less" scoped>
@import "../../../../styles/layouts";

.wrap {
  width: 100%;
  height: 100%;
  min-width: @leftPanelWidth;
}

.list-inner {
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
}

.scroll-loading {
  padding: 12px 0 24px;
  text-align: center;
  font-size: 13px;
  color: #999;
}
</style>
