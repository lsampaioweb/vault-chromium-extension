import { dependencies as coreDependencies } from './core.js';
import { CryptoProviderBase } from '../crypto/base.js';
import { initializePage } from './page-initializer.js';

// Export dependencies.
export const dependencies = {
  ...coreDependencies,
  CryptoProviderBase
};

// Initialize the page startup.
initializePage(dependencies);
