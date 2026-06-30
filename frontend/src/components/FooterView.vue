<template>
  <footer class="border-t border-line bg-ink text-white">
    <div class="container-page grid gap-10 py-14 md:grid-cols-[1.2fr_.8fr_.8fr_.8fr]">
      <div>
        <p class="text-3xl font-black tracking-[-0.04em]">ATLAS</p>
        <p class="mt-4 max-w-sm text-sm leading-6 text-white/65">Une expérience d'achat soignée pour la technologie du quotidien, avec confirmation rapide et paiement à la livraison via WhatsApp.</p>
      </div>
      <div class="text-sm text-white/65">
        <p class="font-black uppercase tracking-[0.18em] text-white">Boutique</p>
        <RouterLink class="mt-4 block hover:text-white" to="/products">Tous les produits</RouterLink>
        <RouterLink class="mt-3 block hover:text-white" to="/cart">Panier</RouterLink>
        <RouterLink class="mt-3 block hover:text-white" to="/orders">Commandes</RouterLink>
      </div>
      <div class="text-sm text-white/65">
        <p class="font-black uppercase tracking-[0.18em] text-white">Services</p>
        <p class="mt-4">Livraison rapide</p>
        <p class="mt-3">Retours faciles</p>
        <p class="mt-3">Service client</p>
      </div>
      <div class="text-sm text-white/65">
        <p class="font-black uppercase tracking-[0.18em] text-white">Contact</p>
        <p class="mt-4">Commande via WhatsApp</p>
        <p class="mt-3">Livraison partout au Maroc</p>
        <p class="mt-3">Paiement sécurisé par compte</p>
      </div>
    </div>
    <div class="border-t border-white/10 py-5">
      <div class="container-page flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/45 md:flex-row md:items-center md:justify-between">
        <span>Atlas Commerce</span>
        <span>Conçu pour le commerce moderne</span>
      </div>
    </div>
  </footer>
</template>
