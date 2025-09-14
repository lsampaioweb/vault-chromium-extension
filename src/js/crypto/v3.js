import { CryptoProviderBase } from './base.js';

/**
 * Cryptography provider for version 3.
 * This version uses the Web Crypto API with AES-GCM and a salt to derive
 * the key and IV. The final output is Base64 encoded for safe string storage.
 * This is the current standard for all new encryption.
 */
export class VaultCryptov3 extends CryptoProviderBase {

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
  static #ENCRYPT_TAG = 'encrypted';

  /**
   * The prefix tag used to identify V3 encrypted data.
   * @private
   * @static
   * @readonly
   */
  static #ENCRYPT_VERSION = 'v3';

  /**
   * Converts an ArrayBuffer to a Base64 string.
   * @param {ArrayBuffer} buffer - The buffer to convert.
   * @returns {string} The Base64 encoded string.
   * @private
   * @static
   */
  static #arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
  }

  /**
   * Converts a Base64 string back to an ArrayBuffer.
   * @param {string} value - The Base64 string.
   * @returns {ArrayBuffer} The resulting ArrayBuffer.
   * @private
   * @static
   */
  static #base64ToArrayBuffer(value) {
    const binary = window.atob(value);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return buffer;
  }

  /**
   * Adds the V3 encryption tag to a value.
   * @param {string} value - The Base64 value to tag.
   * @returns {string} The tagged value, e.g., "encrypted:v3:..."
   * @private
   * @static
   */
  static #addEncryptTag(value) {
    // encrypted:v3:value
    return `${this.#ENCRYPT_TAG}:${this.#ENCRYPT_VERSION}:${value}`;
  }

  /**
   * Removes the V3 encryption tag from a value.
   * @param {string} value - The tagged value.
   * @returns {string} The untagged value.
   * @private
   * @static
   */
  static #removeEncryptTag(value) {
    return value.replace(`${this.#ENCRYPT_TAG}:${this.#ENCRYPT_VERSION}:`, '');
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
   * Derives the encryption key for V3 using a salt.
   * @param {string} salt - The salt used for key derivation.
   * @param {CryptoKey} [key] - An optional pre-existing key.
   * @returns {Promise<CryptoKey>} The imported crypto key.
   * @private
   * @static
   */
  static async #getKey(salt, key) {
    if (key) {
      return key;
    }
    // Get the subtle crypto interface.
    const subtleCrypto = this.getCryptoSubtle();

    // Use a 256-bit key (32 bytes) for AES-256-GCM.
    const rawKey = this.encode(this.replicateString(salt, 32));

    return await subtleCrypto.importKey(
      'raw',
      rawKey,
      this.#DEFAULT_ALGORITHM,
      true,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Derives the Initialization Vector (IV) for V3 using a salt.
   * @param {string} salt - The salt used for IV derivation.
   * @param {BufferSource} [iv] - An optional pre-existing IV.
   * @returns {Uint8Array} The encoded IV.
   * @private
   * @static
   */
  static #getIv(salt, iv) {
    if (iv) {
      return iv;
    }

    // Keep IV size at 12 bytes for AES-GCM.
    return this.encode(this.replicateString(salt, 12));
  }

  /**
   * Encrypts a value using the V3 method.
   * @override
   * @static
   */
  static async encrypt(value, salt, algorithm, key, iv) {
    algorithm = this.#getAlgorithm(algorithm);
    key = await this.#getKey(salt, key);
    iv = this.#getIv(salt, iv);

    // Get the subtle crypto interface.
    const subtleCrypto = this.getCryptoSubtle();

    const encoded = this.encode(value);

    const encrypted = await subtleCrypto.encrypt(
      { name: algorithm, iv: iv },
      key,
      encoded
    );

    return this.#addEncryptTag(this.#arrayBufferToBase64(encrypted));
  }

  /**
   * Decrypts a value using the V3 method.
   * @override
   * @static
   */
  static async decrypt(value, salt, algorithm, key, iv) {
    algorithm = this.#getAlgorithm(algorithm);
    key = await this.#getKey(salt, key);
    iv = this.#getIv(salt, iv);

    // Get the subtle crypto interface.
    const subtleCrypto = this.getCryptoSubtle();

    const decrypted = await subtleCrypto.decrypt(
      { name: algorithm, iv: iv },
      key,
      this.#base64ToArrayBuffer(this.#removeEncryptTag(value))
    );

    return this.decode(decrypted);
  }
}
