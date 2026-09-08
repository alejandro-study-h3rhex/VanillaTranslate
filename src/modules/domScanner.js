/**
 * Scans and translates DOM elements marked with the configured attribute.
 * Supports text node and HTML attribute instructions such as
 * 'placeholder:forms.search'.
 */
export const DOMScanner = {
  /**
   * Splits an attribute value into its individual instructions.
   * Multiple instructions can be separated by whitespace.
   * @param {String} rawValue - Raw value of the translation attribute.
   * @returns {String[]} List of instruction tokens.
   */
  _parseInstructions(rawValue) {
    return rawValue.split(/\s+/).filter(Boolean);
  },

  /**
   * Translates a single element based on its translation attribute value.
   * An instruction without a colon replaces the element text content;
   * an instruction like 'attr:key' sets the HTML attribute to the translation.
   * @param {Element} element - Element to translate.
   * @param {String} attribute - Name of the translation attribute.
   * @param {Function} translate - Callback receiving a key and returning its translation.
   */
  translateElement(element, attribute, translate) {
    const rawValue = element.getAttribute(attribute);
    if (!rawValue) return;

    this._parseInstructions(rawValue).forEach((instruction) => {
      const separatorIndex = instruction.indexOf(':');

      if (separatorIndex === -1) {
        element.textContent = translate(instruction);
        return;
      }

      const attrName = instruction.slice(0, separatorIndex);
      const key = instruction.slice(separatorIndex + 1);
      element.setAttribute(attrName, translate(key));
    });
  },

  /**
   * Scans a root node and translates every matching element within it.
   * The root node itself is also translated when it carries the attribute.
   * @param {Node} root - Node whose subtree will be scanned.
   * @param {String} attribute - Name of the translation attribute.
   * @param {Function} translate - Callback receiving a key and returning its translation.
   */
  scan(root, attribute, translate) {
    if (!root) return;

    const selector = `[${attribute}]`;
    const matchesRoot = typeof root.matches === 'function' && root.matches(selector);
    const elements = matchesRoot ? [root] : [];

    if (typeof root.querySelectorAll === 'function') {
      elements.push(...root.querySelectorAll(selector));
    }

    elements.forEach((element) => this.translateElement(element, attribute, translate));
  },

  /**
   * Observes a root node and translates elements added to the DOM
   * after the observer is started.
   * @param {Node} root - Node whose subtree will be observed.
   * @param {String} attribute - Name of the translation attribute.
   * @param {Function} translate - Callback receiving a key and returning its translation.
   * @returns {MutationObserver|null} The active observer, or null when unsupported.
   */
  observe(root, attribute, translate) {
    if (typeof MutationObserver === 'undefined' || !root) return null;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          this.scan(node, attribute, translate);
        });
      });
    });

    observer.observe(root, { childList: true, subtree: true });
    return observer;
  }
};