import { dependencies as coreDependencies } from './core.js';
import { Password } from '../core/password.js';
import { initializePage } from './page-initializer.js';

// Export dependencies.
export const dependencies = {
  ...coreDependencies,
  Password
};

// Initialize the page startup.
initializePage(dependencies);
