import { PageController } from './add-base-controller.js';
import { dependencies } from '../../services/secrets.js';

// Initialize controller when i18n translation is complete.
document.addEventListener('i18nReady', () => {
  // Create the instance of the Controller with the necessary dependencies.
  const controller = new AddSecretController(dependencies);

  // Execute the main controller logic.
  controller.main();
}, false);

class AddSecretController extends PageController {

  /**
   * State variables for the controller.
   */
  engines = null;
  secretsOfEngine = null;

  /**
   * Constructor that accepts dependencies and passes them to the base controller.
   * @param {object} dependencies - The injected dependencies.
   */
  constructor(dependencies) {
    super(dependencies);
  }

  /**
   * Main entry point called after i18n translation is complete.
   * Validates the stored token and either shows the secret add/edit page
   * or redirects to login if the token is invalid.
   * @async
   * @returns {Promise<void>}
   */
  async main() {
    try {
      const token = await this.storage.getToken();
      if (this.VaultUtils.isTokenValid(token)) {
        await this.showPage();
      } else {
        this.redirectToLoginPage();
      }
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Initializes and displays the secret add/edit page interface.
   * Sets up all UI elements, event listeners, form handlers, and prepares
   * the page for either adding a new secret or editing an existing one.
   * @async
   * @returns {Promise<void>}
   */
  async showPage() {
    const engine = this.getInputEngine();
    const secretPath = this.getInputPath();
    const secretName = this.getInputSecretName();

    const btnSecretTypeCredential = this.getButtonSecretTypeCredential();
    const btnSecretTypeToken = this.getButtonSecretTypeToken();

    const username = this.getInputUsername();
    const password = this.getInputPassword();
    const btnGenerateRandomPassword = this.getButtonGenerateRandomPassword();

    const token = this.getInputToken();
    const btnGenerateRandomToken = this.getButtonGenerateRandomToken();

    const btnSave = this.getButtonSave();
    const btnCancel = this.getButtonCancel();

    this.form.addChangeListener(engine, this.onChangeEngine.bind(this));

    this.form.addClickListener(btnSecretTypeCredential, this.openTabTypeCredential());
    this.form.addClickListener(btnSecretTypeToken, this.openTabTypeToken());

    this.form.addClickListener(btnGenerateRandomPassword, this.generateRandomPassword.bind(this));
    this.form.addClickListener(btnGenerateRandomToken, this.generateRandomToken.bind(this));

    this.form.addClickListener(btnSave, this.save.bind(this));
    this.form.addClickListener(btnCancel, this.cancel.bind(this));

    this.form.addEnterKeydownListener(engine, btnSave);
    this.form.addEnterKeydownListener(secretPath, btnSave);
    this.form.addEnterKeydownListener(secretName, btnSave);
    this.form.addEnterKeydownListener(username, btnSave);
    this.form.addEnterKeydownListener(password, btnSave);
    this.form.addEnterKeydownListener(token, btnSave);

    await this.prepareForm();
  }

  /**
   * Prepares the form for either adding a new secret or editing an existing one.
   * Populates dropdowns with available engines, retrieves secret data if editing,
   * and configures form elements accordingly.
   * @async
   * @returns {Promise<void>}
   */
  async prepareForm() {
    const token = await this.storage.getToken();
    const vault = this.vaultFactory.create(await this.storage.getUrl(), token);

    await this.populateElementsInTheForm(vault);

    const secret = await this.getNewOrEditSecret();
    await this.selectElementsInTheForm(vault, secret);

    this.setFocusOnFirstElementOrFirstEmpty();

    this.form.enable(this.getButtonSave());
  }

  /**
   * Populates form elements with data from Vault.
   * Currently loads the available secret engines into the form.
   * @async
   * @param {Vault} vault - The Vault instance to query for data.
   * @returns {Promise<void>}
   */
  async populateElementsInTheForm(vault) {
    await this.populateEngines(vault);
  }

  /**
   * Populates the engines dropdown with available KV secret engines from Vault.
   * Retrieves the list of KV engines and adds them as options to the engine selection dropdown.
   * @async
   * @param {Vault} vault - The Vault instance to query for available engines.
   * @returns {Promise<void>}
   */
  async populateEngines(vault) {
    const engineElement = this.getInputEngine();
    this.form.clear(engineElement);
    engineElement.add(this.createOption(this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_LOADING)));

    // Retrieve the list of KV engines.
    this.engines = await vault.getKVEngines();

    this.form.clear(engineElement);
    for (const engine of this.engines) {
      engineElement.add(this.createOption(this.removeLastDash(engine.name)));
    }
  }

  /**
   * Determines whether to create a new secret or load an existing one for editing.
   * Checks for a secret name in the query string to determine if this is an edit operation,
   * otherwise prepares for creating a new secret with the current tab's hostname as default name.
   * @async
   * @returns {Promise<object>} The secret object with properties for engine, path, and name.
   */
  async getNewOrEditSecret() {
    const queryString = this.getSecretNameFromQueryString();

    if (queryString) {
      return this.extractSecretFrom(queryString);
    } else {
      const obj = {
        fullName: '',
        engine: {
          name: ''
        },
        path: '',
        name: await this.getHostnameFromCurrentActiveTab(),
      };

      return obj;
    }
  }

  /**
   * Configures form elements based on the selected secret data.
   * Sets the engine, populates secret paths, and pre-fills form fields
   * when editing an existing secret.
   * @async
   * @param {Vault} vault - The Vault instance for data operations.
   * @param {object} selectedSecret - The secret object containing engine, path, and name information.
   * @returns {Promise<void>}
   */
  async selectElementsInTheForm(vault, selectedSecret) {
    this.selectEngine(selectedSecret);

    await this.populateSecretPaths(vault, selectedSecret.engine);

    selectedSecret = await this.selectSecretPath(vault, selectedSecret);

    await this.setSecretTypeCredentialTab(selectedSecret);

    this.setExtraAttributesInForm(selectedSecret);
  }

  /**
   * Selects the appropriate engine in the dropdown based on the secret's engine data.
   * Sets the engine dropdown value and updates the selectedSecret's engine reference
   * to match the engine from the engines list.
   * @param {object} selectedSecret - The secret object containing engine information.
   * @returns {void}
   */
  selectEngine(selectedSecret) {
    const engineElement = this.getInputEngine();

    if (selectedSecret.engine.name) {
      engineElement.value = this.removeLastDash(selectedSecret.engine.name);
    }

    // For new secrets, this will be the first element.
    selectedSecret.engine = this.engines.find((x) => x.name === `${engineElement.value}/`);
  }

  /**
   * Populates the secret paths dropdown with available paths from the selected engine.
   * Retrieves all secrets from the specified engine and creates a dropdown list
   * of unique secret paths for user selection.
   * @async
   * @param {Vault} vault - The Vault instance to query for secret paths.
   * @param {object} selectedEngine - The engine object containing name and other properties.
   * @returns {Promise<void>}
   */
  async populateSecretPaths(vault, selectedEngine) {
    const pathElement = this.getInputPath();
    this.form.clear(pathElement);
    pathElement.add(this.createOption(this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_LOADING)));

    const username = await this.storage.getUsername();

    // Retrieve secrets for the selected engine.
    const result = await vault.getSecretsByTextOnEngine(selectedEngine, username, '');

    // This is an instance variable to store secrets for the selected engine.
    this.secretsOfEngine = result.secrets || [];

    // Extract unique paths from the retrieved secrets.
    const uniquePaths = this.extractUniquePathsFromSecrets(this.secretsOfEngine);

    this.form.clear(pathElement);
    if (!selectedEngine.isPersonal) {
      pathElement.add(this.createOption(PageController.i18nKeys.constants.ELEMENT_IN_ROOT_PATH));
    } else if (uniquePaths.length == 0) {
      pathElement.add(this.createOption(`${username}/`));
    }

    for (const path of uniquePaths) {
      pathElement.add(this.createOption(path));
    }
  }

