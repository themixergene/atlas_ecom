import { defineStore } from 'pinia';

export const useToastStore = defineStore('toast', {
  state: () => ({ message: '', type: 'success' as 'success' | 'error' }),
  actions: {
    show(message: string, type: 'success' | 'error' = 'success') {
      this.message = message;
      this.type = type;
      window.setTimeout(() => {
        this.message = '';
      }, 3500);
    },
  },
});
