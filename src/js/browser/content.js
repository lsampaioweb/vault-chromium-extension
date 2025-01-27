let notification = null;
let i18n = null;
let form = null;

(async () => {
  try {
    const { Notification } = await import(chrome.runtime.getURL('/js/libs/notification.js'));

    const { I18n } = await import(chrome.runtime.getURL('/js/libs/i18n.js'));

    const { Form } = await import(chrome.runtime.getURL('/js/libs/forms.js'));

    notification = new Notification(document.getElementById('notify'));

    i18n = I18n;

    form = new Form(notification);
  } catch (error) {
    console.error(error);
  }
})();

chrome.runtime.onMessage.addListener((request) => {
  try {
    switch (request.message) {
      case 'fillCredentialsInPage':
        handleFillCredentialsInPage(request);
        break;
      case 'fillTokenInPage':
        handleFillTokenInPage(request);
        break;
    }
  } catch (error) {
    console.error(error);
  }
});

function handleFillCredentialsInPage(request) {
  const username = getUsernameInput(document);
  const password = getPasswordInput(document);

  const foundUserField = fillContent(username, request.username);
  const foundPasswordField = fillContent(password, request.password);

  if ((foundUserField) || (foundPasswordField)) {
    sendMessageToExtention({
      message: 'fillCredentialsInPageSuccess'
    });
  } else {
    sendMessageToExtention({
      message: 'fillCredentialsInPageFailed'
    });
  }
}

function handleFillTokenInPage(request) {
  const token = getTokenInput(document);

  const foundTokenField = fillContent(token, request.token);

  if (foundTokenField) {
    sendMessageToExtention({
      message: 'fillTokenInPageSuccess'
    });
  } else {
    sendMessageToExtention({
      message: 'fillTokenInPageFailed'
    });
  }
}

function sendMessageToExtention(content) {
  try {
    browser.runtime.sendMessage(content);
  } catch (error) {
    console.error(error);
  }
}

function fillContent(element, value) {
  if (!element)
    return false;

  form.setFocus(element);
  form.setValue(element, value);

  element.dispatchEvent(createEvent('input'));
  element.dispatchEvent(createEvent('change'));

  form.blur(element);

  return true;
}

function createEvent(name) {
  return new Event(name, {
    bubbles: true,
    cancelable: true
  });
}

function getUsernameInput(parentElement) {
  const inputsToFind = i18n.getMessage('usernameInputsToFind');

  return searchInput(parentElement, inputsToFind, true);
}

function getPasswordInput(parentElement) {
  const inputsToFind = i18n.getMessage('passwordInputsToFind');

  return searchInput(parentElement, inputsToFind, true);
}

function getTokenInput(parentElement) {
  const inputsToFind = i18n.getMessage('tokenInputsToFind');

  return searchInput(parentElement, inputsToFind, true);
}

function searchInput(parentElement, matches, hasToBeVisible) {
  matches = matches?.split(',');

  for (const selector of matches) {
    const elements = parentElement.querySelectorAll(selector);

    for (const element of elements) {
      if ((hasToBeVisible) && (!form.isVisible(element))) {
        continue;
      }

      return element;
    }
  }

  return null;
}