  /**
   * Selects the appropriate secret path in the dropdown and updates the secret's path.
   * Sets the path dropdown value based on the selected secret's path data
   * and ensures a valid selection is made.
   * @async
   * @param {Vault} vault - The Vault instance for data operations.
   * @param {object} selectedSecret - The secret object containing path information.
   * @returns {Promise<object>} The updated selected secret object.
   */
  async selectSecretPath(vault, selectedSecret) {
    const pathElement = this.getInputPath();

    if (selectedSecret.path) {
      pathElement.value = `${selectedSecret.path}/`;
    }

    if (pathElement.selectedIndex < 0) {
      pathElement.selectedIndex = 0;
    }

    // For new secrets, this will be the first element.
    const foundSecret = this.secretsOfEngine.find((x) => x.fullName === selectedSecret.fullName);
    if (foundSecret) {
      // Build the path array required for the Vault API call.
      const subkeys = this.VaultUtils.getSubKeys(foundSecret.path, foundSecret.name);

      // Get secret data from the backend.
      const secretData = await vault.getSecretData(foundSecret.engine, subkeys);

      if (secretData) {
        // Inject data into secret object.
        foundSecret.data = secretData.data;
      }

      selectedSecret = foundSecret;
    }

    return selectedSecret;
  }

  /**
   * Configures the form for credential-type secrets and populates existing data.
   * Sets the credential tab as active and fills in username/password fields
   * if editing an existing credential secret.
   * @async
   * @param {object} selectedSecret - The secret object containing credential data.
   * @returns {Promise<void>}
   */
  async setSecretTypeCredentialTab(selectedSecret) {
    let username = await this.storage.getUsername();

    if (selectedSecret.data) {
      // Get all possible username keys.
      const usernameKeys = this.I18n.getMessage(PageController.i18nKeys.messages.CONFIG_SECRET_USERNAME_KEYS);

      // Get a possible username from the secret data.
      const user = this.getValueIfDataHasKey(selectedSecret.data, usernameKeys);

      if (user) {
        username = user;
      } else {
        // Get all possible token keys.
        const tokenKeys = this.I18n.getMessage(PageController.i18nKeys.messages.CONFIG_SECRET_TOKEN_KEYS);

        // Get a possible token from the secret data.
        const token = this.getValueIfDataHasKey(selectedSecret.data, tokenKeys);

        // If there's a token but no username, switch to token tab.
        if (token) {
          this.showTokenSecretTypeTab();

          // Finish early since we're in token mode.
          return;
        }
      }
    }

    // Populate username field.
    this.form.setValue(this.getInputUsername(), username);

    // If there's a username, show credential tab.
    this.showCredentialSecretTypeTab();
  }

