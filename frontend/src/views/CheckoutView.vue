<script setup lang="ts">
import { Check, MessageCircle } from '@lucide/vue';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, getErrorMessage } from '../api/client';
import { useCartStore } from '../stores/cart';
import { useToastStore } from '../stores/toast';
import type { Order } from '../types';

const cart = useCartStore();
const toast = useToastStore();
const router = useRouter();
const loading = ref(false);
const form = reactive({ customerName: '', phone: '', city: '', address: '', notes: '' });

async function submit() {
  if (!form.customerName || !form.phone || !form.city || !form.address) {
    toast.show('Veuillez remplir tous les champs obligatoires.', 'error');
    return;
  }
  if (cart.items.length === 0) {
    toast.show('Votre panier est vide.', 'error');
    return;
  }
  loading.value = true;
  try {
    const payload = {
      ...form,
      paymentMethod: 'WHATSAPP_COD',
      items: cart.items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    };
    const { data } = await api.post<{ order: Order; whatsappMessage: string }>('/orders', payload);
    const number = import.meta.env.VITE_STORE_WHATSAPP_NUMBER || '212600000000';
    const url = `https://wa.me/${number}?text=${encodeURIComponent(data.whatsappMessage)}`;
    cart.clear();
    toast.show('Commande créée. Ouverture de WhatsApp.');
    window.open(url, '_blank', 'noopener,noreferrer');
    router.push('/orders');
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="container-page py-10">
    <p class="eyebrow">Commande sécurisée</p>
    <h1 class="mt-2 text-5xl font-black tracking-[-0.05em]">Finalisez votre commande</h1>
    <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
      <form class="border border-line bg-white p-6 shadow-sm" @submit.prevent="submit">
        <div class="mb-8 grid grid-cols-3 gap-2 text-xs font-black uppercase tracking-[0.14em]">
          <div class="flex items-center gap-2 text-success"><span class="grid h-7 w-7 place-items-center rounded-full bg-success text-white"><Check class="h-4 w-4" /></span> Panier</div>
          <div class="flex items-center gap-2 text-ink"><span class="grid h-7 w-7 place-items-center rounded-full bg-ink text-white">2</span> Coordonnées</div>
          <div class="flex items-center gap-2 text-stone-400"><span class="grid h-7 w-7 place-items-center rounded-full bg-stone-200">3</span> WhatsApp</div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="grid gap-2 text-sm font-black">Nom complet<input v-model="form.customerName" class="field" required /></label>
          <label class="grid gap-2 text-sm font-black">Numéro de téléphone<input v-model="form.phone" class="field" required /></label>
          <label class="grid gap-2 text-sm font-black">Ville<input v-model="form.city" class="field" required /></label>
          <label class="grid gap-2 text-sm font-black md:col-span-2">Adresse<textarea v-model="form.address" class="field min-h-24" required></textarea></label>
          <label class="grid gap-2 text-sm font-black md:col-span-2">Notes<textarea v-model="form.notes" class="field min-h-24" placeholder="Instructions de livraison, heure d’appel ou remarque sur le produit"></textarea></label>
        </div>
        <button class="btn-primary mt-6 w-full" :disabled="loading">
          <MessageCircle class="h-5 w-5" /> {{ loading ? 'Création de la commande...' : 'Commander via WhatsApp' }}
        </button>
      </form>
      <aside class="h-fit border border-line bg-white p-6 shadow-soft lg:sticky lg:top-32">
        <p class="text-2xl font-black">Récapitulatif</p>
        <div class="mt-4 space-y-3">
          <div v-for="item in cart.items" :key="item.product.id" class="flex gap-3 border-b border-line pb-3 text-sm">
            <img :src="item.product.image" :alt="item.product.name" class="h-16 w-16 object-cover" />
            <div class="flex-1">
              <p class="font-black">{{ item.product.name }}</p>
              <p class="text-stone-500">Qté {{ item.quantity }}</p>
            </div>
            <span class="font-black">{{ (Number(item.product.price) * item.quantity).toFixed(2) }} MAD</span>
          </div>
        </div>
        <div class="mt-5 flex justify-between pt-4 text-xl font-black">
          <span>Total</span>
          <span>{{ cart.total.toFixed(2) }} MAD</span>
        </div>
      </aside>
    </div>
  </section>
</template>
