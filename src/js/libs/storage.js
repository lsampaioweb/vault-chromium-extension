class Storage {
  #storageType;

  constructor(storage) {
    this.#storageType = storage;
  }

  get(key) {
    return this.#storageType.get(key);
  }

  set(content) {
    return this.#storageType.set(content);
  }
}

export class VaultStorage extends Storage {
  async getUrl() {
    const result = await this.get('url');

    return result?.url ?? null;
  }

  async setUrl(value) {
    return await this.set({ url: value });
  }

  async getUsername() {
    const result = await this.get('username');

    return result?.username ?? null;
  }

  async setUsername(value) {
    return await this.set({ username: value });
  }

  async getToken() {
    const result = await this.get('token');

    return result?.token ?? null;
  }

  async setToken(value) {
    return await this.set({ token: value });
  }
}
