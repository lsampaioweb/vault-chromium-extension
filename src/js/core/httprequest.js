import { I18n } from './i18n.js';

/**
 * A base class for making HTTP requests using the fetch API.
 * It provides common HTTP methods and basic error handling for network issues.
 */
export class HttpRequest {
  /**
   * An enumeration of standard HTTP request methods used by the class.
   * The 'LIST' method is specific to the HashiCorp Vault API.
   * @private
   * @readonly
   * @enum {string}
   */
  #RequestMethod = {
    GET: 'GET',
    LIST: 'LIST',
    POST: 'POST',
    DELETE: 'DELETE',
    PATCH: 'PATCH'
  };

  /**
   * A map of internationalization (i18n) keys for error messages.
   * This ensures that user-facing errors can be localized.
   * @private
   * @readonly
   * @property {string} INVALID_ENDPOINT - Error message for an invalid URL.
   * @property {string} HTTP_REQUEST_ERROR - Error message for a failed network request.
   */
  #i18nKeys = {
    INVALID_ENDPOINT: 'error_api_invalid_endpoint',
    HTTP_REQUEST_ERROR: 'error_api_request_failed'
  };

  /**
   * Performs an HTTP GET request.
   * @param {string} endpoint - The URL to send the request to.
   * @param {HeadersInit | null} [headers=null] - Request headers.
   * @returns {Promise<Response>} A promise that resolves with the Fetch API Response object.
   * @throws {Error} If a network error occurs.
   */
  get(endpoint, headers = null) {
    return this.#request(this.#RequestMethod.GET, endpoint, headers);
  }

  /**
   * Performs a Vault API LIST request (which is an HTTP request with method 'LIST').
   * Used for listing secrets or paths in HashiCorp Vault.
   * @param {string} endpoint - The URL to send the request to.
   * @param {HeadersInit | null} [headers=null] - Request headers, typically including 'X-Vault-Token'.
   * @returns {Promise<Response>} A promise that resolves with the Fetch API Response object.
   * @throws {Error} If a network error occurs.
   */
  list(endpoint, headers = null) {
    return this.#request(this.#RequestMethod.LIST, endpoint, headers);
  }

  /**
   * Performs an HTTP POST request.
   * @param {string} endpoint - The URL to send the request to.
   * @param {HeadersInit | null} [headers=null] - Request headers.
   * @param {BodyInit | null} [body=null] - The request body.
   * @returns {Promise<Response>} A promise that resolves with the Fetch API Response object.
   * @throws {Error} If a network error occurs.
   */
  post(endpoint, headers = null, body = null) {
    return this.#request(this.#RequestMethod.POST, endpoint, headers, body);
  }

  /**
   * Performs an HTTP PATCH request.
   * @param {string} endpoint - The URL to send the request to.
   * @param {HeadersInit | null} [headers=null] - Request headers.
   * @param {BodyInit | null} [body=null] - The request body.
   * @returns {Promise<Response>} A promise that resolves with the Fetch API Response object.
   * @throws {Error} If a network error occurs.
   */
  patch(endpoint, headers = null, body = null) {
    return this.#request(this.#RequestMethod.PATCH, endpoint, headers, body);
  }

  /**
   * Performs an HTTP DELETE request.
   * @param {string} endpoint - The URL to send the request to.
   * @param {HeadersInit | null} [headers=null] - Request headers.
   * @returns {Promise<Response>} A promise that resolves with the Fetch API Response object.
   * @throws {Error} If a network error occurs.
   */
  delete(endpoint, headers = null) {
    return this.#request(this.#RequestMethod.DELETE, endpoint, headers);
  }

  /**
   * Private method to execute the fetch request.
   * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
   * @param {string} endpoint - The URL for the request.
   * @param {HeadersInit | null} [headers=null] - Request headers.
   * @param {BodyInit | null} [body=null] - Request body.
   * @returns {Promise<Response>} A promise that resolves with the Response object.
   * @throws {Error} Localized error if the fetch operation fails due to network issues.
   * @private
   */
  async #request(method, endpoint, headers = null, body = null) {
    // Basic input validation to ensure endpoint is a valid string.
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error(I18n.getMessage(this.#i18nKeys.INVALID_ENDPOINT));
    }

    try {
      // Build fetch options object, automatically excluding null/undefined values.
      // This approach is cleaner than manual deletion and handles edge cases better.
      const options = {
        method,
        // Only include if truthy.
        ...(headers && { headers }),
        // Only include if truthy.
        ...(body && { body })
      };

      const response = await fetch(endpoint, options);

      // Return the raw response object.
      return response;

    } catch (error) {
      // Catch network errors (e.g., DNS, server unreachable).
      const errorMessage = I18n.getMessage(this.#i18nKeys.HTTP_REQUEST_ERROR, [endpoint]);

      throw new Error(errorMessage);
    }
  }
}
