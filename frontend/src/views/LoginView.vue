<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getErrorMessage } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';

const auth = useAuthStore();
const toast = useToastStore();
const router = useRouter();
const route = useRoute();
const loading = ref(false);
const form = reactive({ email: '', password: '' });

async function submit() {
  loading.value = true;
  try {
    await auth.login(form.email, form.password);
    toast.show('Bienvenue.');
    router.push(String(route.query.redirect || '/'));
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
      <p class="eyebrow">Accès au compte</p>
      <h1 class="mt-3 text-6xl font-black leading-none tracking-[-0.06em]">Heureux de vous revoir.</h1>
      <p class="mt-5 max-w-lg leading-7 text-stone-600">Connectez-vous pour consulter vos commandes, commander plus rapidement et accéder aux outils d’administration autorisés.</p>
    </div>
    <form class="border border-line bg-white p-7 shadow-soft" @submit.prevent="submit">
      <h1 class="text-3xl font-black">Connexion</h1>
      <label class="mt-6 grid gap-2 text-sm font-black">Email<input v-model="form.email" class="field" type="email" required /></label>
      <label class="mt-4 grid gap-2 text-sm font-black">Mot de passe<input v-model="form.password" class="field" type="password" required /></label>
      <button class="btn-primary mt-6 w-full" :disabled="loading">{{ loading ? 'Connexion...' : 'Se connecter' }}</button>
      <p class="mt-5 text-center text-sm text-stone-600">Pas encore de compte ? <RouterLink class="font-black text-bronze" to="/register">Créer un compte</RouterLink></p>
    </form>
  </section>
</template>
