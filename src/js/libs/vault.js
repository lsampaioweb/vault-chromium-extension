import { I18n } from './i18n.js';
import { HttpRequest } from './httprequest.js';

export class Vault extends HttpRequest {
  #endpoint;
  #token;
  #vaultApiVersion = 'v1';
  #SEPARATOR = '/';
  #ENGINE_TYPE_KV = 'kv';

  #i18n = {
    VAULT_LOGIN_FAILED: 'vault_login_failed',
    VAULT_CURRENT_TOKEN_FAILED: 'vault_current_token_failed',
    VAULT_RENEW_TOKEN_FAILED: 'vault_renew_token_failed',
    VAULT_LOGOUT_FAILED: 'vault_logout_failed',
    VAULT_SECRET_DELETE_FAILED: 'vault_secret_delete_failed',
    VAULT_SECRET_ADD_FAILED: 'vault_secret_add_failed',
    VAULT_WRAP_FAILED: 'vault_wrap_failed',
    VAULT_UNWRAP_FAILED: 'vault_unwrap_failed',
    VAULT_ENGINES_FAILED: 'vault_engines_failed',
    VAULT_FORBIDDEN_FAILED: 'vault_forbidden_failed',
    PERSONAL_ENGINES: 'personalEngines'
  };

  #StatusCode = {
    FORBIDDEN: 403,
    NOT_FOUND: 404
  };

  #authMethod = {
    LDAP: 'ldap',
    USERPASS: 'userpass'
  };

  constructor(endpoint, token) {
    super();
    this.#endpoint = endpoint;
    this.#token = token;
  }

  static isTokenValid(token) {
    if (token) {
      const expireDate = new Date(token.expire_date);
      const now = new Date();

      return (expireDate >= now);
    }

    return false;
  }

  async login(username, password, authMethod = this.#authMethod.LDAP) {
    const url = this.#getLoginEndpoint(username, authMethod);
    const headers = this.#getJsonHeader();
    const body = JSON.stringify({ password });

    const response = await this.post(url, headers, body);

    if (!response.ok) {
      const errorMessage = I18n.getMessage(this.#i18n.VAULT_LOGIN_FAILED);

      throw new Error(errorMessage);
    }

    const result = (await response.json()).auth;

    // Set the token to this instance.
    this.#token = this.#getToken(result);

    result.token = this.#token;

    return result;
  }

  async getCurrentToken() {
    const url = this.#getCurrentTokenEndpoint();

    const headers = this.#mergeObjects([this.#getJsonHeader(), this.#getVaultTokenHeader(this.#token)]);

    const response = await this.get(url, headers);

    if (!response.ok) {
      const errorMessage = I18n.getMessage(this.#i18n.VAULT_CURRENT_TOKEN_FAILED);

      throw new Error(errorMessage);
    }

    return (await response.json());
  }

  async renewToken() {
    const url = this.#getRenewTokenEndpoint();

    const headers = this.#mergeObjects([this.#getJsonHeader(), this.#getVaultTokenHeader(this.#token)]);

    const response = await this.post(url, headers);

    if (!response.ok) {
      const errorMessage = I18n.getMessage(this.#i18n.VAULT_RENEW_TOKEN_FAILED);

      throw new Error(errorMessage);
    }

    const result = (await response.json()).auth;

    // Set the token to this instance.
    this.#token = this.#getToken(result);

    result.token = this.#token;

    return result;
  }

  async logout() {
    const url = this.#getLogoutEndpoint();

    const headers = this.#mergeObjects([this.#getJsonHeader(), this.#getVaultTokenHeader(this.#token)]);

    const response = await this.post(url, headers);

    // Remove the token from this instance.
    this.#token = null;

    if (!response.ok) {
      if (response.status === this.#StatusCode.NOT_FOUND) {
        const errorMessage = I18n.getMessage(this.#i18n.VAULT_LOGOUT_FAILED);
        throw new Error(errorMessage);
      }
    }

    return response;
  }

  async getKVEngines() {
    const url = this.#getEnginesEndpoint();

    const headers = this.#mergeObjects([this.#getJsonHeader(), this.#getVaultTokenHeader(this.#token)]);

    const response = await this.get(url, headers);

    if (!response.ok) {
      let errorMessage;
      if (response.status === this.#StatusCode.FORBIDDEN) {
        errorMessage = I18n.getMessage(this.#i18n.VAULT_FORBIDDEN_FAILED);
      } else {
        errorMessage = I18n.getMessage(this.#i18n.VAULT_ENGINES_FAILED);
      }
      throw new Error(errorMessage);
    }

    const engines = [];
    const json = (await response.json());

    for (const key in json.data.secret) {
      const engine = json.data.secret[key];
      if (engine?.type === this.#ENGINE_TYPE_KV) {
        engines.push({
          name: key,
          uuid: engine.uuid,
          type: engine.type,
          options: engine.options,
          isPersonal: this.#isPersonalEngine(key),
          description: engine.description
        });
      }
    }

    return this.#sortEngines(engines);
  }

  #sortEngines(engines) {
    return engines.sort(this.#compareEngines);
  }

  #compareEngines(a, b) {
    if ((a.isPersonal) && (!b.isPersonal)) {
      return -1;
    }
    if ((!a.isPersonal) && (b.isPersonal)) {
      return 1;
    }

    return a.name.localeCompare(b.name);
  }

  async getSecrets(engine, subkeys = []) {
    const url = this.#getSecretsEndpoint(engine, subkeys);

    const headers = this.#mergeObjects([this.#getJsonHeader(), this.#getVaultTokenHeader(this.#token)]);

    const response = await this.list(url, headers);

    const secrets = [];
    if (response.ok) {
      const json = (await response.json());

      for (const key in json.data.keys) {
        const secret = json.data.keys[key];
        if (secret) {
          secrets.push(secret);
        }
      }
    }

    return secrets;
  }

  async getSecretsByText(text, username) {
    const allSecrets = [];

    // Get all KV engines the user has access to.
    const engines = await this.getKVEngines();

    for (const engine of engines) {
      const secrets = await this.getSecretsByTextOnEngine(text, username, engine);

      if ((secrets) && (secrets.length > 0)) {
        allSecrets.push(secrets);
      }
    }

    return this.#sortSecrets(allSecrets.flat(), text);
  }

  async getSecretsByTextOnEngine(text, username, engine, subkeys = []) {
    const secretsList = [];

    if ((this.#isPersonalEngine(engine.name)) && (subkeys.length === 0)) {
      subkeys.push(username);
    }

    const secrets = await this.getSecrets(engine, subkeys);

    for (const secret of secrets) {
      const nextsubkeys = subkeys.concat([secret.replace(this.#SEPARATOR, '')]);

      if (this.#isSecretAFolder(secret)) {
        await this.#getSecretsInSubFolder(text, username, engine, nextsubkeys, secretsList);
      } else if (this.#textMatchWithSecret(text, secret)) {
        await this.#getSecretData(engine, nextsubkeys, secretsList);
      }
    }

    return secretsList.flat();
  }

  async #getSecretsInSubFolder(text, username, engine, subkeys, secretsList) {
    const secrets = await this.getSecretsByTextOnEngine(text, username, engine, subkeys);

    if ((secrets) && (secrets.length > 0)) {
      secretsList.push(secrets);
    }
  }

  async #getSecretDataOnEngine(engine, subkeys = []) {
    const url = this.#getSecretDataEndpoint(engine, subkeys);

    const headers = this.#mergeObjects([this.#getJsonHeader(), this.#getVaultTokenHeader(this.#token)]);

    const response = await this.get(url, headers);

    if (response.ok) {
      const json = await response.json();

      switch (engine?.options?.version) {
        case '1':
          return json;
        case '2':
          return json.data;
      }
    }

    return null;
  }

  async #getSecretData(engine, subkeys, secretsList) {
    const secret = await this.#getSecretDataOnEngine(engine, subkeys);

    if (secret?.data) {
      const newSecret = {
        engine: engine,
        path: this.#extractPath(subkeys),
        name: this.#extractName(subkeys),
        fullName: this.getSecretFullPath(engine, subkeys),
        isPersonal: this.#isPersonalEngine(engine.name),
        data: secret.data,
      };

      secretsList.push(newSecret);
    }
  }

  #extractPath(value) {
    // Retrieve the first part (??/??/XXX -> ??/??).
    return value.slice(0, -1).join(this.#SEPARATOR);
  }

  #extractName(value) {
    // Retrieve the last part (??/??/XXX -> XXX).
    return value.slice(-1).join(this.#SEPARATOR);
  }

  #sortSecrets(secrets, text) {
    // Only use the first item from the `text` array for comparison.
    const searchText = Array.isArray(text) && text.length > 0 ? text[0].toLowerCase() : '';

    return secrets.sort((a, b) => this.#compareSecrets(a, b, searchText));
  }

  #compareSecrets(a, b, searchText) {
    // Check if the `name` of `a` and `b` matches the search text.
    const isAEqual = this.#isEqual(a, searchText);
    const isBEqual = this.#isEqual(b, searchText);

    // First, sort based on whether `a` or `b` exactly matches the search text.
    if (isAEqual && !isBEqual) {
      return -1; // `a` should come before `b`
    }
    if (!isAEqual && isBEqual) {
      return 1; // `b` should come before `a`
    }

    // Next, if both or neither match the search text, sort by personal status.
    if (a.isPersonal && !b.isPersonal) {
      return -1; // Personal secrets (`a`) come before non-personal (`b`)
    }
    if (!a.isPersonal && b.isPersonal) {
      return 1; // Non-personal secrets (`a`) come after personal (`b`)
    }

    // Finally, if all else is equal, sort alphabetically by `fullName`.
    return a.fullName.localeCompare(b.fullName);
  }

  #isEqual(secret, searchText) {
    return (secret.name.toLowerCase() === searchText);
  }

  getSecretFullPath(engine, subkeys) {
    const fullPath = [].concat([engine.name]).concat(subkeys);

    return this.#removeDoubleSlash(fullPath.join(this.#SEPARATOR));
  }

  #isPersonalEngine(engineName) {
    const personalEngines = I18n.getMessage(this.#i18n.PERSONAL_ENGINES).replace(' ', '').split(',');

    if (personalEngines) {
      for (const element of personalEngines) {
        if (engineName.toLowerCase() === element.toLowerCase()) {
          return true;
        }
      }
    }

    return false;
  }

  #isSecretAFolder(secret) {
    return secret.endsWith(this.#SEPARATOR);
  }

  #textMatchWithSecret(textArray, secret) {
    if (!textArray || textArray.length === 0) {
      // If the array is empty or not provided, it means we want all secrets.
      return true;
    }

    // Convert the secret to lowercase for case-insensitive comparison.
    secret = secret.toLowerCase();

    // Iterate over each text in the array.
    for (let text of textArray) {
      // Check if the secret includes the current text.
      if (secret.includes(text.toLowerCase())) {
        return true;
      }
    }

    // If none of the texts matched, return false.
    return false;
  }

  async addSecret(engine, subkeys, data) {
    const url = this.#getSecretDataEndpoint(engine, subkeys);
    const headers = this.#mergeObjects([this.#getJsonHeader(), this.#getVaultTokenHeader(this.#token)]);
    const body = this.#prepareBody(engine, data);

    const response = await this.post(url, headers, body);

    if (!response.ok) {
      const errorMessage = I18n.getMessage(this.#i18n.VAULT_SECRET_ADD_FAILED);

      throw new Error(errorMessage);
    }

    return response;
  }

  async deleteSecret(engine, subkeys = []) {
    const url = this.#getSecretsEndpoint(engine, subkeys);

    const headers = this.#mergeObjects([this.#getJsonHeader(), this.#getVaultTokenHeader(this.#token)]);

    const response = await this.delete(url, headers);

    if (!response.ok) {
      const fullName = this.getSecretFullPath(engine, subkeys);
      const errorMessage = I18n.getMessage(this.#i18n.VAULT_SECRET_DELETE_FAILED, [fullName]);

      throw new Error(errorMessage);
    }

    return response;
  }

  async wrap(data, ttl = "30m") {
    const url = this.#getWrapEndpoint();
    const headers = this.#mergeObjects([this.#getJsonHeader(), this.#getVaultTokenHeader(this.#token), this.#getWrappingTTLHeader(ttl)]);
    const body = JSON.stringify(data);

    const response = await this.post(url, headers, body);

    if (!response.ok) {
      const errorMessage = I18n.getMessage(this.#i18n.VAULT_WRAP_FAILED);

      throw new Error(errorMessage);
    }

    let json = await response.json();

    return json.wrap_info.token;
  }

  async unwrap(hash) {
    const url = this.#getUnwrapEndpoint();
    const headers = this.#mergeObjects([this.#getJsonHeader(), this.#getVaultTokenHeader(this.#token)]);
    const body = JSON.stringify({ token: hash });

    const response = await this.post(url, headers, body);

    if (!response.ok) {
      const errorMessage = I18n.getMessage(this.#i18n.VAULT_UNWRAP_FAILED);

      throw new Error(errorMessage);
    }

    return (await response.json()).data;
  }

  #getToken(result) {
    const date = new Date();

    // lease_duration is in seconds.
    date.setSeconds(date.getSeconds() + result.lease_duration);

    return {
      client_token: result.client_token,
      expire_date: date.toUTCString()
    };
  }

  #prepareBody(engine, data) {
    if (engine?.options?.version === '2') {
      return JSON.stringify({ data });
    } else {
      return JSON.stringify(data);
    }
  }

  #mergeObjects(arrayOfObjects) {
    return Object.assign({}, ...arrayOfObjects);
  }

  #removeDoubleSlash(url) {
    return url.replace(/([^:])(\/\/+)/g, '$1/');
  }

  #getBaseEndpoint() {
    return `${this.#endpoint}/${this.#vaultApiVersion}`;
  }

  #getAuthEndpoint() {
    return `${this.#getBaseEndpoint()}/auth`;
  }

  #getSysEndpoint() {
    return `${this.#getBaseEndpoint()}/sys`;
  }

  #getWrappingEndpoint() {
    return `${this.#getSysEndpoint()}/wrapping`;
  }

  #getTokenEndpoint() {
    return `${this.#getAuthEndpoint()}/token`;
  }

  #getLoginEndpoint(username, authMethod) {
    return this.#removeDoubleSlash(`${this.#getAuthEndpoint()}/${authMethod}/login/${username}`);
  }

  #getCurrentTokenEndpoint() {
    return this.#removeDoubleSlash(`${this.#getTokenEndpoint()}/lookup-self`);
  }

  #getRenewTokenEndpoint() {
    return this.#removeDoubleSlash(`${this.#getTokenEndpoint()}/renew-self`);
  }

  #getLogoutEndpoint() {
    return this.#removeDoubleSlash(`${this.#getTokenEndpoint()}/revoke-self`);
  }

  #getUnwrapEndpoint() {
    return this.#removeDoubleSlash(`${this.#getWrappingEndpoint()}/unwrap`);
  }

  #getWrapEndpoint() {
    return this.#removeDoubleSlash(`${this.#getWrappingEndpoint()}/wrap`);
  }

  #getEnginesEndpoint(engineName = '') {
    let url = `${this.#getSysEndpoint()}/internal/ui/mounts`;

    if (engineName !== '') {
      url = `${url}/${engineName}`;
    }

    return this.#removeDoubleSlash(url);
  }

  #getSecretsEndpoint(engine, subkeys) {
    return this.#getEndpoint(engine, subkeys, 'metadata');
  }

  #getSecretDataEndpoint(engine, subkeys) {
    return this.#getEndpoint(engine, subkeys, 'data');
  }

  #getEndpoint(engine, subkeys, extraPathEngineV2 = '') {
    let url = `${this.#getBaseEndpoint()}/${engine.name}`;

    if (engine?.options?.version === '2') {
      url = `${url}/${extraPathEngineV2}`;
    }

    if (subkeys.length > 0) {
      const encodedSubkeys = subkeys.map(key => {
        if (this.#isSecretAFolder(key)) {
          // If it's a folder, return it as is (do not encode).
          return key;
        } else {
          // If it's not a folder, URL-encode it.
          return encodeURIComponent(key);
        }
      });
      url = `${url}/${encodedSubkeys.join(this.#SEPARATOR)}`;
    }

    return this.#removeDoubleSlash(url);
  }

  #getJsonHeader() {
    return {
      'Content-Type': 'application/json'
    };
  }

  #getVaultTokenHeader(token) {
    return {
      'X-Vault-Token': token.client_token
    };
  }

  #getWrappingTTLHeader(ttl) {
    return {
      'X-Vault-Wrap-TTL': ttl
    };
  }
}
