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
      ELEMENT_IN_ROOT_PATH: '/',
      TAB_IDS_CREDENTIAL: 'div_secret_type_credential',
      TAB_IDS_TOKEN: 'div_secret_type_token',
      TAB_TYPES_CREDENTIAL: 'credential',
      TAB_TYPES_TOKEN: 'token',
      PATH_SEPARATOR: '/'
    },
    messages: {
      ...PageBaseController.i18nKeys.messages, // Inherit base messages.
      UI_MESSAGE_LOADING: 'ui_message_loading',
      UI_MESSAGE_SAVING: 'ui_message_saving',
      CONFIG_SECRET_USERNAME_KEYS: 'config_secret_username_keys',
      CONFIG_SECRET_PASSWORD_KEYS: 'config_secret_password_keys',
      CONFIG_SECRET_TOKEN_KEYS: 'config_secret_token_keys',
      CONFIG_SECRET_COMMENT_KEYS: 'config_secret_comment_keys'
    },
  };

  /**
   * Crypto service for encryption and decryption operations.
   * @type {object|null}
   */
  VaultCrypto;

  /**
   * Password utility service for generating secure passwords.
   * @type {object|null}
   */
  Password;

  /**
   * Constructor that accepts dependencies and passes them to the base class.
   * @param {object} dependencies - The injected dependencies.
   */
  constructor(dependencies) {
    super(dependencies);

    // Extract specific dependencies this controller needs.
    this.VaultCrypto = dependencies.VaultCrypto;
    this.Password = dependencies.Password;
  }

  /**
   * Gets the secret engine select element from the form.
   * @returns {HTMLSelectElement|null} The secret engine select element, or null if not found.
   */
  getInputEngine() {
    return this.getElementById('secret_engine');
  }

  /**
   * Gets the secret path select element from the form.
   * @returns {HTMLSelectElement|null} The secret path select element, or null if not found.
   */
  getInputPath() {
    return this.getElementById('secret_path');
  }

  /**
   * Gets the secret name input element from the form.
   * @returns {HTMLInputElement|null} The secret name input element, or null if not found.
   */
  getInputSecretName() {
    return this.getElementById('secret_name');
  }

  /**
   * Gets the secret comment textarea element from the form.
   * @returns {HTMLTextAreaElement|null} The secret comment textarea element, or null if not found.
   */
  getInputSecretComment() {
    return this.getElementById('secret_comment');
  }

  /**
   * Gets the button that activates the 'credential' tab.
   * @returns {HTMLButtonElement|null} The credential tab button, or null if not found.
   */
  getButtonSecretTypeCredential() {
    return this.getElementById('button_secret_type_credential');
  }

  /**
   * Gets the button that activates the 'token' tab.
   * @returns {HTMLButtonElement|null} The token tab button, or null if not found.
   */
  getButtonSecretTypeToken() {
    return this.getElementById('button_secret_type_token');
  }

  /**
   * Gets the username input element from the 'credential' tab.
   * @returns {HTMLInputElement|null} The username input element, or null if not found.
   */
  getInputUsername() {
    return this.getElementById('username');
  }

  /**
   * Gets the password input element from the 'credential' tab.
   * @returns {HTMLInputElement|null} The password input element, or null if not found.
   */
  getInputPassword() {
    return this.getElementById('password');
  }

  /**
   * Gets the token input element from the 'token' tab.
   * @returns {HTMLInputElement|null} The token input element, or null if not found.
   */
  getInputToken() {
    return this.getElementById('token');
  }

  /**
   * Gets the button for generating a random password.
   * @returns {HTMLImageElement|null} The random password button, or null if not found.
   */
  getButtonGenerateRandomPassword() {
    return this.getElementById('generate_random_password');
  }

  /**
   * Gets the button for generating a random token.
   * @returns {HTMLImageElement|null} The random token button, or null if not found.
   */
  getButtonGenerateRandomToken() {
    return this.getElementById('generate_random_token');
  }

  /**
   * Gets the save button for the form.
   * @returns {HTMLButtonElement|null} The save button element, or null if not found.
   */
  getButtonSave() {
    return this.getElementById('button_save');
  }

  /**
   * Gets the cancel button for the form.
   * @returns {HTMLButtonElement|null} The cancel button element, or null if not found.
   */
  getButtonCancel() {
    return this.getElementById('button_cancel');
  }

  /**
   * Retrieves the 'secretname' parameter from the URL query string.
   * @returns {string|null} The value of the 'secretname' parameter, or null if not present.
   */
  getSecretNameFromQueryString() {
    return this.getQueryString('secretname');
  }

  /**
   * Returns a function that opens a specific tab and sets focus.
   * This is a higher-order function designed to be used as an event listener.
   * @param {string} tabId - The ID of the tab content element to show.
   * @returns {function(): void} A function that can be called to switch to the specified tab.
   */
  openTab(tabId) {
    return () => {
      super.openTab(tabId);

      this.setFocusOnFirstElementOrFirstEmpty();
    };
  }

  /**
   * Opens the credential secret type tab.
   * @returns {function(): void} A function that opens the credential tab.
   */
  openTabTypeCredential() {
    return this.openTab(PageController.i18nKeys.constants.TAB_IDS_CREDENTIAL);
  }

  /**
   * Opens the token secret type tab.
   * @returns {function(): void} A function that opens the token tab.
   */
  openTabTypeToken() {
    return this.openTab(PageController.i18nKeys.constants.TAB_IDS_TOKEN);
  }

  /**
   * Validates a given form element by delegating to a specific validation method based on the element's ID.
   * @param {HTMLElement} element - The HTML element to validate.
   * @returns {{isValid: boolean, errorMessage?: string}} An object indicating if the element is valid and an optional error message.
   */
  isValid(element) {
    if (element) {
      switch (element.id) {
        case 'secret_engine':
          return this.isValidSecretEngineOrSecretName(element.value);
        case 'secret_name':
          return this.isValidSecretEngineOrSecretName(element.value);
        case 'username':
          return this.isValidUserNameOrPassword(element.value);
        case 'password':
          return this.isValidUserNameOrPassword(element.value);
        case 'token':
          return this.isValidUserNameOrPassword(element.value);
      }
    }

    return {
      isValid: false,
      errorMessage: ''
    };
  }

  /**
   * Validates the format of a secret engine or secret name.
   * Allows alphanumeric characters, hyphens, periods, colons, slashes, backslashes, and spaces.
   * @param {string} text - The text to validate.
   * @returns {{isValid: boolean, errorMessage?: string}} An object indicating if the value is valid.
   */
  isValidSecretEngineOrSecretName(text) {
    return {
      // Regex: ^[\w-.:/\\ ]+$
      // - ^ and $: Ensure the entire string matches.
      // - \w: Matches any alphanumeric character (A-Z, a-z, 0-9, and _).
      // - -: Allows hyphens (-).
      // - .: Allows periods (.).
      // - :: Allows colons (:).
      // - /: Allows forward slashes (/).
      // - \\: Allows backslashes (\).
      // -  : Allows spaces ( ).
      // - +: Ensures at least one valid character is present.
      isValid: this.isValidElement(text, /^[\w-.:/\\ ]+$/gi),
      errorMessage: ''
    };
  }

  /**
   * Validates a username, password, or token field.
   * Ensures the field is not empty.
   * @param {string} text - The text to validate.
   * @returns {{isValid: boolean, errorMessage?: string}} An object indicating if the value is valid.
   */
  isValidUserNameOrPassword(text) {
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
   * Sets focus on the first visible and interactive form element,
   * prioritizing the first empty one to guide user input.
   * @returns {void}
   */
  setFocusOnFirstElementOrFirstEmpty() {
    const secretName = this.getInputSecretName();
    const username = this.getInputUsername();
    const password = this.getInputPassword();
    const token = this.getInputToken();
    const comment = this.getInputSecretComment();

    this.form.setFocusOnFirstElementOrFirstEmpty([secretName, username, password, token, comment]);
  }

  /**
   * Finds the standardized key for a given old key based on mappings.
   * @param {object} keyMappings - An object where keys are new standard keys and values are arrays of old possible keys.
   * @param {string} oldKey - The key to standardize.
   * @returns {string} The new standardized key, or the original key if no mapping is found.
   * @private
   */
  getReplacementKey(keyMappings, oldKey) {
    for (const [newKey, oldKeys] of Object.entries(keyMappings)) {
      if (oldKeys.includes(oldKey)) {
        return newKey;
      }
    }
    // Return the original key if no replacement is found.
    return oldKey;
  }

  /**
   * Processes a secret data object to standardize its keys.
   * For example, it maps keys like 'usuario' or 'user_name' to the standard 'user'.
   * @param {object} obj - The secret data object with potentially non-standard keys.
   * @returns {object} A new object with standardized keys.
   */
  processObject(obj) {
    const keyMappings = {
      user: this.I18n.getMessage(PageController.i18nKeys.messages.CONFIG_SECRET_USERNAME_KEYS).split(','),
      pass: this.I18n.getMessage(PageController.i18nKeys.messages.CONFIG_SECRET_PASSWORD_KEYS).split(','),
      token: this.I18n.getMessage(PageController.i18nKeys.messages.CONFIG_SECRET_TOKEN_KEYS).split(','),
      comment: this.I18n.getMessage(PageController.i18nKeys.messages.CONFIG_SECRET_COMMENT_KEYS).split(','),
    };

    const processed = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = this.getReplacementKey(keyMappings, key);

      processed[newKey] = value;
    }

    return processed;
  }

  /**
   * Removes the trailing slash from a string, typically an engine name.
   * @param {string} name - The string to process.
   * @returns {string} The string without a trailing slash.
   */
  removeLastDash(name) {
    return name.replace('/', '');
  }

  /**
   * Extracts all unique parent paths from a list of secrets.
   * For example, from secrets with paths 'a/b/c' and 'a/b/d', it extracts 'a/' and 'a/b/'.
   * @param {Array<object>} secrets - An array of secret objects, each potentially having a 'path' property.
   * @returns {Array<string>} A sorted array of unique parent paths.
   */
  extractUniquePathsFromSecrets(secrets) {
    // Use Set to automatically handle uniqueness.
    const uniquePaths = new Set();

    for (const secret of secrets) {
      if (secret.path) {
        this.addAllSubPathsToSet(uniquePaths, secret.path);
      }
    }

    // Convert Set back to sorted array.
    return Array.from(uniquePaths).sort();
  }

  /**
   * Adds all intermediate sub-paths of a given path to a Set.
   * For example, for a path "a/b/c", it adds "a/", "a/b/", and "a/b/c/".
   * @param {Set<string>} pathSet - The Set to which paths will be added.
   * @param {string} fullPath - The full path string (e.g., 'folder1/folder2').
   * @private
   */
  addAllSubPathsToSet(pathSet, fullPath) {
    const segments = fullPath.split(PageController.i18nKeys.constants.PATH_SEPARATOR);
    let currentPath = '';

    for (const segment of segments) {
      currentPath += `${segment}${PageController.i18nKeys.constants.PATH_SEPARATOR}`;

      pathSet.add(currentPath);
    }
  }

  /**
   * Shows the saving message and disables the save button to prevent multiple submissions.
   * @returns {void}
   */
  showSavingMessage() {
    this.form.disable(this.getButtonSave());

    this.notification.info(this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_SAVING), { removeOption: false });
  }

  /**
   * Hides the saving message and re-enables the save button.
   * @returns {void}
   */
  hideSavingMessage() {
    this.form.enable(this.getButtonSave());

    this.notification.clear();
  }

  /**
   * Gets the currently selected secret type ('credential' or 'token') based on which tab button is active.
   * @returns {string} The active secret type, or an empty string if none is active.
   */
  getSelectedSecretType() {
    const buttons = document.getElementsByClassName('tab_button');

    for (const button of buttons) {
      if (button.classList.contains('active')) {
        return button.id.replace(/button_secret_type_(\w+)/g, '$1');
      }
    }

    return '';
  }

  /**
   * Programmatically clicks the 'credential' tab button to show the credential form.
   * @returns {void}
   */
  showCredentialSecretTypeTab() {
    const button = this.getButtonSecretTypeCredential();

    button?.click();
  }

  /**
   * Programmatically clicks the 'token' tab button to show the token form.
   * @returns {void}
   */
  showTokenSecretTypeTab() {
    const button = this.getButtonSecretTypeToken();

    button?.click();
  }

}
