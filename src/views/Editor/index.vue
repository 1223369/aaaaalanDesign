<template>
  <div class="layout-box">
    <a-spin :loading="loading" dot class="flex items-center justify-center h-screen" >
      <a-layout style="height: 100%; border: 1px solid red">
        <a-layout-header style="border: 1px solid red">Header</a-layout-header>
      </a-layout>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
const loading = ref(false)
</script>

<style scoped lang="less">
  .layout-box {
    // border: 1px solid red; 
    height: 100vh;
    overflow: hidden;
  }
</style>
