export const LanguageDetector = {
  detect(config) {
    const { detectionOrder, fallbackLang, urlParam, storageKey } = config;

    for (const source of detectionOrder) {
      let detectedLang = null;

      switch (source) {
        case 'url':
          detectedLang = this._getFromURL(urlParam);
          break;
        case 'localStorage':
          detectedLang = this._getFromLocalStorage(storageKey);
          break;
        case 'navigator':
          detectedLang = this._getFromNavigator();
          break;
      }

      if (detectedLang) {
        return this.normalize(detectedLang);
      }
    }

    return this.normalize(fallbackLang);
  },

  _getFromURL(paramName) {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
  },

  _getFromLocalStorage(key) {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('[VanillaTranslate]: No se pudo acceder a localStorage', e);
      return null;
    }
  },

  _getFromNavigator() {
    if (typeof navigator === 'undefined') return null;
    const lang = navigator.language || (navigator.languages && navigator.languages[0]);
    return lang || null;
  },

  savePreference(lang, storageKey) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(storageKey, lang);
    } catch (e) {
      console.warn('[VanillaTranslate]: No se pudo guardar en localStorage', e);
    }
  },

  normalize(lang) {
    if (!lang || typeof lang !== 'string') return '';
    return lang.trim().toLowerCase().split('-')[0];
  }
};