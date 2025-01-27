import { I18n, notification, HTMLReplacer, storage, form, Link, Crypto } from '../common.js';
import { Vault } from '../libs/vault.js';
import { Page } from './list-page.js';

const SECRET_LIST_PAGE_ID_PATTERN = 'secret_list_page_';
const ELEMENTS_PER_PAGE = 4;
const MAXIMUM_NUMBER_OF_PAGINATION_BUTTONS = 11;
let currentDisplayingPageNumber = 1;
let quantityOfFramesInPage = 0;
let repliesReceived = 0;
let credentialsInserted = false;
let credentialsInsertedMessage = '';

async function mainLoaded() {
  try {
    const token = await storage.getToken();

    if (Vault.isTokenValid(token)) {
      showPage();
    } else {
      redirectToLoginPage();
    }
  } catch (error) {
    notification.error(error);
  }
}

async function showPage() {
  const inputSearch = Page.getInputSearch();
  const btnSearch = Page.getButtonSearch();
  const btnNewSecret = Page.getButtonNewSecret();

  form.addEnterKeydownListener(inputSearch, btnSearch);

  form.addClickListener(btnSearch, searchSecret);

  form.addClickListener(btnNewSecret, newSecret);

  Page.setFocusOnFirstElementOrFirstEmpty();

  await listSecretBasedOnCurrentPage();
}

function redirectToLoginPage() {
  location.href = Link.LoginPage;
}

function newSecret() {
  location.href = Link.SecretsAdd;
}

async function editSecret(secret) {
  try {
    let url = `${Link.SecretsAdd}?secretname=${encodeURIComponent(secret.fullName)}`;

    const search = Page.getInputSearch();
    url = `${url}&search=${encodeURIComponent(search.value)}`;
    url = `${url}&page=${encodeURIComponent(currentDisplayingPageNumber)}`;

    location.href = url;
  } catch (error) {
    notification.error(error);
  }
}

async function listSecretBasedOnCurrentPage() {
  form.setValue(Page.getInputSearch(), await getSearchText());

  const btnSearch = Page.getButtonSearch();
  btnSearch?.click();
}

async function getSearchText() {
  const searchFromQueryString = Page.getSearchFromQueryString();

  if (searchFromQueryString) {
    return searchFromQueryString;
  } else {
    return await Page.getHostnameFromCurrentActiveTab();
  }
}

async function searchSecret(event, pageNumber = 1) {
  try {
    notification.clear();

    const search = Page.getInputSearch();

    const result = form.validate({ required: [search] }, Page.isValid);
    if (result) {
      showSearchLoading();

      await searchSecretsByText(search.value, getPageNumber(pageNumber));

      hideSearchLoading();
    }
  } catch (error) {
    hideSearchLoading();

    notification.error(error);
  } finally {
    Page.setFocusOnFirstElementOrFirstEmpty();
  }
}

function showSearchLoading() {
  form.disable(Page.getButtonSearch());

  notification.info(I18n.getMessage('message_connecting'), { removeOption: false });
}

function hideSearchLoading() {
  form.enable(Page.getButtonSearch());

  notification.clear();
}

function getPageNumber(pageNumber) {
  if (pageNumber == 1) {
    const pageFromQueryString = Page.getPageFromQueryString();

    if (pageFromQueryString) {
      // Clear the querystring to avoid future searches using these same values.
      Page.deleteAllQueryStrings();

      pageNumber = pageFromQueryString;
    }
  }

  return isNaN(pageNumber) ? 1 : Number(pageNumber);
}

async function searchSecretsByText(text, pageNumber) {
  const token = await storage.getToken();

  if (!Vault.isTokenValid(token)) {
    redirectToLoginPage();
    return;
  }

  form.clear(Page.getSecretList());
  form.clear(Page.getPaginationBar());

  const vault = new Vault(await storage.getUrl(), token);
  const username = await storage.getUsername();

  text = Page.getAllSubdomains(text);

  const secrets = await vault.getSecretsByText(text, username);

  if (secrets.length > 0) {
    displaySecrets(secrets, pageNumber);
  }
}

function displaySecrets(secrets, pageNumber) {
  insertSecretsInForm(secrets);

  displaySecretsOnPage(pageNumber);
}

