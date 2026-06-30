<script setup lang="ts">
import { Heart, ShoppingBag } from '@lucide/vue';
import type { Product } from '../types';
import { useCartStore } from '../stores/cart';
import { useToastStore } from '../stores/toast';
import { useWishlistStore } from '../stores/wishlist';

defineProps<{ product: Product }>();
const cart = useCartStore();
const toast = useToastStore();
const wishlist = useWishlistStore();

function add(product: Product) {
  cart.add(product);
  toast.show('Produit ajouté au panier.');
}

function discount(product: Product) {
  const oldPrice = Number(product.comparePrice || 0);
  const price = Number(product.price);
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}
</script>

<template>
  <article class="group border border-line bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lift">
    <div class="relative overflow-hidden bg-mist">
      <RouterLink :to="`/products/${product.slug}`">
        <img :src="product.image" :alt="product.name" class="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105" />
      </RouterLink>
      <div class="absolute left-3 top-3 flex flex-col gap-2">
        <span v-if="discount(product)" class="bg-ink px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">-{{ discount(product) }}%</span>
        <span class="px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]" :class="product.stock > 5 ? 'bg-white text-success' : 'bg-clay text-white'">
          {{ product.stock > 0 ? `${product.stock} restants` : 'Épuisé' }}
        </span>
      </div>
      <button
        class="absolute right-3 top-3 grid h-10 w-10 place-items-center bg-white/95 transition hover:bg-ink hover:text-white"
        :aria-label="wishlist.has(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'"
        @click="wishlist.toggle(product)"
      >
        <Heart class="h-5 w-5" :class="wishlist.has(product.id) ? 'fill-ink' : ''" />
      </button>
      <button
        class="absolute inset-x-3 bottom-3 translate-y-4 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.16em] opacity-0 shadow-soft transition duration-300 hover:bg-ink hover:text-white group-hover:translate-y-0 group-hover:opacity-100"
        :disabled="product.stock === 0"
        @click="add(product)"
      >
        Ajouter
      </button>
    </div>
    <div class="space-y-3 p-4">
      <div class="min-h-20">
        <p class="text-[11px] font-black uppercase tracking-[0.18em] text-bronze">{{ product.category?.name }}</p>
        <RouterLink :to="`/products/${product.slug}`" class="mt-2 block text-base font-black leading-tight hover:text-bronze">
          {{ product.name }}
        </RouterLink>
        <p class="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{{ product.shortDescription }}</p>
      </div>
      <div class="flex items-end justify-between gap-2">
        <div>
          <p class="text-lg font-black">{{ Number(product.price).toFixed(2) }} MAD</p>
          <p v-if="product.comparePrice" class="text-xs text-stone-400 line-through">
            {{ Number(product.comparePrice).toFixed(2) }} MAD
          </p>
        </div>
        <button class="grid h-11 w-11 place-items-center bg-ink text-white transition hover:bg-bronze" :disabled="product.stock === 0" @click="add(product)" aria-label="Ajouter au panier">
          <ShoppingBag class="h-5 w-5" />
        </button>
      </div>
    </div>
  </article>
</template>
