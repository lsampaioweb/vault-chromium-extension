import { I18n, form } from '../common.js';
import { PageBase } from '../libs/pagebase.js';

export class Page extends PageBase {

  static getInputEngine() {
    return this.getElementById('secret_engine');
  }

  static getInputPath() {
    return this.getElementById('secret_path');
  }

  static getInputSecretName() {
    return this.getElementById('secret_name');
  }

  static getInputSecretComment() {
    return this.getElementById('secret_comment');
  }

  static getButtonSecretTypeCredential() {
    return this.getElementById('button_secret_type_credential');
  }

  static getButtonSecretTypeToken() {
    return this.getElementById('button_secret_type_token');
  }

  static getInputUsername() {
    return this.getElementById('username');
  }

  static getInputPassword() {
    return this.getElementById('password');
  }

  static getInputToken() {
    return this.getElementById('token');
  }

  static getButtonGenerateRandomPassword() {
    return this.getElementById('generate_random_password');
  }

  static getButtonGenerateRandomToken() {
    return this.getElementById('generate_random_token');
  }

  static getButtonSave() {
    return this.getElementById('button_save');
  }

  static getButtonCancel() {
    return this.getElementById('button_cancel');
  }

  static getSecretNameFromQueryString() {
    return this.getQueryString('secretname');
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
        case 'secret_engine':
          return Page.isValidSecretEngineOrSecretName(element.value);
        case 'secret_name':
          return Page.isValidSecretEngineOrSecretName(element.value);
        case 'username':
          return Page.isValidUserNameOrPassword(element.value);
        case 'password':
          return Page.isValidUserNameOrPassword(element.value);
        case 'token':
          return Page.isValidUserNameOrPassword(element.value);
      }
    }

    return {
      isValid: false,
      errorMessage: ''
    };
  }

  static isValidSecretEngineOrSecretName(text) {
    return {
      // Regex: ^[\w-.:/ ]+$
      // - ^ and $: Ensure the entire string matches.
      // - \w: Matches any alphanumeric character (A-Z, a-z, 0-9, and _).
      // - -: Allows hyphens (-) as valid characters.
      // - .: Allows periods (.).
      // - :: Allows colons (:).
      // - /: Allows forward slashes (/).
      // -  : Allows spaces ( ).
      // - +: Ensures at least one valid character is present.
      isValid: this.isValidElement(text, /^[\w-.:/ ]+$/gi),
      errorMessage: ''
    };
  }

  static isValidUserNameOrPassword(text) {
    return {
      // Regex: ^(.)+$
      // - ^ and $: Ensure the entire string matches.
      // - (.): Matches any single character (except line breaks).
      // - +: Requires at least one character.
      isValid: this.isValidElement(text, /^(.)+$/gi),
      errorMessage: ''
    };
  }

  static setFocusOnFirstElementOrFirstEmpty() {
    const secretName = Page.getInputSecretName();
    const username = Page.getInputUsername();
    const password = Page.getInputPassword();
    const token = Page.getInputToken();
    const comment = Page.getInputSecretComment();

    form.setFocusOnFirstElementOrFirstEmpty([secretName, username, password, token, comment]);
  }

  static #getReplacementKey(keyMappings, oldKey) {
    for (const [newKey, oldKeys] of Object.entries(keyMappings)) {
      if (oldKeys.includes(oldKey)) {
        return newKey;
      }
    }
    // Return the original key if no replacement is found.
    return oldKey;
  }

  static processObject(obj) {
    const keyMappings = {
      user: I18n.getMessage('usernameKeys').split(','),
      pass: I18n.getMessage('passwordKeys').split(','),
      token: I18n.getMessage('tokenKeys').split(','),
      comment: I18n.getMessage('commentKeys').split(','),
    };

    const processed = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = this.#getReplacementKey(keyMappings, key);

      processed[newKey] = value;
    }

    return processed;
  }
}
