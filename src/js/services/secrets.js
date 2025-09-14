import { dependencies as coreDependencies } from './core.js';
import { Password } from '../core/password.js';
import { VaultCrypto } from '../crypto/vaultcrypto.js';
import { Pagination } from '../ui/pagination.js';
import { initializePage } from './page-initializer.js';

// Create the single, shared instance of pagination.
const pagination = new Pagination(coreDependencies.form);

/**
 * Export dependencies for secrets controllers.
 * This includes both add/edit and list secret functionality.
 */
export const dependencies = {
  ...coreDependencies,
  VaultCrypto,
  Password,
  pagination
};

// Initialize the page startup.
initializePage(dependencies);
