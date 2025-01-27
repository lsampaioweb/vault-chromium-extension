import { Notification } from './libs/notification.js';
import { I18n } from './libs/i18n.js';
import { Form } from './libs/forms.js';
import { Pagination } from './libs/pagination.js';
import { VaultStorage } from './libs/storage.js';

export { I18n };
export { HTMLReplacer } from './libs/html-replace.js';
export { Crypto } from './libs/crypto.js';

export const notification = new Notification(document.getElementById('notify'));
export const storage = new VaultStorage(browser.storage.session);
export const form = new Form(notification);
export const pagination = new Pagination(form);

export const Link = {
  LoginPage: '/html/login/index.html',
  SecretsList: '/html/secrets/list.html',
  SecretsAdd: '/html/secrets/add.html'
};

// Change it to true to enable the test page.
export const DEBUG = false;

function showingHiddenPages() {
  if (DEBUG) {
    form.show(document.getElementById('page_test'));
  }
}

// Call the function after the page has finished loading.
document.addEventListener('DOMContentLoaded', I18n.localize(document), false);

// Show or hide the link for the hidden (testing) pages.
document.addEventListener('DOMContentLoaded', showingHiddenPages, false);
