import { defineStore } from 'pinia';
import type { CartItem, Product } from '../types';

const CART_KEY = 'commerce-cart';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: JSON.parse(localStorage.getItem(CART_KEY) || '[]') as CartItem[],
    drawerOpen: false,
  }),
  getters: {
    count: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    total: (state) => state.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),
  },
  actions: {
    add(product: Product, quantity = 1) {
      const existing = this.items.find((item) => item.product.id === product.id);
      if (existing) existing.quantity = Math.min(existing.quantity + quantity, product.stock);
      else this.items.push({ product, quantity: Math.min(quantity, product.stock) });
      this.persist();
    },
    update(productId: number, quantity: number) {
      const item = this.items.find((entry) => entry.product.id === productId);
      if (!item) return;
      item.quantity = Math.max(1, Math.min(quantity, item.product.stock));
      this.persist();
    },
    remove(productId: number) {
      this.items = this.items.filter((item) => item.product.id !== productId);
      this.persist();
    },
    clear() {
      this.items = [];
      this.persist();
    },
    persist() {
      localStorage.setItem(CART_KEY, JSON.stringify(this.items));
    },
  },
});
