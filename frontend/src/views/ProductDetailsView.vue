<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Minus, Plus, ShieldCheck, Star, Truck } from '@lucide/vue';
import { api } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ProductCard from '../components/ProductCard.vue';
import { useCartStore } from '../stores/cart';
import { useToastStore } from '../stores/toast';
import type { PaginatedProducts, Product } from '../types';

const route = useRoute();
const cart = useCartStore();
const toast = useToastStore();
const product = ref<Product | null>(null);
const similar = ref<Product[]>([]);
const quantity = ref(1);
const activeImage = ref('');
const gallery = computed(() => product.value ? [product.value.image, ...product.value.galleryImages].filter(Boolean) : []);

async function loadProduct() {
  const { data } = await api.get<Product>(`/products/${route.params.slug}`);
  product.value = data;
  activeImage.value = data.image;
  document.title = `${data.name} | Atlas Commerce`;
  const response = await api.get<PaginatedProducts>('/products', { params: { category: data.category?.slug, limit: 5 } });
  similar.value = response.data.items.filter((item) => item.id !== data.id).slice(0, 4);
}

onMounted(loadProduct);
watch(() => route.params.slug, () => void loadProduct());

function add() {
  if (!product.value) return;
  cart.add(product.value, quantity.value);
  toast.show('Produit ajouté au panier.');
}
</script>

<template>
  <LoadingSpinner v-if="!product" />
  <template v-else>
    <section class="container-page grid gap-10 py-10 lg:grid-cols-[1.08fr_.92fr]">
      <div class="grid gap-4 lg:grid-cols-[96px_1fr]">
        <div class="order-2 flex gap-3 overflow-auto lg:order-1 lg:block lg:space-y-3">
          <button v-for="image in gallery" :key="image" class="shrink-0 border bg-white p-1 transition" :class="activeImage === image ? 'border-ink' : 'border-line'" @click="activeImage = image">
            <img :src="image" :alt="product.name" class="h-20 w-20 object-cover" />
          </button>
        </div>
        <div class="group order-1 overflow-hidden border border-line bg-white lg:order-2">
          <img :src="activeImage" :alt="product.name" class="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-110" />
        </div>
      </div>
      <div class="lg:sticky lg:top-32 lg:h-fit">
        <p class="eyebrow">{{ product.category?.name }}</p>
        <h1 class="mt-3 text-4xl font-black leading-none tracking-[-0.04em] md:text-6xl">{{ product.name }}</h1>
        <div class="mt-5 flex items-center gap-2">
          <Star v-for="item in 5" :key="item" class="h-4 w-4 fill-bronze text-bronze" />
          <span class="text-sm font-semibold text-stone-600">Note de 4,8 · avis clients vérifiés</span>
        </div>
        <p class="mt-6 text-lg leading-8 text-stone-600">{{ product.description }}</p>
        <div class="mt-8 flex items-end gap-4 border-y border-line py-6">
          <p class="text-4xl font-black">{{ Number(product.price).toFixed(2) }} MAD</p>
          <p v-if="product.comparePrice" class="text-lg text-stone-400 line-through">{{ Number(product.comparePrice).toFixed(2) }} MAD</p>
        </div>
        <p class="mt-4 text-sm font-black uppercase tracking-[0.18em]" :class="product.stock > 0 ? 'text-success' : 'text-danger'">
          {{ product.stock > 0 ? `${product.stock} unités disponibles` : 'Épuisé' }}
        </p>
        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <div class="flex h-14 border border-line bg-white">
            <button class="grid w-14 place-items-center hover:bg-paper" @click="quantity = Math.max(1, quantity - 1)" aria-label="Diminuer la quantité"><Minus class="h-5 w-5" /></button>
            <span class="grid w-14 place-items-center border-x border-line font-black">{{ quantity }}</span>
            <button class="grid w-14 place-items-center hover:bg-paper" @click="quantity = Math.min(product.stock, quantity + 1)" aria-label="Augmenter la quantité"><Plus class="h-5 w-5" /></button>
          </div>
          <button class="btn-primary flex-1" :disabled="product.stock === 0" @click="add">Ajouter au panier</button>
        </div>
        <div class="mt-8 grid gap-3 sm:grid-cols-2">
          <div class="surface p-4"><Truck class="h-5 w-5 text-bronze" /><p class="mt-3 font-black">Livraison locale rapide</p><p class="mt-1 text-sm text-stone-600">Confirmée après la commande WhatsApp.</p></div>
          <div class="surface p-4"><ShieldCheck class="h-5 w-5 text-bronze" /><p class="mt-3 font-black">Achat sécurisé</p><p class="mt-1 text-sm text-stone-600">Commande enregistrée avant l’envoi du message.</p></div>
        </div>
      </div>
    </section>

    <section class="border-y border-line bg-white py-14">
      <div class="container-page grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p class="eyebrow">Avis</p>
          <h2 class="mt-2 text-4xl font-black tracking-tight">La confiance de nos clients</h2>
        </div>
        <div class="grid gap-4 md:grid-cols-3">
          <div v-for="review in [
            { title: 'Qualité au rendez-vous', text: 'L’emballage, la finition et l’état du produit correspondent à la présentation du catalogue.' },
            { title: 'Commande claire', text: 'Le message WhatsApp est précis et facile à confirmer rapidement.' },
            { title: 'Stock fiable', text: 'La disponibilité est visible avant l’ajout au panier.' }
          ]" :key="review.title" class="border border-line p-5">
            <div class="flex gap-1"><Star v-for="item in 5" :key="item" class="h-4 w-4 fill-bronze text-bronze" /></div>
            <p class="mt-4 font-black">{{ review.title }}</p>
            <p class="mt-2 text-sm leading-6 text-stone-600">{{ review.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section v-if="similar.length" class="container-page py-16">
      <p class="eyebrow">Produits similaires</p>
      <h2 class="section-title mt-2">Complétez votre sélection</h2>
      <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ProductCard v-for="item in similar" :key="item.id" :product="item" />
      </div>
    </section>
  </template>
</template>
