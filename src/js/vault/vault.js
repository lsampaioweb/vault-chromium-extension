import { HttpRequest } from '../core/httprequest.js';

/**
 * Interacts with the HashiCorp Vault API.
 * This class acts as a facade, orchestrating API calls using helpers
 * for request building and other utilities.
 */
export class Vault extends HttpRequest {

  /**
   * Constants including Link URLs and other configuration values.
   * @type {object|null}
   */
  constants;

  /**
   * Internationalization service for translating messages and content.
   * @type {object|null}
   */
  I18n;

  /**
   * Logger service for debugging and application monitoring.
   * @type {object|null}
   */
  logger;

  /**
   * Promise pool utility for concurrent operations management.
   * @type {object|null}
   */
  PromisePool;

  /**
   * Vault utility functions for token validation and path management.
   * @type {object|null}
   */
  VaultUtils;

  /**
   * Vault request builder for constructing API URLs and headers.
   * @type {object|null}
   */
  VaultRequestBuilder;

  /**
   * The type identifier for Key-Value (KV) secret engines in Vault.
   * @private
   * @static
   * @readonly
   */
  static #ENGINE_TYPE_KV = 'kv';

  /**
   * Maximum concurrent folder explorations per engine during secret discovery.
   * This limit prevents overwhelming the Vault server while maintaining good performance.
   * @private
   * @static
   * @readonly
   */
  static #FOLDER_CONCURRENCY_LIMIT = 6;

