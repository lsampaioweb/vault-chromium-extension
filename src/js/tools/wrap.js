import { I18n, notification, storage, form, Link } from '../common.js';
import { Vault } from '../libs/vault.js';
import { Page } from './wrap-page.js';

const TabType = {
  SIMPLE: 'simple',
  COMPLEX: 'complex'
};

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

function redirectToLoginPage() {
  location.href = Link.LoginPage;
}

async function showPage() {
  try {
    const btnWrapTypeSimple = Page.getButtonWrapTypeSimple();
    const btnWrapTypeComplex = Page.getButtonWrapTypeComplex();

    const wrapKey = Page.getInputWrapKey();
    const wrapValue = Page.getInputWrapValue();
    const wrapTTL = Page.getInputWrapTTL();

    const btnWrap = Page.getButtonWrap();

    const wrapResult = Page.getWrapResult();
    const wrapResultCopyImg = Page.getWrapResultCopyImg();

    form.addClickListener(btnWrapTypeSimple, Page.openTab('div_wrap_type_simple'));
    form.addClickListener(btnWrapTypeComplex, Page.openTab('div_wrap_type_complex'));

    form.addClickListener(btnWrap, wrapHandler);
    form.addClickListener(wrapResult, copyResultToClipboard);
    form.addClickListener(wrapResultCopyImg, copyResultToClipboard);

    form.addEnterKeydownListener(wrapKey, btnWrap);
    form.addEnterKeydownListener(wrapValue, btnWrap);
    form.addEnterKeydownListener(wrapTTL, btnWrap);

    showWrapTypeSimpleTab();
  } catch (error) {
    notification.error(error);
  }
}

function showWrapTypeSimpleTab() {
  const button = Page.getButtonWrapTypeSimple();

  button?.click();
}

async function wrapHandler() {
  try {
    notification.clear();

    const token = await storage.getToken();

    if (!Vault.isTokenValid(token)) {
      redirectToLoginPage();
      return;
    }

    const wrapTTL = Page.getInputWrapTTL();
    const wrapLabel = Page.getLabelWrapResult();
    const wrapResult = Page.getWrapResult();

    form.setValue(wrapResult, "");
    form.hide(wrapLabel);

    let isValid;
    let data;

    const selectedTab = getSelectedSecretType();
    if (selectedTab === TabType.SIMPLE) {
      const wrapKey = Page.getInputWrapKey();
      const wrapValue = Page.getInputWrapValue();

      isValid = form.validate({ required: [wrapKey, wrapValue, wrapTTL] }, Page.isValid);

      const key = form.getValue(wrapKey);
      const value = form.getValue(wrapValue);

      data = { [key]: value };
    } else if (selectedTab === TabType.COMPLEX) {
      const wrapJson = Page.getInputWrapJson();

      isValid = form.validate({ required: [wrapJson, wrapTTL] }, Page.isValid);

      // Converts the string to a valid object.
      data = JSON.parse(form.getValue(wrapJson));
    }

    if (isValid) {
      showLoading();

      const vault = new Vault(await storage.getUrl(), token);

      const ttl = form.getValue(wrapTTL);

      const wrappedHash = await vault.wrap(data, `${ttl}m`);

      form.setValue(wrapResult, wrappedHash);
      form.show(wrapLabel);

      hideLoading();
    }
  } catch (error) {
    hideLoading();
    notification.error(error);
  }
}

function getSelectedSecretType() {
  const buttons = document.getElementsByClassName('tab_button');

  for (const button of buttons) {
    if (button.classList.contains('active')) {
      return button.id.replace(/button_wrap_type_(\w+)/g, '$1');
    }
  }

  return '';
}

function showLoading() {
  form.disable(Page.getButtonWrap());

  notification.info(I18n.getMessage('message_wrapping'), { removeOption: false });
}

function hideLoading() {
  form.enable(Page.getButtonWrap());

  notification.clear();
}

async function copyResultToClipboard(event) {
  try {
    await Page.copyElementToClipboard(Page.getWrapResult());

    // Cancel the default action.
    event.preventDefault();
  } catch (error) {
    notification.clear().error(error);
  }
}

// Call the function after that page has finished loading.
document.addEventListener('DOMContentLoaded', mainLoaded, false);
