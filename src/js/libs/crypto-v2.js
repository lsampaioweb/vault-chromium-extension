export class Cryptov2 {
  static #DEFAULT_ALGORITHM = 'AES-GCM';
  static #ALGORITHM_KEYWORD = 'QwErTy';
  static #ENCRYPT_TAG = 'encrypted';

  static #encode(value) {
    return new TextEncoder().encode(value);
  }

  static #decode(value) {
    return new TextDecoder().decode(value);
  }

  static #arrayBufferToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }

  static #stringToArrayBuffer(value) {
    const buffer = new ArrayBuffer(value.length);
    const bufView = new Uint8Array(buffer);

    for (let i = 0; i < value.length; i++) {
      bufView[i] = value.charCodeAt(i);
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
    // encrypted:value
    return `${this.#ENCRYPT_TAG}:${value}`;
  }

  static #hasEncryptTag(value) {
    return value.toLowerCase().startsWith(`${this.#ENCRYPT_TAG}:`);
  }

  static #removeEncryptTag(value) {
    return value.replace(`${this.#ENCRYPT_TAG}:`, '');
  }

  static #getAlgorithm(algorithm) {
    return algorithm || this.#DEFAULT_ALGORITHM;
  }

  static async #getKey(key) {
    if (key) {
      return key;
    }

    // Use a 256-bit key (16 bytes) for AES-256-GCM.
    const rawKey = this.#encode(this.#replicateString(this.#ALGORITHM_KEYWORD, 16));

    return await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      this.#DEFAULT_ALGORITHM,
      true,
      ['encrypt', 'decrypt'],
    );
  }

  static #getIv(iv) {
    if (iv) {
      return iv;
    }

    // Keep IV size at 12 bytes for AES-GCM.
    return this.#encode(this.#replicateString(this.#ALGORITHM_KEYWORD, 12));
  }

  static async encrypt(value, algorithm, key, iv) {
    const encoded = this.#encode(value);

    algorithm = this.#getAlgorithm(algorithm);
    key = await this.#getKey(key);
    iv = this.#getIv(iv);

    const encrypted = await window.crypto.subtle.encrypt(
      { name: algorithm, iv: iv },
      key,
      encoded
    );

    return this.#addEncryptTag(this.#arrayBufferToString(encrypted));
  }

  static async decrypt(value, algorithm, key, iv) {
    if (!this.#hasEncryptTag(value)) {
      // The password is in the old format. PLAINTEXT.
      return value;
    }

    algorithm = this.#getAlgorithm(algorithm);
    key = await this.#getKey(key);
    iv = this.#getIv(iv);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: algorithm, iv: iv },
      key,
      this.#stringToArrayBuffer(this.#removeEncryptTag(value))
    );

    return this.#decode(decrypted);
  }
}
