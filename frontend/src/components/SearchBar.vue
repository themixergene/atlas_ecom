<script setup lang="ts">
import { Search } from '@lucide/vue';
defineProps<{ modelValue: string }>();
defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <label class="relative block">
    <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
    <input
      class="field pl-11"
      type="search"
      placeholder="Rechercher des produits ou catégories"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>
