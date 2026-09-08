/**
 * Default translator configuration.
 * @typedef {Object} Config
 * @property {String} fallbackLang - Fallback language used when none is detected.
 * @property {String} basePath - Base path where the language files are located.
 * @property {String[]} detectionOrder - Language detection order (url, localStorage, navigator).
 * @property {String} storageKey - Key used to store the language in localStorage.
 * @property {String} urlParam - URL parameter used to set the language.
 * @property {String} attribute - HTML attribute used to mark translatable texts.
 * @property {Boolean} useMutationObserver - Whether DOM changes are observed to translate dynamically.
 * @property {Boolean} cache - Whether language files are cached.
 * @property {Function} onLanguageChange - Callback invoked when the language changes.
 * @type {Config}
**/
export const defaultConfig = {
  fallbackLang: 'es',
  basePath: './langs',
  detectionOrder: ['url', 'localStorage', 'navigator'],
  storageKey: 'data-lang',
  urlParam: 'lang',
  attribute: 'data-i18n',
  useMutationObserver: false,
  cache: true,
  onLanguageChange: (newLang) => {}
};