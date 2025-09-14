import { CryptoProviderBase } from './base.js';

/**
 * Cryptography provider for version 2.
 * This version uses the Web Crypto API with AES-GCM but has some legacy
 * binary-to-string conversions for compatibility.
 * NOTE: This version is for decryption only and should not be used for new encryption.
 */
export class VaultCryptov2 extends CryptoProviderBase {

  /**
   * Defines the default algorithm for this crypto version.
   * @private
   * @static
   * @readonly
   */
  static #DEFAULT_ALGORITHM = 'AES-GCM';

  /**
   * A hardcoded keyword used for deriving the key and IV.
   * @private
   * @static
   * @readonly
   */
  static #ALGORITHM_KEYWORD = 'QwErTy';

  /**
   * The prefix tag used to identify V2 encrypted data.
   * @private
   * @static
   * @readonly
   */
  static #ENCRYPT_TAG = 'encrypted';

  /**
   * Converts an ArrayBuffer to a binary string. (Legacy method for V2)
   * @param {ArrayBuffer} buffer - The buffer to convert.
   * @returns {string} The resulting binary string.
   * @private
   * @static
   */
  static #arrayBufferToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }

  /**
   * Converts a binary string back to an ArrayBuffer. (Legacy method for V2)
   * @param {string} value - The binary string.
   * @returns {ArrayBuffer} The resulting ArrayBuffer.
   * @private
   * @static
   */
  static #stringToArrayBuffer(value) {
    const buffer = new ArrayBuffer(value.length);
    const bufView = new Uint8Array(buffer);

    for (let i = 0; i < value.length; i++) {
      bufView[i] = value.charCodeAt(i);
    }

    return buffer;
  }

  /**
   * Adds the V2 encryption tag to a value.
   * @param {string} value - The value to tag.
   * @returns {string} The tagged value.
   * @private
   * @static
   */
  static #addEncryptTag(value) {
    // encrypted:value
    return `${this.#ENCRYPT_TAG}:${value}`;
  }

  /**
   * Removes the V2 encryption tag from a value.
   * @param {string} value - The tagged value.
   * @returns {string} The untagged value.
   * @private
   * @static
   */
  static #removeEncryptTag(value) {
    return value.replace(`${this.#ENCRYPT_TAG}:`, '');
  }

  /**
   * Gets the algorithm, using a default if not provided.
   * @param {string} algorithm - The algorithm name.
   * @returns {string} The validated algorithm name.
   * @private
   * @static
   */
  static #getAlgorithm(algorithm) {
    return algorithm || this.#DEFAULT_ALGORITHM;
  }

  /**
   * Derives the encryption key for V2.
   * @param {CryptoKey} [key] - An optional pre-existing key.
   * @returns {Promise<CryptoKey>} The imported crypto key.
   * @private
   * @static
   */
  static async #getKey(key) {
    if (key) {
      return key;
    }

    // Get the subtle crypto interface.
    const subtleCrypto = this.getCryptoSubtle();

    // Use a 256-bit key (16 bytes) for AES-256-GCM.
    const rawKey = this.encode(this.replicateString(this.#ALGORITHM_KEYWORD, 16));

    return await subtleCrypto.importKey(
      'raw',
      rawKey,
      this.#DEFAULT_ALGORITHM,
      true,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Derives the Initialization Vector (IV) for V2.
   * @param {BufferSource} [iv] - An optional pre-existing IV.
   * @returns {Uint8Array} The encoded IV.
   * @private
   * @static
   */
  static #getIv(iv) {
    if (iv) {
      return iv;
    }

    // Keep IV size at 12 bytes for AES-GCM.
    return this.encode(this.replicateString(this.#ALGORITHM_KEYWORD, 12));
  }

  /**
   * Encrypts a value using the V2 method.
   * @override
   * @static
   */
  static async encrypt(value, algorithm, key, iv) {
    algorithm = this.#getAlgorithm(algorithm);
    key = await this.#getKey(key);
    iv = this.#getIv(iv);

    // Get the subtle crypto interface.
    const subtleCrypto = this.getCryptoSubtle();
    const encoded = this.encode(value);

    const encrypted = await subtleCrypto.encrypt(
      { name: algorithm, iv: iv },
      key,
      encoded
    );

    return this.#addEncryptTag(this.#arrayBufferToString(encrypted));
  }

  /**
   * Decrypts a value using the V2 method.
   * @override
   * @static
   */
  static async decrypt(value, algorithm, key, iv) {
    algorithm = this.#getAlgorithm(algorithm);
    key = await this.#getKey(key);
    iv = this.#getIv(iv);

    // Get the subtle crypto interface.
    const subtleCrypto = this.getCryptoSubtle();

    const decrypted = await subtleCrypto.decrypt(
      { name: algorithm, iv: iv },
      key,
      this.#stringToArrayBuffer(this.#removeEncryptTag(value))
    );

    return this.decode(decrypted);
  }
}
