/**
 * Resolves translation keys and applies variable interpolation.
 */
export const Resolver = {
  /**
   * Traverses a translations object using dot notation (e.g. 'header.title').
   * @param {Object} translations - The translations object to search.
   * @param {String} key - Dot-notated key (e.g. 'header.title').
   * @returns {*} The resolved value, or null when the key does not exist.
   */
  get(translations, key) {
    if (!key || typeof key !== 'string') return null;

    return key.split('.').reduce((current, segment) => {
      if (current === null || current === undefined) return null;
      return current[segment];
    }, translations);
  },

  /**
   * Replaces variables wrapped in '{name}' or '{{name}}' within a template.
   * @param {String} template - String containing placeholders to replace.
   * @param {Object} variables - Map of variable names to replacement values.
   * @returns {String} The template with resolved placeholders.
   */
  interpolate(template, variables = {}) {
    if (typeof template !== 'string') return template;

    return template.replace(/\{\{?(\w+)\}\}?/g, (match, name) => {
      return name in variables ? String(variables[name]) : match;
    });
  },

  /**
   * Resolves a key and returns a fallback when it does not exist.
   * @param {Object} translations - The translations object to search.
   * @param {String} key - Dot-notated key (e.g. 'header.title').
   * @param {Object} [variables={}] - Map of variable names to replacement values.
   * @param {String} [fallback=key] - Value returned when the key is missing.
   * @returns {String} The interpolated translation, or the fallback.
   */
  translate(translations, key, variables = {}, fallback = key) {
    const value = this.get(translations, key);

    if (value === null || value === undefined) {
      return fallback;
    }

    return this.interpolate(value, variables);
  }
};