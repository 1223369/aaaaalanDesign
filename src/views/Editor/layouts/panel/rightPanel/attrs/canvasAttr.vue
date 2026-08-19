<template>
  <div>
    <div class="p2">
      <a-row :gutter="[4, 4]" align="center">
        <a-col :span="10">
          <SwipeNumber size="small" :min="0.5" label="宽" v-bind="width" />
        </a-col>
        <a-col :span="10">
          <SwipeNumber size="small" :min="0.5" label="高" v-bind="height" />
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import SwipeNumber from "@/components/swipeNumber/swipeNumber.vue";
import { useActiveObjectModel } from "@/views/Editor/hooks/useActiveObjectModel";

const width = useActiveObjectModel("width");
const height = useActiveObjectModel("height");
</script>
