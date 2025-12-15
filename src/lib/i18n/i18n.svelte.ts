import { browser } from '$app/environment';
import type { Locale, I18nDictionary } from './types';
import { ptBR } from './locales/pt-BR';
import { enUS } from './locales/en-US';

const locales: Record<Locale, I18nDictionary> = {
  'pt-BR': ptBR,
  'en-US': enUS
};

class I18n {
  private currentLocale: Locale = $state('pt-BR');

  constructor() {
    if (browser) {
      const saved = localStorage.getItem('locale') as Locale;
      if (saved && locales[saved]) {
        this.currentLocale = saved;
      }
    }
  }

  get locale(): Locale {
    return this.currentLocale;
  }

  setLocale(locale: Locale) {
    this.currentLocale = locale;
    if (browser) {
      localStorage.setItem('locale', locale);
    }
  }

  get t(): I18nDictionary {
    return locales[this.currentLocale];
  }
}

export const i18n = new I18n();
export type { Locale, I18nDictionary };