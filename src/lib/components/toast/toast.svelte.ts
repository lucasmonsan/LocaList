import type { Toast, ToastType } from '$lib/types/toast.types';

class ToastStore {
  toasts = $state<Toast[]>([]);

  private add(message: string, type: ToastType, duration: number | null = 5000) {
    const id = crypto.randomUUID();
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now()
    };

    this.toasts = [...this.toasts, toast];

    if (duration !== null) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration = 5000) {
    this.add(message, 'success', duration);
  }

  error(message: string, duration = 5000) {
    this.add(message, 'error', duration);
  }

  info(message: string, duration = 5000) {
    this.add(message, 'info', duration);
  }

  warning(message: string, duration = 5000) {
    this.add(message, 'warning', duration);
  }

  persist(message: string, type: ToastType) {
    this.add(message, type, null);
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  clear() {
    this.toasts = [];
  }
}

export const toast = new ToastStore();