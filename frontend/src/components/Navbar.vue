<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Heart, Menu, Search, ShoppingBag, User, X } from '@lucide/vue';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { useCartStore } from '../stores/cart';
import { useWishlistStore } from '../stores/wishlist';
import type { Category } from '../types';

const auth = useAuthStore();
const cart = useCartStore();
const wishlist = useWishlistStore();
const router = useRouter();
const mobileOpen = ref(false);
const categoryOpen = ref(false);
const search = ref('');
const categories = ref<Category[]>([]);
const initials = computed(() => auth.user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '');

onMounted(async () => {
  try {
    const { data } = await api.get<Category[]>('/categories');
    categories.value = data;
  } catch {
    categories.value = [];
  }
});

function logout() {
  auth.logout();
  router.push('/');
}

function submitSearch() {
  const query = search.value.trim();
  mobileOpen.value = false;
  router.push({ path: '/products', query: query ? { search: query } : {} });
}
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 border-b border-line bg-porcelain/95 backdrop-blur-xl">
    <div class="bg-ink py-2 text-center text-xs font-bold uppercase tracking-[0.22em] text-white">
      Livraison gratuite en ville dès 900 MAD
    </div>
    <nav class="container-page flex h-20 items-center justify-between gap-4">
      <button class="grid h-11 w-11 place-items-center border border-line bg-white lg:hidden" @click="mobileOpen = true" aria-label="Ouvrir le menu">
        <Menu class="h-5 w-5" />
      </button>

      <RouterLink to="/" class="shrink-0">
        <span class="block text-2xl font-black tracking-[-0.04em]">ATLAS</span>
        <span class="-mt-1 block text-[10px] font-black uppercase tracking-[0.32em] text-bronze">Commerce</span>
      </RouterLink>

      <div class="hidden items-center gap-8 lg:flex">
        <div class="relative" @mouseenter="categoryOpen = true" @mouseleave="categoryOpen = false">
          <button class="text-sm font-black uppercase tracking-[0.18em] hover:text-bronze">Catégories</button>
          <div v-if="categoryOpen" class="absolute left-0 top-full grid w-[520px] grid-cols-2 gap-2 border border-line bg-white p-4 shadow-lift">
            <RouterLink v-for="category in categories" :key="category.id" :to="`/products?category=${category.slug}`" class="group border border-transparent p-4 hover:border-line hover:bg-paper">
              <span class="text-sm font-black">{{ category.name }}</span>
              <span class="mt-1 block text-xs text-stone-500">{{ category._count?.products ?? 0 }} produits sélectionnés</span>
            </RouterLink>
          </div>
        </div>
        <RouterLink class="text-sm font-black uppercase tracking-[0.18em] hover:text-bronze" to="/products">Boutique</RouterLink>
        <RouterLink v-if="auth.isAuthenticated" class="text-sm font-black uppercase tracking-[0.18em] hover:text-bronze" to="/orders">Commandes</RouterLink>
        <RouterLink v-if="auth.isAdmin" class="text-sm font-black uppercase tracking-[0.18em] hover:text-bronze" to="/admin">Administration</RouterLink>
      </div>

      <form class="hidden min-w-0 flex-1 max-w-md items-center border border-line bg-white lg:flex" @submit.prevent="submitSearch">
        <Search class="ml-4 h-4 w-4 text-stone-500" />
        <input v-model="search" class="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" placeholder="Rechercher un produit" />
      </form>

      <div class="flex items-center gap-2">
        <button class="relative grid h-11 w-11 place-items-center border border-line bg-white transition hover:border-ink" aria-label="Favoris">
          <Heart class="h-5 w-5" />
          <span v-if="wishlist.count" class="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">{{ wishlist.count }}</span>
        </button>
        <button class="relative grid h-11 w-11 place-items-center border border-line bg-white transition hover:border-ink" aria-label="Panier" @click="cart.drawerOpen = true">
          <ShoppingBag class="h-5 w-5" />
          <span v-if="cart.count" class="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">{{ cart.count }}</span>
        </button>
        <RouterLink v-if="!auth.isAuthenticated" class="hidden h-11 items-center gap-2 border border-line bg-white px-4 text-sm font-bold uppercase tracking-[0.14em] transition hover:border-ink md:flex" to="/login">
          <User class="h-4 w-4" /> Connexion
        </RouterLink>
        <button v-else class="hidden h-11 items-center gap-2 border border-line bg-white px-4 text-sm font-bold uppercase tracking-[0.14em] transition hover:border-ink md:flex" @click="logout">
          {{ initials }} Déconnexion
        </button>
      </div>
    </nav>

    <div v-if="mobileOpen" class="fixed inset-0 z-50 bg-ink/40 lg:hidden">
      <aside class="h-full w-[88%] max-w-sm bg-porcelain p-5 shadow-lift">
        <div class="flex items-center justify-between">
          <RouterLink to="/" class="text-2xl font-black tracking-[-0.04em]" @click="mobileOpen = false">ATLAS</RouterLink>
          <button class="grid h-11 w-11 place-items-center border border-line bg-white" @click="mobileOpen = false" aria-label="Fermer le menu">
            <X class="h-5 w-5" />
          </button>
        </div>
        <form class="mt-6 flex border border-line bg-white" @submit.prevent="submitSearch">
          <Search class="ml-4 mt-3.5 h-4 w-4 text-stone-500" />
          <input v-model="search" class="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" placeholder="Rechercher des produits" />
        </form>
        <div class="mt-8 grid gap-1">
          <RouterLink class="border-b border-line py-4 text-sm font-black uppercase tracking-[0.18em]" to="/products" @click="mobileOpen = false">Toute la boutique</RouterLink>
          <RouterLink v-for="category in categories" :key="category.id" class="border-b border-line py-4 text-sm font-black uppercase tracking-[0.18em]" :to="`/products?category=${category.slug}`" @click="mobileOpen = false">
            {{ category.name }}
          </RouterLink>
          <RouterLink v-if="auth.isAuthenticated" class="border-b border-line py-4 text-sm font-black uppercase tracking-[0.18em]" to="/orders" @click="mobileOpen = false">Commandes</RouterLink>
          <RouterLink v-if="auth.isAdmin" class="border-b border-line py-4 text-sm font-black uppercase tracking-[0.18em]" to="/admin" @click="mobileOpen = false">Administration</RouterLink>
          <RouterLink v-if="!auth.isAuthenticated" class="border-b border-line py-4 text-sm font-black uppercase tracking-[0.18em]" to="/login" @click="mobileOpen = false">Connexion</RouterLink>
          <button v-else class="border-b border-line py-4 text-left text-sm font-black uppercase tracking-[0.18em]" @click="logout">Déconnexion</button>
        </div>
      </aside>
    </div>
  </header>
</template>
