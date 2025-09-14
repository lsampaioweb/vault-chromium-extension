/**
 * Handles internationalization (i18n) for the extension.
 * Provides an instance method for localizing the DOM.
 */
export class I18nLocalizer {

  /**
   * Internationalization instance used for retrieving localized messages.
   * @private
   * @type {I18n}
   */
  #i18n;

  /**
   * HTML replacer class instance used for DOM manipulation and text replacement.
   * @private
   * @type {HTMLReplacer}
   */
  #htmlReplacer;

  /**
   * Logger instance used for logging operations and error handling.
   * @private
   * @type {ConsoleLogger}
   */
  #logger;

  /**
   * Creates an instance of the I18n class for localization tasks.
   * @param {I18n} i18nClass - A class with methods for internationalization.
   * @param {HTMLReplacer} htmlReplacerClass - A class with a static `replace` method for DOM manipulation.
   * @param {ConsoleLogger} logger - Logger instance for logging operations.
   */
  constructor(i18nClass, htmlReplacerClass, logger) {
    this.#i18n = i18nClass;
    this.#htmlReplacer = htmlReplacerClass;
    this.#logger = logger;
  }

  /**
   * Localizes an HTML element and its children by replacing __MSG_...__ placeholders.
   * It traverses the DOM starting from the given element and replaces
   * placeholders found in text nodes and specific element attributes.
   * @param {HTMLElement} element - The root HTML element to start localization from.
   * @param {boolean} showLoadingState - Whether to show loading state during localization.
   */
  localize(element, showLoadingState = true) {
    let isDocumentLocalization = false;

    try {
      // Do nothing if the element is null or undefined.
      if (!element) {
        return;
      }

      // Check if we're localizing the entire document.
      isDocumentLocalization = element === document && showLoadingState;

      // Show loading state
      if (isDocumentLocalization) {
        document.body.classList.replace('i18n-ready', 'i18n-loading');
      }

      // Define the pattern to find (__MSG_anyword__) and the replacement function.
      const match = {
        regex: /__MSG_(\w+)__/g,
        func: (match, v1) => (v1 ? this.#i18n.getMessage(v1) : match)
      };

      // Use the injected dependency to perform the actual replacement.
      this.#htmlReplacer.replace(element, match);

    } catch (error) {
      this.#logger.error(this.#i18n.getMessage('error_i18n_localization_failed', [error.message]));
    } finally {
      // Always ensure content is visible when localizing the entire document.
      if (isDocumentLocalization) {
        // Use requestAnimationFrame to ensure the DOM updates are complete.
        requestAnimationFrame(() => {
          document.body.classList.replace('i18n-loading', 'i18n-ready');
        });
      }
    }
  }

}
