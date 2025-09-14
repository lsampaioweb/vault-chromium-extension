import { PageController } from './list-base-controller.js';
import { dependencies } from '../../services/secrets.js';

// Initialize controller when i18n translation is complete.
document.addEventListener('i18nReady', () => {
  // Create the instance of the Controller with the necessary dependencies.
  const controller = new ListSecretsController(dependencies);

  // Execute the main controller logic.
  controller.main();
}, false);

class ListSecretsController extends PageController {

  /**
   * State variables for the controller.
   */
  currentDisplayingPageNumber = 1;
  quantityOfFramesInPage = 0;
  repliesReceived = 0;
  credentialsInserted = false;
  credentialsInsertedMessage = '';

  // Global list of secrets.
  listSecrets = [];

  /**
   * Constructor that accepts dependencies and passes them to the base controller.
   * @param {object} dependencies - The injected dependencies.
   */
  constructor(dependencies) {
    super(dependencies);
  }

  /**
   * Main entry point called after i18n translation is complete.
   * Validates the stored token and either shows the secrets list page
   * or redirects to login if the token is invalid.
   * @async
   * @returns {Promise<void>}
   */
  async main() {
    try {
      const token = await this.storage.getToken();

      if (this.VaultUtils.isTokenValid(token)) {
        // Listen for messages sent from the visited page.
        this.#addMessageListener();

        await this.showPage();
      } else {
        this.redirectToLoginPage();
      }
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Initializes and displays the secrets list page interface.
   * Sets up search functionality, event listeners, and loads the initial
   * page of secrets for display.
   * @async
   * @returns {Promise<void>}
   */
  async showPage() {
    const inputSearch = this.getInputSearch();
    const btnSearch = this.getButtonSearch();
    const btnNewSecret = this.getButtonNewSecret();

    this.form.addEnterKeydownListener(inputSearch, btnSearch);

    this.form.addClickListener(btnSearch, this.searchSecret.bind(this));

    this.form.addClickListener(btnNewSecret, this.newSecret.bind(this));

    this.setFocusOnFirstElementOrFirstEmpty();

    await this.listSecretBasedOnCurrentPage();
  }

  /**
   * Lists secrets based on the current page's context.
   * It determines the appropriate search text (from the URL or active tab)
   * and triggers the search.
   * @async
   * @returns {Promise<void>}
   */
  async listSecretBasedOnCurrentPage() {
    const searchText = await this.getSearchText();

    if (searchText) {
      this.form.setValue(this.getInputSearch(), searchText);

      const btnSearch = this.getButtonSearch();
      btnSearch?.click();
    }
  }

  /**
   * Retrieves the search text from the URL query string or the active tab's hostname.
   * It prioritizes a 'search' parameter from the URL, falling back to the hostname.
   * @async
   * @returns {Promise<string>} The search text to use for filtering secrets.
   */
  async getSearchText() {
    const searchFromQueryString = this.getSearchFromQueryString();

    if (searchFromQueryString) {
      return searchFromQueryString;
    } else {
      return await this.getHostnameFromCurrentActiveTab();
    }
  }

  /**
   * Handles the search operation for secrets, triggered by a user event.
   * Validates the search input and initiates the search process, including pagination.
   * @async
   * @param {Event} [event] - The event that triggered the search (optional).
   * @param {number} [pageNumber=1] - The page number of results to display.
   * @returns {Promise<void>}
   */
  async searchSecret(event, pageNumber = 1) {
    try {
      this.notification.clear();

      const search = this.getInputSearch();

      const result = this.form.validate({ required: [search] }, this.isValid.bind(this));
      if (result) {
        this.showSearchLoading();

        await this.searchSecretsByText(search.value, this.getPageNumber(pageNumber));

        this.hideSearchLoading();
      }
    } catch (error) {
      this.hideSearchLoading();

      this.notification.error(error);
    } finally {
      this.setFocusOnFirstElementOrFirstEmpty();
    }
  }

  /**
   * Searches for secrets in Vault using the provided text query.
   * Retrieves secrets matching the search text, including subdomains, and displays them.
   * @async
   * @param {string} text - The search text used to find matching secrets.
   * @param {number} pageNumber - The page number to display.
   * @returns {Promise<void>}
   */
  async searchSecretsByText(text, pageNumber) {
    const token = await this.storage.getToken();

    // Ensure we have a valid token before proceeding.
    if (!this.VaultUtils.isTokenValid(token)) {
      this.redirectToLoginPage();
      return;
    }

    // Clear previous results and pagination from the UI.
    this.form.clear(this.getSecretList());
    this.form.clear(this.getPaginationBar());
    this.listSecrets = [];

    // Get the username for the current session.
    const username = await this.storage.getUsername();
    // Expand search text to include subdomains (if applicable) for better matching.
    text = this.getAllSubdomains(text);

    // Initialize Vault client.
    const vault = this.vaultFactory.create(await this.storage.getUrl(), token);

    // Search for secrets matching the username and expanded text.
    const result = await vault.getSecretsByText(username, text);

    // Display secrets if any were found.
    if (result.secrets.length > 0) {
      // Reset it, to make sure we don't mix secrets from different searches.
      this.listSecrets = result.secrets;

      this.createAndDisplaySecretsPage(pageNumber);
    }

    // Display notifications for any errors that occurred during the search.
    if (result.errors.length > 0) {
      const errorMessages = result.errors.map(e => `[${e.type} - ${e.engine}] ${e.reason || e.error}`).join(', ');

      const localizedErrorMessages = this.I18n.getMessage(PageController.i18nKeys.messages.ERROR_SEARCH_COMPLETED_WITH_ERRORS, [result.errors.length, errorMessages]);

      throw new Error(localizedErrorMessages);
    }
  }

  /**
   * Orchestrates the display of retrieved secrets.
   * Inserts the secrets into the DOM and displays the specified page.
  * @param {number} [pageNumber=1] - The page number to display.
   * @returns {void}
   */
  createAndDisplaySecretsPage(pageNumber = 1) {
    try {
      // Create the page for the secrets.
      this.createPageForSecretsOf(pageNumber);

      // Display the secrets on the created page.
      this.displaySecretsOfPage(pageNumber);
    } catch (error) {
      this.notification.clear().error(error);
    }
  }

  /**
   * Creates HTML elements for secrets on a specific page only (lazy loading approach).
   * Instead of creating all pages at once, this creates DOM elements only for the requested page,
   * significantly improving performance and memory usage for large secret lists.
   * @param {number} [pageNumber=1] - The page number to create.
   * @returns {void}
   */
  createPageForSecretsOf(pageNumber = 1) {
    // Check if this page was already created to avoid duplicate work.
    const pageElement = document.getElementById(PageController.i18nKeys.constants.SECRET_LIST_PAGE_ID_PATTERN + pageNumber);
    if (pageElement) {
      // The page was already created. There is nothing more to do.
      return;
    }

    // Calculate total pages based on actual secrets data, not DOM elements.
    // This supports the new lazy loading approach where pages are created on-demand
    const totalPages = this.calculateTotalPages(this.listSecrets.length, PageController.i18nKeys.constants.ELEMENTS_PER_PAGE);

    if ((totalPages < pageNumber) && (pageNumber > 1)) {
      // There are less pages than the requested page. Navigate to the previous page.
      this.createAndDisplaySecretsPage(--pageNumber);

      return;
    }

    // Get DOM templates and containers.
    const secretList = this.getSecretList();
    const secretPage = this.getSecretPage();
    const secretTemplate = this.getSecretTemplate();

    // Calculate which secrets belong to this specific page (lazy loading).
    const { startIndex, endIndex } = this.calculatePageIndices(pageNumber, PageController.i18nKeys.constants.ELEMENTS_PER_PAGE, this.listSecrets.length);

    // Slice the array to get only secrets for this page - this is the key optimization!
    const secretsForThisPage = this.listSecrets.slice(startIndex, endIndex);

    // Create the page container for this specific page.
    const newPage = secretPage.cloneNode();
    newPage.id = PageController.i18nKeys.constants.SECRET_LIST_PAGE_ID_PATTERN + pageNumber;

    // Create DOM elements only for secrets that belong to this page.
    secretsForThisPage.forEach(secret => {
      const secretElement = secretTemplate.cloneNode(true);
      // Clear the ID to avoid duplicates.
      secretElement.id = '';

      // Mark secret as not loaded yet - detailed data will be fetched when page is displayed.
      secret.isLoaded = false;

      // Populate the element with basic secret information (name, path, etc.).
      this.replaceHTMLWithBasicData(secretElement, secret);

      // Add this secret element to the current page.
      newPage.appendChild(secretElement);
    });

    // Add the completed page to the DOM.
    secretList.appendChild(newPage);
  }

  /**
   * Displays a specific page of secrets and manages pagination controls.
   * It also triggers the loading of detailed data for the secrets on the visible page.
   * @param {number} [pageNumber=1] - The page number to display.
   * @returns {void}
   */
  displaySecretsOfPage(pageNumber = 1) {
    const pageElement = document.getElementById(PageController.i18nKeys.constants.SECRET_LIST_PAGE_ID_PATTERN + pageNumber);
    if (!pageElement) {
      // The page was not found. We need to create it using lazy loading.
      this.createAndDisplaySecretsPage(pageNumber);

      // We stop the processing here. This method will be called again after that page has been created.
      return;
    }

    // Calculate total pages based on actual secrets data, not DOM elements.
    // This supports the new lazy loading approach where pages are created on-demand
    const totalPages = this.calculateTotalPages(this.listSecrets.length, PageController.i18nKeys.constants.ELEMENTS_PER_PAGE);

    // Create pagination bar with calculated total pages (not DOM child count)
    this.createPaginationBar(totalPages, pageNumber, this.createAndDisplaySecretsPage.bind(this), PageController.i18nKeys.constants.MAXIMUM_NUMBER_OF_PAGINATION_BUTTONS);

    // Handle page switching: hide current page if we're switching to a different one
    if (this.currentDisplayingPageNumber != pageNumber) {
      let currentPage = document.getElementById(PageController.i18nKeys.constants.SECRET_LIST_PAGE_ID_PATTERN + this.currentDisplayingPageNumber);
      this.form.hide(currentPage);

      // Update the global tracker to the new page
      this.currentDisplayingPageNumber = pageNumber;
    }

    // Load detailed data for secrets on this page if not already loaded (username, password, etc.)
    this.loadPageData(pageNumber);

    // Show the requested page.
    this.form.show(pageElement);
  }

  /**
   * Loads detailed data for all secrets on a specific page if they haven't been loaded yet.
   * Uses PromisePool for parallel fetching with concurrency control for optimal performance.
   * Individual secret failures are handled gracefully without affecting other secrets.
   * @async
   * @param {number} pageNumber - The page number to load data for.
   * @returns {Promise<void>}
   */
  async loadPageData(pageNumber) {
    const pageElement = document.getElementById(PageController.i18nKeys.constants.SECRET_LIST_PAGE_ID_PATTERN + pageNumber);
    if (!pageElement) {
      return;
    }

    const token = await this.storage.getToken();
    const vault = this.vaultFactory.create(await this.storage.getUrl(), token);

    /**
     * Processes a single secret element: fetches its data and updates the UI.
     * This function is designed to work with PromisePool - it handles its own errors
     * and always returns a result (success or failure indicator).
     * @param {HTMLElement} secretElement - The DOM element for a single secret in the list.
     * @param {number} index - The index of this element in the processing array.
     * @returns {Promise<Object>} A promise that resolves with processing status information.
     */
    const processSecret = async (secretElement, index) => {
      try {
        // Extract secret information from the DOM element's data attribute.
        const fullName = secretElement.dataset.fullName;

        // Find the secret in the global list using its full name.
        const secret = this.listSecrets.find((x) => x.fullName === fullName);

        // Skip processing if the secret isn't found or its data is already loaded.
        if (!secret || secret.isLoaded) {
          return { status: 'skipped', secretName: fullName, reason: 'Already loaded or not found' };
        }

        // Build the path array required for the Vault API call.
        const subkeys = this.VaultUtils.getSubKeys(secret.path, secret.name);

        // Fetch the secret data. This is the asynchronous network call.
        const secretData = await vault.getSecretData(secret.engine, subkeys);

        // If data is successfully retrieved, update the secret object and the UI.
        if (secretData) {
          // Inject data into secret object.
          secret.data = secretData.data;

          // Update the UI with the loaded secret data.
          this.updateSecretElementWithData(secretElement, secret);

          return { status: 'success', secretName: fullName };
        } else {
          return { status: 'no-data', secretName: fullName, reason: 'No data returned from Vault' };
        }
      } catch (error) {
        // Return error information - PromisePool will handle the user notification.
        return { status: 'error', secretName: secretElement.dataset.fullName, reason: error.message };
      }
    };

    // Convert the HTMLCollection of child elements to an array for PromisePool processing.
    const elementsToProcess = Array.from(pageElement.children);

    // Use PromisePool to process secret elements with concurrency control (default: 6 concurrent requests).
    if (elementsToProcess.length > 0) {
      const results = await this.PromisePool.process(elementsToProcess, processSecret);

      // Log processing summary for debugging.
      const skipped = results.filter(r => r.status === 'skipped').length;
      const successful = results.filter(r => r.status === 'success').length;
      const noData = results.filter(r => r.status === 'no-data').length;
      const failed = results.filter(r => r.status === 'error');

      this.logger.info(`LoadPageData summary: ${skipped} skipped, ${successful} successful, ${noData} no-data, ${failed.length} failed`);

      // If there are failed operations, notify the user.
      if (failed.length > 0) {
        // Collect error messages from failed results.
        const errorMessages = failed.map(r => r.reason).join('; ');

        // Notify the user about the failed operations.
        throw new Error(this.I18n.getMessage(PageController.i18nKeys.messages.ERROR_LOAD_PAGE_DATA_FAILED, [failed.length, errorMessages]));
      }
    }
  }

  /**
   * Updates a secret's DOM element with its fully loaded data.
   * It determines if the secret is a credential, a token, or has invalid attributes, and updates the UI accordingly.
   * @param {HTMLElement} secretElement - The DOM element for the secret.
   * @param {object} secret - The full secret object, including its data.
   * @returns {void}
   */
  updateSecretElementWithData(secretElement, secret) {
    const usernameKeys = this.I18n.getMessage(PageController.i18nKeys.messages.CONFIG_SECRET_USERNAME_KEYS);
    const passwordKeys = this.I18n.getMessage(PageController.i18nKeys.messages.CONFIG_SECRET_PASSWORD_KEYS);
    const tokenKeys = this.I18n.getMessage(PageController.i18nKeys.messages.CONFIG_SECRET_TOKEN_KEYS);

    const user = this.getValueIfDataHasKey(secret.data, usernameKeys);
    const password = this.getValueIfDataHasKey(secret.data, passwordKeys);
    const token = this.getValueIfDataHasKey(secret.data, tokenKeys);

    if ((user) && (password)) {
      this.replaceHTMLWithCredentials(secretElement, secret, user, password);

      // Mark as loaded.
      secret.isLoaded = true;
    } else if (token) {
      this.replaceHTMLWithToken(secretElement, secret, token);

      // Mark as loaded.
      secret.isLoaded = true;
    } else {
      this.replaceHTMLWithInvalidAttributes(secretElement, secret);
    }
  }

  /**
   * Populates a secret's DOM element with its basic, pre-load data (name and a loading message).
   * Also sets up the initial state of the action buttons (edit, delete).
   * @param {HTMLElement} element - The DOM element for the secret.
   * @param {object} secret - The secret object with basic information.
   * @returns {void}
   */
  replaceHTMLWithBasicData(element, secret) {
    const secretName = this.form.cutTextAfter(secret.fullName);
    const initialMessage = this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_LOADING);

    const keyValuesToReplace = this.getBasicKeyValuesToReplace(secretName, initialMessage);

    // Store full name of the secret in the element.
    // This will be used to identify the secret later.
    element.dataset.fullName = secret.fullName;

    // Replace HTML content with the secret's basic data.
    this.replaceHtml(element, keyValuesToReplace);

    const buttons = element.getElementsByTagName('button');

    // We only have 2 buttons: Edit (index 1) and Delete (index 2).
    // Button index 0 is the main list item button.
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];

      let callback;
      switch (i) {
        case 0:
          this.form.disable(button);
          break;
        case 1:
        case 2:
          break;
        case 3:
          this.form.show(button);
          callback = this.editSecret.bind(this, secret);
          break;
        case 4:
          callback = this.deleteSecret.bind(this, secret);
          break;
      }

      if (callback) {
        this.form.addClickListener(button, callback);
      }
    }
  }

  /**
   * Updates a secret's DOM element to display credential information (username).
   * It enables and configures the action buttons for filling, copying user, and copying password.
   * @param {HTMLElement} element - The DOM element for the secret.
   * @param {object} secret - The full secret object.
   * @param {string} user - The secret's username.
   * @param {string} password - The secret's encrypted password.
   * @returns {void}
   */
  replaceHTMLWithCredentials(element, secret, user, password) {
    const secretType = this.form.cutTextAfter(`${this.I18n.getMessage(PageController.i18nKeys.messages.UI_LABEL_USER)}: ${user}`);
    const textCopyValue = this.I18n.getMessage(PageController.i18nKeys.messages.UI_TOOLTIP_BUTTON_COPY_PASSWORD);

    const keyValuesToReplace = this.getKeyValuesToReplace(secretType, textCopyValue);

    this.replaceHtml(element, keyValuesToReplace);

    const buttons = element.getElementsByTagName('button');

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];

      let callback;
      switch (i) {
        case 0:
          this.form.enable(button);
          callback = this.fillCredentialsInPage.bind(this, user, password, secret);
          break;
        case 1:
          this.form.show(button);
          callback = this.copyStringToClipboard.bind(this, user);
          break;
        case 2:
          this.form.show(button);
          callback = this.copySecretToClipboard.bind(this, password, secret);
          break;
        case 3:
          this.form.show(button);
          //callback = this.editSecret.bind(this, secret);
          break;
        case 4:
          //callback = this.deleteSecret.bind(this, secret);
          break;
      }

      if (callback) {
        this.form.addClickListener(button, callback);
      }
    }
  }

  /**
   * Updates a secret's DOM element to display token information.
   * It enables and configures the action buttons for filling and copying the token.
   * @async
   * @param {HTMLElement} element - The DOM element for the secret.
   * @param {object} secret - The full secret object.
   * @param {string} token - The secret's encrypted token.
   * @returns {Promise<void>}
   */
  async replaceHTMLWithToken(element, secret, token) {
    const secretType = this.form.cutTextAfter(`${this.I18n.getMessage(PageController.i18nKeys.messages.UI_LABEL_TOKEN)}: **********`, 30);
    const textCopyValue = this.I18n.getMessage(PageController.i18nKeys.messages.UI_TOOLTIP_BUTTON_COPY_TOKEN);

    const keyValuesToReplace = this.getKeyValuesToReplace(secretType, textCopyValue);

    this.replaceHtml(element, keyValuesToReplace);

    const buttons = element.getElementsByTagName('button');

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];

      let callback;
      switch (i) {
        case 0:
          this.form.enable(button);
          callback = this.fillTokenInPage.bind(this, token, secret);
          break;
        case 1:
          break;
        case 2:
          this.form.show(button);
          callback = this.copySecretToClipboard.bind(this, token, secret);
          break;
        case 3:
          this.form.show(button);
          //callback = this.editSecret.bind(this, secret);
          break;
        case 4:
          //callback = this.deleteSecret.bind(this, secret);
          break;
      }

      if (callback) {
        this.form.addClickListener(button, callback);
      }
    }
  }

  /**
   * Updates a secret's DOM element to indicate that it has missing or invalid attributes.
   * Disables interactive buttons except for the delete button.
   * @async
   * @param {HTMLElement} element - The DOM element for the secret.
   * @param {object} secret - The full secret object.
   * @returns {Promise<void>}
   */
  async replaceHTMLWithInvalidAttributes(element, secret) {
    // Display invalid attributes message
    const invalidAttributesMessage = this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_INVALID_ATTRIBUTES);

    const keyValuesToReplace = this.getKeyValuesToReplace(invalidAttributesMessage);

    this.replaceHtml(element, keyValuesToReplace);

    const buttons = element.getElementsByTagName('button');

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];

      let callback;
      switch (i) {
        case 0:
        case 1:
        case 2:
        case 3:
          this.form.hide(button);
          break;
        case 4:
          //callback = this.deleteSecret.bind(this, secret);
          break;
      }

      if (callback) {
        this.form.addClickListener(button, callback);
      }
    }
  }

  /**
   * Decrypts a secret value (password or token) and copies it to the clipboard.
   * @async
   * @param {string} text - The encrypted text to decrypt and copy.
   * @param {object} secret - The secret object, used to get the salt for decryption.
   * @returns {Promise<void>}
   */
  async copySecretToClipboard(text, secret) {
    try {
      this.copyStringToClipboard(await this.VaultCrypto.decrypt(text, secret.fullName));
    } catch (error) {
      this.notification.clear().error(error);
    }
  }

  /**
   * Copies a given string to the user's clipboard.
   * @async
   * @param {string} text - The text to copy.
   * @returns {Promise<void>}
   */
  async copyStringToClipboard(text) {
    try {
      await this.copyValueToClipboard(text);
    } catch (error) {
      this.notification.clear().error(error);
    }
  }

  /**
   * Fills credentials (username and password) into the active web page.
   * It decrypts the password and sends a message to the content script to perform the action.
   * @async
   * @param {string} username - The username to fill.
   * @param {string} password - The encrypted password.
   * @param {object} secret - The secret object, used for the decryption salt.
   * @returns {Promise<void>}
   */
  async fillCredentialsInPage(username, password, secret) {
    try {
      this.fillContentInPage({
        message: PageController.i18nKeys.constants.REQUEST_MESSAGE_ID.FILL_CREDENTIALS_IN_PAGE,
        username,
        password: await this.VaultCrypto.decrypt(password, secret.fullName)
      });
    } catch (error) {
      this.notification.clear().error(error);
    }
  }

  /**
   * Fills a token into the active web page.
   * It decrypts the token and sends a message to the content script to perform the action.
   * @async
   * @param {string} token - The encrypted token.
   * @param {object} secret - The secret object, used for the decryption salt.
   * @returns {Promise<void>}
   */
  async fillTokenInPage(token, secret) {
    try {
      this.fillContentInPage({
        message: PageController.i18nKeys.constants.REQUEST_MESSAGE_ID.FILL_TOKEN_IN_PAGE,
        token: await this.VaultCrypto.decrypt(token, secret.fullName)
      });
    } catch (error) {
      this.notification.clear().error(error);
    }
  }

  /**
   * Sends a message to the content script of the active tab to fill content.
   * It handles messaging all frames within the tab.
   * @async
   * @param {object} content - The message payload to send to the content script.
   * @returns {Promise<void>}
   */
  async fillContentInPage(content) {
    try {
      // Get the current active tab.
      const tab = await this.getCurrentAndActiveTab();

      if (tab.url) {
        // Reset state for tracking responses from multiple frames.
        // We need to know when all frames have responded to show a final notification.
        // This is important for pages with iframes, where multiple frames may need to be filled.

        // Get all frames in the current tab.
        const allFrames = await this.getAllFramesFrom(tab.id);

        // Initialize tracking variables.
        this.quantityOfFramesInPage = allFrames.length;
        this.repliesReceived = 0;
        this.credentialsInserted = false;

        this.getBrowserHandler().tabs
          .sendMessage(tab.id, content)
          .catch(this.sendMessageCallback.bind(this));
      }
    } catch (error) {
      this.notification.clear().error(error);
    }
  }

  /**
   * A callback to handle potential errors when sending a message to a content script.
   * Suppresses the "receiving end does not exist" error, which is common.
   * @returns {void}
   */
  sendMessageCallback() {
    const lastError = this.getBrowserHandler().runtime.lastError;

    if (lastError) {
      // Could not establish connection. Receiving end does not exist.
      return;
    }
  }

  /**
   * Handles editing a secret by navigating to the add/edit page.
   * Constructs the edit URL with the secret's full name and current search context,
   * then redirects to the secrets add page in edit mode.
   * @async
   * @param {object} secret - The secret object containing its full name.
   * @returns {Promise<void>}
   */
  async editSecret(secret) {
    try {
      let url = `${this.Link.SecretsAdd}?secretname=${encodeURIComponent(secret.fullName)}`;

      const search = this.getInputSearch();

      url = `${url}&search=${encodeURIComponent(search.value)}`;
      url = `${url}&page=${encodeURIComponent(this.currentDisplayingPageNumber)}`;

      // Redirect to the edit page.
      location.href = url;
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Handles the deletion of a secret.
   * It confirms the action with the user, then calls the Vault API to delete the secret
   * and reloads the list.
   * @async
   * @param {object} secret - The secret object to delete.
   * @returns {Promise<void>}
   */
  async deleteSecret(secret) {
    try {
      // Get the current token.
      const token = await this.storage.getToken();

      // Ensure we have a valid token before proceeding.
      if (!this.VaultUtils.isTokenValid(token)) {
        this.redirectToLoginPage();
        return;
      }

      // Get the delete message with the secret's full name.
      let message = this.I18n.getMessage(PageController.i18nKeys.messages.UI_CONFIRM_DELETE_SECRET, [secret.fullName]);

      if (confirm(message)) {
        // Build the path array required for the Vault API call.
        const subkeys = this.VaultUtils.getSubKeys(secret.path, secret.name);

        // Initialize Vault client.
        const vault = this.vaultFactory.create(await this.storage.getUrl(), token);

        // Call Vault to delete the secret.
        await vault.deleteSecret(secret.engine, subkeys);

        // Do a new search to reload the page.
        await this.searchSecret(null, this.currentDisplayingPageNumber);

        // Get the success message with the secret's full name.
        message = this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_DELETE_SECRET_SUCCESS, [secret.fullName]);

        // Notify the user of successful deletion.
        this.notification.info(message, { removeOption: true });
      }
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Checks if the message from a content script indicates a successful operation.
   * @param {object} request - The message object received from the content script.
   * @returns {boolean} True if the operation was successful, false otherwise.
   */
  fillCredentialsWasSuccessful(request) {
    const messageIds = PageController.i18nKeys.constants.REQUEST_MESSAGE_ID;

    return (request.message === messageIds.FILL_CREDENTIALS_SUCCESS) || (request.message === messageIds.FILL_TOKEN_SUCCESS);
  }

  /**
   * A private method to handle message listening from content scripts.
   * Sets up the Chrome runtime message listener for this controller instance.
   *
   * This method handles the complex process of aggregating responses from multiple frames
   * when credentials or tokens are filled into web pages. Since a single tab can contain
   * multiple frames (iframes), we need to wait for all frames to respond before showing
   * a final success/failure notification to the user.
   *
   * @private
   */
  #addMessageListener() {
    this.getBrowserHandler().runtime.onMessage.addListener((request) => {
      try {
        // Increment the counter of replies received from content scripts.
        // This tracks how many frames have responded to our fill operation.
        this.repliesReceived += 1;

        // Check if we haven't already detected a successful credential insertion.
        // We only need one successful insertion to consider the operation successful.
        if (!this.credentialsInserted) {
          // Determine if this specific response indicates success.
          if (this.fillCredentialsWasSuccessful(request)) {
            // Mark that we've successfully inserted credentials/token.
            this.credentialsInserted = true;
            // Store the success message for later display.
            this.credentialsInsertedMessage = request.message;
          }
        }

        // Check if we've received responses from all frames in the page.
        // If not all frames have responded yet, we wait for more responses.
        if (this.repliesReceived != this.quantityOfFramesInPage) {
          // Still waiting for more frames to respond.
          return;
        }

        // All frames have responded - time to show the final notification.
        // Clear any existing notifications first.
        this.notification.clear();

        const NOTIFICATION_TIMEOUT = 5000;

        // Show appropriate notification based on whether the operation was successful.
        if (this.credentialsInserted) {
          // At least one frame successfully received the credentials/token.
          let message = this.I18n.getMessage(this.credentialsInsertedMessage);
          this.notification.info(message, { time: NOTIFICATION_TIMEOUT });
        }
        else {
          // No frame successfully received the credentials/token.
          // Show the error message from the last response.
          let message = this.I18n.getMessage(request.message);
          this.notification.error(message, { time: NOTIFICATION_TIMEOUT });
        }
      } catch (error) {
        // Handle any unexpected errors in the message processing.
        // This ensures the listener doesn't crash and provides user feedback.
        this.notification.error(this.I18n.getMessage(PageController.i18nKeys.messages.ERROR_MESSAGE_HANDLING_FAILED, [error.message || error]));
      }
    });
  }

}
