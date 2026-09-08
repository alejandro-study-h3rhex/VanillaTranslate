/**
 * Detects the user language by evaluating configured sources in priority order.
 * Safe to use in environments without a DOM (SSR/Node).
 */
export const LanguageDetector = {
  /**
   * Evaluates each configured source sequentially and returns the first language found.
   * @param {Object} config - The merged translation configuration.
   * @param {String[]} config.detectionOrder - Ordered list of sources to evaluate.
   * @param {String} config.fallbackLang - Language used when no source yields a result.
   * @param {String} config.urlParam - URL parameter name holding the language.
   * @param {String} config.storageKey - localStorage key holding the language.
   * @returns {String} Normalized language code.
   */
  detect(config) {
    const { detectionOrder, fallbackLang, urlParam, storageKey } = config;

    for (const source of detectionOrder) {
      const detectedLang = this._readFrom(source, urlParam, storageKey);

      if (detectedLang) {
        return this.normalize(detectedLang);
      }
    }

    return this.normalize(fallbackLang);
  },

  /**
   * Dispatches a detection source to its corresponding reader.
   * @param {String} source - Source identifier ('url', 'localStorage' or 'navigator').
   * @param {String} urlParam - URL parameter name holding the language.
   * @param {String} storageKey - localStorage key holding the language.
   * @returns {String|null} Detected raw language, or null when unavailable.
   */
  _readFrom(source, urlParam, storageKey) {
    switch (source) {
      case 'url':
        return this._getFromURL(urlParam);
      case 'localStorage':
        return this._getFromLocalStorage(storageKey);
      case 'navigator':
        return this._getFromNavigator();
      default:
        return null;
    }
  },

  /**
   * Reads the language from the URL query parameter.
   * @param {String} paramName - URL parameter name to read.
   * @returns {String|null} The raw language, or null when unavailable.
   */
  _getFromURL(paramName) {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get(paramName);
  },

  /**
   * Reads the persisted language from localStorage.
   * @param {String} key - Storage key to read.
   * @returns {String|null} The raw language, or null when unavailable.
   */
  _getFromLocalStorage(key) {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('[vanilla-t]: Unable to access localStorage', error);
      return null;
    }
  },

  /**
   * Reads the language from the browser navigator settings.
   * @returns {String|null} The raw language, or null when unavailable.
   */
  _getFromNavigator() {
    if (typeof navigator === 'undefined') return null;
    const lang = navigator.language || (navigator.languages && navigator.languages[0]);
    return lang || null;
  },

  /**
   * Persists the selected language to localStorage.
   * @param {String} lang - Normalized language code to save.
   * @param {String} storageKey - Storage key where the language is kept.
   */
  savePreference(lang, storageKey) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(storageKey, lang);
    } catch (error) {
      console.warn('[vanilla-t]: Unable to save language preference', error);
    }
  },

  /**
   * Normalizes an ISO language code to its short form (e.g. 'es-ES' -> 'es').
   * @param {String} lang - Language code to normalize.
   * @returns {String} Normalized two-letter code, or empty string when invalid.
   */
  normalize(lang) {
    if (!lang || typeof lang !== 'string') return '';
    return lang.trim().toLowerCase().split('-')[0];
  }
};