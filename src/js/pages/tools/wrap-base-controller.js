import { PageBaseController } from '../../ui/page-base-controller.js';

export class PageController extends PageBaseController {

  /**
   * Constants and I18n keys that are specific to the this.
   * @private
   * @static
   * @readonly
   */
  static i18nKeys = {
    constants: {
      ...PageBaseController.i18nKeys.constants, // Inherit all base constants.
      TTL_MAXIMUM_SIZE: 1440,
      TAB_TYPE_SIMPLE: 'simple',
      TAB_TYPE_COMPLEX: 'complex'
    },
    messages: {
      ...PageBaseController.i18nKeys.messages, // Inherit base messages.
      UI_MESSAGE_WRAPPING: 'ui_message_wrapping',
      ERROR_WRAP_DATA_FORMAT_INVALID_JSON: 'error_wrap_data_format_invalid_json',
      ERROR_WRAP_TTL_NOT_A_NUMBER: 'error_wrap_ttl_not_a_number',
      ERROR_WRAP_TTL_OUT_OF_RANGE: 'error_wrap_ttl_out_of_range',
    },
  };

  /**
   * Constructor that accepts dependencies and passes them to the base class.
   * @param {object} dependencies - The injected dependencies
   */
  constructor(dependencies) {
    super(dependencies);
  }

  /**
   * Gets the button that activates the 'simple' wrap type tab.
   * @returns {HTMLButtonElement|null} The simple wrap tab button, or null if not found.
   */
  getButtonWrapTypeSimple() {
    return this.getElementById('button_wrap_type_simple');
  }

  /**
   * Gets the button that activates the 'complex' wrap type tab.
   * @returns {HTMLButtonElement|null} The complex wrap tab button, or null if not found.
   */
  getButtonWrapTypeComplex() {
    return this.getElementById('button_wrap_type_complex');
  }

  /**
   * Gets the key input element from the 'simple' wrap tab.
   * @returns {HTMLInputElement|null} The key input element, or null if not found.
   */
  getInputWrapKey() {
    return this.getElementById('wrap_key');
  }

  /**
   * Gets the value input element from the 'simple' wrap tab.
   * @returns {HTMLInputElement|null} The value input element, or null if not found.
   */
  getInputWrapValue() {
    return this.getElementById('wrap_value');
  }

  /**
   * Gets the JSON textarea element from the 'complex' wrap tab.
   * @returns {HTMLTextAreaElement|null} The JSON textarea element, or null if not found.
   */
  getInputWrapJson() {
    return this.getElementById('wrap_json');
  }

  /**
   * Gets the TTL (Time-To-Live) input element for the wrapped secret.
   * @returns {HTMLInputElement|null} The TTL input element, or null if not found.
   */
  getInputWrapTTL() {
    return this.getElementById('wrap_ttl');
  }

  /**
   * Gets the main 'wrap' (encrypt) button.
   * @returns {HTMLButtonElement|null} The wrap button element, or null if not found.
   */
  getButtonWrap() {
    return this.getElementById('button_wrap');
  }

  /**
   * Gets the label element displayed above the wrap result.
   * @returns {HTMLLabelElement|null} The wrap result label element, or null if not found.
   */
  getLabelWrapResult() {
    return this.getElementById('label_wrap_result');
  }

  /**
   * Gets the copy icon/image associated with the wrap result.
   * @returns {HTMLImageElement|null} The copy image element, or null if not found.
   */
  getWrapResultCopyImg() {
    return this.getElementById('wrap_result_copy_img');
  }

  /**
   * Gets the textarea element where the wrapped hash result is displayed.
   * @returns {HTMLTextAreaElement|null} The wrap result textarea element, or null if not found.
   */
  getWrapResult() {
    return this.getElementById('wrap_result');
  }

  /**
   * Opens the simple wrap type tab and sets focus appropriately.
   * @returns {void}
   */
  openTabTypeSimple() {
    return this.openTab('div_wrap_type_simple');
  }

  /**
   * Opens the complex wrap type tab and sets focus appropriately.
   * @returns {void}
   */
  openTabTypeComplex() {
    return this.openTab('div_wrap_type_complex');
  }

  /**
   * Enhanced tab opening function that also sets focus after tab switch.
   * @param {string} tabId - The ID of the tab content div to show.
   * @returns {Function} A function that opens the specified tab and sets focus.
   */
  openTab(tabId) {
    return () => {
      super.openTab(tabId);

      this.setFocusOnFirstElementOrFirstEmpty();
    };
  }

  /**
   * Validates form elements based on their ID and content.
   * @param {HTMLElement} element - The form element to validate.
   * @returns {{isValid: boolean, errorMessage: string}} Validation result object.
   */
  isValid(element) {
    if (element) {
      switch (element.id) {
        case 'wrap_key':
          return this.isValidKey(element.value);
        case 'wrap_value':
          return this.isValidValue(element.value);
        case 'wrap_json':
          return this.isValidJson(element.value);
        case 'wrap_ttl':
          return this.isValidTTL(element.value);
      }
    }

    return {
      isValid: false,
      errorMessage: ''
    };
  }

