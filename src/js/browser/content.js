/**
 * This content script acts as the bridge between the extension and the web page.
 * It is responsible for finding and filling form fields when instructed by the extension's popup.
 * An "injection guard" is used to prevent this script from running multiple times on the same page,
 * which is crucial for Single-Page Applications (SPAs).
 */

// --- The Injection Guard ---
// We create a uniquely named property on the window object. If this property
// already exists, it means our script has already been injected and set up its
// listeners, so we should not do anything further.
if (window.vaultContentScriptsInjected === undefined) {
  // Set the flag to true immediately to prevent future runs on this page.
  window.vaultContentScriptsInjected = true;

  let constants = null;
  let i18n = null;
  let logger = null;
  let form = null;

  /**
   * Returns the appropriate browser API object (browser or chrome).
   * Uses the 'browser' object (from webextension-polyfill) if available, otherwise falls back to 'chrome'.
   * @returns {object} The browser API object.
   */
  function getBrowserHandler() {
    return browser || chrome;
  }

  /**
   * Initializes the content script by importing necessary libraries (I18n, Form, constants, logger)
   * and instantiating them.
   * This is an Immediately Invoked Function Expression (IIFE).
   */
  (async () => {
    try {
      const _constants = await import(getBrowserHandler().runtime.getURL('/js/core/constants.js'));
      const { I18n } = await import(getBrowserHandler().runtime.getURL('/js/core/i18n.js'));
      const { ConsoleLogger } = await import(getBrowserHandler().runtime.getURL('/js/core/consolelogger.js'));
      const { Form } = await import(getBrowserHandler().runtime.getURL('/js/ui/forms.js'));

      constants = _constants;
      i18n = I18n;
      logger = new ConsoleLogger(_constants.DEBUG);
      form = new Form();
    } catch (error) {
      console.error("Error importing modules in content script:", error);
    }
  })();

  /**
   * Listens for messages from other parts of the extension (e.g., popup or background).
   * @param {object} request - The message object sent.
   * @param {object} sender - An object containing information about the script context that sent the message.
   * @param {function} sendResponse - A function to send a response back to the message sender.
   */
  getBrowserHandler().runtime.onMessage.addListener((request) => {
    // Ensure required libraries are loaded before processing the message.
    if (!constants || !i18n || !logger || !form) {
      console.error("Content script libraries not yet loaded. Message ignored:", request);

      // Stop execution if libs are not ready.
      return;
    }

    try {
      switch (request.message) {
        case constants.REQUEST_MESSAGE_ID.FILL_CREDENTIALS_IN_PAGE:
          handleFillCredentialsInPage(request);
          break;
        case constants.REQUEST_MESSAGE_ID.FILL_TOKEN_IN_PAGE:
          handleFillTokenInPage(request);
          break;
      }
    } catch (error) {
      logger.error("Error handling message in content script:", error);
    }
  });

  /**
   * Handles the request to fill credentials (username and password) into the current page.
   * Searches for appropriate input fields and fills them with the provided credentials.
   *
   * @param {Object} request - The message request containing credential data.
   * @param {string} request.username - The username to fill.
   * @param {string} request.password - The password to fill.
   * @returns {Object} Response object indicating success or failure.
   */
  function handleFillCredentialsInPage(request) {
    if (!request?.username || !request?.password) {
      logger.error("Invalid request data for fillCredentialsInPage:", request);

      // Send failure message back to extension.
      sendMessageToExtension({
        message: constants.REQUEST_MESSAGE_ID.FILL_CREDENTIALS_FAILED,
      });

      // Stop execution if username or password is missing.
      return;
    }

    const usernameInput = getUsernameInput(document);
    const passwordInput = getPasswordInput(document);

    const foundUserField = fillContent(usernameInput, request.username);
    const foundPasswordField = fillContent(passwordInput, request.password);

    if (foundUserField || foundPasswordField) {
      sendMessageToExtension({
        message: constants.REQUEST_MESSAGE_ID.FILL_CREDENTIALS_SUCCESS
      });
    } else {
      sendMessageToExtension({
        message: constants.REQUEST_MESSAGE_ID.FILL_CREDENTIALS_FAILED
      });
    }
  }

  /**
   * Handles the request to fill a token into the current page.
   * Searches for an appropriate token input field and fills it with the provided token value.
   *
   * @param {Object} request - The message request containing token data.
   * @param {string} request.token - The token value to fill.
   * @returns {Object} Response object indicating success or failure.
   */
  function handleFillTokenInPage(request) {
    if (!request?.token) {
      logger.error("Invalid request data for fillTokenInPage:", request);

      // Send failure message back to extension.
      sendMessageToExtension({
        message: constants.REQUEST_MESSAGE_ID.FILL_TOKEN_FAILED,
      });

      // Stop execution if token is missing.
      return;
    }

    const tokenInput = getTokenInput(document);
    const foundTokenField = fillContent(tokenInput, request.token);

    if (foundTokenField) {
      sendMessageToExtension({
        message: constants.REQUEST_MESSAGE_ID.FILL_TOKEN_SUCCESS
      });
    } else {
      sendMessageToExtension({
        message: constants.REQUEST_MESSAGE_ID.FILL_TOKEN_FAILED
      });
    }
  }

  /**
   * Sends a message back to the extension's runtime (e.g., to the popup or background script).
   *
   * @param {Object} content - The message payload to send.
   * @returns {void}
   */
  function sendMessageToExtension(content) {
    try {
      getBrowserHandler().runtime.sendMessage(content);
    } catch (error) {
      logger.error("Error sending message to extension:", error);
    }
  }

  /**
   * Fills a given HTML element with a value and dispatches input/change events.
   * This function handles various input types and ensures proper event triggering for form validation.
   *
   * @param {HTMLElement} element - The DOM element to fill.
   * @param {string} value - The value to fill into the element.
   * @returns {boolean} True if the element was found and filled, false otherwise.
   */
  function fillContent(element, value) {
    if (!element) {
      return false;
    }

    form.setFocus(element);
    form.setValue(element, value);

    element.dispatchEvent(createEvent('input'));
    element.dispatchEvent(createEvent('change'));

    form.blur(element);

    return true;
  }

  /**
   * Creates a new DOM event with specified bubbling and cancelable properties.
   *
   * @param {string} name - The name of the event to create (e.g., 'input', 'change').
   * @returns {Event} The created event object.
   */
  function createEvent(name) {
    return new Event(name, {
      bubbles: true,
      cancelable: true
    });
  }

  /**
   * Finds a username input field in the given parent element.
   * Uses configurable selectors from i18n messages to identify username fields.
   *
   * @param {HTMLElement|Document} parentElement - The DOM element to search within.
   * @returns {HTMLElement|null} The found username input element or null if not found.
   */
  function getUsernameInput(parentElement) {
    const inputsToFind = i18n.getMessage('config_page_scan_username_selectors');

    return searchInput(parentElement, inputsToFind, true);
  }

  /**
   * Finds a password input field in the given parent element.
   * Uses configurable selectors from i18n messages to identify password fields.
   *
   * @param {HTMLElement|Document} parentElement - The DOM element to search within.
   * @returns {HTMLElement|null} The found password input element or null if not found.
   */
  function getPasswordInput(parentElement) {
    const inputsToFind = i18n.getMessage('config_page_scan_password_selectors');

    return searchInput(parentElement, inputsToFind, true);
  }

  /**
   * Finds a token input field in the given parent element.
   * Uses configurable selectors from i18n messages to identify token fields.
   *
   * @param {HTMLElement|Document} parentElement - The DOM element to search within.
   * @returns {HTMLElement|null} The found token input element or null if not found.
   */
  function getTokenInput(parentElement) {
    const inputsToFind = i18n.getMessage('config_page_scan_token_selectors');

    return searchInput(parentElement, inputsToFind, true);
  }

  /**
   * Searches for an input element within a parent element based on a string of CSS selectors.
   * @param {HTMLElement|Document} parentElement - The DOM element to search within.
   * @param {string} selectorsString - A comma-separated string of CSS selectors.
   * @param {boolean} hasToBeVisible - Whether the found element must be visible.
   * @returns {HTMLElement|null} The first matching element found, or null.
   */
  function searchInput(parentElement, selectorsString, hasToBeVisible) {
    if (!selectorsString) {
      logger.warn("No selectors provided to searchInput.");
      return null;
    }

    // Split by comma and trim whitespace around each selector.
    const selectors = selectorsString.split(/\s*,\s*/);

    for (const selector of selectors) {
      if (!selector) {
        continue;
      }

      try {
        const elements = parentElement.querySelectorAll(selector);
        for (const element of elements) {
          if (hasToBeVisible && !form.isVisible(element)) {
            continue;
          }
          return element;
        }
      } catch (error) {
        logger.warn(`Invalid selector string '${selector}' from i18n:`, error);
      }
    }

    // If no matching element is found, return null.
    return null;
  }
}
