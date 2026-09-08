/** In-memory JSON cache keyed by language code. */
const cache = new Map();

/**
 * Loads translation files asynchronously and caches them in memory.
 */
export const Loader = {
  /**
   * Loads the translations for a language, reusing the cache when enabled.
   * @param {String} lang - Language code to load (e.g. 'es').
   * @param {Object} config - The merged translation configuration.
   * @param {String} config.basePath - Base path where language files are located.
   * @param {Boolean} config.cache - Whether loaded files should be cached in memory.
   * @returns {Promise<Object>} The parsed translations object.
   * @throws {Error} When the file cannot be fetched or parsed.
   */
  async load(lang, config) {
    const cached = cache.get(lang);
    if (cached && config.cache) {
      return cached;
    }

    const translations = await this._fetch(lang, config.basePath);

    if (config.cache) {
      cache.set(lang, translations);
    }

    return translations;
  },

  /**
   * Fetches and parses the JSON file for a language.
   * @param {String} lang - Language code to load.
   * @param {String} basePath - Base path where language files are located.
   * @returns {Promise<Object>} The parsed translations object.
   * @throws {Error} On network failure, HTTP error or invalid JSON.
   */
  async _fetch(lang, basePath) {
    const url = `${basePath}/${lang}.json`;

    let response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new Error(`[vanilla-t]: Network error while loading "${url}" (${error.message})`);
    }

    if (!response.ok) {
      throw new Error(`[vanilla-t]: Failed to load "${url}" (HTTP ${response.status})`);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error(`[vanilla-t]: Invalid JSON in "${url}" (${error.message})`);
    }
  },

  /**
   * Removes all entries from the in-memory cache.
   */
  clearCache() {
    cache.clear();
  }
};