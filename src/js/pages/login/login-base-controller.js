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
      PASSWORD_MINIMUM_SIZE: 7
    },
    messages: {
      ...PageBaseController.i18nKeys.messages, // Inherit base messages.
      CONFIG_VAULT_URL: 'config_vault_url',
      UI_MESSAGE_LOGGED_IN_URL: 'ui_message_logged_in_url',
      UI_MESSAGE_LOGGED_IN_USER: 'ui_message_logged_in_user',
      ERROR_FORM_PASSWORD_SIZE_INVALID: 'error_form_password_size_invalid'
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
   * Gets the URL input element from the login form.
   * @returns {HTMLInputElement|null} The URL input element, or null if not found.
   */
  getInputUrl() {
    return this.getElementById('url');
  }

  /**
   * Gets the authentication method select element from the login form.
   * @returns {HTMLSelectElement|null} The auth method select element, or null if not found.
   */
  getInputAuthMethod() {
    return this.getElementById('auth_method');
  }

  /**
   * Gets the username input element from the login form.
   * @returns {HTMLInputElement|null} The username input element, or null if not found.
   */
  getInputUsername() {
    return this.getElementById('username');
  }

  /**
   * Gets the password input element from the login form.
   * @returns {HTMLInputElement|null} The password input element, or null if not found.
   */
  getInputPassword() {
    return this.getElementById('password');
  }

  /**
   * Gets the label element that displays the logged-in URL.
   * @returns {HTMLElement|null} The logged-in URL label element, or null if not found.
   */
  getLabelLoggedInUrl() {
    return this.getElementById('loggedin_url');
  }

  /**
   * Gets the label element that displays the logged-in user.
   * @returns {HTMLElement|null} The logged-in user label element, or null if not found.
   */
  getLabelLoggedInUser() {
    return this.getElementById('loggedin_user');
  }

  /**
   * Gets the login button element.
   * @returns {HTMLButtonElement|null} The login button element, or null if not found.
   */
  getButtonLogin() {
    return this.getElementById('button_login');
  }

  /**
   * Gets the logout button element.
   * @returns {HTMLButtonElement|null} The logout button element, or null if not found.
   */
  getButtonLogout() {
    return this.getElementById('button_logout');
  }

  /**
   * Gets the main container div for the login form.
   * @returns {HTMLDivElement|null} The login form container, or null if not found.
   */
  getDivLogin() {
    return this.getElementById('login');
  }

  /**
   * Gets the main container div for the logout section.
   * @returns {HTMLDivElement|null} The logout section container, or null if not found.
   */
  getDivLogout() {
    return this.getElementById('logout');
  }

  /**
   * Validates a given form element based on its ID.
   * This function delegates to more specific validation methods.
   * @param {HTMLElement} element - The HTML element to validate.
   * @returns {{isValid: boolean, errorMessage?: string}} An object indicating if the element is valid and an optional error message.
   */
  isValid(element) {
    if (element) {
      switch (element.id) {
        case 'url':
          return this.isValidURL(element.value);
        case 'auth_method':
          return this.isValidAuthMethod(element.value);
        case 'username':
          return this.isValidUserName(element.value);
        case 'password':
          return this.isValidPassword(element.value);
      }
    }

    return {
      isValid: false,
      errorMessage: ''
    };
  }

  /**
   * Validates the authentication method value.
   * It checks if the value consists of 4 to 8 lowercase letters.
   * @param {string} text - The authentication method string to validate.
   * @returns {{isValid: boolean, errorMessage?: string}} An object indicating if the value is valid.
   */
  isValidAuthMethod(text) {
    return {
      // Regex: ^([a-z]{4,8})$
      // - ^ and $: Ensure the entire string matches.
      // - [a-z]: Allows only lowercase alphabetic characters.
      // - {4,8}: Ensures the length is between 4 and 8 characters.
      isValid: this.isValidElement(text, /^([a-z]{4,8})$/gi),
      errorMessage: ''
    };
  }

  /**
   * Validates the username value.
   * Ensures that the username field is not empty.
   * @param {string} text - The username string to validate.
   * @returns {{isValid: boolean, errorMessage?: string}} An object indicating if the value is valid.
   */
  isValidUserName(text) {
    return {
      // Regex: ^(.)+$
      // - ^ and $: Ensure the entire string matches.
      // - (.)+: Matches one or more of any character (except line breaks).
      isValid: this.isValidElement(text, /^(.)+$/gi),
      errorMessage: ''
    };
  }

  /**
   * Validates the password value.
   * Checks if the password meets the minimum length requirement.
   * @param {string} text - The password string to validate.
   * @returns {{isValid: boolean, errorMessage?: string}} An object indicating if the value is valid and a specific error message if it's not.
   */
  isValidPassword(text) {
    const passwordMinimumSize = PageController.i18nKeys.constants.PASSWORD_MINIMUM_SIZE;

    let errorMessage;
    if (text.length < passwordMinimumSize) {
      errorMessage = this.I18n.getMessage(PageController.i18nKeys.messages.ERROR_FORM_PASSWORD_SIZE_INVALID, [passwordMinimumSize]);
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

  /**
   * Sets focus on the first visible form element on the page,
   * prioritizing the first empty one to guide user input.
   * @returns {void}
   */
  setFocusOnFirstElementOrFirstEmpty() {
    const url = this.getInputUrl();
    const username = this.getInputUsername();
    const password = this.getInputPassword();

    this.form.setFocusOnFirstElementOrFirstEmpty([url, username, password]);
  }

  /**
   * Shows the login form.
   */
  showLoginForm() {
    this.form.show(this.getDivLogin());
  }

  /**
   * Hides the login form.
   */
  hideLoginForm() {
    this.form.hide(this.getDivLogin());
  }

  /**
   * Shows the logout form.
   */
  showLogoutForm() {
    this.form.show(this.getDivLogout());
  }

  /**
   * Hides the logout form.
   */
  hideLogoutForm() {
    this.form.hide(this.getDivLogout());
  }

  /**
   * Shows login loading state by disabling the login button and displaying a loading message.
   */
  showLoginLoading() {
    this.form.disable(this.getButtonLogin());

    this.notification.info(this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_CONNECTING), { removeOption: false });
  }

  /**
   * Shows logout loading state by disabling the logout button and displaying a loading message.
   */
  showLogoutLoading() {
    this.form.disable(this.getButtonLogout());

    this.notification.info(this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_CONNECTING), { removeOption: false });
  }

  /**
   * Hides login loading state by enabling the login button and clearing notifications.
   */
  hideLoginLoading() {
    this.form.enable(this.getButtonLogin());

    this.notification.clear();
  }

  /**
   * Hides logout loading state by enabling the logout button and clearing notifications.
   */
  hideLogoutLoading() {
    this.form.enable(this.getButtonLogout());

    this.notification.clear();
  }

}