  /**
   * Validates the wrap key input using alphanumeric characters and hyphens only.
   * @param {string} text - The key text to validate.
   * @returns {{isValid: boolean, errorMessage: string}} Validation result with success status.
   */
  isValidKey(text) {
    return {
      // Regex: ^[\w-]+$
      // - ^ and $: Ensure the entire string matches.
      // - \w: Matches any alphanumeric character (A-Z, a-z, 0-9, and _).
      // - -: Includes the hyphen (-) as a valid character.
      // - +: Requires at least one character.
      isValid: this.isValidElement(text, /^[\w-]+$/gi),
      errorMessage: ''
    };
  }

  /**
   * Validates the wrap value input ensuring it contains at least one character.
   * @param {string} text - The value text to validate.
   * @returns {{isValid: boolean, errorMessage: string}} Validation result with success status.
   */
  isValidValue(text) {
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
   * Validates JSON input by attempting to parse it and checking for syntax errors.
   * @param {string} text - The JSON text to validate.
   * @returns {{isValid: boolean, errorMessage: string}} Validation result with error message if invalid.
   */
  isValidJson(text) {
    let isValid = true;
    let errorMessage;

    try {
      // Ensure it's valid JSON.
      JSON.parse(text);
    } catch (error) {
      isValid = false;
      errorMessage = this.I18n.getMessage(PageController.i18nKeys.messages.ERROR_WRAP_DATA_FORMAT_INVALID_JSON);
    }

    return {
      isValid: isValid,
      errorMessage: errorMessage
    };
  }

  /**
   * Validates the TTL (Time-To-Live) input value.
   * @param {string} text - The TTL text to validate.
   * @returns {{isValid: boolean, errorMessage: string}} Validation result with error message if invalid.
   */
  isValidTTL(text) {
    let isValid = true;

    // Regex: ^\d+$
    // - ^ and $: Ensure the entire string matches.
    // - \d: Matches any digit (0-9).
    // - +: Requires at least one digit.
    const isNumber = this.isValidElement(text, /^\d+$/g);

    let errorMessage;
    if (!isNumber) {
      isValid = false;
      errorMessage = this.I18n.getMessage(PageController.i18nKeys.messages.ERROR_WRAP_TTL_NOT_A_NUMBER);
    } else if ((text <= 0) || (text > PageController.i18nKeys.constants.TTL_MAXIMUM_SIZE)) {
      isValid = false;
      errorMessage = this.I18n.getMessage(PageController.i18nKeys.messages.ERROR_WRAP_TTL_OUT_OF_RANGE, [PageController.i18nKeys.constants.TTL_MAXIMUM_SIZE]);
    }

    return {
      isValid: isValid,
      errorMessage: errorMessage
    };
  }

  /**
   * Sets focus on the first form element or the first empty element.
   * @returns {void}
   */
  setFocusOnFirstElementOrFirstEmpty() {
    const wrapKey = this.getInputWrapKey();
    const wrapValue = this.getInputWrapValue();
    const wrapJson = this.getInputWrapJson();
    const wrapTTL = this.getInputWrapTTL();

    this.form.setFocusOnFirstElementOrFirstEmpty([wrapKey, wrapValue, wrapJson, wrapTTL]);
  }

  /**
   * Shows the simple wrap type tab.
   */
  showWrapTypeSimpleTab() {
    const button = this.getButtonWrapTypeSimple();

    button?.click();
  }

  /**
   * Gets the currently selected wrap type from tab buttons.
   * @returns {string} The wrap type ('simple' or 'complex').
   */
  getSelectedSecretType() {
    const buttons = document.getElementsByClassName('tab_button');

    for (const button of buttons) {
      if (button.classList.contains('active')) {
        return button.id.replace(/button_wrap_type_(\w+)/g, '$1');
      }
    }

    return '';
  }

  /**
   * Shows loading state during the wrap operation.
   * Disables the wrap button and displays an informational message.
   *
   * @returns {void}
   */
  showLoading() {
    this.form.disable(this.getButtonWrap());

    this.notification.info(this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_WRAPPING), { removeOption: false });
  }

  /**
   * Hides loading state after the wrap operation completes.
   * Re-enables the wrap button and clears any notification messages.
   *
   * @returns {void}
   */
  hideLoading() {
    this.form.enable(this.getButtonWrap());

    this.notification.clear();
  }

  /**
   * Copies the wrap result to clipboard.
   * @param {Event} event - The event object.
   */
  async copyResultToClipboard(event) {
    try {
      await this.copyElementToClipboard(this.getWrapResult());

      // Cancel the default action.
      event.preventDefault();
    } catch (error) {
      this.notification.clear().error(error);
    }
  }

}
