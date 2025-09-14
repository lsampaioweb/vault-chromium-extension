// Shared, exported constants for the Vault library modules.

// If DEBUG is true, additional logging and testing features are enabled.
export const DEBUG = true;

// The path separator character is used by the builder and utils.
export const PATH_SEPARATOR = '/';

// Secret names that should be ignored during secret discovery and processing.
export const IGNORED_SECRET_NAMES = new Set(['_data', '_do-not-delete']);

// Named links for different pages in the application.
export const Link = {
  LoginPage: '/html/login/index.html',
  SecretsList: '/html/secrets/list.html',
  SecretsAdd: '/html/secrets/add.html'
};

// Request message constants for communication between content scripts and extension.
export const REQUEST_MESSAGE_ID = {
  // Messages sent from extension to content script.
  FILL_CREDENTIALS_IN_PAGE: 'fillCredentialsInPage',
  FILL_TOKEN_IN_PAGE: 'fillTokenInPage',

  // Success response messages from content script.
  FILL_CREDENTIALS_SUCCESS: 'ui_message_fill_credentials_success',
  FILL_TOKEN_SUCCESS: 'ui_message_fill_token_success',

  // Error response messages from content script.
  FILL_CREDENTIALS_FAILED: 'error_page_fill_credentials_failed',
  FILL_TOKEN_FAILED: 'error_page_fill_token_failed'
};
