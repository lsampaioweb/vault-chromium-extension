/**
 * Handles internationalization (i18n) for the extension.
 * Provides a static method for getting messages.
 */
export class I18n {

  /**
   * Returns the appropriate browser API object (browser or chrome).
   * Uses the 'browser' object (from webextension-polyfill) if available, otherwise falls back to 'chrome'.
   * @returns {object} The browser API object.
   */
  static #getBrowserHandler() {
    return browser || chrome;
  }

  /**
   * Retrieves a localized message by its name.
   * @param {string} messageName - The name of the message to retrieve (key in messages.json).
   * @param {string|string[]} [substitutions=[]] - Optional substitutions for placeholders in the message.
   * @returns {string} The localized message.
   */
  static getMessage(messageName, substitutions = []) {
    return this.#getBrowserHandler().i18n.getMessage(messageName, substitutions);
  }

}
