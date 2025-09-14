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
      PASSWORD_MINIMUM_SIZE: 1,
      PASSWORD_MAXIMUM_SIZE: 40
    },
    messages: {
      ...PageBaseController.i18nKeys.messages, // Inherit base messages.
      ERROR_PASSWORD_GENERATOR_OPTION_REQUIRED: 'error_password_generator_option_required',
      ERROR_PASSWORD_GENERATOR_SIZE_NOT_A_NUMBER: 'error_password_generator_size_not_a_number',
      ERROR_PASSWORD_GENERATOR_SIZE_OUT_OF_RANGE: 'error_password_generator_size_out_of_range'
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
   * Gets the 'numbers_yes' checkbox input element for password generation options.
   *
   * @returns {HTMLInputElement|null} The numbers checkbox element, or null if not found.
   */
  getInputNumbersYes() {
    return this.getElementById('numbers_yes');
  }

  /**
   * Gets the 'lowercase_yes' checkbox input element for password generation options.
   *
   * @returns {HTMLInputElement|null} The lowercase checkbox element, or null if not found.
   */
  getInputLowercaseYes() {
    return this.getElementById('lowercase_yes');
  }

  /**
   * Gets the 'uppercase_yes' checkbox input element for password generation options.
   *
   * @returns {HTMLInputElement|null} The uppercase checkbox element, or null if not found.
   */
  getInputUppercaseYes() {
    return this.getElementById('uppercase_yes');
  }

  /**
   * Gets the 'special_characters_yes' checkbox input element for password generation options.
   *
   * @returns {HTMLInputElement|null} The special characters checkbox element, or null if not found.
   */
  getInputSpecialCharactersYes() {
    return this.getElementById('special_characters_yes');
  }

  /**
   * Gets the password size input element.
   *
   * @returns {HTMLInputElement|null} The password size input element, or null if not found.
   */
  getInputSize() {
    return this.getElementById('size');
  }

  /**
   * Gets the label element that displays above the generated password field.
   *
   * @returns {HTMLLabelElement|null} The generated password label element, or null if not found.
   */
  getLabelGeneratedPassword() {
    return this.getElementById('label_generated_password');
  }

  /**
   * Gets the input element that displays the generated password (visible version).
   *
   * @returns {HTMLInputElement|null} The generated password display element, or null if not found.
   */
  getGeneratedPassword() {
    return this.getElementById('generated_password');
  }

  /**
   * Gets the hidden input element that stores the actual generated password value.
   * This element holds the real password while the visible one may show asterisks.
   *
   * @returns {HTMLInputElement|null} The hidden generated password element, or null if not found.
   */
  getHiddenGeneratedPassword() {
    return this.getElementById('hidden_generated_password');
  }

  /**
   * Gets the button element used to toggle password visibility (show/hide).
   *
   * @returns {HTMLButtonElement|null} The password visibility toggle button, or null if not found.
   */
  getGeneratedPasswordToggleView() {
    return this.getElementById('generated_password_toggle_view');
  }

  /**
   * Gets the image element used for copying the generated password to clipboard.
   *
   * @returns {HTMLImageElement|null} The copy password image element, or null if not found.
   */
  getGeneratedPasswordCopyImg() {
    return this.getElementById('generated_password_copy_img');
  }

  /**
   * Gets the button element used to generate a new password.
   *
   * @returns {HTMLButtonElement|null} The generate password button element, or null if not found.
   */
  getButtonGenerate() {
    return this.getElementById('button_password_generator');
  }

  /**
   * Validates form elements specific to the password generator page.
   * Currently handles validation for the password size input field.
   *
   * @param {HTMLElement|null} element - The DOM element to validate.
   * @returns {Object} Validation result with isValid boolean and optional errorMessage string.
   */
  isValid(element) {
    if (element) {
      if (element.id === 'size') {
        return this.isValidSize(element.value);
      }
    }

    return {
      isValid: false,
      errorMessage: ''
    };
  }

  /**
   * Validates that the password size is a valid number within acceptable range.
   * Checks that the value is numeric and falls between minimum and maximum size constraints.
   *
   * @param {string} text - The password size value to validate.
   * @returns {Object} Validation result with isValid boolean and optional errorMessage string.
   */
  isValidSize(text) {
    let isValid = true;

    // Regex: ^\d+$
    // - ^ and $: Ensure the entire string matches.
    // - \d: Matches any digit (0-9).
    // - +: Requires at least one digit is present.
    const isNumber = this.isValidElement(text, /^\d+$/g);

    let errorMessage;
    if (!isNumber) {
      isValid = false;
      errorMessage = this.I18n.getMessage(PageController.i18nKeys.messages.ERROR_PASSWORD_GENERATOR_SIZE_NOT_A_NUMBER);
    } else if ((text < PageController.i18nKeys.constants.PASSWORD_MINIMUM_SIZE) || (text > PageController.i18nKeys.constants.PASSWORD_MAXIMUM_SIZE)) {
      isValid = false;
      errorMessage = this.I18n.getMessage(PageController.i18nKeys.messages.ERROR_PASSWORD_GENERATOR_SIZE_OUT_OF_RANGE, [PageController.i18nKeys.constants.PASSWORD_MINIMUM_SIZE, PageController.i18nKeys.constants.PASSWORD_MAXIMUM_SIZE]);
    }

    return {
      isValid: isValid,
      errorMessage: errorMessage
    };
  }

  /**
   * Sets focus to the first form element or the first empty element.
   * Used to improve user experience by automatically focusing on the appropriate input field.
   *
   * @returns {void}
   */
  setFocusOnFirstElementOrFirstEmpty() {
    const size = this.getInputSize();

    this.form.setFocusOnFirstElementOrFirstEmpty([size]);
  }

  /**
   * Shows the generated password in plaintext and updates the toggle button to "hide" state.
   * @param {HTMLElement} generatedPasswordElement - The password display element.
   * @param {string} generatedPassword - The generated password.
   * @returns {void}
   */
  showGeneratedPassword(generatedPasswordElement, generatedPassword) {
    this.form.setValue(generatedPasswordElement, generatedPassword);

    this.changeToHidePasswordImage();
  }

  /**
   * Hides the generated password with asterisks and updates the toggle button to "show" state.
   * @param {HTMLElement} generatedPasswordElement - The password display element.
   * @param {string} generatedPassword - The generated password.
   * @returns {void}
   */
  hideGeneratedPassword(generatedPasswordElement, generatedPassword) {
    this.form.setValue(generatedPasswordElement, this.form.replaceAllCharactersWithAsterisks(generatedPassword));

    this.changeToShowPasswordImage();
  }

  /**
   * Sets the generated password to the form element with proper visibility.
   * Updates the display based on whether the password should be shown as plaintext or asterisks.
   * Also updates the toggle button image to reflect the current state.
   *
   * @param {HTMLElement} generatedPasswordElement - The password display element.
   * @param {string} generatedPassword - The generated password.
   * @param {boolean} showPassword - Whether to show the password in plaintext.
   * @returns {void}
   */
  setGeneratedPasswordToElementInForm(generatedPasswordElement, generatedPassword, showPassword) {
    if (showPassword) {
      this.showGeneratedPassword(generatedPasswordElement, generatedPassword);
    } else {
      this.hideGeneratedPassword(generatedPasswordElement, generatedPassword);
    }
  }

  /**
   * Toggles the password visibility state between shown and hidden.
   * Retrieves the actual password from the hidden field and updates the display accordingly.
   *
   * @param {boolean} showPassword - Whether to show the password in plaintext.
   * @returns {void}
   */
  toggleShowPassword(showPassword) {
    try {
      const generatedPasswordElement = this.getGeneratedPassword();
      const hiddenGeneratedPasswordElement = this.getHiddenGeneratedPassword();

      const generatedPassword = this.form.getValue(hiddenGeneratedPasswordElement);

      this.setGeneratedPasswordToElementInForm(generatedPasswordElement, generatedPassword, showPassword);
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Changes the toggle button image to the hide password icon.
   * Called when the password is currently visible and should show the "hide" option.
   *
   * @returns {void}
   */
  changeToHidePasswordImage() {
    this.changeToImage("hide-password.svg");
  }

  /**
   * Changes the toggle button image to the show password icon.
   * Called when the password is currently hidden and should show the "show" option.
   *
   * @returns {void}
   */
  changeToShowPasswordImage() {
    this.changeToImage("show-password.svg");
  }

  /**
   * Updates the password toggle button image source.
   *
   * @param {string} imageName - The image filename to use for the toggle button.
   * @returns {void}
   */
  changeToImage(imageName) {
    const generatedPasswordToggleView = this.getGeneratedPasswordToggleView();

    generatedPasswordToggleView.src = `/images/icons/${imageName}`;
  }

  /**
   * Copies the generated password to the clipboard.
   * Uses the hidden password element to get the actual password value.
   * Prevents default event behavior and shows appropriate notifications.
   *
   * @async
   * @param {Event} event - The click event that triggered the copy action.
   * @returns {Promise<void>}
   */
  async copyPasswordToClipboard(event) {
    try {
      await this.copyElementToClipboard(this.getHiddenGeneratedPassword());

      // Cancel the default action.
      event.preventDefault();
    } catch (error) {
      this.notification.clear().error(error);
    }
  }
}
