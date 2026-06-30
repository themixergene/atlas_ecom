<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue';
import type { Category } from '../types';
const props = defineProps<{ category: Category; image?: string }>();
</script>

<template>
  <RouterLink
    :to="`/products?category=${category.slug}`"
    class="group relative block overflow-hidden border border-line bg-ink text-white shadow-sm"
  >
    <img v-if="props.image" :src="props.image" :alt="category.name" class="aspect-[4/3] w-full object-cover opacity-75 transition duration-700 group-hover:scale-105 group-hover:opacity-55" />
    <div v-else class="aspect-[4/3] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.22),transparent_28%),linear-gradient(135deg,#111,#596248)]"></div>
    <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"></div>
    <div class="absolute inset-x-0 bottom-0 p-5">
      <div class="mb-4 grid h-11 w-11 place-items-center border border-white/40 bg-white/10 backdrop-blur">
        <ArrowUpRight class="h-5 w-5" />
      </div>
      <p class="text-2xl font-black tracking-tight">{{ category.name }}</p>
      <p class="mt-1 text-sm text-white/75">{{ category._count?.products ?? 0 }} produits sélectionnés</p>
    </div>
  </RouterLink>
</template>
