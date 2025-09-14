import { I18n } from './i18n.js';

export class Password {
  /**
   * Character sets used for password generation.
   * @private
   * @readonly
   */
  static #CHARACTER_SETS = {
    NUMBERS: '0123456789',
    LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
    UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    SPECIAL: '!@#$%&*-_'
  };

  /**
   * Password generation constraints.
   * @private
   * @readonly
   */
  static #CONSTRAINTS = {
    DEFAULT_SIZE: 20,
    MIN_SIZE: 1,
    MAX_SIZE: 100
  };

  /**
   * Retrieves the browser's native Crypto API object.
   * @returns {SubtleCrypto} The SubtleCrypto interface.
   * @throws {Error} If the Crypto API is not available.
   * @protected
   * @static
   */
  static getCrypto() {
    const crypto = window.crypto || window.msCrypto;

    if (typeof crypto === 'undefined') {
      throw new Error(I18n.getMessage('error_crypto_not_supported'));
    }

    return crypto;
  }

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
    // This is ES6 destructuring assignment with default values.
    // The function expects an object parameter, and these are the properties
    // it extracts from that object. If no object is passed, it defaults to {}
    // Each property gets a default value if not provided in the object.
    useNumbers = true,
    useLowercase = true,
    useUppercase = true,
    useSpecialCharacters = true,
    size = Password.#CONSTRAINTS.DEFAULT_SIZE,
  } = {}) {
    // Convert size to number if it's a string (common when getting values from HTML inputs).
    const numericSize = typeof size === 'string' ? parseInt(size, 10) : size;

    // Validate size parameter to prevent runtime errors.
    if (!Number.isInteger(numericSize) || numericSize < Password.#CONSTRAINTS.MIN_SIZE || numericSize > Password.#CONSTRAINTS.MAX_SIZE) {
      throw new Error(I18n.getMessage('error_password_generator_size_out_of_range', [Password.#CONSTRAINTS.MIN_SIZE, Password.#CONSTRAINTS.MAX_SIZE]));
    }

    // Get the crypto API.
    const crypto = this.getCrypto();

    // Build charset based on selected options using named character sets.
    let charset = '';
    if (useNumbers) charset += Password.#CHARACTER_SETS.NUMBERS;
    if (useLowercase) charset += Password.#CHARACTER_SETS.LOWERCASE;
    if (useUppercase) charset += Password.#CHARACTER_SETS.UPPERCASE;
    if (useSpecialCharacters) charset += Password.#CHARACTER_SETS.SPECIAL;

    if (!charset) {
      throw new Error(I18n.getMessage('error_password_generator_option_required'));
    }

    // Generate the password using the validated numeric size
    const indexes = crypto.getRandomValues(new Uint32Array(numericSize));

    // Map the generated indexes to characters in the charset.
    return Array.from(indexes, index => charset[index % charset.length]).join('');
  }
}
