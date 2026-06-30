<script setup lang="ts">
import { Minus, Plus, ShoppingBag, X } from '@lucide/vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';

const cart = useCartStore();
const router = useRouter();

function checkout() {
  cart.drawerOpen = false;
  router.push('/checkout');
}
</script>

<template>
  <div v-if="cart.drawerOpen" class="fixed inset-0 z-50">
    <button class="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label="Fermer le panier" @click="cart.drawerOpen = false"></button>
    <aside class="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col bg-porcelain shadow-lift">
      <div class="flex items-center justify-between border-b border-line p-5">
        <div>
          <p class="eyebrow">Votre sélection</p>
          <h2 class="mt-1 text-2xl font-black">Panier</h2>
        </div>
        <button class="grid h-11 w-11 place-items-center border border-line bg-white hover:border-ink" @click="cart.drawerOpen = false" aria-label="Fermer le panier">
          <X class="h-5 w-5" />
        </button>
      </div>
      <div class="flex-1 space-y-4 overflow-auto p-5">
        <div v-if="cart.items.length === 0" class="grid h-full place-items-center text-center">
          <div>
            <ShoppingBag class="mx-auto h-12 w-12 text-stone-400" />
            <p class="mt-4 font-black">Votre panier est vide</p>
            <RouterLink class="btn-primary mt-5" to="/products" @click="cart.drawerOpen = false">Découvrir la boutique</RouterLink>
          </div>
        </div>
        <div v-for="item in cart.items" :key="item.product.id" class="flex gap-4 border border-line bg-white p-3">
          <img :src="item.product.image" :alt="item.product.name" class="h-24 w-24 object-cover" />
          <div class="flex-1">
            <div class="flex justify-between gap-3">
              <div>
                <p class="font-black leading-tight">{{ item.product.name }}</p>
                <p class="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">{{ item.product.category?.name }}</p>
              </div>
              <button class="text-xs font-black uppercase tracking-[0.14em] text-danger" @click="cart.remove(item.product.id)">Supprimer</button>
            </div>
            <div class="mt-4 flex items-center justify-between">
              <div class="flex items-center border border-line">
                <button class="grid h-9 w-9 place-items-center bg-white hover:bg-paper" @click="cart.update(item.product.id, item.quantity - 1)" aria-label="Diminuer la quantité">
                  <Minus class="h-4 w-4" />
                </button>
                <span class="grid h-9 w-10 place-items-center border-x border-line text-sm font-black">{{ item.quantity }}</span>
                <button class="grid h-9 w-9 place-items-center bg-white hover:bg-paper" @click="cart.update(item.product.id, item.quantity + 1)" aria-label="Augmenter la quantité">
                  <Plus class="h-4 w-4" />
                </button>
              </div>
              <p class="font-black">{{ (Number(item.product.price) * item.quantity).toFixed(2) }} MAD</p>
            </div>
          </div>
        </div>
      </div>
      <div class="border-t border-line bg-white p-5">
        <div class="mb-3 flex justify-between text-sm text-stone-600">
          <span>Articles</span>
          <span>{{ cart.count }}</span>
        </div>
        <div class="mb-5 flex justify-between text-xl font-black">
          <span>Total</span>
          <span>{{ cart.total.toFixed(2) }} MAD</span>
        </div>
        <button class="btn-primary w-full" :disabled="cart.items.length === 0" @click="checkout">Commander</button>
        <button class="mt-3 w-full text-xs font-black uppercase tracking-[0.18em] text-stone-500 hover:text-danger" :disabled="cart.items.length === 0" @click="cart.clear">Vider le panier</button>
      </div>
    </aside>
  </div>
</template>
