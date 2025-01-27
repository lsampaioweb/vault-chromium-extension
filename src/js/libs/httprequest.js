import { I18n } from './i18n.js';

export class HttpRequest {
  #RequestMethod = {
    LIST: 'LIST',
    GET: 'GET',
    POST: 'POST',
    DELETE: 'DELETE',
    PATCH: 'PATCH'
  };

  #i18n = {
    HTTP_REQUEST_ERROR: 'http_request_error'
  };

  get(endpoint, headers) {
    return this.#request(this.#RequestMethod.GET, endpoint, headers);
  }

  list(endpoint, headers) {
    return this.#request(this.#RequestMethod.LIST, endpoint, headers);
  }

  post(endpoint, headers, body) {
    return this.#request(this.#RequestMethod.POST, endpoint, headers, body);
  }

  patch(endpoint, headers, body) {
    return this.#request(this.#RequestMethod.PATCH, endpoint, headers, body);
  }

  delete(endpoint, headers) {
    return this.#request(this.#RequestMethod.DELETE, endpoint, headers);
  }

  async #request(method, endpoint, headers = null, body = null) {
    try {
      const options = {
        method,
        headers,
        body
      };

      const response = await fetch(endpoint, options);

      return response;
    } catch (error) {
      const errorMessage = I18n.getMessage(this.#i18n.HTTP_REQUEST_ERROR, [endpoint]);

      throw new Error(errorMessage);
    }
  }
}
