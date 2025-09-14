import { PageBaseController } from '../../ui/page-base-controller.js';

export class PageController extends PageBaseController {

  /**
   * Constants and I18n keys that are specific to the page.
   * @private
   * @static
   * @readonly
   */
  static i18nKeys = {
    constants: {
      ...PageBaseController.i18nKeys.constants, // Inherit all base constants.
      SECRET_LIST_PAGE_ID_PATTERN: 'secret_list_page_',
      ELEMENTS_PER_PAGE: 4,
      MAXIMUM_NUMBER_OF_PAGINATION_BUTTONS: 11
    },
    messages: {
      ...PageBaseController.i18nKeys.messages, // Inherit base messages.
      UI_CONFIRM_DELETE_SECRET: 'ui_confirm_delete_secret',
      UI_MESSAGE_DELETE_SECRET_SUCCESS: 'ui_message_delete_secret_success',
      UI_LABEL_USER: 'ui_label_user',
      UI_TOOLTIP_BUTTON_COPY_PASSWORD: 'ui_tooltip_button_copy_password',
      UI_LABEL_TOKEN: 'ui_label_token',
      UI_TOOLTIP_BUTTON_COPY_TOKEN: 'ui_tooltip_button_copy_token',
      UI_MESSAGE_INVALID_ATTRIBUTES: 'ui_message_invalid_attributes',
      ERROR_MESSAGE_HANDLING_FAILED: 'error_message_handling_failed',
      ERROR_LOAD_PAGE_DATA_FAILED: 'error_load_page_data_failed',
      ERROR_SEARCH_COMPLETED_WITH_ERRORS: 'error_search_completed_with_errors'
    },
  };

  /**
   * Crypto service for encryption and decryption operations.
   * @type {object|null}
   */
  VaultCrypto;

  /**
   * Pagination utility service for managing page navigation.
   * @type {object|null}
   */
  pagination;

  /**
   * Promise pool utility for managing concurrent operations.
   * @type {object|null}
   */
  PromisePool;

  /**
   * HTML replacement utility for dynamic content updates.
   * @type {object|null}
   */
  HTMLReplacer;

  /**
   * Constructor that accepts dependencies and passes them to the base class.
   * @param {object} dependencies - The injected dependencies.
   */
  constructor(dependencies) {
    super(dependencies);

    // Extract specific dependencies this controller needs.
    this.VaultCrypto = dependencies.VaultCrypto;
    this.pagination = dependencies.pagination;
    this.PromisePool = dependencies.PromisePool;
    this.HTMLReplacer = dependencies.HTMLReplacer;
  }

  /**
   * Gets the search input element from the page.
   * @returns {HTMLInputElement|null} The search input element, or null if not found.
   */
  getInputSearch() {
    return this.getElementById('search');
  }

  /**
   * Gets the search button element from the page.
   * @returns {HTMLButtonElement|null} The search button element, or null if not found.
   */
  getButtonSearch() {
    return this.getElementById('button_search');
  }

  /**
   * Gets the 'New Secret' button element from the page.
   * @returns {HTMLButtonElement|null} The 'New Secret' button element, or null if not found.
   */
  getButtonNewSecret() {
    return this.getElementById('button_new_secret');
  }

  /**
   * Gets the main container element where the list of secrets is rendered.
   * @returns {HTMLDivElement|null} The secrets list container, or null if not found.
   */
  getSecretList() {
    return this.getElementById('secret_list');
  }

  /**
   * Gets the template element for a single page of secrets.
   * This is cloned to create new pages for pagination.
   * @returns {HTMLUListElement|null} The secret page template element, or null if not found.
   */
  getSecretPage() {
    return this.getElementById('secret_list_page');
  }

  /**
   * Gets the template element for a single secret item in the list.
   * This is cloned for each secret to be displayed.
   * @returns {HTMLLIElement|null} The secret item template element, or null if not found.
   */
  getSecretTemplate() {
    return this.getElementById('secret_template');
  }

