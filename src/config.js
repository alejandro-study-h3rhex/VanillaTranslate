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
  attribute: 'data-translate',
  useMutationObserver: false,
  cache: true,
  onLanguageChange: (newLang) => {}
};

/**
 * Recursively merges a user configuration over a base configuration.
 * Nested plain objects are merged recursively; arrays and primitives
 * from the user configuration take precedence.
 * @param {Object} [userConfig={}] - Configuration provided by the consumer.
 * @param {Object} [base=defaultConfig] - Base configuration to merge from.
 * @returns {Object} A new merged configuration object.
 */
export function mergeConfig(userConfig = {}, base = defaultConfig) {
  const merged = { ...base };

  for (const key of Object.keys(userConfig)) {
    const userValue = userConfig[key];
    const baseValue = base[key];

    merged[key] =
      isPlainObject(userValue) && isPlainObject(baseValue)
        ? mergeConfig(userValue, baseValue)
        : userValue;
  }

  return merged;
}

/**
 * Checks whether a value is a plain object (not an array, null or class instance).
 * @param {*} value - Value to inspect.
 * @returns {Boolean} True when the value is a plain object.
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}