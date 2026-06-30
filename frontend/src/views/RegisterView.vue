<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getErrorMessage } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';

const auth = useAuthStore();
const toast = useToastStore();
const router = useRouter();
const loading = ref(false);
const form = reactive({ name: '', email: '', password: '' });

async function submit() {
  loading.value = true;
  try {
    await auth.register(form.name, form.email, form.password);
    toast.show('Compte créé avec succès.');
    router.push('/');
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="container-page grid min-h-[72vh] items-center gap-8 py-10 lg:grid-cols-[1fr_460px]">
    <div class="hidden lg:block">
      <p class="eyebrow">Nouveau client</p>
      <h1 class="mt-3 text-6xl font-black leading-none tracking-[-0.06em]">Créez votre profil en quelques instants.</h1>
      <p class="mt-5 max-w-lg leading-7 text-stone-600">Inscrivez-vous pour conserver l’historique de vos commandes et simplifier vos prochains achats.</p>
    </div>
    <form class="border border-line bg-white p-7 shadow-soft" @submit.prevent="submit">
      <h1 class="text-3xl font-black">Créer un compte</h1>
      <label class="mt-6 grid gap-2 text-sm font-black">Nom<input v-model="form.name" class="field" required /></label>
      <label class="mt-4 grid gap-2 text-sm font-black">Email<input v-model="form.email" class="field" type="email" required /></label>
      <label class="mt-4 grid gap-2 text-sm font-black">Mot de passe<input v-model="form.password" class="field" type="password" minlength="8" required /></label>
      <button class="btn-primary mt-6 w-full" :disabled="loading">{{ loading ? 'Création...' : 'Créer mon compte' }}</button>
      <p class="mt-5 text-center text-sm text-stone-600">Déjà inscrit ? <RouterLink class="font-black text-bronze" to="/login">Se connecter</RouterLink></p>
    </form>
  </section>
</template>
