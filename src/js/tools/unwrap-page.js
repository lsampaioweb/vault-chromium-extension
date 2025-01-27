import { I18n, form } from '../common.js';
import { PageBase } from '../libs/pagebase.js';

export class Page extends PageBase {

  static getInputUnwrapHash() {
    return this.getElementById('unwrap_hash');
  }

  static getButtonUnwrap() {
    return this.getElementById('button_unwrap');
  }

  static getLabelUnwrapResult() {
    return this.getElementById('label_unwrap_result');
  }

  static getUnwrapResultCopyImg() {
    return this.getElementById('unwrap_result_copy_img');
  }

  static getUnwrapResult() {
    return this.getElementById('unwrap_result');
  }

  static isValid(element) {
    if (element) {
      if (element.id === 'unwrap_hash') {
        return Page.isValidUnwrapHash(element.value);
      }
    }

    return {
      isValid: false,
      errorMessage: ''
    };
  }

  static isValidUnwrapHash(text) {
    let isValid = true;
    let errorMessage;
    const hash_minimum_size = 5;

    if (text.length < hash_minimum_size) {
      isValid = false;
      errorMessage = I18n.getMessage('unwrap_hash_invalid_size');
      // Regex: ^hvs\.[\w-]+$
      // - ^ and $: Ensure the entire string matches.
      // - hvs\.: Requires the string to start with 'hvs.'.
      // - [\w-]+: Matches one or more word characters (a-z, A-Z, 0-9, _) or hyphens.
    } else if (!this.isValidElement(text, /^hvs\.[\w-]+$/g)) {
      isValid = false;
      errorMessage = I18n.getMessage('unwrap_hash_invalid_format');
    }

    return {
      isValid: isValid,
      errorMessage: errorMessage
    };
  }

  static setFocusOnFirstElementOrFirstEmpty() {
    const unwrapHash = Page.getInputUnwrapHash();

    form.setFocusOnFirstElementOrFirstEmpty([unwrapHash]);
  }

}
