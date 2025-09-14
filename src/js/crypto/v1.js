import { CryptoProviderBase } from './base.js';

/**
 * Cryptography provider for version 1 (plaintext).
 * This version provides no actual encryption and is used for backward compatibility
 * with secrets that were stored before encryption was implemented.
 */
export class VaultCryptov1 extends CryptoProviderBase {

  /**
   * "Encrypts" a value by returning it unchanged.
   * @param {string} value - The plaintext value.
   * @returns {string} The original, unchanged value.
   * @override
   * @static
   */
  static encrypt(value) {
    return value;
  }

  /**
   * "Decrypts" a value by returning it unchanged.
   * @param {string} value - The plaintext value.
   * @returns {string} The original, unchanged value.
   * @override
   * @static
   */
  static decrypt(value) {
    return value;
  }
}
