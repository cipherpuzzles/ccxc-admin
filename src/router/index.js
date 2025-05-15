import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import UserBackend from '../views/UserBackend.vue'
import Overview from '../views/Overview.vue'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

// 懒加载其他页面组件
const User = () => import('../views/User.vue')
const LoginLog = () => import('../views/LoginLog.vue')
const Announcement = () => import('../views/Announcement.vue')
const Article = () => import('../views/Article.vue')
const Group = () => import('../views/Group.vue')
const AnswerLog = () => import('../views/AnswerLog.vue')
const Message = () => import('../views/Message.vue')
const Oracle = () => import('../views/Oracle.vue')
const BasicSetting = () => import('../views/BasicSetting.vue')
const PuzzleGroup = () => import('../views/PuzzleGroup.vue')
const Puzzle = () => import('../views/Puzzle.vue')
const PuzzleArticle = () => import('../views/PuzzleArticle.vue')
const PuzzleScript = () => import('../views/PuzzleScript.vue')
const CachePurge = () => import('../views/CachePurge.vue')
const SystemSettings = () => import('../views/SystemSettings.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/userbackend',
      name: 'userbackend',
      component: UserBackend,
      children: [
        {
          path: '',
          name: 'overview',
          component: Overview
        },
        {
          path: 'user',
          name: 'user',
          component: User
        },
        {
          path: 'loginlog',
          name: 'loginlog',
          component: LoginLog
        },
        {
          path: 'announcement',
          name: 'announcement',
          component: Announcement
        },
        {
          path: 'article',
          name: 'article',
          component: Article
        },
        {
          path: 'group',
          name: 'group',
          component: Group
        },
        {
          path: 'answerlog',
          name: 'answerlog',
          component: AnswerLog
        },
        {
          path: 'message',
          name: 'message',
          component: Message
        },
        {
          path: 'oracle',
          name: 'oracle',
          component: Oracle
        },
        {
          path: 'basicsetting',
          name: 'basicsetting',
          component: BasicSetting
        },
        {
          path: 'puzzlegroup',
          name: 'puzzlegroup',
          component: PuzzleGroup
        },
        {
          path: 'puzzle',
          name: 'puzzle',
          component: Puzzle
        },
        {
          path: 'puzzlearticle',
          name: 'puzzlearticle',
          component: PuzzleArticle
        },
        {
          path: 'puzzlescript',
          name: 'puzzlescript',
          component: PuzzleScript
        },
        {
          path: 'cachepurge',
          name: 'cachepurge',
          component: CachePurge
        },
        {
          path: 'systemsettings',
          name: 'systemsettings',
          component: SystemSettings
        }
      ]
    },
    {
      path: '/ssologin',
      name: 'ssologin',
      component: () => import('@/views/SSOLogin.vue')
    },
    {
      path: '/error',
      name: 'error',
      component: () => import('@/views/Error.vue'),
      props: (route) => ({
        title: route.query.title || '错误',
        subTitle: route.query.message || '发生未知错误',
        code: route.query.code || '',
        status: route.query.status || 'error'
      })
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 检查是否是后台页面
  if (to.path.startsWith('/userbackend')) {
    // 首先检查是否登录
    if (!userStore.isLoggedIn()) {
        // 通过API获取SSO前缀
        const ssoPrefixResponse = await axios.get(import.meta.env.VITE_BACKEND_ROOT + '/v1/get-sso-prefix')
        const frontEndRoot = ssoPrefixResponse.data.prefix
        const redirectUrl = encodeURIComponent(window.location.protocol + "//" + window.location.host + "/ssologin")
        window.location.href = `${frontEndRoot}/user/sso?app=ccxc&token=sso-from-backend&redirect=${redirectUrl}`
        return
    }
    
    // 检查用户角色
    if (userStore.roleid !== 4 && userStore.roleid !== 5) {
      next({
        path: '/error',
        query: {
          title: '无法访问',
          message: '您没有权限访问管理后台',
          code: '403',
          status: '403'
        }
      })
      return
    }
  }
  
  next()
})

export default router 