  /**
   * Sets additional form attributes like secret name and comments.
   * Populates the secret name field and extracts comment data from
   * existing secret data if available.
   * @param {object} selectedSecret - The secret object containing name and data.
   * @returns {void}
   */
  setExtraAttributesInForm(selectedSecret) {
    this.form.setValue(this.getInputSecretName(), selectedSecret.name);

    if (selectedSecret.data) {
      const commentKeys = this.I18n.getMessage(PageController.i18nKeys.messages.CONFIG_SECRET_COMMENT_KEYS);
      const comment = this.getValueIfDataHasKey(selectedSecret.data, commentKeys);

      if (comment) {
        this.form.setValue(this.getInputSecretComment(), comment);
      }
    }
  }

  /**
   * Handles the engine dropdown change event.
   * When the user selects a different engine, updates the secret paths dropdown
   * to show paths available in the newly selected engine.
   * @async
   * @returns {Promise<void>}
   */
  async onChangeEngine() {
    const token = await this.storage.getToken();
    if (this.VaultUtils.isTokenValid(token)) {
      const vault = this.vaultFactory.create(await this.storage.getUrl(), token);

      const engine = this.getInputEngine();

      const secret = await this.getNewOrEditSecret();
      secret.engine.name = engine.value;

      await this.selectElementsInTheForm(vault, secret);
    } else {
      this.redirectToLoginPage();
    }
  }

