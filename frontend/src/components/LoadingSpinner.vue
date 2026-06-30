<template>
  <div class="grid gap-4 py-10">
    <div class="container-page grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="item in 4" :key="item" class="surface p-3">
        <div class="skeleton h-64 w-full"></div>
        <div class="skeleton mt-4 h-4 w-2/3"></div>
        <div class="skeleton mt-3 h-4 w-1/3"></div>
      </div>
    </div>
  </div>
</template>
