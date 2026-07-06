<template>
  <a-layout-footer class="dea-footer-page">
    <div class="bg-white page-box not-select">
      <a-space>
        <div
          class="page-view"
          v-for="(item, index) in workspacesData"
          @click="onSelect(item)"
          @contextmenu.stop="openContextMenu($event, item)"
          :class="{
            'page-selected':
              useEditor()?.workspaces?.getCurrentId() === item.id,
          }"
          :key="index"
        >
          <a-avatar class="page-ava" :size="30" shape="square">{{
            index + 1
          }}</a-avatar>
        </div>

        <div class="page-add page-view" @click="addOnClick">
          <icon-plus size="20" />
        </div>
      </a-space>
    </div>
  </a-layout-footer>
</template>
<script setup lang="ts">
import { IWorkspace } from "../../core/workspaces/workspacesService";
import { useEditor } from "@/views/Editor/app";
import ContextMenu from "@/components/contextMenu";

const workspacesData = ref<IWorkspace[]>([]);

const pages = computed(() => {
  return useEditor()?.canvas?.getPages() ?? new Map();
});

const updateWorkspaces = () => {
  const workspaces = useEditor()?.workspaces;
  if (!workspaces) return;
  workspacesData.value = workspaces.all().map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    cover: workspace.cover,
  }));
};

const onSelect = (item: IWorkspace) => {
  useEditor()?.workspaces?.setCurrentId(item.id.toString());
};

const openContextMenu = (e: MouseEvent, node: any) => {
  e.preventDefault();
  ContextMenu.showContextMenu({
    x: e.clientX,
    y: e.clientY,
    preserveIconWidth: false,
    items: [
      {
        label: "复制",
        onClick: async () => {
          if (!node.id) return;
          const editor = useEditor();
          if (!editor) return;
          const { workspaces, canvas } = editor;
          const workspace = workspaces.get(node.id.toString());
          if (!workspace) return;
          const id = workspaces.add(`${pages.value.size + 1}`);
          workspaces.setCurrentId(id);
          // 循序不能变， getPageJSON必须在setCurrentId之后执行，否则要复制的页面数据可能还未保存
          const json = canvas.getPageJSON(node.id);
          canvas.reLoadFromJSON(json);
        },
      },
      {
        label: "删除",
        disabled: (() => {
          const workspaces = useEditor()?.workspaces;
          return (
            !workspaces ||
            workspaces.size() <= 1 ||
            node.id === workspaces.getCurrentId()
          );
        })(),
        onClick: () => {
          if (!node.id) return;
          useEditor()?.workspaces?.remove(node.id.toString());
        },
        // divided: true,
      },
      // {
      //     label: '重命名',
      //     onClick: () => {
      //
      //     },
      // },
    ],
  });
};

const addOnClick = () => {
  const editor = useEditor();
  console.log("editor", editor);
  if (!editor) return;
  const { workspaces, canvas } = editor;
  workspaces.setCurrentId(workspaces.add(`${pages.value.size + 1}`));
  canvas.zoomToFit();
};

onMounted(() => {
  const event = useEditor()?.event;
  if (event) {
    event.on("workspaceChangeAfter", updateWorkspaces);
    event.on("workspaceAddAfter", updateWorkspaces);
    event.on("workspaceRemoveAfter", updateWorkspaces);
  }
  updateWorkspaces();
});

onUnmounted(() => {
  const event = useEditor()?.event;
  if (event) {
    event.off("workspaceChangeAfter", updateWorkspaces);
    event.off("workspaceAddAfter", updateWorkspaces);
    event.off("workspaceRemoveAfter", updateWorkspaces);
  }
});
</script>

<style lang="less" scoped>
@import "../../styles/layouts";

.dea-footer-page {
  background-color: #f1f2f4;
  padding: 10px 20px 10px 20px;
  height: @footerBoxHeight;
  overflow: auto;

  .page-box {
    padding: 0 5px;
    height: 100%;
    align-items: center;
    display: flex;
  }

  .page-view {
    cursor: pointer;
    border: 1px solid var(--color-neutral-4);
    border-radius: 5px;
    padding: 5px;
    height: calc(@footerBoxHeight - 30px);
    align-items: center;
    align-content: center;
    display: flex;
  }

  .page-selected {
    border-color: rgb(var(--primary-6));
  }

  .page-add {
    height: calc(@footerBoxHeight - 30px);
    width: calc(@footerBoxHeight - 30px);
    text-align: center;
    align-items: center;
    display: flex;
    align-content: center;
    justify-content: center;
  }

  .page-add:hover {
    color: rgb(var(--primary-6));
    border-color: rgb(var(--primary-6));
    cursor: pointer;
  }

  .page-ava {
    //background-color: #3370ff;
  }
}
</style>
