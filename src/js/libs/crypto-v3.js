export class Cryptov3 {
  static #DEFAULT_ALGORITHM = 'AES-GCM';
  static #ENCRYPT_TAG = 'encrypted';
  static #ENCRYPT_VERSION = 'v3';

  static #encode(value) {
    return new TextEncoder().encode(value);
  }

  static #decode(value) {
    return new TextDecoder().decode(value);
  }

  static #arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
  }

  static #base64ToArrayBuffer(value) {
    const binary = window.atob(value);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return buffer;
  }

  static #replicateString(value, length) {
    let stringToReturn = '';
    let stringIndex = 0;

    for (let i = 0; i < length; i++) {
      if (stringIndex == value.length) {
        stringIndex = 0;
      }

      stringToReturn = stringToReturn + value.charAt(stringIndex++);
    }

    return stringToReturn;
  }

  static #addEncryptTag(value) {
    // encrypted:v3:value
    return `${this.#ENCRYPT_TAG}:${this.#ENCRYPT_VERSION}:${value}`;
  }

  static #hasEncryptTag(value) {
    return value.toLowerCase().startsWith(`${this.#ENCRYPT_TAG}:`);
  }

  static #removeEncryptTag(value) {
    return value.replace(`${this.#ENCRYPT_TAG}:${this.#ENCRYPT_VERSION}:`, '');
  }

  static #getAlgorithm(algorithm) {
    return algorithm || this.#DEFAULT_ALGORITHM;
  }

  static async #getKey(salt, key) {
    if (key) {
      return key;
    }

    // Use a 256-bit key (32 bytes) for AES-256-GCM.
    const rawKey = this.#encode(this.#replicateString(salt, 32));

    return await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      this.#DEFAULT_ALGORITHM,
      true,
      ['encrypt', 'decrypt'],
    );
  }

  static #getIv(salt, iv) {
    if (iv) {
      return iv;
    }

    // Keep IV size at 12 bytes for AES-GCM.
    return this.#encode(this.#replicateString(salt, 12));
  }

  static async encrypt(value, salt, algorithm, key, iv) {
    const encoded = this.#encode(value);

    algorithm = this.#getAlgorithm(algorithm);
    key = await this.#getKey(salt, key);
    iv = this.#getIv(salt, iv);

    const encrypted = await window.crypto.subtle.encrypt(
      { name: algorithm, iv: iv },
      key,
      encoded
    );

    return this.#addEncryptTag(this.#arrayBufferToBase64(encrypted));
  }

  static async decrypt(value, salt, algorithm, key, iv) {
    if (!this.#hasEncryptTag(value)) {
      // The password is in the old format. PLAINTEXT.
      return value;
    }

    algorithm = this.#getAlgorithm(algorithm);
    key = await this.#getKey(salt, key);
    iv = this.#getIv(salt, iv);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: algorithm, iv: iv },
      key,
      this.#base64ToArrayBuffer(this.#removeEncryptTag(value))
    );

    return this.#decode(decrypted);
  }
}
