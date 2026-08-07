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
                { 'cate--select': +state.currentIndex === index },
              ]"
              >{{ item?.label }}</span
            >
          </a-doption>
        </template>
      </a-dropdown>
      <a-input-search
        v-model="state.searchValue"
        placeholder="输入关键词搜索"
        @search="onSearch"
      />
    </a-input-group>
  </div>
</template>

<script setup lang="ts">
import { PropType } from "vue";
import { IconMenu } from "@arco-design/web-vue/es/icon";

export interface CateItem {
  label?: string;
  value?: string | number;
  [key: string]: any;
}

const state: any = reactive({
  searchValue: "",
  materialCates: [],
  currentIndex: 0,
});

const props = defineProps({
  cateList: {
    type: Array as PropType<CateItem[]>,
    default: (): CateItem[] => [],
  },
  currentIndex: {
    type: [Number, String],
    default: 0,
  },
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "search", "changeCate"]);

const action = (
  fn: "changeCate" | "search" | "update:modelValue",
  item: any,
  currentIndex: number | string,
) => {
  state.currentIndex = currentIndex;
  emit(fn, item, currentIndex);
};

const onSearch = (value: string) => {
  emit("search", value);
};

watch(
  () => props.modelValue,
  (val) => {
    if (val !== state.searchValue) {
      state.searchValue = val || "";
    }
  },
  { immediate: true },
);

watch(
  () => props.currentIndex,
  (val) => {
    state.currentIndex = val ?? 0;
  },
  { immediate: true },
);

const unwatch = watch(
  () => state.searchValue,
  () => {
    emit("update:modelValue", state.searchValue);
  },
);

if (props.cateList) {
  state.cateList = props.cateList;
}

onBeforeUnmount(() => {
  unwatch();
});
</script>

<style lang="less" scoped>
:deep(.el-input__suffix) {
  padding-top: 9px;
}

.search__wrap {
  padding: 16px 1rem 0rem 0rem;
  display: flex;
  cursor: pointer;
  justify-content: center;
}

.search {
  &__type {
    border: 1px solid #e8eaec;
    color: #666666;
    width: 44px;
    margin: 0 0.6rem 0 1rem;
    border-radius: 4px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 14px;

    .iconfont {
      font-size: 20px;
    }
  }

  &__type:hover {
    color: rgb(var(--primary-6));
  }
}

.cate {
  &__text {
    font-weight: bold;
  }

  &--select {
    color: rgb(var(--primary-6));
  }
}
</style>
