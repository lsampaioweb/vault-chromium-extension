import * as constants from '../core/constants.js';

export class PageBaseController {

  /**
   * Link constants containing application page URLs and navigation paths.
   * @type {object|null}
   */
  Link;

  /**
   * Internationalization service for translating messages and content.
   * @type {object|null}
   */
  I18n;

  /**
   * Logger service for debugging and application monitoring.
   * @type {object|null}
   */
  logger;

  /**
   * Notification service for displaying user messages, errors, and alerts.
   * @type {object|null}
  */
  notification;

  /**
   * Form utility service for DOM manipulation and form operations.
   * @type {object|null}
  */
  form;

  /**
   * Vault storage service for managing session data like tokens and URLs.
   * @type {object|null}
   */
  storage;

  /**
   * Vault utility functions for token validation and path management.
   * @type {object|null}
   */
  VaultUtils;

  /**
   * Factory to create Vault instances with dependency injection.
   * @type {object|null}
   */
  vaultFactory;

  /**
   * Common internationalization keys and constants shared across all pages.
   * @private
   * @static
   * @readonly
   */
  static i18nKeys = {
    constants: {
      ...constants
    },
    messages: {
      UI_MESSAGE_LOADING: 'ui_message_loading',
      UI_MESSAGE_CONNECTING: 'ui_message_connecting',
      UI_MESSAGE_SAVING: 'ui_message_saving',
      UI_MESSAGE_COPIED_TO_CLIPBOARD: 'ui_message_copied_to_clipboard',
      CONFIG_SECRET_USERNAME_KEYS: 'config_secret_username_keys',
      CONFIG_SECRET_PASSWORD_KEYS: 'config_secret_password_keys',
      CONFIG_SECRET_TOKEN_KEYS: 'config_secret_token_keys',
      CONFIG_SECRET_COMMENT_KEYS: 'config_secret_comment_keys',
      ERROR_BROWSER_QUERY_TAB_FAILED: 'error_browser_query_tab_failed',
    },
  };

  /**
   * Constructor for dependency injection.
   * @param {object} dependencies - The injected dependencies.
   * @param {object} dependencies.constants - Constants including Link URLs.
   * @param {object} dependencies.I18n - Internationalization service.
   * @param {object} dependencies.logger - Logger service for debugging and monitoring.
   * @param {object} dependencies.notification - Notification service.
   * @param {object} dependencies.form - Form service.
   * @param {object} dependencies.storage - Storage service for session data.
   * @param {object} dependencies.VaultUtils - Vault utility functions.
   * @param {object} dependencies.vaultFactory - Vault factory for creating Vault instances.
   */
  constructor(dependencies) {
    this.Link = dependencies.constants.Link;
    this.I18n = dependencies.I18n;
    this.logger = dependencies.logger;
    this.notification = dependencies.notification;
    this.form = dependencies.form;
    this.storage = dependencies.storage;
    this.VaultUtils = dependencies.VaultUtils;
    this.vaultFactory = dependencies.vaultFactory;
  }

  /**
   * Returns the appropriate browser API object (browser or chrome).
   * Uses the 'browser' object (from webextension-polyfill) if available, otherwise falls back to 'chrome'.
   * @returns {object} The browser API object.
   */
  getBrowserHandler() {
    return browser || chrome;
  }

  /**
   * Redirects to the login page.
   */
  redirectToLoginPage() {
    location.href = this.Link.LoginPage;
  }

  /**
   * Redirects to the new secret page.
   */
  newSecret() {
    location.href = this.Link.SecretsAdd;
  }

  /**
   * Redirects to the secrets list page, preserving any URL parameters.
   */
  redirectToSecretsPage() {
    let url = this.Link.SecretsList;

    const urlParams = this.getURLSearchParams();
    if (urlParams.size > 0) {
      url = `${url}?${urlParams.toString()}`;
    }

    location.href = url;
  }

  /**
   * A simple wrapper for document.getElementById for cleaner code.
   * @param {string} id - The ID of the element to find.
   * @returns {HTMLElement|null} The found element, or null if it doesn't exist.
   */
  getElementById(id) {
    return document.getElementById(id);
  }

  /**
   * Gets the current URL of the document as a URL object.
   * @returns {URL} The URL object representing the current page's location.
   */
  getCurrentURL() {
    return new URL(document.location.toString());
  }

  /**
   * Gets the URLSearchParams object from a given URL object or the current page's URL.
   * @param {URL} [url] - An optional URL object. Defaults to the current page's URL if not provided.
   * @returns {URLSearchParams} The URLSearchParams object for the given URL.
   */
  getURLSearchParams(url) {
    if (!url) {
      url = this.getCurrentURL();
    }

    return new URLSearchParams(url.search);
  }

