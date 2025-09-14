/**
 * Handles displaying and managing notifications within a designated HTML element.
 */
export class Notification {
  /**
   * Common internationalization keys and constants for this class.
   * As a static field, this is shared across all instances of Notification.
   * @private
   * @static
   * @readonly
   */
  static #i18nKeys = {
    constants: {
      NOTIFICATION_LEVEL_INFO: 'info',
      NOTIFICATION_LEVEL_ERROR: 'error'
    },
    messages: {
      ERROR_NOTIFICATION_INVALID_CONTAINER: 'error_notification_invalid_container',
      ERROR_UNKNOWN_OCCURRED: 'error_unknown_occurred',
      UI_TOOLTIP_NOTIFICATION_CLOSE: 'ui_tooltip_notification_close',
    },
  };

  // Internationalization instance.
  #i18n;

  /**
   * The ID of the HTML element that will contain the notifications.
   * @type {string}
   * @private
   */
  #nodeId;

  /**
   * The cached HTML element where notifications will be displayed.
   * @type {HTMLElement}
   * @private
   */
  #containerNode;

  /**
   * Creates an instance of the Notification class.
   * @param {string} nodeId - The ID of the HTML element that will contain the notifications.
   * @param {object} i18nClass - A class with methods for internationalization.
   */
  constructor(nodeId, i18nClass) {
    if (!nodeId || typeof nodeId !== 'string') {
      // Access the static property via the class name: Notification.#i18nKeys
      throw new Error(i18nClass.getMessage(Notification.#i18nKeys.messages.ERROR_NOTIFICATION_INVALID_CONTAINER));
    }

    this.#nodeId = nodeId;
    this.#i18n = i18nClass;
  }

  /**
   * Gets the container node for notifications.
   * @returns {HTMLElement} The container node.
   */
  #getContainerNode() {
    if (!this.#containerNode) {
      this.#containerNode = document.getElementById(this.#nodeId);
    }

    return this.#containerNode;
  }

  /**
   * Removes all currently displayed notifications.
   * @returns {Notification} The current instance for chaining.
   */
  clear() {
    this.#getContainerNode().replaceChildren();

    return this;
  }

  /**
   * Displays an informational message.
   * @param {string | Error} message - The message content (string or Error object).
   * @param {object} [options] - Configuration options.
   * @param {number} [options.time] - Duration in ms before auto-removal.
   * @param {boolean} [options.removeOption=true] - Show a close button.
   * @returns {Notification} The current instance for chaining.
   */
  info(message, options) {
    return this.#message({ level: Notification.#i18nKeys.constants.NOTIFICATION_LEVEL_INFO, message, ...options });
  }

  /**
   * Displays an error message.
   * @param {string | Error} message - The message content (string or Error object).
   * @param {object} [options] - Configuration options.
   * @param {number} [options.time] - Duration in ms before auto-removal.
   * @param {boolean} [options.removeOption=true] - Show a close button.
   * @returns {Notification} The current instance for chaining.
   */
  error(message, options) {
    // Extract a clean error message using the helper method.
    const errorMessage = this.#extractErrorMessage(message);

    return this.#message({ level: Notification.#i18nKeys.constants.NOTIFICATION_LEVEL_ERROR, message: errorMessage, ...options });
  }

  /**
   * Extracts a readable error message from various input types.
   * @param {string | Error | object} message - The message content.
   * @returns {string} A clean error message string.
   * @private
   */
  #extractErrorMessage(message) {
    if (message instanceof Error) {
      return message.message || message.toString();
    }
    if (message && typeof message === 'object' && message?.message) {
      return message.message;
    }

    // Handle plain objects that would stringify to "[object Object]"
    if (message && typeof message === 'object') {
      try {
        return JSON.stringify(message);
      } catch {
        return String(message);
      }
    }

    return message?.toString() || this.#i18n.getMessage(Notification.#i18nKeys.messages.ERROR_UNKNOWN_OCCURRED);
  }

  /**
   * Creates and displays a single notification message.
   * @param {object} options - Notification options.
   * @param {string} options.level - 'info' or 'error'.
   * @param {string} options.message - The HTML or text message content.
   * @param {number} [options.time] - Auto-removal time in ms.
   * @param {boolean} [options.removeOption=true] - Show close button.
   * @returns {Notification} The current instance for chaining.
   * @private
   */
  #message({ level = Notification.#i18nKeys.constants.NOTIFICATION_LEVEL_INFO, message, time, removeOption = true }) {
    const messageNode = document.createElement('div');

    messageNode.classList.add('notify', `notify_${level}`);

    // Use textContent for security - prevents XSS attacks by treating content as plain text.
    messageNode.textContent = message;

    this.#append(messageNode);

    // Add a close button if requested.
    if (removeOption) {
      this.#addRemoveOption(messageNode);
    }

    // Set a timeout to remove the message if a time is specified.
    if (time && typeof time === 'number' && time > 0) {
      setTimeout(() => {
        // Only remove the node if it hasn't been removed already.
        if (messageNode.parentNode) {
          messageNode.remove();
        }
      }, time);
    }

    return this;
  }

  /**
   * Appends a new notification node to the container.
   * @param {HTMLElement} node - The notification element to add.
   * @private
   */
  #append(node) {
    this.#getContainerNode().append(node);
  }

  /**
   * Adds a close button (✖) to a notification node.
   * @param {HTMLElement} node - The notification element.
   * @private
   */
  #addRemoveOption(node) {
    const closeButton = document.createElement('button');

    // Get localized text for the button attributes.
    const closeButtonText = this.#i18n.getMessage(Notification.#i18nKeys.messages.UI_TOOLTIP_NOTIFICATION_CLOSE);

    closeButton.textContent = '✖';
    closeButton.classList.add('nobutton', 'link', 'notify_button');

    // For tooltip.
    closeButton.setAttribute('title', closeButtonText);

    // Add listener to remove the notification (its parent) when clicked.
    // Use { once: true } so the listener cleans itself up after one click.
    closeButton.addEventListener('click', () => node.remove(), { once: true });

    // Append the close button to the notification node.
    node.append(closeButton);
  }
}
