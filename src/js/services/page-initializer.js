/**
 * Shared initialization function to avoid code duplication.
 * Sets up DOM event listener for page initialization.
 * @param {object} dependencies - The dependencies to pass to PageInitializer.
 * @returns {void}
 */
export function initializePage(dependencies) {
  document.addEventListener('DOMContentLoaded', () => {
    // Create page initializer with the provided dependencies.
    const pageInitializer = new PageInitializer(dependencies);

    // Execute initialization logic.
    pageInitializer.main();
  }, false);
}

/**
 * This class manages the startup process by coordinating debug features,
 * internationalization, and DOM manipulation in the correct order. It serves
 * as the main entry point for page initialization logic and ensures all
 * required services are properly configured before the page becomes
 * interactive.
 */
class PageInitializer {

  /**
   * Constants for configuration and feature flags.
   * @type {object|null}
   */
  constants;

  /**
   * Internationalization localizer service for translating HTML documents.
   * @type {object|null}
   */
  i18nLocalizer;

  /**
   * Form utility service for DOM manipulation and form operations.
   * @type {object|null}
   */
  form;

  /**
   * Constructor that accepts dependencies.
   * @param {object} dependencies - The injected dependencies.
   * @param {boolean} dependencies.DEBUG - Debug flag.
   * @param {object} dependencies.i18nLocalizer - I18n localizer service.
   * @param {object} dependencies.form - Form utility service.
   */
  constructor(dependencies) {
    this.constants = dependencies.constants;
    this.i18nLocalizer = dependencies.i18nLocalizer;
    this.form = dependencies.form;
  }

  /**
   * Main entry point for page initialization.
   * Executes initialization steps in the correct order.
   * @async
   * @returns {Promise<void>}
   */
  async main() {
    // First show/hide HTML elements.
    // this.showTestingPages();

    // Then localize the HTML.
    this.localizeDocument();

    // Finally signal ready.
    this.fireI18nReadyEvent();
  }

  /**
   * Shows or hides testing pages based on the DEBUG flag.
   * When DEBUG is true, shows the test page element by making it visible.
   * @returns {void}
   */
  showTestingPages() {
    if (this.constants.DEBUG) {
      this.form.show(document.getElementById('page_test'));
    }
  }

  /**
   * Performs i18n localization of the entire HTML document.
   * @returns {void}
   */
  localizeDocument() {
    this.i18nLocalizer.localize(document);
  }

  /**
   * Fires a custom 'i18nReady' event to signal that internationalization is complete.
   * Uses requestAnimationFrame to ensure smooth UI updates.
   * @returns {void}
   */
  fireI18nReadyEvent() {
    // Schedules the callback to run before the next browser repaint.
    // Useful for smooth animations and UI updates.
    requestAnimationFrame(() => {
      // Fire custom event when i18n is ready.
      document.dispatchEvent(new CustomEvent('i18nReady'));
    });
  }

}
