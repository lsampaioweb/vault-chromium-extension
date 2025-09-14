import { dependencies as coreDependencies } from './core.js';
import { initializePage } from './page-initializer.js';

// Export dependencies.
export const dependencies = {
  ...coreDependencies
};

// Initialize the page startup.
initializePage(dependencies);
