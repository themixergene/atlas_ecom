<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import type { Order } from '../types';

const orders = ref<Order[]>([]);
const loading = ref(true);
const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

onMounted(async () => {
  document.title = 'Mes commandes | Atlas Commerce';
  const { data } = await api.get<Order[]>('/orders/mine');
  orders.value = data;
  loading.value = false;
});
</script>

<template>
  <section class="container-page py-10">
    <p class="eyebrow">Mon compte</p>
    <h1 class="mt-2 text-5xl font-black tracking-[-0.05em]">Mes commandes</h1>
    <LoadingSpinner v-if="loading" />
    <div v-else class="mt-8 space-y-4">
      <p v-if="orders.length === 0" class="surface p-8 text-stone-600">Vous n’avez pas encore de commande.</p>
      <article v-for="order in orders" :key="order.id" class="border border-line bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-lg font-black">Commande n°{{ order.id }}</p>
          <span class="bg-mist px-3 py-1 text-xs font-black uppercase tracking-[0.16em]">{{ statusLabels[order.status] ?? order.status }}</span>
        </div>
        <div class="mt-4 space-y-2 text-sm text-stone-600">
          <p v-for="item in order.items" :key="item.id">{{ item.product.name }} x{{ item.quantity }}</p>
        </div>
        <p class="mt-4 font-black">{{ Number(order.total).toFixed(2) }} MAD</p>
      </article>
    </div>
  </section>
</template>
