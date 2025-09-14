import { PATH_SEPARATOR } from '../core/constants.js';
import { I18n } from '../core/i18n.js';

/**
 * A collection of stateless, static utility methods for the Vault library,
 * covering logic for paths, names, sorting, and matching.
 */
export class VaultUtils {

  /**
   * Internationalization keys used by VaultUtils.
   * @private
   * @static
   * @readonly
   */
  static #i18nKeys = {
    VAULT_INVALID_TOKEN_DETAILS: 'error_vault_token_date_invalid',
    CONFIG_SECRET_PERSONAL_ENGINES: 'config_secret_personal_engines'
  };

  /**
   * Checks if a given Vault token object is valid (exists and not expired).
   * Assumes the token object has an 'expire_date' property.
   * @param {object | null} token - The token object to validate.
   * @param {string} token.expire_date - The UTC string representation of the token's expiration date.
   * @returns {boolean} True if the token is valid, false otherwise.
   * @static
   */
  static isTokenValid(token) {
    if (token && token.expire_date) {
      const expireDate = new Date(token.expire_date);

      // Check if expireDate is a valid date, as new Date(undefined) or new Date(null) can be "Invalid Date".
      if (isNaN(expireDate.getTime())) {
        throw new Error(I18n.getMessage(VaultUtils.#i18nKeys.VAULT_INVALID_TOKEN_DETAILS, [token.expire_date]));
      }

      return expireDate >= new Date();
    }
    return false;
  }

  /**
   * Constructs the full canonical path for a secret or path within Vault.
   * @param {string} engineName - The name of the engine.
   * @param {string[]} subkeys - An array of sub-path segments.
   * @returns {string} The full, normalized path string.
   * @static
   */
  static getSecretFullPath(engineName, subkeys) {
    // Ensure subkeys is an array, even if empty or null.
    const validSubkeys = Array.isArray(subkeys) ? subkeys : [];

    // Concatenate the engine name with the subkeys.
    const pathParts = [engineName, ...validSubkeys];

    // Filter out any null, undefined, or empty string segments before joining, although typically subkeys should be clean.
    const cleanPathParts = pathParts.filter(part => part && typeof part === 'string' && part.trim() !== '');

    return VaultUtils.removeDoubleSlash(cleanPathParts.join(PATH_SEPARATOR));
  }

  /**
   * Constructs an array of subkeys from a given path and secret name.
   * If a path is provided, splits the path by the PATH_SEPARATOR and appends the secret name.
   * If no path is provided, returns an array containing only the secret name.
   *
   * @param {string} path - The path string to split into subkeys.
   * @param {string} secretName - The name of the secret to append.
   * @returns {string[]} An array of subkeys derived from the path and secret name.
   */
  static getSubKeys(path, secretName) {
    return (path) ? path.split(PATH_SEPARATOR).concat([secretName]) : [secretName];
  }

  /**
   * Merges multiple plain objects into a single new object.
   * @param {Array<object>} arrayOfObjects - An array of objects to merge.
   * @returns {object} A single merged object.
   * @static
   */
  static mergeObjects(arrayOfObjects) {
    return Object.assign({}, ...arrayOfObjects);
  }

  /**
   * Removes consecutive slashes from a URL string, leaving single slashes.
   * @param {string} url - The URL string to process.
   * @returns {string} The normalized URL string.
   * @static
   */
  static removeDoubleSlash(url) {
    return url.replace(/([^:])(\/\/+)/g, '$1/');
  }

  /**
   * Prepares the request body for adding/updating a secret.
   * @param {object} engine - The engine object, containing options like version.
   * @param {object} data - The secret data (key-value pairs) to be stored.
   * @returns {string} The stringified JSON request body.
   * @static
   */
  static prepareBody(engine, data) {
    if (engine?.options?.version === '2') {
      // KVv2 expects data to be wrapped in a "data" field within the request body.
      return JSON.stringify({ data });
    } else {
      // KVv1 expects the data directly as the request body.
      return JSON.stringify(data);
    }
  }

  /**
   * Extracts the parent path from an array of path segments.
   * Example: (['path1', 'path2', 'secretName']) -> "path1/path2"
   * @param {string[]} pathSegments - An array of path segments.
   * @returns {string} The joined parent path, or an empty string if there is no parent.
   * @static
   */
  static extractPath(pathSegments) {
    if (!pathSegments || pathSegments.length <= 1) {
      // No parent path if 0 or 1 segment
      return '';
    }
    // Joins all segments except the last one.
    return pathSegments.slice(0, -1).join(PATH_SEPARATOR);
  }

  /**
   * Extracts the name (last segment) from an array of path segments.
   * Example: (['path1', 'path2', 'secretName']) -> "secretName"
   * @param {string[]} pathSegments - An array of path segments.
   * @returns {string} The last segment (name), or an empty string if input is empty.
   * @static
   */
  static extractName(pathSegments) {
    if (!pathSegments || pathSegments.length === 0) {
      return '';
    }
    // Returns the last element.
    return pathSegments[pathSegments.length - 1];
  }

  /**
   * Checks if a given secret key represents a folder/sub-path.
   * In Vault, folders typically end with a separator character.
   * @param {string} secretKey - The secret key or path string to check.
   * @returns {boolean} True if the key represents a folder.
   * @static
   */
  static isSecretAFolder(secretKey) {
    if (!secretKey) {
      return false;
    }

    // Check if the secretKey ends with the defined PATH_SEPARATOR.
    return secretKey.endsWith(PATH_SEPARATOR);
  }

  /**
   * Checks if a given engine name corresponds to a personal engine type.
   * Personal engine names are configured in an i18n message.
   * @param {string} engineName - The name of the engine to check.
   * @returns {boolean} True if the engine is considered personal.
   * @static
   */
  static isPersonalEngine(engineName) {
    if (!engineName) return false;

    // Retrieve the personal engines string from i18n messages.
    const personalEnginesString = I18n.getMessage(VaultUtils.#i18nKeys.CONFIG_SECRET_PERSONAL_ENGINES);

    // Split the string by comma, then trim whitespace from each part.
    const personalEngines = personalEnginesString.split(',').map(e => e.trim().toLowerCase());

    // Remove any empty strings that might result from trailing commas or multiple commas.
    const validPersonalEngines = personalEngines.filter(e => e.length > 0);

    if (validPersonalEngines.length > 0) {
      const lowerEngineName = engineName.toLowerCase();

      for (const currentElement of validPersonalEngines) {
        // Check if the engine name matches a configured personal engine name.
        if (lowerEngineName === currentElement) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Checks if a secret name/key matches any of the provided search terms.
   * @param {string | string[]} searchTermsInput - A single search term or an array of terms.
   * @param {string} secretName - The name of the secret to check.
   * @returns {boolean} True if a match is found or if no valid search terms are provided.
   * @static
   */
  static textMatchWithSecret(searchTermsInput, secretName) {
    // Normalize searchTermsInput to be an array.
    const searchTermsArray = Array.isArray(searchTermsInput) ? searchTermsInput : [searchTermsInput];

    // Check if there are any actual, non-falsy search terms.
    // .every(term => !term) checks if all terms are falsy (e.g., '', null, undefined).
    if (!searchTermsArray ||
      searchTermsArray.length === 0 ||
      searchTermsArray.every(term => !term)) {
      // If no valid search terms are provided, consider it a match (no filter is applied).
      return true;
    }

    if (!secretName) {
      // Cannot match against a null/empty secretName if there are search terms.
      return false;
    }

    const lowerSecretName = secretName.toLowerCase();

    for (const term of searchTermsArray) {
      // Only attempt to match if the term is a non-empty string.
      if (term && typeof term === 'string' && term.trim() !== '') {
        if (lowerSecretName.includes(term.toLowerCase())) {
          // Found a match.
          return true;
        }
      }
    }

    // No match found.
    return false;
  }

  /**
   * Sorts an array of engine objects. Personal engines are listed first.
   * @param {Array<object>} engines - The array of engine objects to sort.
   * @returns {Array<object>} The sorted array.
   * @static
   */
  static sortEngines(engines) {
    return engines.sort(VaultUtils.compareEngines);
  }

  /**
   * Comparator function for sorting two engine objects.
   * Prioritizes personal engines, then sorts by name.
   * @param {object} a - The first engine object.
   * @param {object} b - The second engine object.
   * @returns {number} -1 if a < b, 1 if a > b, 0 if a === b (for sort order).
     * @static
   */
  static compareEngines(a, b) {
    if (a.isPersonal && !b.isPersonal) {
      return -1;
    }
    if (!a.isPersonal && b.isPersonal) {
      return 1;
    }
    // If both are personal or neither is, sort by name.
    return a.name.localeCompare(b.name);
  }

  /**
   * Sorts an array of secret objects based on a defined priority:
   * 1. Secrets whose names exactly match the primary search term.
   * 2. Personal secrets before non-personal secrets.
   * 3. Alphabetically by full name.
   * @param {Array<object>} secrets - The array of secret objects to sort.
   * @param {string | string[]} text - The original search text or array of search terms.
   * The first term is used for exact match prioritization.
   * @returns {Array<object>} The sorted array of secret objects.
   * @static
   */
  static sortSecrets(secrets, text) {
    // Use the first search term for exact match prioritization, converting to lowercase.
    // If 'text' is not an array or is empty, searchText will be an empty string.
    // Ensure text[0] is treated as a string.
    const searchText = Array.isArray(text) && text.length > 0 && text[0]
      ? String(text[0]).toLowerCase()
      : '';

    return secrets.sort((a, b) => VaultUtils.compareSecrets(a, b, searchText));
  }

  /**
    * Comparator function for sorting two secret objects (a, b).
    * Implements a multi-level sorting logic.
    * @param {object} a - The first secret object.
    * @param {object} b - The second secret object.
    * @param {string} searchText - The primary search term (lowercase) for exact match prioritization.
    * @returns {number} -1 if a < b, 1 if a > b, 0 if a === b (for sort order).
    * @static
    */
  static compareSecrets(a, b, searchText) {
    // Prioritize secrets that exactly match the searchText.
    const isAEqual = VaultUtils.isEqual(a, searchText);
    const isBEqual = VaultUtils.isEqual(b, searchText);

    if (isAEqual && !isBEqual) {
      return -1; // 'a' comes before 'b'.
    }
    if (!isAEqual && isBEqual) {
      return 1; // 'b' comes before 'a'.
    }

    // Next, prioritize personal secrets.
    if (a.isPersonal && !b.isPersonal) {
      return -1; // Personal 'a' comes before non-personal 'b'.
    }
    if (!a.isPersonal && b.isPersonal) {
      return 1; // Non-personal 'a' comes after personal 'b'.
    }

    // Finally, sort alphabetically by the full name of the secret.
    // Ensure fullName exists and is a string for robust comparison.
    const fullNameA = typeof a.fullName === 'string' ? a.fullName : '';
    const fullNameB = typeof b.fullName === 'string' ? b.fullName : '';

    // Use localeCompare for case-insensitive alphabetical sorting.
    return fullNameA.localeCompare(fullNameB);
  }

  /**
   * Checks if a secret's name exactly matches the given search text (case-insensitive).
   * @param {object} secret - The secret object, expected to have a 'name' property.
   * @param {string} searchText - The search text to compare against (expected to be lowercase).
   * @returns {boolean} True if the secret's name matches the searchText, false otherwise.
   * @static
   */
  static isEqual(secret, searchText) {
    // If searchText is empty, no secret name can be "equal" to it for prioritization.
    if (!searchText) {
      return false;
    }
    // Ensure secret.name exists and is a string before calling toLowerCase.
    const secretName = (typeof secret?.name === 'string') ? secret.name.toLowerCase() : '';

    return secretName === searchText;
  }

}
