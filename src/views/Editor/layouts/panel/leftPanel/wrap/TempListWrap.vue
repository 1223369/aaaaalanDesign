<template>
  <div class="wrap">
    <search-header
      :cateList="cateList"
      v-model="keyword"
      @changeCate="changeCate"
      @search="onSearch"
    />

    <div class="temp-wrap">
      <comp-list-wrap
        @fetchData="fetchData"
        :data="page.dataList"
        :config="config"
        :noMore="page.noMore"
        max-height="calc(100vh - 115px)"
      >
        <template #item="{ item, url }">
          <div class="temp-item">
            <img v-if="url" :src="url" class="temp-item__img" :alt="item.name || ''" />
            <div v-else class="temp-item__placeholder">{{ item.name || "模板" }}</div>
          </div>
        </template>
      </comp-list-wrap>
    </div>
  </div>
</template>

<script setup lang="ts">
import usePageMixin from "@/views/Editor/layouts/panel/leftPanel/wrap/mixins/pageMixin";
import { queryTemplateList } from "@/api/editor/materials";
import CompListWrap from "./CompListWrap.vue";

const config = {
  imgSelector: "cover",
};

const SearchHeader = defineAsyncComponent(
  () => import("@/components/editorModules/searchHeader.vue"),
);

const keyword = ref();
const { page } = usePageMixin();

const cateList = reactive([
  { label: "全部", value: "-1" },
  { label: "风景图片", value: "1111" },
  { label: "插画图片", value: "1111" },
]);

const changeCate = (e: any) => {
  console.log("e=", e);
};

const onSearch = (value: any, ev: any) => {
  console.log("value=", value);
  console.log("keyword=", keyword.value);
  console.log("ev=", ev);
};

const fetchData = () => {
  if (page.noMore) return;
  // 只传分页参数，避免把 dataList 等响应式整包塞进请求
  const params = {
    pageNum: page.pageNum,
    pageSize: page.pageSize,
  };
  queryTemplateList(params)
    .then((res: any) => {
      // 拦截器成功时直接返回 { success, data }；兼容未拦截的 axios 原始结构
      const payload = res?.data?.records !== undefined ? res.data : res?.data?.data || res?.data;
      const newDataList = payload?.records || [];
      const total = payload?.total ?? 0;
      if (newDataList.length > 0) {
        page.dataList.push(...newDataList);
        page.pageNum += 1;
      }
      page.noMore = page.dataList.length >= total || newDataList.length === 0;
    })
    .catch((err) => {
      console.error("queryTemplateList error:", err);
      page.noMore = true;
    });
};
</script>

<style scoped lang="less">
.wrap {
  width: 100%;
  height: 100%;
}

.temp-wrap {
  width: 100%;
  height: calc(100vh - 115px);
}

.temp-item {
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  background: #f8fafc;
  cursor: pointer;

  &__img {
    width: 100%;
    display: block;
    object-fit: cover;
  }

  &__placeholder {
    width: 100%;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 12px;
    padding: 8px;
  }
}
</style>
