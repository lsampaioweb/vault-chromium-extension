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
      // Minimum number of rows for the textarea.
      MIN_TEXTAREA_ROWS: 3
    },
    messages: {
      ...PageBaseController.i18nKeys.messages, // Inherit base messages.
      ERROR_UNWRAP_HASH_FORMAT_INVALID: 'error_unwrap_hash_format_invalid',
      UI_MESSAGE_UNWRAPPING: 'ui_message_unwrapping'
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
   * Gets the unwrap hash input element where users enter the wrapped secret hash.
   *
   * @returns {HTMLInputElement|null} The unwrap hash input element, or null if not found.
   */
  getInputUnwrapHash() {
    return this.getElementById('unwrap_hash');
  }

  /**
   * Gets the unwrap button element that triggers the unwrapping process.
   *
   * @returns {HTMLButtonElement|null} The unwrap button element, or null if not found.
   */
  getButtonUnwrap() {
    return this.getElementById('button_unwrap');
  }

  /**
   * Gets the label element that displays above the unwrap result area.
   *
   * @returns {HTMLLabelElement|null} The unwrap result label element, or null if not found.
   */
  getLabelUnwrapResult() {
    return this.getElementById('label_unwrap_result');
  }

  /**
   * Gets the image element used for copying the unwrap result to clipboard.
   *
   * @returns {HTMLImageElement|null} The copy result image element, or null if not found.
   */
  getUnwrapResultCopyImg() {
    return this.getElementById('unwrap_result_copy_img');
  }

  /**
   * Gets the textarea element that displays the unwrapped secret data.
   *
   * @returns {HTMLTextAreaElement|null} The unwrap result textarea element, or null if not found.
   */
  getUnwrapResult() {
    return this.getElementById('unwrap_result');
  }

  /**
   * Validates form elements specific to the unwrap page.
   * Currently handles validation for the unwrap hash input field.
   *
   * @param {HTMLElement|null} element - The DOM element to validate.
   * @returns {Object} Validation result with isValid boolean and optional errorMessage string.
   */
  isValid(element) {
    if (element) {
      if (element.id === 'unwrap_hash') {
        return this.isValidUnwrapHash(element.value);
      }
    }

    return {
      isValid: false,
      errorMessage: ''
    };
  }

  /**
   * Validates that the unwrap hash follows the expected Vault format.
   * Checks that the hash starts with 'hvs.' followed by valid characters.
   *
   * @param {string} text - The unwrap hash value to validate.
   * @returns {Object} Validation result with isValid boolean and optional errorMessage string.
   */
  isValidUnwrapHash(text) {
    let isValid = true;
    let errorMessage;

    if (!this.isValidElement(text, /^hvs\.[\w-]+$/g)) {
      isValid = false;
      errorMessage = this.I18n.getMessage(PageController.i18nKeys.messages.ERROR_UNWRAP_HASH_FORMAT_INVALID);
    }

    return {
      isValid: isValid,
      errorMessage: errorMessage
    };
  }

  /**
   * Sets focus to the first form element or the first empty element.
   * Used to improve user experience by automatically focusing on the unwrap hash input.
   *
   * @returns {void}
   */
  setFocusOnFirstElementOrFirstEmpty() {
    const unwrapHash = this.getInputUnwrapHash();

    this.form.setFocusOnFirstElementOrFirstEmpty([unwrapHash]);
  }

  /**
   * Formats unwrapped data for display in the result textarea.
   * Can format as JSON or as key-value pairs depending on the asJson parameter.
   *
   * @param {Object} data - The unwrapped data object to format.
   * @param {boolean} [asJson=true] - Whether to format as pretty JSON or key-value pairs.
   * @returns {string} The formatted data string ready for display.
   */
  formatUnwrappedData(data, asJson = true) {
    if (asJson) {
      // Pretty JSON.
      return JSON.stringify(data, null, 2);
    }

    // Fallback to key-value list format.
    let formattedResult = "";

    for (const [key, value] of Object.entries(data)) {
      formattedResult += `${key}: ${value}\n`;
    }

    return formattedResult;
  }

  /**
   * Dynamically adjusts the height of a textarea based on its content.
   * Ensures the textarea is tall enough to display all content without scrolling.
   *
   * @param {HTMLElement} textarea - The textarea element to resize.
   * @param {string} content - The content that will be displayed in the textarea.
   * @returns {void}
   */
  updateTextareaSize(textarea, content) {
    // Calculate the number of lines in the content.
    const lineCount = content.split('\n').length;

    // Set the rows attribute dynamically based on the line count and minimum rows.
    textarea.rows = Math.max(lineCount, PageController.i18nKeys.constants.MIN_TEXTAREA_ROWS);
  }

  /**
   * Shows loading state during the unwrap operation.
   * Disables the unwrap button and displays an informational message.
   *
   * @returns {void}
   */
  showLoading() {
    this.form.disable(this.getButtonUnwrap());

    this.notification.info(this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_UNWRAPPING), { removeOption: false });
  }

  /**
   * Hides loading state after the unwrap operation completes.
   * Re-enables the unwrap button and clears any notification messages.
   *
   * @returns {void}
   */
  hideLoading() {
    this.form.enable(this.getButtonUnwrap());

    this.notification.clear();
  }

  /**
   * Copies the unwrap result content to the clipboard.
   * Uses the result textarea element to get the unwrapped data.
   * Prevents default event behavior and shows appropriate notifications.
   *
   * @async
   * @param {Event} event - The click event that triggered the copy action.
   * @returns {Promise<void>}
   */
  async copyResultToClipboard(event) {
    try {
      await this.copyElementToClipboard(this.getUnwrapResult());

      // Cancel the default action.
      event.preventDefault();
    } catch (error) {
      this.notification.clear().error(error);
    }
  }

}
