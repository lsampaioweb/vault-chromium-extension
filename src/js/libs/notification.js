export class Notification {
  #NotificationLevel = {
    INFO: 'info',
    ERROR: 'error'
  };

  constructor(node) {
    this.node = node;
    this.messages = [];
  }

  /**
 * Clears all messages.
 * @returns this
 */
  clear() {
    this.node.innerHTML = '';
    this.messages = [];

    return this;
  }

  /**
   * @param {String} message will be parsed to HTML.
   * @param {Object} options
   * @param {Number} [options.time] when declared, notification will disappear after Xms.
   * @param {Boolean} [options.removeOption] wether or not to show the ✖.
   * @returns this
   */
  info(message, options) {
    return this.#message({ level: this.#NotificationLevel.INFO, message, ...options });
  }

  /**
   * @param {String} message will be parsed to HTML.
   * @param {Object} options
   * @param {Number} [options.time] when declared, notification will disappear after Xms.
   * @param {Boolean} [options.removeOption] wether or not to show the ✖.
   * @returns this
   */
  error(message, options) {
    let errorMessage = message;

    if (typeof message === 'string') {
      errorMessage = message;

    } else if (message instanceof Error) {
      errorMessage = message.message || message;

    } else if (message && message.message) {
      errorMessage = message.message || message;

    }

    return this.#message({ level: this.#NotificationLevel.ERROR, message: errorMessage, ...options });
  }

  /**
   * @param {Object} options
   * @param {String} [options.level] info|error.
   * @param {String} options.message will be parsed to HTML.
   * @param {Number} [options.time] when declared, notification will disappear after Xms.
   * @param {Boolean} [options.removeOption] wether or not to show the ✖.
   * @returns this
   */
  #message({ level = this.#NotificationLevel.INFO, message, time, removeOption = true }) {
    const messageNode = document.createElement('div');

    messageNode.classList.add('notify', `notify_${level}`);
    messageNode.innerHTML = message?.toString();

    this.#append(messageNode);

    if (removeOption) {
      this.#addRemoveOption(messageNode);
    }
    if (time) {
      setTimeout(() => messageNode.remove(), time);
    }

    return this;
  }

  #addRemoveOption(node) {
    const removeNode = document.createElement('button');

    removeNode.innerHTML = '✖';
    removeNode.classList.add('nobutton', 'link', 'notify_button');
    removeNode.addEventListener('click', () => node.remove());

    node.append(removeNode);
  }

  #append(node) {
    this.messages.push(node);
    this.node.append(node);
  }
}
