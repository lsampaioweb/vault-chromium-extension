import { I18n, form } from '../common.js';
import { PageBase } from '../libs/pagebase.js';

export class Page extends PageBase {
  static #PASSWORD_MAXIMUM_SIZE = 40;

  static getInputNumbersYes() {
    return this.getElementById('numbers_yes');
  }

  static getInputLowercaseYes() {
    return this.getElementById('lowercase_yes');
  }

  static getInputUppercaseYes() {
    return this.getElementById('uppercase_yes');
  }

  static getInputSpecialCharactersYes() {
    return this.getElementById('special_characters_yes');
  }

  static getInputSize() {
    return this.getElementById('size');
  }

  static getLabelGeneratedPassword() {
    return this.getElementById('label_generated_password');
  }

  static getGeneratedPassword() {
    return this.getElementById('generated_password');
  }

  static getHiddenGeneratedPassword() {
    return this.getElementById('hidden_generated_password');
  }

  static getGeneratedPasswordToggleView() {
    return this.getElementById('generated_password_toggle_view');
  }

  static getGeneratedPasswordCopyImg() {
    return this.getElementById('generated_password_copy_img');
  }

  static getButtonGenerate() {
    return this.getElementById('button_password_generator');
  }

  static isValid(element) {
    if (element) {
      if (element.id === 'size') {
        return Page.isValidSize(element.value);
      }
    }

    return {
      isValid: false,
      errorMessage: ''
    };
  }

  static isValidSize(text) {
    let isValid = true;

    // Regex: ^\d+$
    // - ^ and $: Ensure the entire string matches.
    // - \d: Matches any digit (0-9).
    // - +: Ensures at least one digit is present.
    const isNumber = this.isValidElement(text, /^\d+$/g);

    let errorMessage;
    if (!isNumber) {
      isValid = false;
      errorMessage = I18n.getMessage('password_size_is_not_a_number');
    } else if ((text <= 0) || (text > this.#PASSWORD_MAXIMUM_SIZE)) {
      isValid = false;
      errorMessage = I18n.getMessage('password_size_is_not_in_range');
    }

    return {
      isValid: isValid,
      errorMessage: errorMessage
    };
  }

  static setFocusOnFirstElementOrFirstEmpty() {
    const size = this.getInputSize();

    form.setFocusOnFirstElementOrFirstEmpty([size]);
  }
}
