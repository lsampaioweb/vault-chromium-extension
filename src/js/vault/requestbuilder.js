import { PATH_SEPARATOR } from '../core/constants.js';
import { VaultUtils } from './utils.js';

/**
 * Constructs request components (endpoints and headers) for the Vault API.
 */
export class VaultRequestBuilder {

  /** @type {string} @private @static @readonly */
  static #VAULT_API_VERSION = 'v1';

  /**
   * The base endpoint URL for the Vault server.
   * @type {string}
   * @private
   */
  #endpoint;

  /**
   * Creates an instance of the VaultRequestBuilder.
   * @param {string} endpoint - The base URL of the Vault server (e.g., "https://vault.example.com").
   */
  constructor(endpoint) {
    this.#endpoint = endpoint;
  }

  /**
   * Creates the standard JSON content-type header.
   * @returns {object} The Content-Type header object.
   */
  getJsonHeader() {
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Creates the Vault token header.
   * @param {object | null} token - The token object.
   * @param {string} [token.client_token] - The client token string.
   * @returns {object} The X-Vault-Token header or an empty object if token is invalid.
   */
  getVaultTokenHeader(token) {
    // Return an empty object if token or client_token is missing to avoid sending a faulty header.
    if (!token || !token.client_token) {
      // Returning an empty header object is safer than sending 'X-Vault-Token': undefined.

      return {};
    }

    return {
      'X-Vault-Token': token.client_token
    };
  }

  /**
   * Creates the X-Vault-Wrap-TTL header for response wrapping.
   * @param {string} ttl - The Time-To-Live string (e.g., "30m", "1h").
   * @returns {object} The X-Vault-Wrap-TTL header.
   */
  getWrappingTTLHeader(ttl) {
    return {
      'X-Vault-Wrap-TTL': ttl
    };
  }

  /**
   * Constructs the base API endpoint URL (e.g., "https://vault.example.com/v1").
   * @returns {string} The base endpoint URL.
   * @private
   */
  #getBaseEndpoint() {
    return `${this.#endpoint}/${VaultRequestBuilder.#VAULT_API_VERSION}`;
  }

