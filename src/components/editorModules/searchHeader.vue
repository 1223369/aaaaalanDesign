<template>
  <div class="search__wrap">
    <a-input-group>
      <a-dropdown
        v-if="cateList && cateList.length > 0"
        placement="bottom-start"
      >
        <div class="search__type">
          <icon-menu />
        </div>
        <template #content>
          <a-doption
            v-for="(item, index) in cateList"
            :key="index"
            @click.stop="action('changeCate', item, index)"
          >
            <span
              :class="[
                'cate__text',
                { 'cate--select': +currentIndex === index },
              ]"
              >{{ item.label }}</span
            >
          </a-doption>
        </template>
      </a-dropdown>
      <a-input-search
        v-model="searchValue"
        placeholder="输入关键词搜索"
        @search="onSearch"
      />
    </a-input-group>
  </div>
</template>

<script setup lang="ts">
import { IconMenu } from "@arco-design/web-vue/es/icon";

const state: any = reactive({
  searchValue: "",
  materialCates: [],
  currentIndex: 0,
});

const props = defineProps({
  cateList: {
    type: Array,
    default() {
      return [];
    },
  },
  currentIndex: {
    type: [Number, String],
    default() {
      return 0;
    },
  },
  searchValue: {
    type: String,
    default() {
      return "";
    },
  },
});

// emit事件
const emit = defineEmits(["update:modelValue", "search", "changeCate"]);

const action = (
  fn: "changeCate" | "search" | "update:modelValue",
  item: any,
  currentIndex: number | string,
) => {
  state.currentIndex = currentIndex;
  emit(fn, item, currentIndex);
};
const unwatch = watch(
  () => state.searchValue,
  () => {
    emit("update:modelValue", state.searchValue);
  },
);

if (props.cateList) {
  state.cateList = props.cateList;
  //   const { cate } = route.query
  //   cate && (state.currentIndex = cate)
  //   cate && action('change', state.materialCates[Number(cate)], Number(cate))
}

onBeforeUnmount(() => {
  unwatch();
});
</script>
