import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/products', name: 'products', component: () => import('../views/ProductsView.vue') },
    { path: '/products/:slug', name: 'product', component: () => import('../views/ProductDetailsView.vue') },
    { path: '/cart', name: 'cart', component: () => import('../views/CartView.vue') },
    { path: '/checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue') },
    { path: '/orders', name: 'orders', meta: { auth: true }, component: () => import('../views/OrdersView.vue') },
    { path: '/admin', name: 'admin', meta: { auth: true, admin: true }, component: () => import('../views/admin/AdminView.vue') },
    { path: '/admin/product-research', name: 'admin-product-research', meta: { auth: true, admin: true }, component: () => import('../views/admin/AdminView.vue') },
    { path: '/admin/ads', name: 'admin-ads', meta: { auth: true, admin: true }, component: () => import('../views/admin/AdminView.vue') },
    { path: '/admin/competitor-intelligence', name: 'admin-competitor-intelligence', meta: { auth: true, admin: true }, component: () => import('../views/admin/AdminView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.auth && !auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } };
  if (to.meta.admin && !auth.isAdmin) return { name: 'home' };
  return true;
});

export default router;