  /**
   * Retrieves a specific parameter's value from the current URL's query string.
   * @param {string} name - The name of the query string parameter to retrieve.
   * @returns {string|null} The value of the parameter, or null if it is not found.
   */
  getQueryString(name) {
    const searchParams = this.getURLSearchParams();

    return searchParams.get(name);
  }

  /**
   * Removes all query string parameters from the current URL in the browser's history.
   * This is useful for cleaning up the URL after using parameters for one-time actions.
   * @returns {void}
   */
  deleteAllQueryStrings() {
    const url = this.getCurrentURL();

    const searchParams = this.getURLSearchParams(url);

    while (searchParams.size > 0) {
      for (const key of searchParams.keys()) {
        searchParams.delete(key);
      }
    }

    window.history.replaceState(null, null, url.pathname);
  }

  /**
   * Validates if a given string is a valid URL.
   * @param {string} text - The string to validate.
   * @returns {{isValid: boolean, errorMessage: string}} An object indicating if the URL is valid.
   */
  isValidURL(text) {
    let isValid;
    try {
      new URL(text);

      isValid = true;
    } catch (error) {
      isValid = false;
    }

    return {
      isValid: isValid,
      errorMessage: ''
    };
  }

  /**
   * Validates a string against a given regular expression.
   * @param {string} text - The string to test.
   * @param {RegExp} regexp - The regular expression to match against.
   * @returns {boolean} True if the text matches the pattern, false otherwise.
   */
  isValidElement(text, regexp) {
    return (text) ? text.match(regexp) : false;
  }

  /**
   * Queries for the active tabs in the current window.
   * @async
   * @returns {Promise<browser.tabs.Tab[]>} A promise that resolves with an array of active tabs.
   * @throws {Error} If the browser query fails.
   */
  async getActiveTabs() {
    const queryOptions = { active: true, currentWindow: true };

    const tabs = await this.getBrowserHandler().tabs.query(queryOptions);

    if (!tabs) {
      throw new Error(this.I18n.getMessage(PageBaseController.i18nKeys.messages.ERROR_BROWSER_QUERY_TAB_FAILED));
    }

    return tabs;
  }

  /**
   * Gets the single currently active tab in the current window.
   * @async
   * @returns {Promise<browser.tabs.Tab|undefined>} A promise that resolves with the active tab object, or undefined if none is found.
   */
  async getCurrentAndActiveTab() {
    // 'tab' will either be a 'tabs[0]' instance or 'undefined'.
    const [tab] = await this.getActiveTabs();

    return tab;
  }

  /**
   * Gets the hostname from the URL of the currently active tab.
   * @async
   * @returns {Promise<string>} A promise that resolves with the hostname (e.g., 'www.google.com').
   */
  async getHostnameFromCurrentActiveTab() {
    const tab = await this.getCurrentAndActiveTab();

    // If there's no active tab or no URL, there's nothing to search.
    if (!tab || !tab.url) {
      return '';
    }

    // Parse the URL to extract its components.
    const url = new URL(tab.url);

    // These are the protocols we consider valid for an automatic search.
    const validProtocols = ['http:', 'https:'];

    // If the URL's protocol is one of the valid ones, return its hostname.
    if (validProtocols.includes(url.protocol)) {
      return url.hostname;
    }

    // For all other cases (e.g., 'chrome:', 'about:', 'file:'), return an empty string.
    return '';
  }

  /**
   * Extracts engine, path, and secret name from a full secret string.
   * It handles variations with leading/trailing slashes and multiple sub-paths.
   * @param {string} value - The full secret path string (e.g., 'engine/path/secret').
   * @returns {{fullName: string, engine: {name: string}, path: string, name: string}} An object containing the dissected parts of the secret path.
   */
  extractSecretFrom(value) {
    /*
    Regex Explanation:
    ^\/?                       // Matches an optional leading slash at the start of the string.
    ([^/]+)                    // Captures the engine name (one or more characters that are not slashes).
    (?:\/([^/]+(?:\/[^/]+)*))? // Non-capturing group to match the path, allowing for multiple segments separated by slashes. This group is optional.
    \/([^/]+)                  // Matches a slash followed by one or more non-slash characters (captures the secret name).
    \/?$                       // Allows for an optional trailing slash at the end of the string.
    */

    const regex = /^\/?([^/]+)(?:\/([^/]+(?:\/[^/]+)*))?\/([^/]+)\/?$/;

    value = value.replace(/\/\/+/g, '/');

    const match = value.match(regex);

    const obj = {
      fullName: value,
      engine: {
        name: match?.[1] || ''
      },
      path: match?.[2] || '',
      name: match?.[3] || ''
    };

    return obj;
  }

  /**
   * Generates an array of all parent domains and subdomains from a given domain string.
   * For example, 'sub2.sub1.domain.com' would produce ['sub2.sub1.domain.com', 'sub1.domain.com', 'domain.com'].
   * @param {string} text - The full domain or subdomain string.
   * @returns {string[]} An array of domains, from most specific to least specific.
   */
  getAllSubdomains(text) {
    const results = [];

    while (text) {
      results.push(text);

      text = this.removeSubdomain(text);
    }

    return results;
  }

