/**
 * Console logger for debugging API requests and application flow.
 * Only logs when DEBUG mode is enabled.
 */
export class ConsoleLogger {

  /**
   * Request counters for different API types.
   * @private
   */
  #requestCount = {
    listEngines: 0,
    listSecrets: 0,
    getSecretData: 0
  };

  /**
   * Creates a new ConsoleLogger instance.
   * @param {boolean} debugEnabled - Whether debug logging is enabled.
   */
  constructor(debugEnabled = false) {
    this.debugEnabled = debugEnabled;
  }

  /**
   * Generates a formatted timestamp string in the format "YYYY-MM-DD HH:MM:SS.mmm".
   * @returns {string} The current date and time with milliseconds.
   * @private
   */
  #getTimestamp() {
    // Get the current date and time.
    const now = new Date();

    // YYYY-MM-DD.
    const date = now.toISOString().slice(0, 10);

    // HH:MM:SS.
    const time = now.toTimeString().split(' ')[0];

    // Milliseconds.
    const ms = String(now.getMilliseconds()).padStart(3, '0');

    // Formatted timestamp.
    return `${date} ${time}.${ms}`;
  }

  /**
   * Formats a log message by prepending a timestamp.
   * @param {string} message - The message to format.
   * @returns {string} The formatted log message with timestamp.
   * @private
   */
  #formatMessage(message) {
    const timestamp = this.#getTimestamp();

    return `[${timestamp}] ${message}`;
  }

  /**
   * Logs an informational message to the console.
   * @param {string} message - The message to log.
   * @param {...any} args - Additional arguments to log.
   */
  debug(message, ...args) {
    if (!this.debugEnabled) return;

    console.debug(this.#formatMessage(message), ...args);
  }

  /**
   * Logs an informational message to the console.
   * @param {string} message - The message to log.
   * @param {...any} args - Additional arguments to log.
   */
  info(message, ...args) {
    if (!this.debugEnabled) return;

    console.info(this.#formatMessage(message), ...args);
  }

  /**
   * Logs a warning message to the console.
   * @param {string} message - The message to log.
   * @param {...any} args - Additional arguments to log.
   */
  warn(message, ...args) {
    if (!this.debugEnabled) return;

    console.warn(this.#formatMessage(message), ...args);
  }

  /**
   * Logs an error message to the console.
   * @param {string} message - The message to log.
   * @param {...any} args - Additional arguments to log.
   */
  error(message, ...args) {
    if (!this.debugEnabled) return;

    console.error(this.#formatMessage(message), ...args);
  }

  /**
   * Resets all request counters.
   */
  reset() {
    this.#requestCount = {
      listEngines: 0,
      listSecrets: 0,
      getSecretData: 0
    };
  }

  /**
   * Calculates and returns the total number of requests logged.
   * @returns {number} The sum of all request types.
   * @private
   */
  #getTotalRequests() {
    return Object.values(this.#requestCount).reduce((a, b) => a + b, 0);
  }

  /**
   * Logs an API request with a timestamp and increments the relevant counter.
   * @param {string} type - Type of request (e.g., 'listEngines').
   * @param {string} [details=''] - Additional details about the request, such as a URL.
   */
  logRequest(type, details = '') {
    if (!this.debugEnabled) return;

    if (!this.#requestCount.hasOwnProperty(type)) {
      this.warn(`Unknown request type: ${type}`);
      return;
    }

    this.#requestCount[type]++;
    this.info(`API Request #${this.#requestCount[type]} - ${type}${details ? ': [' + details + ']' : ''}`);
  }

  /**
   * Creates a new inline group in the browser console, indenting all subsequent log messages.
   * Call groupEnd() to exit the group.
   * @param {string} message - The label for the log group.
   */
  group(message) {
    if (!this.debugEnabled) return;

    console.group(this.#formatMessage(message));
  }

  /**
   * Exits the current inline log group in the browser console.
   */
  groupEnd() {
    if (!this.debugEnabled) return;

    console.groupEnd();
  }

  /**
   * Logs a formatted summary of all API requests made since the last reset.
   */
  logSummary() {
    if (!this.debugEnabled) return;

    this.group('API Request Summary');
    this.info(`List Engines: ${this.#requestCount.listEngines} requests`);
    this.info(`List Secrets: ${this.#requestCount.listSecrets} requests`);
    this.info(`Get Secret Data: ${this.#requestCount.getSecretData} requests`);
    this.info(`Total API Calls: ${this.#getTotalRequests()}`);
    this.groupEnd();
  }
}
