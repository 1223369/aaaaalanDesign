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
        <a-col :span="16">
          <a-checkbox v-model="overflowCheck">超出画布隐藏</a-checkbox>
        </a-col>
      </a-row>
    </div>
    <panel title="背景" @click-add="addFill">
      <a-space direction="vertical">
        <a-row :gutter="[8, 4]" v-for="(item, index) in fillArray" :key="index">
          <a-col :span="20">
            <a-col :span="20">
              <a-input
                size="mini"
                :model-value="formatValue(index)"
                :readonly="readonly"
                @change="changeColor"
                class="pl0!"
              >
                <template #prefix>
                  <a-button
                    size="mini"
                    class="icon-btn"
                    @click="openColorPicker(index)"
                  >
                    <template #icon>
                      <div v-bind="colorBlock(index)"></div>
                    </template>
                  </a-button>
                </template>
              </a-input>
            </a-col>
          </a-col>
        </a-row>
      </a-space>
    </panel>
  </div>
</template>

<script setup lang="ts">
import SwipeNumber from "@/components/swipeNumber/swipeNumber.vue";
import { useActiveObjectModel } from "@/views/Editor/hooks/useActiveObjectModel";
import Panel from "./panel.vue";

const width = useActiveObjectModel("width");
const height = useActiveObjectModel("height");
const overflow = useActiveObjectModel("overflow");
const fill = useActiveObjectModel("fill");

const overflowCheck = ref(false);
const fillArray = ref([]);

const refreshFill = () => {
  fill.value.onChange([]);
  fill.value.onChange(fillArray.value.length <= 0 ? [] : fillArray.value);
};
const addFill = () => {
  fill.value.onChange([]);
  fillArray.value.push({
    type: "solid",
    color: "rgba(151,151,151,1)",
  });
  refreshFill();
};

const removeFill = (index: any) => {
  fillArray.value.splice(index, 1);
  refreshFill();
};

watchEffect(() => {
  if (fill.value.modelValue) {
    fillArray.value = <any>fill.value.modelValue;
  } else {
    fillArray.value = [];
  }
});

watchEffect(() => {
  if (overflow.value.modelValue === "hide") {
    overflowCheck.value = true;
  } else {
    overflowCheck.value = false;
  }
});

watchEffect(() => {
  if (overflowCheck.value) {
    overflow.value.onChange("hide");
  } else {
    overflow.value.onChange("show");
  }
});
</script>