  /**
   * Removes the lowest-level subdomain from a domain string.
   * For example, 'sub2.sub1.domain.com' becomes 'sub1.domain.com'. It is aware of common TLDs.
   * @param {string} text - The domain string to process.
   * @returns {string} The domain with the subdomain removed, or an empty string if it's a root domain.
   */
  removeSubdomain(text) {
    // co, com, gov, blog | co.uk, com.br, gov.us, blog.br
    const tldRegex = /^([a-z]{2,4})(\.[a-z]{2})?$/i;

    let result = '';
    const list = text.split('.');

    if (list.length > 2) {
      result = list.slice(1).join('.');

      if (RegExp(tldRegex).exec(result)) {
        result = '';
      }
    }

    return result;
  }

  /**
   * Retrieves all frames (including iframes) within a specific tab.
   * @async
   * @param {number} tabId - The ID of the tab to query.
   * @returns {Promise<browser.webNavigation.GetAllFramesCallbackDetails[]>} A promise that resolves with an array of frame objects.
   */
  async getAllFramesFrom(tabId) {
    return this.getBrowserHandler().webNavigation.getAllFrames({ tabId: tabId });
  }

  /**
   * Searches for a value in a data object where the key matches one of the keys in a provided list.
   * The search is case-insensitive.
   * @param {object} data - The data object to search within (e.g., a secret's data).
   * @param {string} list - A comma-separated string of possible keys to look for (e.g., 'user,username,login').
   * @returns {any|null} The value of the first matching key found, or null if no match is found.
   */
  getValueIfDataHasKey(data, list) {
    list = list.toLowerCase().replace(' ', '').split(',');

    if (data) {
      for (const [key, value] of Object.entries(data)) {
        for (const keyToSearch of list) {
          if (key.toLowerCase() === keyToSearch) {
            return value;
          }
        }
      }
    }

    return null;
  }

  /**
   * Checks if the extension has permission to write to the clipboard.
   * @async
   * @returns {Promise<boolean>} A promise that resolves to true if permission is granted, false otherwise.
   */
  async hasClipboardWritePermission() {
    const write = await navigator.permissions.query({
      name: 'clipboard-write'
    });

    return (write.state === 'granted');
  }

  /**
   * Copies the value of a given HTML element to the clipboard.
   * @async
   * @param {HTMLElement} element - The element whose value should be copied.
   * @returns {Promise<void>}
   */
  async copyElementToClipboard(element) {
    try {
      await this.copyValueToClipboard(this.form.getValue(element));
    } catch (error) {
      this.notification.clear().error(error);
    }
  }

  /**
   * Copies a given string value to the clipboard and shows a confirmation notification.
   * @async
   * @param {string} value - The string to copy.
   * @returns {Promise<void>}
   */
  async copyValueToClipboard(value) {
    try {
      const hasPermissions = await this.hasClipboardWritePermission();

      if ((hasPermissions) && (document.hasFocus())) {

        await navigator.clipboard.writeText(value);

        this.notification.clear().info(this.I18n.getMessage(PageBaseController.i18nKeys.messages.UI_MESSAGE_COPIED_TO_CLIPBOARD),
          {
            removeOption: false,
            time: 3000
          });
      }
    } catch (error) {
      this.notification.clear().error(error);
    }
  }

  /**
   * Switches the visibility of tabbed content.
   * Shows the content for the specified tabId and hides all others.
   * @param {string} tabId - The ID of the content `div` to show.
   * @returns {void}
   */
  openTab(tabId) {
    const tabs = document.getElementsByClassName('tab_content');

    for (const tab of tabs) {
      const button = this.getElementById(this.getButtonIdFromDivId(tab));

      if (tab.id === (tabId)) {
        this.form.classListAdd(button, 'active');
        this.form.show(tab);
      } else {
        this.form.classListRemove(button, 'active');
        this.form.hide(tab);
      }
    }
  }

  /**
   * Derives a tab button's ID from its corresponding content div's ID.
   * Assumes a naming convention of 'div_...' for content and 'button_...' for buttons.
   * @param {HTMLElement} tab - The tab content `div` element.
   * @returns {string} The corresponding button's ID.
   */
  getButtonIdFromDivId(tab) {
    return tab.id.replace('div_', 'button_');
  }

  /**
   * Creates a new `<option>` element for use in a `<select>` dropdown.
   * @param {string} value - The value attribute for the option.
   * @param {string} [text] - The display text for the option. If not provided, `value` is used.
   * @returns {HTMLOptionElement} The newly created option element.
   */
  createOption(value, text) {
    const option = document.createElement('option');

    option.value = value;
    option.text = (text) || value;

    return option;
  }

}
