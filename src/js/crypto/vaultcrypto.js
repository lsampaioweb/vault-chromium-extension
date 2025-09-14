import { I18n } from '../core/i18n.js';
import { VaultCryptov1 } from './v1.js';
import { VaultCryptov2 } from './v2.js';
import { VaultCryptov3 } from './v3.js';

/**
 * Main cryptography dispatcher class.
 * This class determines the encryption version of a given value and
 * delegates the encrypt/decrypt operation to the appropriate versioned provider.
 */
export class VaultCrypto {

  /**
   * Defines the prefix tag for encrypted values.
   * @private
   * @static
   * @readonly
   */
  static #ENCRYPT_TAG = 'encrypted';

  /**
   * Defines the different encryption versions the system can handle.
   * @private
   * @static
   * @readonly
   */
  static #EncryptionVersion = {
    V1: 'v1', // Plain text.
    V2: 'v2', // encrypted:binary data.
    V3: 'v3', // encrypted:v3:base64 data.
  };

  /**
   * Internationalization keys used by the Crypto dispatcher.
   * @private
   * @static
   * @readonly
   */
  static #i18nKeys = {
    CRYPTO_NULL_VALUE: 'error_crypto_null_value',
    CRYPTO_UNSUPPORTED_VERSION: 'error_crypto_unsupported_version',
    CRYPTO_ENCRYPTION_FAILED: 'error_crypto_encryption_failed',
    CRYPTO_DECRYPTION_FAILED: 'error_crypto_decryption_failed'
  };

  /**
   * Determines the encryption version of a given string value based on its prefix.
   * @param {string} value - The value to check.
   * @returns {string} The detected version ('v1', 'v2', or 'v3').
   * @private
   * @static
   */
  static #getEncryptVersion(value) {
    if (!value) {
      throw new Error(I18n.getMessage(this.#i18nKeys.CRYPTO_NULL_VALUE));
    }

    switch (true) {
      case value.startsWith(`${this.#ENCRYPT_TAG}:v3:`):
        return this.#EncryptionVersion.V3;

      case value.startsWith(`${this.#ENCRYPT_TAG}:`):
        return this.#EncryptionVersion.V2;

      default:
        return this.#EncryptionVersion.V1;
    }
  }

  /**
   * Encrypts a value using the latest (V3) encryption standard.
   * @param {string} value - The plaintext value to encrypt.
   * @param {string} salt - The salt for deriving the key and IV.
   * @param {string} [algorithm] - Optional algorithm, defaults to AES-GCM.
   * @param {CryptoKey} [key] - Optional pre-existing key.
   * @param {Uint8Array} [iv] - Optional initialization vector.
   * @returns {Promise<string>} A promise that resolves with the encrypted string.
   * @throws {Error} If encryption fails.
   * @static
   */
  static async encrypt(value, salt, algorithm, key, iv) {
    try {
      return await VaultCryptov3.encrypt(value, salt, algorithm, key, iv);

      // Not used anymore.
      // return await VaultCryptov2.encrypt(value, algorithm, key, iv);

      // Not used anymore.
      // return VaultCryptov1.encrypt(value);
    } catch (error) {
      throw new Error(I18n.getMessage(this.#i18nKeys.CRYPTO_ENCRYPTION_FAILED));
    }
  }

  /**
   * Decrypts a value by dispatching to the correct versioned crypto provider.
   * @param {string} value - The value to decrypt (can be plaintext or any supported encrypted format).
   * @param {string} salt - The salt for deriving the key and IV (used for V3).
   * @param {string} [algorithm] - Optional algorithm, defaults to AES-GCM.
   * @param {CryptoKey} [key] - Optional pre-existing key.
   * @param {Uint8Array} [iv] - Optional initialization vector.
   * @returns {Promise<string>} A promise that resolves with the decrypted plaintext string.
   * @throws {Error} If decryption fails.
   * @static
   */
  static async decrypt(value, salt, algorithm, key, iv) {
    try {
      const encryptVersion = this.#getEncryptVersion(value);

      switch (encryptVersion) {
        case this.#EncryptionVersion.V3:
          return await VaultCryptov3.decrypt(value, salt, algorithm, key, iv);

        case this.#EncryptionVersion.V2:
          return await VaultCryptov2.decrypt(value, algorithm, key, iv);

        case this.#EncryptionVersion.V1:
          return VaultCryptov1.decrypt(value);

        default:
          throw new Error(I18n.getMessage(this.#i18nKeys.CRYPTO_UNSUPPORTED_VERSION, [encryptVersion]));
      }
    } catch (error) {
      throw new Error(I18n.getMessage(this.#i18nKeys.CRYPTO_DECRYPTION_FAILED));
    }
  }
}
