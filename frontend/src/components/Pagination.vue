<script setup lang="ts">
defineProps<{ page: number; pages: number }>();
defineEmits<{ change: [page: number] }>();
</script>

<template>
  <div v-if="pages > 1" class="mt-10 flex items-center justify-center gap-2">
    <button class="btn-secondary" :disabled="page <= 1" @click="$emit('change', page - 1)">Précédent</button>
    <span class="border border-line bg-white px-4 py-3 text-sm font-bold">Page {{ page }} sur {{ pages }}</span>
    <button class="btn-secondary" :disabled="page >= pages" @click="$emit('change', page + 1)">Suivant</button>
  </div>
</template>
