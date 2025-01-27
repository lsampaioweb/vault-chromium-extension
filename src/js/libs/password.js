import { I18n } from '../common.js';

export class Password {
  /**
   * Generates a random password.
   * @param {Object} options - Configuration for password generation.
   * @param {boolean} [options.useNumbers=true] - Include numbers in the password.
   * @param {boolean} [options.useLowercase=true] - Include lowercase letters.
   * @param {boolean} [options.useUppercase=true] - Include uppercase letters.
   * @param {boolean} [options.useSpecialCharacters=true] - Include special characters.
   * @param {number} [options.size=20] - Length of the password.
   * @returns {string} - The generated password.
   */
  static generate({
    useNumbers = true,
    useLowercase = true,
    useUppercase = true,
    useSpecialCharacters = true,
    size = 20,
  } = {}) {
    const crypto = window.crypto || window.msCrypto;

    if (typeof crypto === 'undefined') {
      throw new Error(I18n.getMessage('window_crypto_undefined'));
    }

    // Build charset based on the options.
    let charset = '';
    if (useNumbers) charset += '0123456789';
    if (useLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useSpecialCharacters) charset += '!@#$%&*';

    if (!charset) {
      throw new Error(I18n.getMessage('password_generator_at_least_one_option_must_be_selected'));
    }

    // Generate the password.
    const indexes = crypto.getRandomValues(new Uint32Array(size));

    return Array.from(indexes, index => charset[index % charset.length]).join('');
  }
}
