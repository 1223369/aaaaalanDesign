<template>
  <div class="layout-box">
    <a-spin :loading="loading" dot class="flex items-center justify-center h-screen" >
      <a-layout style="height: 100%">
        <a-layout-header>
          <headerBar />
        </a-layout-header>
      </a-layout>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/views/Editor/layouts/header/headerBar.vue'
const loading = ref(false)
</script>

<style scoped lang="less">
  .layout-box {
    // border: 1px solid red; 
    height: 100vh;
    overflow: hidden;
  }
</style>
