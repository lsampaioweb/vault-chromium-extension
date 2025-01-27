import { I18n, notification, storage, form, Link } from '../common.js';
import { Vault } from '../libs/vault.js';
import { Page } from './unwrap-page.js';

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
    const inputUnwrapHash = Page.getInputUnwrapHash();
    const btnUnwrap = Page.getButtonUnwrap();
    const unwrapResult = Page.getUnwrapResult();
    const unwrapResultCopyImg = Page.getUnwrapResultCopyImg();

    form.addEnterKeydownListener(inputUnwrapHash, btnUnwrap);

    form.addClickListener(btnUnwrap, unwrapHandler);
    form.addClickListener(unwrapResult, copyResultToClipboard);
    form.addClickListener(unwrapResultCopyImg, copyResultToClipboard);

    Page.setFocusOnFirstElementOrFirstEmpty();
  } catch (error) {
    notification.error(error);
  }
}

async function unwrapHandler() {
  try {
    notification.clear();

    const token = await storage.getToken();

    if (!Vault.isTokenValid(token)) {
      redirectToLoginPage();
      return;
    }

    const inputUnwrapHash = Page.getInputUnwrapHash();
    const unwrapLabel = Page.getLabelUnwrapResult();
    const unwrapResult = Page.getUnwrapResult();

    form.setValue(unwrapResult, "");
    form.hide(unwrapLabel);

    const result = form.validate({ required: [inputUnwrapHash] }, Page.isValid);
    if (result) {
      showLoading();

      const vault = new Vault(await storage.getUrl(), token);

      const unwrappedData = await vault.unwrap(inputUnwrapHash.value);

      const userFriendlyResult = formatUnwrappedData(unwrappedData);

      form.setValue(unwrapResult, userFriendlyResult);
      updateTextareaSize(unwrapResult, userFriendlyResult);
      form.show(unwrapLabel);

      hideLoading();
    }
  } catch (error) {
    hideLoading();

    notification.error(error);
  } finally {
    Page.setFocusOnFirstElementOrFirstEmpty();
  }
}

function formatUnwrappedData(data, asJson = true) {
  if (asJson) {
    // Pretty JSON.
    return JSON.stringify(data, null, 2);
  }

  // Fallback to key-value list format.
  let formattedResult = "";

  for (const [key, value] of Object.entries(data)) {
    formattedResult += `${key}: ${value}\n`;
  }

  return formattedResult;
}

function updateTextareaSize(textarea, content) {
  // Minimum number of rows for the textarea.
  const MIN_TEXTAREA_ROWS = 3;

  // Calculate the number of lines in the content.
  const lineCount = content.split('\n').length;

  // Set the rows attribute dynamically based on the line count and minimum rows.
  textarea.rows = Math.max(lineCount, MIN_TEXTAREA_ROWS);
}

async function copyResultToClipboard(event) {
  try {
    await Page.copyElementToClipboard(Page.getUnwrapResult());

    // Cancel the default action.
    event.preventDefault();
  } catch (error) {
    notification.clear().error(error);
  }
}

function showLoading() {
  form.disable(Page.getButtonUnwrap());

  notification.info(I18n.getMessage('message_unwrapping'), { removeOption: false });
}

function hideLoading() {
  form.enable(Page.getButtonUnwrap());

  notification.clear();
}

// Call the function after that page has finished loading.
document.addEventListener('DOMContentLoaded', mainLoaded, false);
