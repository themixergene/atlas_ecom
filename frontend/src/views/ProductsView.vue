<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { SlidersHorizontal } from '@lucide/vue';
import { api } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import Pagination from '../components/Pagination.vue';
import ProductCard from '../components/ProductCard.vue';
import SearchBar from '../components/SearchBar.vue';
import type { Category, PaginatedProducts, Product } from '../types';

const route = useRoute();
const router = useRouter();
const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);
const search = ref(String(route.query.search || ''));
const category = ref(String(route.query.category || ''));
const sort = ref(String(route.query.sort || 'newest'));
const page = ref(Number(route.query.page || 1));
const pages = ref(1);

async function load() {
  loading.value = true;
  const { data } = await api.get<PaginatedProducts>('/products', {
    params: { search: search.value || undefined, category: category.value || undefined, sort: sort.value, page: page.value },
  });
  products.value = data.items;
  pages.value = data.meta.pages;
  loading.value = false;
}

function syncQuery() {
  router.replace({ query: { search: search.value || undefined, category: category.value || undefined, sort: sort.value, page: page.value } });
  void load();
}

onMounted(async () => {
  document.title = 'Collection | Atlas Commerce';
  const { data } = await api.get<Category[]>('/categories');
  categories.value = data;
  await load();
});

watch([search, category, sort], () => {
  page.value = 1;
  syncQuery();
});
</script>

<template>
  <section class="border-b border-line bg-ink py-14 text-white">
    <div class="container-page">
      <p class="eyebrow">Catalogue</p>
      <h1 class="mt-3 text-5xl font-black tracking-[-0.05em] md:text-7xl">Découvrez toute la collection.</h1>
      <p class="mt-5 max-w-2xl text-white/65">Consultez le stock, comparez les prix et ajoutez vos produits directement au panier.</p>
    </div>
  </section>

  <section class="container-page py-10">
    <div class="surface sticky top-28 z-20 grid gap-3 p-4 md:grid-cols-[1fr_220px_220px]">
      <SearchBar v-model="search" />
      <label class="relative">
        <SlidersHorizontal class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
        <select v-model="category" class="field appearance-none pl-11">
          <option value="">Toutes les catégories</option>
          <option v-for="item in categories" :key="item.id" :value="item.slug">{{ item.name }}</option>
        </select>
      </label>
      <select v-model="sort" class="field">
        <option value="newest">Plus récents</option>
        <option value="price_asc">Prix croissant</option>
        <option value="price_desc">Prix décroissant</option>
      </select>
    </div>
    <div class="mt-8 flex items-center justify-between border-b border-line pb-4">
      <p class="text-sm font-black uppercase tracking-[0.18em] text-stone-500">{{ products.length }} produits affichés</p>
      <p class="hidden text-sm text-stone-500 md:block">Stock et prix actualisés depuis le catalogue.</p>
    </div>
    <LoadingSpinner v-if="loading" />
    <div v-else class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
    <p v-if="!loading && products.length === 0" class="surface py-16 text-center font-semibold text-stone-600">Aucun produit ne correspond à vos filtres.</p>
    <Pagination :page="page" :pages="pages" @change="(next) => { page = next; syncQuery(); }" />
  </section>
</template>
