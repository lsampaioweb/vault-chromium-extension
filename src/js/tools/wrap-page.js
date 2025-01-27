import { I18n, form } from '../common.js';
import { PageBase } from '../libs/pagebase.js';

export class Page extends PageBase {
  static #TTL_MAXIMUM_SIZE = 1440;

  static getButtonWrapTypeSimple() {
    return this.getElementById('button_wrap_type_simple');
  }

  static getButtonWrapTypeComplex() {
    return this.getElementById('button_wrap_type_complex');
  }

  static getInputWrapKey() {
    return this.getElementById('wrap_key');
  }

  static getInputWrapValue() {
    return this.getElementById('wrap_value');
  }

  static getInputWrapJson() {
    return this.getElementById('wrap_json');
  }

  static getInputWrapTTL() {
    return this.getElementById('wrap_ttl');
  }

  static getButtonWrap() {
    return this.getElementById('button_wrap');
  }

  static getLabelWrapResult() {
    return this.getElementById('label_wrap_result');
  }

  static getWrapResultCopyImg() {
    return this.getElementById('wrap_result_copy_img');
  }

  static getWrapResult() {
    return this.getElementById('wrap_result');
  }

  static openTab(tabId) {
    return function () {
      PageBase.openTab(tabId);

      Page.setFocusOnFirstElementOrFirstEmpty();
    };
  }

  static isValid(element) {
    if (element) {
      switch (element.id) {
        case 'wrap_key':
          return Page.isValidKey(element.value);
        case 'wrap_value':
          return Page.isValidValue(element.value);
        case 'wrap_json':
          return Page.isValidJson(element.value);
        case 'wrap_ttl':
          return Page.isValidTTL(element.value);
      }
    }

    return {
      isValid: false,
      errorMessage: ''
    };
  }

  static isValidKey(text) {
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

  static isValidValue(text) {
    return {
      // Regex: ^(.)+$
      // - ^ and $: Ensure the entire string matches.
      // - (.): Matches any single character (except line breaks).
      // - +: Requires at least one character.
      isValid: this.isValidElement(text, /^(.)+$/gi),
      errorMessage: ''
    };
  }

  static isValidJson(text) {
    let isValid = true;
    let errorMessage;

    try {
      // Ensure it's valid JSON.
      JSON.parse(text);
    } catch (error) {
      isValid = false;
      errorMessage = I18n.getMessage('wrap_data_not_in_json_format');
    }

    return {
      isValid: isValid,
      errorMessage: errorMessage
    };
  }

  static isValidTTL(text) {
    let isValid = true;

    // Regex: ^\d+$
    // - ^ and $: Ensure the entire string matches.
    // - \d: Matches any digit (0-9).
    // - +: Requires at least one digit.
    const isNumber = this.isValidElement(text, /^\d+$/g);

    let errorMessage;
    if (!isNumber) {
      isValid = false;
      errorMessage = I18n.getMessage('ttl_is_not_a_number');
    } else if ((text <= 0) || (text > this.#TTL_MAXIMUM_SIZE)) {
      isValid = false;
      errorMessage = I18n.getMessage('ttl_is_not_in_range');
    }

    return {
      isValid: isValid,
      errorMessage: errorMessage
    };
  }

  static setFocusOnFirstElementOrFirstEmpty() {
    const wrapKey = Page.getInputWrapKey();
    const wrapValue = Page.getInputWrapValue();
    const wrapJson = Page.getInputWrapJson();
    const wrapTTL = Page.getInputWrapTTL();

    form.setFocusOnFirstElementOrFirstEmpty([wrapKey, wrapValue, wrapJson, wrapTTL]);
  }

}
