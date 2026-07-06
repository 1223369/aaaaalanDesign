<template>
  <div class="layout-box">
    <a-spin
      :loading="loading"
      dot
      class="flex items-center justify-center h-screen"
    >
      <a-layout style="height: 100%">
        <a-layout-header>
          <headerBar />
        </a-layout-header>
        <a-layout>
          <a-layout-content>
            <a-layout class="editor-box">
              <a-layout-content class="dea-main-container">
                <div style="background-color: #fff">
                  <!-- <canvas-edit/> -->
                </div>
              </a-layout-content>
              <footerBar />
            </a-layout>
          </a-layout-content>
        </a-layout>
      </a-layout>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import HeaderBar from "@/views/Editor/layouts/header/headerBar.vue";
import FooterBar from "@/views/Editor/layouts/footer/footerBar.vue";
const loading = ref(false);
</script>

<style scoped lang="less">
@import "./styles/layouts";
.editor-box {
  height: calc(100vh - @contentLayoutPadding*2);
}
.dea-main-container {
  background-color: #f1f2f4;
  max-width: 100%;
  padding: @contentLayoutPadding;
  overflow: hidden;
  height: 100%;
  position: relative;
}
/*马赛克背景样式，和.contentBox一起使用，用起来有点晃眼*/
.dea-main-container-wrap {
  --offsetX: 0px;
  --offsetY: 0px;
  --size: 14px;
  --color: #dedcdc;
  background-image:
    linear-gradient(
      45deg,
      var(--color) 25%,
      transparent 0,
      transparent 75%,
      var(--color) 0
    ),
    linear-gradient(
      45deg,
      var(--color) 25%,
      transparent 0,
      transparent 75%,
      var(--color) 0
    );
  background-position:
    var(--offsetX) var(--offsetY),
    calc(var(--size) + var(--offsetX)) calc(var(--size) + var(--offsetY));
  background-size: calc(var(--size) * 2) calc(var(--size) * 2);
}

.layout-box {
  height: 100vh;
  overflow: hidden;
}
</style>