  /**
   * Gets the container element for the pagination controls.
   * @returns {HTMLDivElement|null} The pagination bar container, or null if not found.
   */
  getPaginationBar() {
    return this.getElementById('pagination_bar');
  }

  /**
   * Gets the template `<ul>` element for the pagination list.
   * @returns {HTMLUListElement|null} The pagination list template, or null if not found.
   */
  getPaginationList() {
    return this.getElementById('pagination_list');
  }

  /**
   * Gets the template `<li>` element for a single pagination button (page number).
   * @returns {HTMLLIElement|null} The pagination item template, or null if not found.
   */
  getPaginationItem() {
    return this.getElementById('pagination_item');
  }

  /**
   * Retrieves the 'search' parameter from the URL query string.
   * @returns {string|null} The value of the 'search' parameter, or null if not present.
   */
  getSearchFromQueryString() {
    return this.getQueryString('search');
  }

  /**
   * Retrieves the 'page' parameter from the URL query string.
   * @returns {string|null} The value of the 'page' parameter, or null if not present.
   */
  getPageFromQueryString() {
    return this.getQueryString('page');
  }

  /**
   * Validates a given form element from the secrets list page.
   * @param {HTMLElement} element - The HTML element to validate.
   * @returns {{isValid: boolean, errorMessage?: string}} An object indicating if the element's value is valid.
   */
  isValid(element) {
    if (element) {
      if (element.id === 'search') {
        return this.isValidSearch(element.value);
      }
    }

    return {
      isValid: false,
      errorMessage: ''
    };
  }

  /**
   * Validates the search text to ensure it's not empty.
   * @param {string} text - The search text to validate.
   * @returns {{isValid: boolean, errorMessage?: string}} An object indicating if the search text is valid.
   */
  isValidSearch(text) {
    return {
      // Regex: ^(.)+$
      // - ^ and $: Ensure the entire string matches.
      // - (.): Matches any single character (except line breaks).
      // - +: Requires at least one character.
      isValid: this.isValidElement(text, /^(.)+$/gi),
      errorMessage: ''
    };
  }

  /**
   * Sets the focus on the search input field.
   * @returns {void}
   */
  setFocusOnFirstElementOrFirstEmpty() {
    const search = this.getInputSearch();

    this.form.setFocusOnFirstElementOrFirstEmpty([search]);
  }

  /**
   * Calculates the array indices for secrets that belong to a specific page.
   * This enables lazy loading by determining which slice of the secrets array to process.
   * @param {number} pageNumber - The page number (1-based).
   * @param {number} elementsPerPage - Number of secrets per page.
   * @param {number} totalElements - Total number of secrets available.
   * @returns {Object} Object with startIndex and endIndex for array slicing.
   */
  calculatePageIndices(pageNumber, elementsPerPage, totalElements) {
    // Convert 1-based page number to 0-based array index.
    const startIndex = (pageNumber - 1) * elementsPerPage;
    const endIndex = Math.min(startIndex + elementsPerPage, totalElements);

    return { startIndex, endIndex };
  }

  /**
   * Calculates the total number of pages needed based on available secrets.
   * Used by pagination component to determine how many page buttons to show.
   * @param {number} totalSecrets - Total number of secrets available.
   * @param {number} elementsPerPage - Number of secrets per page.
   * @returns {number} Total number of pages needed.
   */
  calculateTotalPages(totalSecrets, elementsPerPage) {
    return Math.ceil(totalSecrets / elementsPerPage);
  }

  /**
   * Creates and renders the pagination bar if there is more than one page of results.
   * @param {number} quantityOfPages - The total number of pages.
   * @param {number} currentPage - The currently active page number.
   * @param {function(number): void} callback - The function to call when a page button is clicked.
   * @param {number} [maximumNumberOfPaginationButtons] - The max number of page buttons to show at once.
   */
  createPaginationBar(quantityOfPages, currentPage, callback, maximumNumberOfPaginationButtons = PageController.i18nKeys.constants.MAXIMUM_NUMBER_OF_PAGINATION_BUTTONS) {
    if (quantityOfPages <= 1)
      return;

    const pageObjects = {
      paginationBar: this.getPaginationBar(),
      paginationList: this.getPaginationList(),
      paginationItem: this.getPaginationItem()
    };

    this.pagination.createPaginationBar(quantityOfPages, currentPage, callback, maximumNumberOfPaginationButtons, pageObjects);
  }

