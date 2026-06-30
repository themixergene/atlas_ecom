<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ArrowRight, BadgeCheck, Headphones, RotateCcw, Truck } from '@lucide/vue';
import { api } from '../api/client';
import CategoryCard from '../components/CategoryCard.vue';
import ProductCard from '../components/ProductCard.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import type { Category, PaginatedProducts, Product } from '../types';

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);
const newArrivals = computed(() => [...products.value].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 4));
const bestSellers = computed(() => products.value.slice(4, 8).length ? products.value.slice(4, 8) : products.value.slice(0, 4));
const heroProducts = computed(() => products.value.slice(0, 3));

function categoryImage(category: Category) {
  return products.value.find((product) => product.categoryId === category.id)?.image;
}

onMounted(async () => {
  document.title = 'Atlas Commerce | L’essentiel du commerce moderne';
  const [productResponse, categoryResponse] = await Promise.all([
    api.get<PaginatedProducts>('/products', { params: { featured: true, limit: 12 } }),
    api.get<Category[]>('/categories'),
  ]);
  products.value = productResponse.data.items;
  categories.value = categoryResponse.data;
  loading.value = false;
});
</script>

<template>
  <section class="bg-ink text-white">
    <div class="container-page grid min-h-[620px] items-center gap-10 py-12 lg:grid-cols-[.9fr_1.1fr]">
      <div class="relative z-10">
        <p class="eyebrow text-bronze">Les essentiels de la saison</p>
        <h1 class="mt-5 max-w-3xl text-6xl font-black leading-[0.9] tracking-[-0.07em] md:text-8xl">Pensés pour votre quotidien.</h1>
        <p class="mt-6 max-w-xl text-lg leading-8 text-white/70">
          Une façon plus simple d’acheter des appareils électroniques, accessoires et équipements pour la maison, avec confirmation WhatsApp et paiement à la livraison.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <RouterLink class="btn-primary bg-white text-ink hover:bg-bronze hover:text-white" to="/products">
            Voir la collection <ArrowRight class="h-4 w-4" />
          </RouterLink>
          <RouterLink class="btn-secondary border-white text-white hover:bg-white hover:text-ink" to="/products?sort=price_desc">Meilleures ventes</RouterLink>
        </div>
        <div class="mt-10 grid max-w-lg grid-cols-3 border-y border-white/15 py-5 text-sm">
          <div><p class="text-2xl font-black">20+</p><p class="text-white/55">Produits</p></div>
          <div><p class="text-2xl font-black">24h</p><p class="text-white/55">Confirmation</p></div>
          <div><p class="text-2xl font-black">À la livraison</p><p class="text-white/55">Paiement</p></div>
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-3">
        <RouterLink
          v-for="(product, index) in heroProducts"
          :key="product.id"
          :to="`/products/${product.slug}`"
          class="group relative overflow-hidden border border-white/15 bg-white/5"
          :class="index === 1 ? 'sm:mt-12' : index === 2 ? 'sm:mt-24' : ''"
        >
          <img :src="product.image" :alt="product.name" class="h-[420px] w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-75" />
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-white/60">{{ product.category?.name }}</p>
            <p class="mt-2 font-black">{{ product.name }}</p>
            <p class="mt-1 text-sm text-white/75">{{ Number(product.price).toFixed(2) }} MAD</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>

  <LoadingSpinner v-if="loading" />

  <template v-else>
    <section class="container-page py-16">
      <div class="mb-8 flex items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Acheter par univers</p>
          <h2 class="section-title mt-2">Catégories sélectionnées</h2>
        </div>
        <RouterLink class="hidden font-black uppercase tracking-[0.16em] hover:text-bronze md:block" to="/products">Tout explorer</RouterLink>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <CategoryCard v-for="category in categories" :key="category.id" :category="category" :image="categoryImage(category)" />
      </div>
    </section>

    <section class="bg-white py-16">
      <div class="container-page">
        <div class="mb-8 flex items-end justify-between">
          <div>
            <p class="eyebrow">Produits en vedette</p>
            <h2 class="section-title mt-2">Notre sélection</h2>
          </div>
          <RouterLink class="font-black uppercase tracking-[0.16em] hover:text-bronze" to="/products">Voir la collection</RouterLink>
        </div>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ProductCard v-for="product in products.slice(0, 8)" :key="product.id" :product="product" />
        </div>
      </div>
    </section>

    <section class="container-page py-16">
      <div class="grid gap-10 lg:grid-cols-[.85fr_1.15fr]">
        <div class="sticky top-32 h-fit">
          <p class="eyebrow">Meilleures ventes</p>
          <h2 class="section-title mt-2">Les favoris, prêts à commander.</h2>
          <p class="mt-5 max-w-md leading-7 text-stone-600">Des produits très demandés, disponibles en stock, avec des prix clairs et une confirmation rapide sur WhatsApp.</p>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <ProductCard v-for="product in bestSellers" :key="product.id" :product="product" />
        </div>
      </div>
    </section>

    <section class="bg-mist py-16">
      <div class="container-page">
        <div class="mb-8">
          <p class="eyebrow">Nouveautés</p>
          <h2 class="section-title mt-2">Tout juste arrivés</h2>
        </div>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ProductCard v-for="product in newArrivals" :key="product.id" :product="product" />
        </div>
      </div>
    </section>

    <section class="container-page grid gap-0 py-16 md:grid-cols-4">
      <div v-for="benefit in [
        { title: 'Livraison rapide', text: 'Préparation rapide après confirmation de la commande.', icon: Truck },
        { title: 'Achat sécurisé', text: 'Commandes liées au compte et administration protégée.', icon: BadgeCheck },
        { title: 'Service client', text: 'Communication claire sur WhatsApp dès la commande.', icon: Headphones },
        { title: 'Retours faciles', text: 'Une assistance simple après votre achat.', icon: RotateCcw }
      ]" :key="benefit.title" class="border border-line bg-white p-6">
        <component :is="benefit.icon" class="h-7 w-7 text-bronze" />
        <p class="mt-5 text-lg font-black">{{ benefit.title }}</p>
        <p class="mt-2 text-sm leading-6 text-stone-600">{{ benefit.text }}</p>
      </div>
    </section>

    <section class="bg-ink py-16 text-white">
      <div class="container-page grid gap-8 md:grid-cols-[1fr_.9fr] md:items-center">
        <div>
          <p class="eyebrow">Liste privée</p>
          <h2 class="mt-3 text-4xl font-black tracking-tight md:text-6xl">Découvrez les nouveautés en premier.</h2>
          <p class="mt-4 max-w-xl text-white/65">Recevez les alertes de lancement, promotions limitées et notifications de retour en stock.</p>
        </div>
        <form class="grid gap-3 sm:grid-cols-[1fr_auto]" @submit.prevent>
          <input class="field border-white/15 bg-white text-ink" type="email" placeholder="Adresse e-mail" />
          <button class="btn-primary bg-bronze hover:bg-white hover:text-ink">S’inscrire</button>
        </form>
      </div>
    </section>
  </template>
</template>
