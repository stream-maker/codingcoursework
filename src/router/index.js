import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/home/home.vue'
import Snake from '../views/snake/snake.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/game',
      name: 'game',
      component: Snake
    }
  ]
})

export default router