  /**
   * Constructs the authentication-related API endpoint root (e.g., ".../v1/auth").
   * @returns {string} The authentication endpoint root.
   * @private
   */
  #getAuthEndpoint() {
    return `${this.#getBaseEndpoint()}/auth`;
  }

  /**
   * Constructs the system-related API endpoint root (e.g., ".../v1/sys").
   * @returns {string} The system endpoint root.
   * @private
   */
  #getSysEndpoint() {
    return `${this.#getBaseEndpoint()}/sys`;
  }

  /**
   * Constructs the wrapping-related API endpoint root (e.g., ".../v1/sys/wrapping").
   * @returns {string} The wrapping endpoint root.
   * @private
   */
  #getWrappingEndpoint() {
    return `${this.#getSysEndpoint()}/wrapping`;
  }

  /**
   * Constructs the token-related API endpoint root (e.g., ".../v1/auth/token").
   * @returns {string} The token endpoint root.
   * @private
   */
  #getTokenEndpoint() {
    return `${this.#getAuthEndpoint()}/token`;
  }

  /**
   * Constructs the final API endpoint for a secret operation (data or metadata).
   * Handles differences for KVv1 and KVv2 engines and URL-encodes
   * secret name segments while preserving folder path segments.
   * @param {object} engine - The engine object (must have 'name' and 'options.version').
   * @param {string[]} subkeys - An array of sub-path segments under the engine.
   * @param {string} [extraPathEngineV2=''] - Specific path part for KVv2 (e.g., 'data', 'metadata').
   * @returns {string} The fully constructed and normalized API endpoint URL.
   * @private
   */
  #getEndpoint(engine, subkeys, extraPathEngineV2 = '') {
    // Starting with the base path for the engine.
    let url = `${this.#getBaseEndpoint()}/${engine.name}`;

    // Append specific KVv2 path if applicable.
    if (engine?.options?.version === '2') {
      url = `${url}/${extraPathEngineV2}`;
    }

    // Append subkeys, encoding only the parts that are not folder indicators.
    if (subkeys && subkeys.length > 0) {
      const encodedSubkeys = subkeys.map(key => {
        if (VaultUtils.isSecretAFolder(key)) {
          // Do not URL-encode segments that represent folders (ending with '/').
          return key;
        } else {
          // URL-encode individual secret names or path segments without a trailing slash.
          return encodeURIComponent(key);
        }
      });

      url = `${url}/${encodedSubkeys.join(PATH_SEPARATOR)}`;
    }

    return VaultUtils.removeDoubleSlash(url);
  }

  /**
   * Constructs the full endpoint for a user login operation.
   * @param {string} username - The username for the login path.
   * @param {string} authMethod - The authentication method (e.g., 'ldap').
   * @returns {string} The normalized login endpoint URL.
   */
  getLoginEndpoint(username, authMethod) {
    return VaultUtils.removeDoubleSlash(`${this.#getAuthEndpoint()}/${authMethod}/login/${username}`);
  }

  /**
   * Constructs the endpoint for looking up the current token.
   * @returns {string} The normalized lookup-self endpoint URL.
   */
  getCurrentTokenEndpoint() {
    return VaultUtils.removeDoubleSlash(`${this.#getTokenEndpoint()}/lookup-self`);
  }

  /**
   * Constructs the endpoint for renewing the current token.
   * @returns {string} The normalized renew-self endpoint URL.
   */
  getRenewTokenEndpoint() {
    return VaultUtils.removeDoubleSlash(`${this.#getTokenEndpoint()}/renew-self`);
  }

  /**
   * Constructs the endpoint for revoking the current token.
   * @returns {string} The normalized revoke-self endpoint URL.
   */
  getLogoutEndpoint() {
    return VaultUtils.removeDoubleSlash(`${this.#getTokenEndpoint()}/revoke-self`);
  }

  /**
   * Constructs the endpoint for wrapping a response.
   * @returns {string} The normalized wrap endpoint URL.
   */
  getWrapEndpoint() {
    return VaultUtils.removeDoubleSlash(`${this.#getWrappingEndpoint()}/wrap`);
  }

  /**
   * Constructs the endpoint for unwrapping a response.
   * @returns {string} The normalized unwrap endpoint URL.
   */
  getUnwrapEndpoint() {
    return VaultUtils.removeDoubleSlash(`${this.#getWrappingEndpoint()}/unwrap`);
  }

  /**
   * Constructs the endpoint for listing secret engines.
   * @param {string} [engineName=''] - An optional specific engine name.
   * @returns {string} The normalized engines endpoint URL.
   */
  getEnginesEndpoint(engineName = '') {
    let url = `${this.#getSysEndpoint()}/internal/ui/mounts`;

    if (engineName !== '') {
      url = `${url}/${engineName}`;
    }
    // Ensure the URL is normalized by removing any double slashes.
    return VaultUtils.removeDoubleSlash(url);
  }

  /**
   * Constructs the endpoint for listing secrets (metadata path for KVv2).
   * @param {object} engine - The engine object.
   * @param {string[]} subkeys - An array of sub-path segments.
   * @returns {string} The normalized secrets metadata endpoint URL.
   */
  getSecretsEndpoint(engine, subkeys) {
    return this.#getEndpoint(engine, subkeys, 'metadata');
  }

  /**
   * Constructs the endpoint for accessing secret data (data path for KVv2).
   * @param {object} engine - The engine object.
   * @param {string[]} subkeys - An array of sub-path segments.
   * @returns {string} The normalized secret data endpoint URL.
   */
  getSecretDataEndpoint(engine, subkeys) {
    return this.#getEndpoint(engine, subkeys, 'data');
  }

}
