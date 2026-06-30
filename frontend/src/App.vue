<script setup lang="ts">
import Navbar from './components/Navbar.vue';
import FooterView from './components/FooterView.vue';
import CartDrawer from './components/CartDrawer.vue';
import ToastNotice from './components/ToastNotice.vue';
</script>

<template>
  <Navbar />
  <main class="min-h-screen pt-28">
    <RouterView />
  </main>
  <FooterView />
  <CartDrawer />
  <ToastNotice />
</template>
