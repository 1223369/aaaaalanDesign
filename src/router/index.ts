import Home from '@/views/Home/home.vue'
import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: '',
      component: Home,
    }
  ]
})

export default router
