import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/home/home.vue'
import Snake from '../views/snake/snake.vue'
import TcmHome from '../views/tcm/TcmHome.vue'
import TcmConfig from '../views/tcm/TcmConfig.vue'
import TcmStudy from '../views/tcm/TcmStudy.vue'

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
    },
    {
      path: '/tcm-study',
      name: 'tcm-home',
      component: TcmHome
    },
    {
      path: '/tcm-study/:bookId',
      name: 'tcm-config',
      component: TcmConfig
    },
    {
      path: '/tcm-study/:bookId/run',
      name: 'tcm-study',
      component: TcmStudy
    }
  ]
})

export default router