function insertSecretsInForm(secrets) {
  const fragSecretList = document.createDocumentFragment();

  const secretList = Page.getSecretList();
  const secretPage = Page.getSecretPage();
  const secretTemplate = Page.getSecretTemplate();

  const usernameKeys = I18n.getMessage('usernameKeys');
  const passwordKeys = I18n.getMessage('passwordKeys');
  const tokenKeys = I18n.getMessage('tokenKeys');

  let insertedSecrets = 0;
  let newPage;

  for (const secret of secrets) {
    const secretElement = secretTemplate.cloneNode(true);

    const user = Page.getValueIfDataHasKey(secret.data, usernameKeys);
    const password = Page.getValueIfDataHasKey(secret.data, passwordKeys);
    const token = Page.getValueIfDataHasKey(secret.data, tokenKeys);

    if ((user) && (password)) {
      replaceHTMLWithCredentials(secretElement, secret, user, password);
    } else if (token) {
      replaceHTMLWithToken(secretElement, secret, token);
    } else {
      continue;
    }

    if ((insertedSecrets == 0) || (insertedSecrets % ELEMENTS_PER_PAGE == 0)) {
      newPage = secretPage.cloneNode();
      newPage.id = SECRET_LIST_PAGE_ID_PATTERN + ((insertedSecrets / ELEMENTS_PER_PAGE) + 1);

      fragSecretList.appendChild(newPage);
    }

    newPage.appendChild(secretElement);
    insertedSecrets++;
  }

  secretList.appendChild(fragSecretList);
}

function displaySecretsOnPage(page = 1) {
  const secretList = Page.getSecretList();
  const quantityOfPages = secretList.childNodes.length;

  if ((quantityOfPages < page) && (page > 1)) {
    // There are less pages than the informed page. Then, we need to go one page below.
    displaySecretsOnPage(--page);
  }

  Page.createPaginationBar(quantityOfPages, page, displaySecretsOnPage, MAXIMUM_NUMBER_OF_PAGINATION_BUTTONS);

  if (currentDisplayingPageNumber != page) {
    let currentPage = document.getElementById(SECRET_LIST_PAGE_ID_PATTERN + currentDisplayingPageNumber);

    form.hide(currentPage);

    currentDisplayingPageNumber = page;
  }

  let newPage = document.getElementById(SECRET_LIST_PAGE_ID_PATTERN + page);
  form.show(newPage);
}

function replaceHTMLWithCredentials(element, secret, user, password) {
  const secretName = form.cutTextAfter(secret.fullName);
  const secretType = form.cutTextAfter(`${I18n.getMessage('label_user')}: ${user}`);
  const textCopyValue = I18n.getMessage('button_copy_password');

  const keyValuesToReplace = getKeyValuesToReplace(secretName, secretType, textCopyValue);

  replaceHtml(element, keyValuesToReplace);

  const buttons = element.getElementsByTagName('button');

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];

    let callback;
    switch (i) {
      case 0:
        callback = fillCredentialsInPage.bind(null, user, password, secret);
        break;
      case 1:
        callback = copyStringToClipboard.bind(null, user);
        break;
      case 2:
        callback = copySecretToClipboard.bind(null, password, secret);
        break;
      case 3:
        callback = editSecret.bind(null, secret);
        break;
      case 4:
        callback = deleteSecret.bind(null, secret);
        break;
    }

    form.addClickListener(button, callback);
  }
}

async function replaceHTMLWithToken(element, secret, token) {
  const secretName = form.cutTextAfter(secret.fullName, 55);
  const secretType = form.cutTextAfter(`${I18n.getMessage('label_token')}: **********`, 30);
  const textCopyValue = I18n.getMessage('button_copy_token');

  const keyValuesToReplace = getKeyValuesToReplace(secretName, secretType, textCopyValue);

  replaceHtml(element, keyValuesToReplace);

  const buttons = element.getElementsByTagName('button');

  // When it's a token, it does not need the copy user button.
  removeCopyUserButton(buttons);

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];

    let callback;
    switch (i) {
      case 0:
        callback = fillTokenInPage.bind(null, token, secret);
        break;
      case 1:
        callback = copySecretToClipboard.bind(null, token, secret);
        break;
      case 2:
        callback = editSecret.bind(null, secret);
        break;
      case 3:
        callback = deleteSecret.bind(null, secret);
        break;
    }

    form.addClickListener(button, callback);
  }
}