  /**
   * HTTP status codes relevant for Vault responses.
   * @private
   * @static
   * @readonly
   */
  static #STATUS_CODE = {
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429
  };

  /**
   * Supported authentication methods for Vault login.
   * @private
   * @static
   * @readonly
   */
  static #AUTH_METHOD = {
    LDAP: 'ldap',
    USERPASS: 'userpass'
  };

  /**
   * Internationalization keys for Vault-specific messages.
   * These keys map to user-facing messages in the messages.json files.
   * @private
   * @static
   * @readonly
   */
  static #i18nKeys = {
    VAULT_ENDPOINT_REQUIRED: 'error_vault_endpoint_required',
    VAULT_LOGIN_FAILED: 'error_vault_login_failed',
    VAULT_CURRENT_TOKEN_FAILED: 'error_vault_token_lookup_failed',
    VAULT_RENEW_TOKEN_FAILED: 'error_vault_token_renew_failed',
    VAULT_LOGOUT_FAILED: 'error_vault_logout_failed',
    VAULT_SECRET_DELETE_FAILED: 'error_vault_secret_delete_failed',
    VAULT_SECRET_ADD_FAILED: 'error_vault_secret_add_failed',
    VAULT_WRAP_FAILED: 'error_vault_wrap_failed',
    VAULT_UNWRAP_FAILED: 'error_vault_unwrap_failed',
    VAULT_ENGINES_FAILED: 'error_vault_engines_failed',
    VAULT_SECRETS_FAILED: 'error_vault_secrets_failed',
    VAULT_FORBIDDEN_FAILED: 'error_vault_permission_denied',
    VAULT_NOT_FOUND: 'error_vault_not_found',
    VAULT_RATE_LIMITED: 'error_vault_rate_limited',
    VAULT_SERVER_ERROR: 'error_vault_server_error',
    ERROR_TYPE_ENGINE_FAILURE: 'error_type_engine_failure',
    ERROR_TYPE_PATH_FAILURE: 'error_type_path_failure',
  };

  /**
   * The client authentication token object for Vault.
   * Expected to have properties like `client_token` and `expire_date`.
   * @type {object | null}
   * @private
   */
  #token;

  /**
   * An instance of the request builder for constructing URLs and headers.
   * @type {VaultRequestBuilder}
   * @private
   */
  #requestBuilder;

  /**
   * Creates an instance of the Vault API client.
   * @param {object} dependencies - The injected dependencies object containing shared services.
   * @param {string} endpoint - The base URL of the Vault server (e.g., "https://vault.example.com").
   * @param {object | null} [token=null] - An optional pre-existing token object.
   */
  constructor(dependencies, endpoint, token = null) {
    super();

    // Store the injected dependencies.
    this.constants = dependencies.constants;
    this.I18n = dependencies.I18n;
    this.logger = dependencies.logger;
    this.PromisePool = dependencies.PromisePool;
    this.VaultUtils = dependencies.VaultUtils;
    this.VaultRequestBuilder = dependencies.VaultRequestBuilder;

    // Validate the endpoint parameter.
    if (!endpoint || typeof endpoint !== 'string' || endpoint.trim() === '') {
      throw new Error(this.I18n.getMessage(Vault.#i18nKeys.VAULT_ENDPOINT_REQUIRED));
    }

    // Normalize endpoint: remove trailing slashes.
    const normalizedEndpoint = endpoint.replace(/\/+$/, '');

    // Create an instance of the request builder for this Vault instance.
    this.#requestBuilder = new this.VaultRequestBuilder(normalizedEndpoint);

    this.#token = token;
  }

  /**
   * Processes a successful authentication-related response from Vault.
   * Parses the JSON, validates the structure, extracts the 'auth' object, and processes the token.
   * @param {Response} response - The successful HTTP response object from Vault.
   * @param {string} failureMessageKey - The i18n key for the generic failure message for this operation (e.g., login failed, renew failed).
   * @returns {Promise<object>} The 'auth' object from Vault's response, augmented with a processed 'token' property.
   * @throws {Error} A localized error if processing fails.
   * @private
   */
  async #processAuthResponse(response, failureMessageKey) {
    // Get the JSON body of the response.
    const responseData = await response.json();

    if (responseData?.auth) {
      const authResult = responseData.auth;

      // Set the token for this instance.
      this.#token = this.#getToken(authResult);

      // Add the processed token object to the result.
      authResult.token = this.#token;

      return authResult;
    }

    // Throw an internal error with a specific localized message.
    throw new Error(this.I18n.getMessage(failureMessageKey));
  }

  /**
   * Processes an error response from Vault.
   * Logs the error details and throws a localized error based on status code.
   * @param {Response} response - The failed HTTP response object from Vault.
   * @param {string} fallbackMessageKey - The i18n key for the generic failure message for this operation.
   * @param {string[]} ignoredStatusCodes - A list of status codes to ignore.
   * @param {string|string[]} [substitutions=[]] - Optional substitutions for placeholders in the message.
   * @returns {Promise<void>}
   * @throws {Error} A localized error based on the response status or fallback message.
   * @private
   */
  async #processErrorResponse(response, ignoredStatusCodes, fallbackMessageKey, substitutions = []) {
    if (ignoredStatusCodes.includes(response?.status)) {
      // If the status code is in the ignored list, we can skip further processing.
      return;
    }

    let errorMessageKey;
    let shouldLogError = true;

    switch (response?.status) {
      case Vault.#STATUS_CODE.FORBIDDEN: // 403.
        errorMessageKey = Vault.#i18nKeys.VAULT_FORBIDDEN_FAILED;
        break;
      case Vault.#STATUS_CODE.NOT_FOUND: // 404.
        errorMessageKey = Vault.#i18nKeys.VAULT_NOT_FOUND;
        break;
      case Vault.#STATUS_CODE.TOO_MANY_REQUESTS: // 429.
        errorMessageKey = Vault.#i18nKeys.VAULT_RATE_LIMITED;
        break;
      default:
        if (response.status >= 500) {
          errorMessageKey = Vault.#i18nKeys.VAULT_SERVER_ERROR;
        } else {
          errorMessageKey = fallbackMessageKey;

          // This error is kind of expected for this endpoint, so we won't log it.
          shouldLogError = false;
        }
        break;
    }
    // Construct the error message.
    const errorMessage = response?.statusText || this.I18n.getMessage(errorMessageKey, substitutions);

    if (shouldLogError) {
      // Log the error details only if the error is not an expected one.
      this.logger.error(`Error [${response?.status}]: On url: [${response?.url}] with message: [${errorMessage}]`);
    }

    throw new Error(errorMessage);
  }

  /**
   * Processes the authentication result from Vault to create a structured token object.
   * This object includes the client_token and a calculated 'expire_date'.
   * @param {object} authResponseData - The 'auth' object from a Vault login or token renewal response.
   * @param {string} authResponseData.client_token - The client token string.
   * @param {number} authResponseData.lease_duration - The duration of the token lease in seconds.
   * @returns {{client_token: string, expire_date: string}} The processed token object.
   * @private
   */
  #getToken(authResponseData) {
    const date = new Date();
    // The lease_duration is provided in seconds by Vault.
    date.setSeconds(date.getSeconds() + authResponseData.lease_duration);

    return {
      client_token: authResponseData.client_token,
      // Store the expiration date as a UTC string.
      expire_date: date.toUTCString()
    };
  }

  /**
   * Retrieves details about the current client token.
   * @returns {Promise<object>} A promise that resolves with the token's data from Vault.
   * @throws {Error} If the request fails or the token is invalid.
   * @public
   */
  async getCurrentToken() {
    // Get the endpoint URL for looking up the current token.
    const url = this.#requestBuilder.getCurrentTokenEndpoint();

    // Prepare headers including JSON content type and the current token.
    const headers = this.VaultUtils.mergeObjects([
      this.#requestBuilder.getJsonHeader(),
      this.#requestBuilder.getVaultTokenHeader(this.#token)
    ]);

    // Execute the GET request.
    const response = await this.get(url, headers);

    if (response.ok) {
      // Return the full JSON response which contains token details.
      return await response.json();
    }

    // If execution reaches this point, the response was not successful and must be handled as an error.
    await this.#processErrorResponse(response, [], Vault.#i18nKeys.VAULT_CURRENT_TOKEN_FAILED);
  }

  /**
   * Renews the current client token.
   * Updates the instance's token upon successful renewal.
   * @returns {Promise<object>} A promise that resolves with the Vault authentication response object
   * for the renewed token, including an added 'token' property with client_token and calculated expire_date.
   * @throws {Error} If renewal fails.
   * @public
   */
  async renewToken() {
    // Get the endpoint URL for renewing the current token.
    const url = this.#requestBuilder.getRenewTokenEndpoint();

    // Prepare headers including JSON content type and the current token.
    const headers = this.VaultUtils.mergeObjects([
      this.#requestBuilder.getJsonHeader(),
      this.#requestBuilder.getVaultTokenHeader(this.#token)
    ]);

    // Execute the POST request.
    const response = await this.post(url, headers);

    if (response.ok) {
      // Delegate to the shared processing method.
      return this.#processAuthResponse(response, Vault.#i18nKeys.VAULT_RENEW_TOKEN_FAILED);
    }

    // If execution reaches this point, the response was not successful and must be handled as an error.
    await this.#processErrorResponse(response, [], Vault.#i18nKeys.VAULT_RENEW_TOKEN_FAILED);
  }

  /**
   * Logs into Vault using the specified credentials and authentication method.
   * Upon successful login, the instance's token is updated.
   * The authentication response from Vault, augmented with a processed token object, is returned.
   * @param {string} username - The username for login.
   * @param {string} password - The password for login.
   * @param {string} [authMethod=Vault.#AUTH_METHOD.LDAP] - The Vault authentication method to use.
   * @returns {Promise<object>} A promise resolving with the Vault 'auth' response object.
   * This object includes an added 'token' property containing the client_token and calculated expire_date.
   * @throws {Error} If login fails (network, non-OK HTTP status, bad response format, or invalid credentials).
   * @public
   */
  async login(username, password, authMethod = Vault.#AUTH_METHOD.LDAP) {
    // Get the login endpoint URL for the specified auth method.
    const url = this.#requestBuilder.getLoginEndpoint(username, authMethod);

    // Get the JSON header.
    const headers = this.#requestBuilder.getJsonHeader();

    // Prepare the request body with the password.
    const body = JSON.stringify({ password });

    // Execute the POST request.
    const response = await this.post(url, headers, body);

    if (response.ok) {
      // Delegate to the shared processing method.
      return this.#processAuthResponse(response, Vault.#i18nKeys.VAULT_LOGIN_FAILED);
    }

    // If execution reaches this point, the response was not successful and must be handled as an error.
    await this.#processErrorResponse(response, [], Vault.#i18nKeys.VAULT_LOGIN_FAILED);
  }

  /**
   * Revokes the current client token (logs out).
   * Clears the token from the instance regardless of API call success.
   * @returns {Promise<Response>} A promise that resolves with the raw Fetch API Response object.
   * A successful revocation typically results in an HTTP 204 No Content response.
   * @throws {Error} If the API call reports an error (other than typical token-already-invalid scenarios).
   * @public
   */
  async logout() {
    // Get the endpoint URL for logging out (revoking the current token).
    const url = this.#requestBuilder.getLogoutEndpoint();

    // Prepare headers including JSON content type and the current token.
    const headers = this.VaultUtils.mergeObjects([
      this.#requestBuilder.getJsonHeader(),
      this.#requestBuilder.getVaultTokenHeader(this.#token)
    ]);

    // Clear the instance token immediately; the intent is to log out.
    this.#token = null;

    // Execute the POST request.
    const response = await this.post(url, headers);

    if (response.ok) {
      // On success, Vault's auth/token/revoke-self returns HTTP 204 No Content.
      return response;
    }

    // If execution reaches this point, the response was not successful and must be handled as an error.
    await this.#processErrorResponse(response, [], Vault.#i18nKeys.VAULT_LOGOUT_FAILED);
  }

  /**
   * Retrieves a list of Key-Value (KV) secret engines accessible by the current token.
   * The engines are sorted with personal engines first, then alphabetically.
   * @returns {Promise<Array<object>>} A promise that resolves with an array of engine objects.
   * Each engine object contains name, uuid, type, options, isPersonal, and description.
   * @throws {Error} If the request fails or the response structure is invalid.
   * @public
   */
  async getKVEngines() {
    // Get the endpoint URL for listing secret engines.
    const url = this.#requestBuilder.getEnginesEndpoint();

    // Prepare headers including JSON content type and the current token.
    const headers = this.VaultUtils.mergeObjects([
      this.#requestBuilder.getJsonHeader(),
      this.#requestBuilder.getVaultTokenHeader(this.#token)
    ]);

    this.logger.logRequest('listEngines', url);
    // Execute the GET request.
    const response = await this.get(url, headers);

    if (response.ok) {
      // Get the JSON body of the response.
      const jsonData = await response.json();

      const engines = [];
      // Validate the expected structure of the response.
      if (jsonData?.data?.secret && typeof jsonData.data.secret === 'object') {
        for (const key in jsonData.data.secret) {
          const engine = jsonData.data.secret[key];

          if (engine && engine.type === Vault.#ENGINE_TYPE_KV) {
            engines.push({
              name: key,
              uuid: engine.uuid,
              type: engine.type,
              options: engine.options,
              isPersonal: this.VaultUtils.isPersonalEngine(key),
              description: engine.description
            });
          }
        }

        // Sort the engines before returning.
        return this.VaultUtils.sortEngines(engines);
      }
    }

    // If execution reaches this point, the response was not successful and must be handled as an error.
    await this.#processErrorResponse(response, [], Vault.#i18nKeys.VAULT_ENGINES_FAILED);
  }

  /**
   * Searches for secrets across all accessible KV engines based on search text.
   * Uses PromisePool for parallel engine processing with concurrency control.
   * Results are compiled from all engines and then sorted.
   * @param {string} username - The username, potentially used for pathing in personal engines.
   * @param {string | string[]} text - The search text or an array of search terms.
   * @returns {Promise<Array<object>>} A promise that resolves with a flat, sorted array of found secret objects.
   * @public
   */
  async getSecretsByText(username, text) {
    const allSecrets = [];
    const allErrors = [];

    // Reset the logger for a fresh start.
    this.logger.reset();

    // Get all KV engines the user has access to.
    const engines = await this.getKVEngines();

    /**
     * Processes a single engine: searches for secrets within it.
     * Returns status objects to allow batch processing error handling.
     * @param {object} engine - The engine object to search within.
     * @returns {Promise<object>} Status object with results or error information.
     */
    const processEngine = async (engine) => {
      // It will return a report object.
      // We don't need a try/catch here because it will never reject.
      return await this.getSecretsByTextOnEngine(engine, username, text);
    };

    // Process all engines in parallel using PromisePool.
    const engineResults = await this.PromisePool.process(engines, processEngine);

    // Collect all secrets and all errors from the engine results.
    engineResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        allErrors.push({
          type: this.I18n.getMessage(Vault.#i18nKeys.ERROR_TYPE_ENGINE_FAILURE),
          engine: engines[index]?.name,
          reason: result.reason.message
        });
      } else {
        if (Array.isArray(result.secrets) && result.secrets.length > 0) {
          // Flatten successful results into a single array.
          allSecrets.push(...result.secrets);
        }
        if (result.errors.length > 0) {
          result.errors.forEach(e =>
            allErrors.push({
              type: this.I18n.getMessage(Vault.#i18nKeys.ERROR_TYPE_PATH_FAILURE),
              engine: engines[index]?.name,
              ...e
            }));
        }
      }
    });

    // Log a summary of all requests made during this operation.
    this.logger.logSummary();

    // Return the final report to the UI layer.
    return {
      secrets: this.VaultUtils.sortSecrets(allSecrets, text),
      errors: allErrors
    };
  }

  /**
   * Recursively searches for secrets within a specific engine that match the search text.
   * Uses a specialized concurrent queue to handle dynamic folder discovery efficiently.
   * @param {object} engine - The engine object to search within.
   * @param {string} username - The username, used for pathing in personal engines.
   * @param {string | string[]} text - The search text or an array of search terms.
   * @returns {Promise<{secrets: Array<object>, errors: Array<object>}>} A promise resolving with secrets and any path exploration errors.
   * @public
   */
  async getSecretsByTextOnEngine(engine, username, text) {
    const allSecrets = [];
    const allErrors = [];
    const foldersToExplore = [];
    let activeTasks = 0;

    /**
     * Explores one folder path, adding secrets to the results list and new
     * folders to the exploration queue.
     * @param {string[]} currentSubkeys - The current path to explore.
     * @returns {Promise<void>}
     */
    const explorePath = async (currentSubkeys) => {
      try {
        // Another worker may have processed this already (edge case protection).
        if (!currentSubkeys) {
          return;
        }

        // Get the secrets for the engine at the current path.
        const secretList = await this.#getSecrets(engine, currentSubkeys);
        if (!secretList) {
          return;
        }

        for (const secretName of secretList) {
          // Skip ignored secret names.
          if (this.constants.IGNORED_SECRET_NAMES.has(secretName)) {
            continue;
          }

          // Path for the child item (folder or secret itself).
          // Remove trailing slash from secretName if it's a folder to ensure clean path segment.
          const childItemSubkeys = [...currentSubkeys, secretName.replace(this.constants.PATH_SEPARATOR, '')];

          if (this.VaultUtils.isSecretAFolder(secretName)) {
            // Add to the dynamic queue for later exploration.
            foldersToExplore.push(childItemSubkeys);

          } else if (this.VaultUtils.textMatchWithSecret(text, secretName)) {
            // Create and add the secret object immediately.
            allSecrets.push({
              engine: engine,
              path: this.VaultUtils.extractPath(childItemSubkeys),
              name: this.VaultUtils.extractName(childItemSubkeys),
              fullName: this.VaultUtils.getSecretFullPath(engine.name, childItemSubkeys),
              isPersonal: this.VaultUtils.isPersonalEngine(engine.name)
            });
          }
        }
      } catch (error) {
        // Collect path exploration errors for potential user notification.
        allErrors.push({
          path: currentSubkeys.join(this.constants.PATH_SEPARATOR),
          error: error.message
        });
      }
    };

    // --- The Specialized Concurrent Queue Manager for Dynamic Folder Discovery ---
    return new Promise(resolve => {
      /**
       * Manages the dynamic queue of folders, ensuring that workers are kept busy
       * up to the concurrency limit. This is the key to efficient concurrency!
       */
      const manageQueue = () => {
        // When the "to-do" list is empty and all workers are idle, the job is done.
        if (foldersToExplore.length === 0 && activeTasks === 0) {
          // Resolve the main promise with the final report.
          return resolve({ secrets: allSecrets, errors: allErrors });
        }

        // Fill any available worker slots with tasks from the queue.
        while (foldersToExplore.length > 0 && activeTasks < Vault.#FOLDER_CONCURRENCY_LIMIT) {
          activeTasks++;

          // Get the next folder path to explore.
          const currentSubkeys = foldersToExplore.shift();

          // Start the exploration. The .finally() block is crucial for concurrency!
          explorePath(currentSubkeys).finally(() => {
            // This code runs whether explorePath succeeded or failed.

            // A worker has become free.
            activeTasks--;

            // Immediately check for more work to do!
            manageQueue();
          });
        }
      };

      // Initialize the exploration with the user's personal path if applicable.
      const initialSubkeys = (this.VaultUtils.isPersonalEngine(engine.name)) ? [username] : [];

      // Add the initial path to the exploration queue.
      foldersToExplore.push(initialSubkeys);

      // Start the queue manager.
      manageQueue();
    });
  }

  /**
   * Lists keys (secrets or sub-paths/folders) under a given path in a Vault KVv2 engine.
   * This method is typically used with metadata paths for KVv2 engines.
   * @param {object} engine - The engine object (containing name, options, etc.).
   * @param {string[]} [subkeys=[]] - An array of sub-paths to navigate under the engine.
   * @returns {Promise<string[]>} A promise that resolves with an array of secret keys/names.
   * @throws {Error} If the request fails or the response is invalid.
   * @private
   */
  async #getSecrets(engine, subkeys = []) {
    // Build the endpoint URL for listing secrets at the given path.
    const url = this.#requestBuilder.getSecretsEndpoint(engine, subkeys);

    // Prepare headers with JSON content type and Vault token.
    const headers = this.VaultUtils.mergeObjects([
      this.#requestBuilder.getJsonHeader(),
      this.#requestBuilder.getVaultTokenHeader(this.#token)
    ]);

    // Log the request for debugging and traceability.
    this.logger.logRequest('listSecrets', url);
    // Perform the LIST request to Vault.
    const response = await this.list(url, headers);

    if (response.ok) {
      // Parse the JSON response body.
      const jsonData = await response.json();

      const secrets = [];
      // Vault's LIST operation on a metadata path returns { "data": { "keys": ["key1", "key2/"] } }
      for (const secretName of jsonData.data.keys) {
        // Only add non-empty secret names to the result.
        if (secretName) {
          secrets.push(secretName);
        }
      }

      // Return the list of secret names (folders and secrets).
      return secrets;
    }

    // If execution reaches this point, the response was not successful and must be handled as an error.
    await this.#processErrorResponse(
      response,
      [Vault.#STATUS_CODE.FORBIDDEN, Vault.#STATUS_CODE.NOT_FOUND],
      Vault.#i18nKeys.VAULT_SECRETS_FAILED,
      [url]
    );
  }

  /**
   * Fetches the data for a specific secret by engine and path.
   * This is a public wrapper around the private #getSecretDataOnEngine method.
   * @param {object} engine - The engine object.
   * @param {string[]} subkeys - An array of sub-paths to the secret.
   * @returns {Promise<object|null>} A promise resolving to the secret's data or null.
   * @public
   */
  async getSecretData(engine, subkeys) {
    return await this.#getSecretDataOnEngine(engine, subkeys);
  }

  /**
   * Fetches the actual key-value data of a secret from Vault for a given engine and path.
   * This method normalizes the response from KVv1 and KVv2 engines to return
   * only the direct secret data (key-value pairs) or null.
   * @param {object} engine - The engine object, containing options like version.
   * @param {string[]} subkeys - An array of sub-paths to the secret.
   * @returns {Promise<object|null>} A promise resolving to the secret's direct key-value data object,
   * or null if not found, on error, or if parsing fails.
   * @private
   */
  async #getSecretDataOnEngine(engine, subkeys = []) {
    // Build the endpoint URL for fetching secret data at the given path.
    const url = this.#requestBuilder.getSecretDataEndpoint(engine, subkeys);

    // Prepare headers with JSON content type and Vault token.
    const headers = this.VaultUtils.mergeObjects([
      this.#requestBuilder.getJsonHeader(),
      this.#requestBuilder.getVaultTokenHeader(this.#token)
    ]);

    // Log the request for debugging and traceability.
    this.logger.logRequest('getSecretData', url);
    // Perform the GET request to Vault.
    const response = await this.get(url, headers);

    if (response.ok) {
      // Parse the JSON response body.
      const json = await response.json();

      // Normalize the response for KVv1 and KVv2 engines.
      switch (engine?.options?.version) {
        case '1':
          // For KVv1, the response itself is the data object.
          return json || null;
        case '2':
          // For KVv2, the actual secret data is nested under json.data.
          return json?.data || null;
        default:
          // Unknown engine version; treat as not found.
          return null;
      }
    }

    // If we reach here, the request failed or the response was invalid.
    // Return null to indicate no data was found or an error occurred.
    return null;
  }

  /**
   * Adds or updates a secret in Vault.
   * @param {object} engine - The engine object where the secret will be stored.
   * @param {string[]} subkeys - An array of sub-paths forming the path to the secret.
   * @param {object} data - The secret data (key-value pairs) to store.
   * @returns {Promise<Response>} A promise that resolves with the raw Fetch API Response object.
   * Successful operations typically yield an HTTP 204 No Content.
   * @throws {Error} If the operation fails.
   * @public
   */
  async addSecret(engine, subkeys, data) {
    // Get the endpoint URL for adding/updating the secret.
    const url = this.#requestBuilder.getSecretDataEndpoint(engine, subkeys);

    // Prepare headers including JSON content type and the current token.
    const headers = this.VaultUtils.mergeObjects([
      this.#requestBuilder.getJsonHeader(),
      this.#requestBuilder.getVaultTokenHeader(this.#token)
    ]);

    // Prepare the request body using VaultUtils to handle engine specifics.
    const body = this.VaultUtils.prepareBody(engine, data);

    // Execute the POST request.
    const response = await this.post(url, headers, body);

    if (response.ok) {
      // If the response is OK, return the raw response object.
      return response;
    }

    // If execution reaches this point, the response was not successful and must be handled as an error.
    await this.#processErrorResponse(response, [], Vault.#i18nKeys.VAULT_SECRET_ADD_FAILED);
  }

  /**
   * Deletes a secret from Vault.
   * @param {object} engine - The engine object where the secret is located.
   * @param {string[]} [subkeys=[]] - An array of sub-paths forming the path to the secret.
   * @returns {Promise<Response>} A promise that resolves with the raw Fetch API Response object.
   * A successful deletion typically results in an HTTP 204 No Content response.
   * @throws {Error} If the deletion fails.
   * @public
   */
  async deleteSecret(engine, subkeys = []) {
    // Get the endpoint URL for deleting the secret.
    const url = this.#requestBuilder.getSecretsEndpoint(engine, subkeys);

    // Prepare headers including JSON content type and the current token.
    const headers = this.VaultUtils.mergeObjects([
      this.#requestBuilder.getJsonHeader(),
      this.#requestBuilder.getVaultTokenHeader(this.#token)
    ]);

    // Execute the DELETE request.
    const response = await this.delete(url, headers);

    if (response.ok) {
      return response;
    }

    // If we reach this point, the response was not successful.
    // For delete operations, we include the secret name in the error message
    const fullName = this.VaultUtils.getSecretFullPath(engine.name, subkeys);

    // If we reach this point, the response was not successful and the response needs to be handled.
    await this.#processErrorResponse(response, [], Vault.#i18nKeys.VAULT_SECRET_DELETE_FAILED, [fullName]);
  }

  /**
   * Wraps the given data using Vault's response wrapping mechanism.
   * @param {object} data - The data to be wrapped.
   * @param {string} [ttl="30m"] - The Time-To-Live for the wrapped response (e.g., "1h", "30m").
   * @returns {Promise<string>} A promise that resolves with the wrapping token string.
   * @throws {Error} If the wrapping operation fails or the response is malformed.
   * @public
   */
  async wrap(data, ttl = "30m") {
    // Get the wrap endpoint URL.
    const url = this.#requestBuilder.getWrapEndpoint();

    // Prepare headers including JSON content type, user token, and wrapping TTL.
    const headers = this.VaultUtils.mergeObjects([
      this.#requestBuilder.getJsonHeader(),
      this.#requestBuilder.getVaultTokenHeader(this.#token),
      this.#requestBuilder.getWrappingTTLHeader(ttl)
    ]);

    // Create the request body with the data to be wrapped.
    const body = JSON.stringify(data);

    // Make the POST request to wrap the data.
    const response = await this.post(url, headers, body);

    if (response.ok) {
      // Get the JSON body of the response.
      const json = await response.json();

      // Ensure the expected structure for wrap_info and token.
      if (json?.wrap_info?.token && typeof json.wrap_info.token === 'string') {
        return json.wrap_info.token;
      }
    }

    // If execution reaches this point, the response was not successful and must be handled as an error.
    await this.#processErrorResponse(response, [], Vault.#i18nKeys.VAULT_WRAP_FAILED);
  }

  /**
   * Unwraps a Vault wrapped response using the given wrapping token (hash).
   * @param {string} hash - The wrapping token (often called a 'hash' or 'wrapping ID').
   * @returns {Promise<object>} A promise that resolves with the unwrapped data.
   * @throws {Error} If the unwrapping operation fails or the response is malformed.
   * @public
   */
  async unwrap(hash) {
    // Get the unwrap endpoint URL.
    const url = this.#requestBuilder.getUnwrapEndpoint();

    // Prepare headers including with JSON content type and user token.
    const headers = this.VaultUtils.mergeObjects([
      this.#requestBuilder.getJsonHeader(),
      this.#requestBuilder.getVaultTokenHeader(this.#token)
    ]);

    // Create the request body with the hash to be unwrapped.
    const body = JSON.stringify({ token: hash });

    // Make the POST request to unwrap the data.
    const response = await this.post(url, headers, body);

    if (response.ok) {
      const json = await response.json();

      // The unwrapped data is expected directly in the 'data' field of the response.
      if (json?.data && typeof json.data === 'object') {
        return json.data;
      }
    }

    // If execution reaches this point, the response was not successful and must be handled as an error.
    await this.#processErrorResponse(response, [], Vault.#i18nKeys.VAULT_UNWRAP_FAILED);
  }

}