  /**
   * Shows search loading state by disabling the search button and displaying a loading message.
   */
  showSearchLoading() {
    this.form.disable(this.getButtonSearch());

    this.notification.info(this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_CONNECTING), { removeOption: false });
  }

  /**
   * Hides search loading state by enabling the search button and clearing notifications.
   */
  hideSearchLoading() {
    this.form.enable(this.getButtonSearch());

    this.notification.clear();
  }

  /**
   * Gets the page number, handling query string parameters and validation.
   * @param {number} pageNumber - The requested page number.
   * @returns {number} The validated page number (defaults to 1 if invalid).
   */
  getPageNumber(pageNumber) {
    if (pageNumber == 1) {
      const pageFromQueryString = this.getPageFromQueryString();

      if (pageFromQueryString) {
        // Clear the querystring to avoid future searches using these same values.
        this.deleteAllQueryStrings();

        pageNumber = pageFromQueryString;
      }
    }

    return isNaN(pageNumber) ? 1 : Number(pageNumber);
  }

  /**
   * Creates a basic key-value map for HTML template replacement.
   * @param {string} title - The title text to replace __template_title__.
   * @param {string} body - The body text to replace __template_body__.
   * @returns {Map<string, string>} Map containing the replacement key-value pairs.
   */
  getBasicKeyValuesToReplace(title, body) {
    return new Map([
      ['__template_title__', title],
      ['__template_body__', body]
    ]);
  }

  /**
   * Creates a key-value map for secret HTML template replacement.
   * @param {string} newValueBody - The secret name to replace the loading message.
   * @param {string} [textTooltip=''] - The text for copy value tooltip.
   * @returns {Map<string, string>} Map containing the replacement key-value pairs.
   */
  getKeyValuesToReplace(newValueBody, textTooltip = '') {
    // If it is the first time this secret is being loaded, show a loading message.
    const loadingMessage = this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_LOADING);

    // If it is the second+ time this secret is being loaded, the default text was already replaced, so we need to also search for this value.
    const invalidAttributesMessage = this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_INVALID_ATTRIBUTES);

    return new Map([
      [loadingMessage, newValueBody],
      [invalidAttributesMessage, newValueBody],
      ['__template_copy_value__', textTooltip]
    ]);
  }

  /**
   * Replaces HTML content using a flexible key-value mapping system.
   * @param {HTMLElement} element - The DOM element to process.
   * @param {Map<string, string>} keyValuesToReplace - Map of keys to replacement values.
   */
  replaceHtml(element, keyValuesToReplace) {
    // Extract all keys from the map to build a dynamic regex.
    const keys = Array.from(keyValuesToReplace.keys());

    // Escape special regex characters in each key (dots, brackets, etc.).
    const escapedKeys = keys.map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    // Create a regex pattern that matches any of the keys: (key1|key2|key3).
    const regexPattern = `(${escapedKeys.join('|')})`;

    const match = {
      // Build regex from the dynamic pattern with global flag.
      regex: new RegExp(regexPattern, 'g'),
      func: this.replaceHTMLCallback(keyValuesToReplace)
    };

    // Replace HTML content in the element using the match object.
    this.HTMLReplacer.replace(element, match);
  }

  /**
   * Creates a callback function for HTML replacement operations.
   * @param {Map<string, string>} keyValuesToReplace - Map of keys to replacement values.
   * @returns {Function} Callback function for HTMLReplacer.
   * @private
   */
  replaceHTMLCallback(keyValuesToReplace) {
    return function (match, v1) {
      return keyValuesToReplace.get(v1) || match;
    };
  }

}
