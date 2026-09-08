import { defaultConfig, mergeConfig } from './config.js';
import { LanguageDetector } from './modules/languageDetector.js';
import { Loader } from './modules/loader.js';
import { Resolver } from './modules/resolver.js';
import { DOMScanner } from './modules/domScanner.js';

/**
 * Main entry point exposing the public internationalization API.
 * Wires the internal modules together behind a single facade.
 */
export class VanillaT {
  /**
   * Creates a translator instance.
   * @param {Object} [userConfig={}] - Configuration overrides merged over the defaults.
   */
  constructor(userConfig = {}) {
    this.config = mergeConfig(userConfig);
    this.translations = {};
    this.observer = null;
    this._currentLang = '';
  }

  /**
   * Detects the language, loads its translations and translates the current DOM.
   * @returns {Promise<VanillaT>} This instance, ready to use.
   */
  async init() {
    const detected = LanguageDetector.detect(this.config);
    this._currentLang = detected;

    await this._loadTranslations(detected);
    this._translateDOM();

    if (this.config.useMutationObserver) {
      this.observer = DOMScanner.observe(document, this.config.attribute, (key) => this.t(key));
    }

    return this;
  }

  /**
   * Translates a key of the currently loaded language.
   * @param {String} key - Dot-notated key (e.g. 'header.title').
   * @param {Object} [variables={}] - Variables for interpolation ({name} / {{name}}).
   * @returns {String} The translation, or the key itself when missing.
   */
  t(key, variables = {}) {
    return Resolver.translate(this.translations, key, variables);
  }

  /**
   * The currently active language code.
   * @returns {String} Normalized language code.
   */
  get currentLang() {
    return this._currentLang;
  }

  /**
   * Switches the active language, persists the preference, reloads the
   * translations, re-translates the DOM and fires the change callback.
   * @param {String} lang - Language code to activate (e.g. 'en').
   * @returns {Promise<VanillaT>} This instance.
   */
  async setLanguage(lang) {
    const normalized = LanguageDetector.normalize(lang) || this.config.fallbackLang;

    this._currentLang = normalized;
    LanguageDetector.savePreference(normalized, this.config.storageKey);

    await this._loadTranslations(normalized);
    this._translateDOM();
    this.config.onLanguageChange(normalized);

    return this;
  }

  /**
   * Removes the MutationObserver so dynamic elements stop being translated.
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Loads the translations for a language, falling back on the configured
   * fallback language when the requested file cannot be loaded.
   * @param {String} lang - Language code to load.
   * @returns {Promise<void>}
   */
  async _loadTranslations(lang) {
    try {
      this.translations = await Loader.load(lang, this.config);
    } catch (error) {
      if (lang === this.config.fallbackLang) {
        throw error;
      }

      console.warn(`[vanilla-t]: Falling back to "${this.config.fallbackLang}" (${error.message})`);
      await this._loadTranslations(this.config.fallbackLang);
    }
  }

  /**
   * Re-applies the translations to every marked element in the document.
   * @returns {void}
   */
  _translateDOM() {
    DOMScanner.scan(document, this.config.attribute, (key) => this.t(key));
  }
}