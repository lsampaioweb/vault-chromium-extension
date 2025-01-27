import { I18n, form } from '../common.js';
import { PageBase } from '../libs/pagebase.js';

export class Page extends PageBase {
  static #PASSWORD_MINIMUM_SIZE = 7;

  static getInputUrl() {
    return this.getElementById('url');
  }

  static getInputAuthMethod() {
    return this.getElementById('auth_method');
  }

  static getInputUsername() {
    return this.getElementById('username');
  }

  static getInputPassword() {
    return this.getElementById('password');
  }

  static getLabelLoggedInUrl() {
    return this.getElementById('loggedin_url');
  }

  static getLabelLoggedInUser() {
    return this.getElementById('loggedin_user');
  }

  static getButtonLogin() {
    return this.getElementById('button_login');
  }

  static getButtonLogout() {
    return this.getElementById('button_logout');
  }

  static getDivLogin() {
    return this.getElementById('login');
  }

  static getDivLogout() {
    return this.getElementById('logout');
  }

  static isValid(element) {
    if (element) {
      switch (element.id) {
        case 'url':
          return Page.isValidURL(element.value);
        case 'auth_method':
          return Page.isValidAuthMethod(element.value);
        case 'username':
          return Page.isValidUserName(element.value);
        case 'password':
          return Page.isValidPassword(element.value);
      }
    }

    return {
      isValid: false,
      errorMessage: ''
    };
  }

  static isValidAuthMethod(text) {
    return {
      // Regex: ^([a-z]{4,8})$
      // - ^ and $: Ensure the entire string matches.
      // - [a-z]: Allows only lowercase alphabetic characters.
      // - {4,8}: Ensures the length is between 4 and 8 characters.
      isValid: this.isValidElement(text, /^([a-z]{4,8})$/gi),
      errorMessage: ''
    };
  }

  static isValidUserName(text) {
    return {
      // Regex: ^(.)+$
      // - ^ and $: Ensure the entire string matches.
      // - (.)+: Matches one or more of any character (except line breaks).
      isValid: this.isValidElement(text, /^(.)+$/gi),
      errorMessage: ''
    };
  }

  static isValidPassword(text) {
    let errorMessage;

    if (text.length < this.#PASSWORD_MINIMUM_SIZE) {
      errorMessage = I18n.getMessage('password_invalid_size');
    }

    return {
      // Regex: ^(.){7,}$
      // - ^ and $: Ensure the entire string matches.
      // - (.): Matches any single character.
      // - {7,}: Ensures at least 7 characters.
      isValid: this.isValidElement(text, /^(.){7,}$/gi),
      errorMessage: errorMessage
    };
  }

  static setFocusOnFirstElementOrFirstEmpty() {
    const url = this.getInputUrl();
    const username = this.getInputUsername();
    const password = this.getInputPassword();

    form.setFocusOnFirstElementOrFirstEmpty([url, username, password]);
  }
}
