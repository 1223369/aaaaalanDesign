<template>
    <a-space>
        <DropdownButton v-for="(button, index) in editToolList" :key="button.key" :active="activeTool === button.key"
            @click="onClick(button.key)" @select="
                (value) => {
                    onSelect(index, value);
                }
            ">
            <SvgIcon :name="button.icon" />
             <template #content v-if="button.doption">
                <a-doption v-for="doption in button.doption" :key="doption.key" :value="doption">
                    <template #icon>
                        <SvgIcon :name="doption.icon"/>
                    </template>
                    {{ doption.name }}
                </a-doption>
            </template>
        </DropdownButton>
    </a-space>
</template>

<script setup lang="ts">
import SvgIcon from '@/components/svgIcon'
import DropdownButton from "@/components/dropdown/dropdown.vue";
import type { EditTool } from "app";
import { useAppStore } from "@/store/index";

const { activeTool } = storeToRefs(useAppStore());

type EditToolListItem = {
    key: EditTool;
    icon: string;
    name: string;
};

type EditToolList = (EditToolListItem & {
    doption?: EditToolListItem[];
})[];

const editToolList = ref<EditToolList>(<
    (EditToolListItem & { doption?: EditToolListItem[] })[]
    >[
        {
            key: "select",
            icon: "bxs-pointer",
            name: "选择工具",
            doption: [
                {
                    key: "select",
                    icon: "bxs-pointer",
                    name: "选择工具",
                },
                {
                    key: "handMove",
                    icon: "bxs-hand",
                    name: "移动视图",
                },
            ],
        },
        {
            key: "pen",
            icon: "bx-pen",
            name: "钢笔",
        },
    ]);

const onClick = (key: EditTool) => {
};

const onSelect = (index: number, value: any) => {
    console.log("index", index);
    console.log("value", value);
};
</script>
