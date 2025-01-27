import { I18n, notification, storage, form, Link } from '../common.js';
import { Vault } from '../libs/vault.js';
import { Page } from './index-page.js';

async function mainLoaded() {
  try {
    const token = await storage.getToken();
    if (Vault.isTokenValid(token)) {
      showLoggedInPage();
    } else {
      showLoginPage();
    }
  } catch (error) {
    notification.error(error);
  }
}

async function showLoggedInPage() {
  hideLoginForm();
  showLogoutForm();

  const loggedinUrl = I18n.getMessage('already_loggedin_url', [await storage.getUrl()]);
  const loggedinUser = I18n.getMessage('already_loggedin_user', [await storage.getUsername()]);

  form.setValue(Page.getLabelLoggedInUrl(), loggedinUrl);
  form.setValue(Page.getLabelLoggedInUser(), loggedinUser);

  form.addClickListener(Page.getButtonLogout(), logout);
}

async function showLoginPage() {
  hideLogoutForm();
  showLoginForm();

  const url = Page.getInputUrl();
  const authMethod = Page.getInputAuthMethod();
  const username = Page.getInputUsername();
  const password = Page.getInputPassword();

  // Set value of the elements if there is any in the storage.
  form.setValue(url, await storage.getUrl());
  form.setValue(username, await storage.getUsername());

  const btnLogin = Page.getButtonLogin();
  form.addClickListener(btnLogin, login);

  form.addEnterKeydownListener(url, btnLogin);
  form.addEnterKeydownListener(authMethod, btnLogin);
  form.addEnterKeydownListener(username, btnLogin);
  form.addEnterKeydownListener(password, btnLogin);

  Page.setFocusOnFirstElementOrFirstEmpty();
}

async function login() {
  try {
    notification.clear();

    const url = Page.getInputUrl();
    const authMethod = Page.getInputAuthMethod();
    const username = Page.getInputUsername();
    const password = Page.getInputPassword();

    const isValid = form.validate({ required: [url, authMethod, username, password] }, Page.isValid);
    if (isValid) {
      showLoginLoading();

      storage.setUrl(url.value);
      storage.setUsername(username.value);

      const vault = new Vault(url.value);
      const result = await vault.login(username.value, password.value, authMethod.value);

      storage.setToken(result.token);

      redirectToSecretsPage();
    }
  } catch (error) {
    hideLoginLoading();
    notification.error(error);
  }
}

async function logout() {
  try {
    notification.clear();

    const token = await storage.getToken();

    if (Vault.isTokenValid(token)) {
      showLogoutLoading();

      const vault = new Vault(await storage.getUrl(), token);
      await vault.logout();
    }

    location.reload();
  } catch (error) {
    hideLogoutLoading();
    notification.error(error);
  } finally {
    storage.setToken(null);
  }
}

function redirectToSecretsPage() {
  location.href = Link.SecretsList;
}

function showLoginForm() {
  form.show(Page.getDivLogin());
}

function hideLoginForm() {
  form.hide(Page.getDivLogin());
}

function showLogoutForm() {
  form.show(Page.getDivLogout());
}

function hideLogoutForm() {
  form.hide(Page.getDivLogout());
}

function showLoginLoading() {
  form.disable(Page.getButtonLogin());

  notification.info(I18n.getMessage('message_connecting'), { removeOption: false });
}

function showLogoutLoading() {
  form.disable(Page.getButtonLogout());

  notification.info(I18n.getMessage('message_connecting'), { removeOption: false });
}

function hideLoginLoading() {
  form.enable(Page.getButtonLogin());

  notification.clear();
}

function hideLogoutLoading() {
  form.enable(Page.getButtonLogout());

  notification.clear();
}

// Call the function after that page has finished loading.
document.addEventListener('DOMContentLoaded', mainLoaded, false);
