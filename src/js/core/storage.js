/**
 * A generic base class for interacting with a storage mechanism.
 * This class is intended to be extended by more specific storage handlers.
 */
class Storage {
  /**
   * The underlying storage API (e.g., browser.storage.local, browser.storage.session).
   * @type {object}
   * @private
   */
  #storageType;

  /**
   * Creates an instance of the Storage class.
   * @param {object} storage - The browser storage object (e.g., browser.storage.session).
   * Must implement 'get' and 'set' methods.
   */
  constructor(storage) {
    // Ensure the provided storage object is valid and has the necessary methods.
    if (!storage || typeof storage.get !== 'function' || typeof storage.set !== 'function') {
      throw new Error("Invalid storage object provided. Must implement get and set methods.");
    }
    this.#storageType = storage;
  }

  /**
   * Retrieves an item or items from storage.
   * Corresponds to browser.storage.get().
   * @param {string | string[] | object | null} keys - A key, array of keys, or object to retrieve.
   * @returns {Promise<object>} A promise that resolves with an object containing the retrieved items.
   */
  get(keys) {
    return this.#storageType.get(keys);
  }

  /**
   * Stores an item or items in storage.
   * Corresponds to browser.storage.set().
   * @param {object} items - An object where keys are item names and values are their content.
   * @returns {Promise<void>} A promise that resolves when the operation is complete, or rejects on error.
   */
  set(items) {
    return this.#storageType.set(items);
  }
}

/**
 * Manages storage specific to the Vault extension, such as URL, username, and token.
 * It uses the browser.storage.session API.
 */
export class VaultStorage extends Storage {
  /** * Storage key for the Vault URL.
   * @private
   * @type {string}
   */
  static #KEY_URL = 'url';

  /** * Storage key for the username.
   * @private
   * @type {string}
   */
  static #KEY_USERNAME = 'username';

  /** * Storage key for the authentication token.
   * @private
   * @type {string}
   */
  static #KEY_TOKEN = 'token';

  /**
   * Retrieves the Vault URL from session storage.
   * @returns {Promise<string | undefined>} The Vault URL, or undefined if not set.
   */
  async getUrl() {
    // browser.storage.get returns an object like { url: 'the_url' }
    const result = await this.get(VaultStorage.#KEY_URL);

    // Use optional chaining in case result is unexpectedly not an object.
    return result?.[VaultStorage.#KEY_URL];
  }

  /**
   * Sets the Vault URL in session storage.
   * @param {string} value - The Vault URL to store.
   * @returns {Promise<void>} A promise that resolves when the URL is set.
   */
  async setUrl(value) {
    return this.set({ [VaultStorage.#KEY_URL]: value });
  }

  /**
   * Retrieves the username from session storage.
   * @returns {Promise<string | undefined>} The username, or undefined if not set.
   */
  async getUsername() {
    const result = await this.get(VaultStorage.#KEY_USERNAME);

    return result?.[VaultStorage.#KEY_USERNAME];
  }

  /**
   * Sets the username in session storage.
   * @param {string} value - The username to store.
   * @returns {Promise<void>} A promise that resolves when the username is set.
   */
  async setUsername(value) {
    return this.set({ [VaultStorage.#KEY_USERNAME]: value });
  }

  /**
   * Retrieves the authentication token object from session storage.
   * The token object typically has properties like 'client_token' and 'expire_date'.
   * @returns {Promise<object | undefined>} The token object, or undefined if not set.
   */
  async getToken() {
    const result = await this.get(VaultStorage.#KEY_TOKEN);

    return result?.[VaultStorage.#KEY_TOKEN];
  }

  /**
   * Sets the authentication token object in session storage.
   * @param {object | null} value - The token object to store, or null to effectively clear it.
   * @returns {Promise<void>} A promise that resolves when the token is set.
   */
  async setToken(value) {
    return this.set({ [VaultStorage.#KEY_TOKEN]: value });
  }
}
