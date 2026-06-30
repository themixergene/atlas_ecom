import { defineStore } from 'pinia';
import type { Product } from '../types';

const WISHLIST_KEY = 'commerce-wishlist';

export const useWishlistStore = defineStore('wishlist', {
  state: () => ({
    items: JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]') as Product[],
  }),
  getters: {
    count: (state) => state.items.length,
    has: (state) => (productId: number) => state.items.some((product) => product.id === productId),
  },
  actions: {
    toggle(product: Product) {
      if (this.items.some((item) => item.id === product.id)) {
        this.items = this.items.filter((item) => item.id !== product.id);
      } else {
        this.items.push(product);
      }
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(this.items));
    },
  },
});
