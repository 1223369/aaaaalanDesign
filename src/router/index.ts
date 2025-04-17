import Home from '@/views/Home/home.vue'
import Editor from '@/views/Editor/index.vue'
import CusComponents from '@/views/CusComponents/index.vue'
import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/editor',
      name: 'Editor',
      component: Editor,
    },
    {
      path: '/cusComponents',
      name: 'CusComponents',
      component: CusComponents,
    }
  ]
})

export default router