function removeCopyUserButton(buttons) {
  const userButtonTitle = I18n.getMessage('button_copy_user');

  for (const button of buttons) {
    if (button.title === userButtonTitle) {
      button.remove();
      break;
    }
  }
}

function getKeyValuesToReplace(secretName, text, textCopyValue) {
  return new Map([
    ['__template_title__', secretName],
    ['__template_body__', text],
    ['__template_copy_value__', textCopyValue]
  ]);
}

function replaceHtml(element, keyValuesToReplace) {
  const match = {
    regex: /(__template_\w+__)/g,
    func: replaceHTMLCallback(keyValuesToReplace)
  };

  HTMLReplacer.replace(element, match);
}

function replaceHTMLCallback(keyValuesToReplace) {
  return function (match, v1) {
    return v1 ? keyValuesToReplace.get(v1) : match;
  };
}

async function copySecretToClipboard(text, secret) {
  try {
    copyStringToClipboard(await Crypto.decrypt(text, secret.fullName));
  } catch (error) {
    notification.clear().error(error);
  }
}

async function copyStringToClipboard(text) {
  try {
    await Page.copyValueToClipboard(text);
  } catch (error) {
    notification.clear().error(error);
  }
}

async function fillCredentialsInPage(username, password, secret) {
  try {
    fillContentInPage({
      message: 'fillCredentialsInPage',
      username,
      password: await Crypto.decrypt(password, secret.fullName)
    });
  } catch (error) {
    notification.clear().error(error);
  }
}

async function fillTokenInPage(token, secret) {
  try {
    fillContentInPage({
      message: 'fillTokenInPage',
      token: await Crypto.decrypt(token, secret.fullName)
    });
  } catch (error) {
    notification.clear().error(error);
  }
}

async function fillContentInPage(content) {
  try {
    const tab = await Page.getCurrentAndActiveTab();

    if (tab.url) {
      const allFrames = await Page.getAllFramesFrom(tab.id);
      quantityOfFramesInPage = allFrames.length;
      repliesReceived = 0;
      credentialsInserted = false;

      browser.tabs
        .sendMessage(tab.id, content)
        .catch(sendMessageCallback);
    }
  } catch (error) {
    notification.clear().error(error);
  }
}

function sendMessageCallback() {
  const lastError = chrome.runtime.lastError;

  if (lastError) {
    // Could not establish connection. Receiving end does not exist.
    return;
  }
}

async function deleteSecret(secret) {
  try {
    const token = await storage.getToken();

    if (!Vault.isTokenValid(token)) {
      redirectToLoginPage();
      return;
    }

    let message = I18n.getMessage('confirm_delete_secret', [secret.fullName]);

    if (confirm(message)) {
      const subkeys = [].concat([secret.path]).concat([secret.name]);

      const vault = new Vault(await storage.getUrl(), token);
      await vault.deleteSecret(secret.engine, subkeys);

      // Do a new search to reload the page.
      await searchSecret(null, currentDisplayingPageNumber);

      message = I18n.getMessage('delete_secret_successful', [secret.fullName]);
      notification.info(message, { removeOption: true });
    }
  } catch (error) {
    notification.error(error);
  }
}

chrome.runtime.onMessage.addListener((request) => {
  try {
    repliesReceived += 1;

    if (!credentialsInserted) {
      if (fillCredentialsWasSuccessful(request)) {
        credentialsInserted = true;
        credentialsInsertedMessage = request.message;
      }
    }

    if (repliesReceived != quantityOfFramesInPage) {
      return;
    }

    notification.clear();

    const NOTIFICATION_TIMEOUT = 5000;
    if (credentialsInserted) {
      let message = I18n.getMessage(credentialsInsertedMessage);

      notification.info(message, { time: NOTIFICATION_TIMEOUT });
    }
    else {
      let message = I18n.getMessage(request.message);

      notification.error(message, { time: NOTIFICATION_TIMEOUT });
    }
  } catch (error) {
    console.error(error);
  }
});

function fillCredentialsWasSuccessful(request) {
  return (request.message === 'fillCredentialsInPageSuccess') || (request.message === 'fillTokenInPageSuccess');
}

// Call the function after that page has finished loading.
document.addEventListener('DOMContentLoaded', mainLoaded, false);
