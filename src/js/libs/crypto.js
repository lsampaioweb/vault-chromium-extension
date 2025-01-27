import { I18n } from '../common.js';
import { Cryptov1 } from './crypto-v1.js';
import { Cryptov2 } from './crypto-v2.js';
import { Cryptov3 } from './crypto-v3.js';

export class Crypto {
  static #ENCRYPT_TAG = 'encrypted';

  static #EncryptionVersion = {
    V1: 'v1', // Plain text
    V2: 'v2', // encrypted:binary data
    V3: 'v3', // encrypted:v3:base64 data
  };

  static #getEncryptVersion(value) {
    if (!value) {
      throw new Error(I18n.getMessage('encryptedValueCannotBeNull'));
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

  static async encrypt(value, salt, algorithm, key, iv) {
    try {
      return await Cryptov3.encrypt(value, salt, algorithm, key, iv);

      // Not used anymore.
      // return await Cryptov2.encrypt(value, algorithm, key, iv);

      // Not used anymore.
      // return Cryptov1.encrypt(value);
    } catch (error) {
      throw new Error(I18n.getMessage('encryption_error'));
    }
  }

  static async decrypt(value, salt, algorithm, key, iv) {
    try {
      const encryptVersion = this.#getEncryptVersion(value);

      switch (encryptVersion) {
        case this.#EncryptionVersion.V3:
          return await Cryptov3.decrypt(value, salt, algorithm, key, iv);

        case this.#EncryptionVersion.V2:
          return await Cryptov2.decrypt(value, algorithm, key, iv);

        case this.#EncryptionVersion.V1:
          return Cryptov1.decrypt(value);

        default:
          throw new Error(I18n.getMessage('encryptedVersionIsNotSupported', [encryptVersion]));
      }
    } catch (error) {
      throw new Error(I18n.getMessage('decryption_error'));
    }
  }
}
