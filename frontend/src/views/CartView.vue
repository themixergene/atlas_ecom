<script setup lang="ts">
import { Minus, Plus, ShieldCheck, Truck } from '@lucide/vue';
import { useCartStore } from '../stores/cart';
const cart = useCartStore();
</script>

<template>
  <section class="container-page py-10">
    <p class="eyebrow">Vérifier le panier</p>
    <h1 class="mt-2 text-5xl font-black tracking-[-0.05em]">Votre panier</h1>
    <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_390px]">
      <div class="space-y-4">
        <div v-if="cart.items.length === 0" class="surface p-10 text-center">
          <p class="text-xl font-black">Votre panier est vide</p>
          <RouterLink class="btn-primary mt-6" to="/products">Voir la collection</RouterLink>
        </div>
        <div v-for="item in cart.items" :key="item.product.id" class="grid gap-4 border border-line bg-white p-4 shadow-sm md:grid-cols-[140px_1fr_auto]">
          <img :src="item.product.image" :alt="item.product.name" class="h-36 w-full object-cover md:w-36" />
          <div class="flex-1">
            <p class="text-xl font-black">{{ item.product.name }}</p>
            <p class="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-bronze">{{ item.product.category?.name }}</p>
            <p class="mt-3 max-w-xl text-sm leading-6 text-stone-600">{{ item.product.shortDescription }}</p>
            <div class="mt-4 flex items-center gap-3">
              <div class="flex border border-line">
                <button class="grid h-10 w-10 place-items-center hover:bg-paper" @click="cart.update(item.product.id, item.quantity - 1)" aria-label="Diminuer la quantité"><Minus class="h-4 w-4" /></button>
                <span class="grid h-10 w-11 place-items-center border-x border-line font-black">{{ item.quantity }}</span>
                <button class="grid h-10 w-10 place-items-center hover:bg-paper" @click="cart.update(item.product.id, item.quantity + 1)" aria-label="Augmenter la quantité"><Plus class="h-4 w-4" /></button>
              </div>
              <button class="text-xs font-black uppercase tracking-[0.16em] text-danger" @click="cart.remove(item.product.id)">Supprimer</button>
            </div>
          </div>
          <p class="text-right text-xl font-black">{{ (Number(item.product.price) * item.quantity).toFixed(2) }} MAD</p>
        </div>
      </div>
      <aside class="h-fit border border-line bg-white p-6 shadow-soft lg:sticky lg:top-32">
        <p class="text-2xl font-black">Récapitulatif</p>
        <div class="mt-6 space-y-3 border-b border-line pb-5 text-sm">
          <div class="flex justify-between"><span>Articles</span><span>{{ cart.count }}</span></div>
          <div class="flex justify-between"><span>Livraison</span><span>Confirmée sur WhatsApp</span></div>
        </div>
        <div class="mt-5 flex justify-between text-xl">
          <span>Total</span>
          <span class="font-black">{{ cart.total.toFixed(2) }} MAD</span>
        </div>
        <RouterLink class="btn-primary mt-6 w-full" to="/checkout">Passer la commande</RouterLink>
        <div class="mt-6 grid gap-3 text-sm text-stone-600">
          <p class="flex items-center gap-2"><Truck class="h-4 w-4 text-bronze" /> Livraison rapide après confirmation</p>
          <p class="flex items-center gap-2"><ShieldCheck class="h-4 w-4 text-bronze" /> Commande enregistrée avant l’ouverture de WhatsApp</p>
        </div>
      </aside>
    </div>
  </section>
</template>
