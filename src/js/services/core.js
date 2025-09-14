import '../browser/browser-polyfill.min.js';
import * as constants from '../core/constants.js';
import { I18n } from '../core/i18n.js';
import { ConsoleLogger } from '../core/consolelogger.js';
import { VaultStorage } from '../core/storage.js';
import { PromisePool } from '../core/promise-pool.js';
import { HTMLReplacer } from '../ui/html-replace.js';
import { I18nLocalizer } from '../ui/i18n-localizer.js';
import { Notification } from '../ui/notification.js';
import { Form } from '../ui/forms.js';
import { VaultUtils } from '../vault/utils.js';
import { VaultRequestBuilder } from '../vault/requestbuilder.js';
import { Vault } from '../vault/vault.js';

// Create the single, shared instance of logger.
const logger = new ConsoleLogger(constants.DEBUG);

// Create the single, shared instance of i18nLocalizer.
const i18nLocalizer = new I18nLocalizer(I18n, HTMLReplacer, logger);

// Create the single, shared instance of storage.
const storage = new VaultStorage(browser.storage.session);

// Create the single, shared instance of notification.
const notification = new Notification('notify', I18n);

// Create the single, shared instance of form.
const form = new Form(notification, I18n, logger);

// Create a factory object for Vault instances that injects dependencies.
const vaultFactory = {
  create: (endpoint, token = null) => {
    // Injects the shared dependencies into a new Vault instance.
    return new Vault({ constants, I18n, logger, PromisePool, VaultUtils, VaultRequestBuilder }, endpoint, token);
  }
};

// Export core dependencies as a single object for dependency injection.
export const dependencies = {
  constants,
  I18n,
  HTMLReplacer,
  logger,
  i18nLocalizer,
  storage,
  notification,
  form,
  PromisePool,
  VaultUtils,
  vaultFactory
};