  /**
   * Handles the save operation for creating or updating a secret.
   * Validates form data, constructs the secret object, and saves it to Vault.
   * Handles both credential and token type secrets.
   * @async
   * @returns {Promise<void>}
   */
  async save() {
    try {
      this.notification.clear();

      // Get the stored token.
      const token = await this.storage.getToken();

      // Validate the token before proceeding.
      if (!this.VaultUtils.isTokenValid(token)) {
        this.redirectToLoginPage();
        return;
      }

      const engineElement = this.getInputEngine();
      const secretPathElement = this.getInputPath();
      const secretNameElement = this.getInputSecretName();
      const secretCommentElement = this.getInputSecretComment();

      let isValid;
      let data;

      const selectedTab = this.getSelectedSecretType();
      if (selectedTab === PageController.i18nKeys.constants.TAB_TYPES_CREDENTIAL) {
        const username = this.getInputUsername();
        const password = this.getInputPassword();

        isValid = this.form.validate({ required: [engineElement, secretNameElement, username, password] }, this.isValid.bind(this));

        data = {
          user: username.value,
          pass: password.value
        };
      } else if (selectedTab === PageController.i18nKeys.constants.TAB_TYPES_TOKEN) {
        const tokenElement = this.getInputToken();

        isValid = this.form.validate({ required: [engineElement, secretNameElement, tokenElement] }, this.isValid.bind(this));

        data = {
          token: tokenElement.value
        };
      }

      if (isValid) {
        this.showSavingMessage();

        // Find the selected engine object.
        const engine = this.engines.find((x) => x.name === `${engineElement.value}/`);

        let path = '';
        if (secretPathElement.value !== PageController.i18nKeys.constants.ELEMENT_IN_ROOT_PATH) {
          // Remove trailing slash.
          path = secretPathElement.value.replace(/\/$/, '');
        }

        // Build the path array required for the Vault API call.
        const subkeys = this.VaultUtils.getSubKeys(path, secretNameElement.value);

        if (secretCommentElement.value) {
          data.comment = secretCommentElement.value;
        }

        // Get the existing secret if we're editing.
        const editingSecret = await this.getEditingSecretOrNull();

        // Encrypt sensitive fields before saving.
        const saltKey = editingSecret ? editingSecret.fullName : this.VaultUtils.getSecretFullPath(engine.name, subkeys);

        // Process the data to ensure consistent key naming.
        data = this.processObject(data);

        // Encrypt username if it exists.
        if (data.pass) {
          data.pass = await this.VaultCrypto.encrypt(data.pass, saltKey);
        }

        // Encrypt token if it exists.
        if (data.token) {
          data.token = await this.VaultCrypto.encrypt(data.token, saltKey);
        }

        // Initialize Vault client.
        const vault = this.vaultFactory.create(await this.storage.getUrl(), token);

        // Call Vault to add or update the secret.
        await vault.addSecret(engine, subkeys, data);

        // Show success notification.
        this.notification.info(this.I18n.getMessage('ui_message_save_success'));

        // Redirect back to secrets list with search context.
        this.redirectToSecretsPage();
      }
    } catch (error) {
      this.hideSavingMessage();
      this.notification.error(error);
    }
  }

  /**
   * Retrieves the currently editing secret or returns null for new secrets.
   * Checks if there's a secret name in the query string to determine
   * if this is an edit operation.
   * @async
   * @returns {Promise<object|null>} The secret object if editing, null if creating new.
   */
  async getEditingSecretOrNull() {
    const secret = await this.getNewOrEditSecret();

    return this.secretsOfEngine.find((x) => x.fullName === secret.fullName);
  }

  /**
   * Handles the cancel operation by redirecting back to the secrets list page.
   * Provides a way for users to abort the add/edit operation.
   * @async
   * @returns {Promise<void>}
   */
  async cancel() {
    try {
      this.redirectToSecretsPage();
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Generates a random password and fills it into the password field.
   * Uses the Password utility class to create a secure random password
   * for credential-type secrets.
   * @async
   * @returns {Promise<void>}
   */
  async generateRandomPassword() {
    try {
      const password = this.getInputPassword();

      const result = this.Password.generate();

      this.form.setValue(password, result);
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Generates a random token and fills it into the token field.
   * Uses the Password utility class to create a secure random token
   * for token-type secrets.
   * @async
   * @returns {Promise<void>}
   */
  async generateRandomToken() {
    try {
      const token = this.getInputToken();

      const result = this.Password.generate({ size: 40 });

      this.form.setValue(token, result);
    } catch (error) {
      this.notification.error(error);
    }
  }

}
