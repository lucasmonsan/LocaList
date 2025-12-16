export interface I18nDictionary {
  search: {
    placeholder: string;
    noResults: string;
    hints: {
      title: string;
      items: string[];
    };
  };
  buttons: {
    clear: string;
    search: string;
    locate: string;
    profile: string;
  };
  profile: {
    theme: {
      title: string;
      light: string;
      auto: string;
      dark: string;
    };
    language: {
      title: string;
    };
    favorites: string;
    reviews: string;
    about: string;
    login: string;
    logout: string;
  };
  auth: {
    loginTitle: string;
    signupTitle: string;
    emailLabel: string;
    passwordLabel: string;
    nameLabel: string;
    loginButton: string;
    signupButton: string;
    noAccount: string;
    hasAccount: string;
    googleLogin: string;
    or: string;
    errors: {
      invalidEmail: string;
      passwordShort: string;
      generic: string;
    };
  };
  errors: {
    searchFailed: string;
    locationDenied: string;
    locationUnavailable: string;
    locationTimeout: string;
  };
  success: {
    locationFound: string;
  };
  toast: {
    close: string;
  };
  categories: {
    [key: string]: string;
  };
  places: {
    [key: string]: string;
  };
}

export type Locale = 'pt-BR' | 'en-US';