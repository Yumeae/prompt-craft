import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'
import LoginPage from '../components/LoginPage.vue'
import CreatePage from '../components/CreatePage.vue'
import EditPage from '../components/EditPage.vue'
import DetailPage from '../components/DetailPage.vue'
import ProfilePage from '../components/ProfilePage.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/create', name: 'create', component: CreatePage },
  { path: '/edit/:id', name: 'edit', component: EditPage },
  { path: '/detail/:id', name: 'detail', component: DetailPage },
  { path: '/profile', name: 'profile', component: ProfilePage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
