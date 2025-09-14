import { I18n } from '../core/i18n.js';

/**
 * A base class for cryptography providers.
 * It provides shared utility methods and defines the contract (encrypt, decrypt)
 * that all subclasses must implement.
 * This class is not meant to be used directly.
 */
export class CryptoProviderBase {

  /**
   * Internationalization keys used by this base class.
   * @private
   * @static
   * @readonly
   */
  static #i18nKeys = {
    CRYPTO_NOT_SUPPORTED: 'error_crypto_not_supported',
    METHOD_NOT_IMPLEMENTED: 'error_crypto_method_not_implemented'
  };

  /**
   * Retrieves the browser's native Crypto API object.
   * @returns {SubtleCrypto} The SubtleCrypto interface.
   * @throws {Error} If the Crypto API is not available.
   * @protected
   * @static
   */
  static getCryptoSubtle() {
    const crypto = window.crypto || window.msCrypto;

    if (typeof crypto?.subtle === 'undefined') {
      throw new Error(I18n.getMessage(this.#i18nKeys.CRYPTO_NOT_SUPPORTED));
    }

    return crypto.subtle;
  }

  /**
   * Encodes a string into a Uint8Array.
   * @param {string} value - The string to encode.
   * @returns {Uint8Array} The encoded data.
   * @protected
   * @static
   */
  static encode(value) {
    return new TextEncoder().encode(value);
  }

  /**
   * Decodes a Uint8Array into a string.
   * @param {BufferSource} value - The buffer to decode.
   * @returns {string} The decoded string.
   * @protected
   * @static
   */
  static decode(value) {
    return new TextDecoder().decode(value);
  }

  /**
   * Replicates a string to a specific length.
   * @param {string} value - The string to replicate.
   * @param {number} length - The desired final length.
   * @returns {string} The replicated string.
   * @protected
   * @static
   */
  static replicateString(value, length) {
    let stringToReturn = '';
    let stringIndex = 0;

    for (let i = 0; i < length; i++) {
      if (stringIndex === value.length) {
        stringIndex = 0;
      }
      stringToReturn += value.charAt(stringIndex++);
    }
    return stringToReturn;
  }

  /**
   * Abstract-like method for encryption. Subclasses must override this.
   * @throws {Error} If not implemented by a subclass.
   * @static
   */
  static async encrypt() {
    throw new Error(I18n.getMessage(this.#i18nKeys.METHOD_NOT_IMPLEMENTED, ['encrypt']));
  }

  /**
   * Abstract-like method for decryption. Subclasses must override this.
   * @throws {Error} If not implemented by a subclass.
   * @static
   */
  static async decrypt() {
    throw new Error(I18n.getMessage(this.#i18nKeys.METHOD_NOT_IMPLEMENTED, ['decrypt']));
  }
}
