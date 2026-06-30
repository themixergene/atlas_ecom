<script setup lang="ts">
import { useToastStore } from '../stores/toast';
const toast = useToastStore();
</script>

<template>
  <div
    v-if="toast.message"
    class="fixed bottom-5 right-5 z-50 border border-white/15 px-5 py-4 text-sm font-bold text-white shadow-lift"
    :class="toast.type === 'success' ? 'bg-success' : 'bg-danger'"
  >
    {{ toast.message }}
  </div>
</template>
