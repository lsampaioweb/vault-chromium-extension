import { I18n, notification, storage, form, Link, Crypto } from '../common.js';
import { Vault } from '../libs/vault.js';
import { Page } from './add-page.js';
import { Password } from '../libs/password.js';

const ELEMENT_IN_ROOT_PATH = '/';
const TAB_TYPE_CREDENTIAL = 'credential';
const TAB_TYPE_TOKEN = 'token';
let engines;
let secretsOfEngine;

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

function redirectToSecretsPage() {
  let url = Link.SecretsList;

  const urlParams = Page.getURLSearchParams();
  if (urlParams.size > 0) {
    url = `${url}?${urlParams.toString()}`;
  }

  location.href = url;
}

async function showPage() {
  const engine = Page.getInputEngine();
  const secretPath = Page.getInputPath();
  const secretName = Page.getInputSecretName();
  const secretComment = Page.getInputSecretComment();

  const btnSecretTypeCredential = Page.getButtonSecretTypeCredential();
  const btnSecretTypeToken = Page.getButtonSecretTypeToken();

  const username = Page.getInputUsername();
  const password = Page.getInputPassword();
  const btnGenerateRandomPassword = Page.getButtonGenerateRandomPassword();

  const token = Page.getInputToken();
  const btnGenerateRandomToken = Page.getButtonGenerateRandomToken();

  const btnSave = Page.getButtonSave();
  const btnCancel = Page.getButtonCancel();

  form.addChangeListener(engine, onChangeEngine);

  form.addClickListener(btnSecretTypeCredential, Page.openTab('div_secret_type_credential'));
  form.addClickListener(btnSecretTypeToken, Page.openTab('div_secret_type_token'));

  form.addClickListener(btnGenerateRandomPassword, generateRandomPassword);
  form.addClickListener(btnGenerateRandomToken, generateRandomToken);

  form.addClickListener(btnSave, save);
  form.addClickListener(btnCancel, cancel);

  form.addEnterKeydownListener(engine, btnSave);
  form.addEnterKeydownListener(secretPath, btnSave);
  form.addEnterKeydownListener(secretName, btnSave);
  form.addEnterKeydownListener(username, btnSave);
  form.addEnterKeydownListener(password, btnSave);
  form.addEnterKeydownListener(token, btnSave);
  form.addEnterKeydownListener(secretComment, btnSave);

  await prepareForm();
}

async function prepareForm() {
  const token = await storage.getToken();
  const vault = new Vault(await storage.getUrl(), token);

  await populateElementsInTheForm(vault);

  const secret = await getNewOrEditSecret();
  await selectElementsInTheForm(vault, secret);

  Page.setFocusOnFirstElementOrFirstEmpty();

  form.enable(Page.getButtonSave());
}

async function getNewOrEditSecret() {
  const queryString = Page.getSecretNameFromQueryString();

  if (queryString) {
    return extractSecretFrom(queryString);
  } else {
    const obj = {
      fullName: '',
      engine: {
        name: ''
      },
      path: '',
      name: await Page.getHostnameFromCurrentActiveTab(),
    };

    return obj;
  }
}

function extractSecretFrom(value) {
  /*
  Regex Explanation:
  ^\/?                       // Matches an optional leading slash at the start of the string.
  ([^/]+)                    // Captures the engine name (one or more characters that are not slashes).
  (?:\/([^/]+(?:\/[^/]+)*))? // Non-capturing group to match the path, allowing for multiple segments separated by slashes. This group is optional.
  \/([^/]+)                  // Matches a slash followed by one or more non-slash characters (captures the secret name).
  \/?$                       // Allows for an optional trailing slash at the end of the string.
  */
  const regex = /^\/?([^/]+)(?:\/([^/]+(?:\/[^/]+)*))?\/([^/]+)\/?$/;

  value = value.replace(/\/\/+/g, '/');

  const match = value.match(regex);

  const obj = {
    fullName: value,
    engine: {
      name: match?.[1] || ''
    },
    path: match?.[2] || '',
    name: match?.[3] || ''
  };

  return obj;
}

async function populateElementsInTheForm(vault) {
  await populateEngines(vault);
}

async function populateEngines(vault) {
  const engineElement = Page.getInputEngine();
  form.clear(engineElement);
  engineElement.add(createOption(I18n.getMessage('message_loading')));

  engines = await vault.getKVEngines();

  form.clear(engineElement);
  for (const engine of engines) {
    engineElement.add(createOption(removeLastDash(engine.name)));
  }
}

async function populateSecretPaths(vault, selectedEngine) {
  const pathElement = Page.getInputPath();
  form.clear(pathElement);
  pathElement.add(createOption(I18n.getMessage('message_loading')));

  const username = await storage.getUsername();

  secretsOfEngine = await vault.getSecretsByTextOnEngine('', username, selectedEngine);
  const uniquePaths = extractUniquePathsFromSecrets(secretsOfEngine);

  form.clear(pathElement);
  if (!selectedEngine.isPersonal) {
    pathElement.add(createOption(ELEMENT_IN_ROOT_PATH));
  } else if (uniquePaths.length == 0) {
    pathElement.add(createOption(`${username}/`));
  }

  for (const path of uniquePaths) {
    pathElement.add(createOption(path));
  }
}

function removeLastDash(name) {
  return name.replace('/', '');
}

function createOption(value, text) {
  const option = document.createElement('option');

  option.value = value;
  option.text = (text) || value;

  return option;
}

async function selectElementsInTheForm(vault, selectedSecret) {
  selectEngine(selectedSecret);

  await populateSecretPaths(vault, selectedSecret.engine);

  selectedSecret = selectSecretPath(selectedSecret);

  setSecretTypeCredentialTab(selectedSecret);

  setExtraAttributesInForm(selectedSecret);
}

function selectEngine(selectedSecret) {
  const engineElement = Page.getInputEngine();

  if (selectedSecret.engine.name) {
    engineElement.value = removeLastDash(selectedSecret.engine.name);
  }

  // For new secrets, this will be the first element.
  selectedSecret.engine = engines.find((x) => x.name === `${engineElement.value}/`);
}

function selectSecretPath(selectedSecret) {
  const pathElement = Page.getInputPath();

  if (selectedSecret.path) {
    pathElement.value = `${selectedSecret.path}/`;
  }

  if (pathElement.selectedIndex < 0) {
    pathElement.selectedIndex = 0;
  }

  // For new secrets, this will be the first element.
  const foundSecret = secretsOfEngine.find((x) => x.fullName === selectedSecret.fullName);
  if (foundSecret) {
    selectedSecret = foundSecret;
  }

  return selectedSecret;
}

function extractUniquePathsFromSecrets(secrets) {
  let list = [];

  for (const secret of secrets) {
    addUniquePathToArray(list, secret);
  }

  return list;
}

function addUniquePathToArray(array, secret) {
  if (!secret.path) {
    return;
  }

  const paths = secret.path.split('/');

  let i = 0;
  let path = '';
  while (i < paths.length) {
    path += `${paths[i]}/`;

    i++;
    if (array.some(x => x === path)) {
      // We don't want duplicated values.
      continue;
    }

    array.push(path);
  }
}

async function setSecretTypeCredentialTab(selectedSecret) {
  let username = await storage.getUsername();

  if (selectedSecret.data) {
    const usernameKeys = I18n.getMessage('usernameKeys');
    const user = Page.getValueIfDataHasKey(selectedSecret.data, usernameKeys);

    if (user) {
      username = user;
    } else {
      const tokenKeys = I18n.getMessage('tokenKeys');
      const token = Page.getValueIfDataHasKey(selectedSecret.data, tokenKeys);

      if (token) {
        showTokenSecretTypeTab();
        return;
      }
    }
  }

  form.setValue(Page.getInputUsername(), username);
  showCredentialSecretTypeTab();
}

function setExtraAttributesInForm(selectedSecret) {
  form.setValue(Page.getInputSecretName(), selectedSecret.name);

  if (selectedSecret.data) {
    const commentKeys = I18n.getMessage('commentKeys');
    const comment = Page.getValueIfDataHasKey(selectedSecret.data, commentKeys);

    if (comment) {
      form.setValue(Page.getInputSecretComment(), comment);
    }
  }
}

function showCredentialSecretTypeTab() {
  const button = Page.getButtonSecretTypeCredential();

  button?.click();
}

function showTokenSecretTypeTab() {
  const button = Page.getButtonSecretTypeToken();

  button?.click();
}

async function onChangeEngine() {
  const token = await storage.getToken();
  if (Vault.isTokenValid(token)) {
    const vault = new Vault(await storage.getUrl(), token);

    const engine = Page.getInputEngine();

    const secret = await getNewOrEditSecret();
    secret.engine.name = engine.value;

    selectElementsInTheForm(vault, secret);
  } else {
    redirectToLoginPage();
  }
}

async function save() {
  try {
    notification.clear();

    const token = await storage.getToken();

    if (!Vault.isTokenValid(token)) {
      redirectToLoginPage();
      return;
    }

    const engineElement = Page.getInputEngine();
    const secretPathElement = Page.getInputPath();
    const secretNameElement = Page.getInputSecretName();
    const secretCommentElement = Page.getInputSecretComment();

    let isValid;
    let data;

    const selectedTab = getSelectedSecretType();
    if (selectedTab === TAB_TYPE_CREDENTIAL) {
      const username = Page.getInputUsername();
      const password = Page.getInputPassword();

      isValid = form.validate({ required: [engineElement, secretNameElement, username, password] }, Page.isValid);

      data = {
        user: username.value,
        pass: password.value
      };
    } else if (selectedTab === TAB_TYPE_TOKEN) {
      const token = Page.getInputToken();

      isValid = form.validate({ required: [engineElement, secretNameElement, token] }, Page.isValid);

      data = {
        token: token.value
      };
    }

    if (isValid) {
      showSavingMessage();

      const engine = engines.find((x) => x.name === `${engineElement.value}/`);

      let path = '';
      if (secretPathElement.value !== ELEMENT_IN_ROOT_PATH) {
        path = secretPathElement.value;
      }
      const subkeys = [].concat([path]).concat([secretNameElement.value]);

      const vault = new Vault(await storage.getUrl(), token);

      let fullName = vault.getSecretFullPath(engine, subkeys)

      if (selectedTab === TAB_TYPE_CREDENTIAL) {
        data.pass = await Crypto.encrypt(data.pass, fullName);
      } else if (selectedTab === TAB_TYPE_TOKEN) {
        data.token = await Crypto.encrypt(data.token, fullName);
      }

      data.comment = form.getValue(secretCommentElement);

      const editingSecret = await getEditingSecretOrNull();
      if (editingSecret) {
        // Merge the processed data with the correctly keyed data.
        data = {
          ...Page.processObject(editingSecret.data),
          ...data
        };
      }

      await vault.addSecret(engine, subkeys, data);

      redirectToSecretsPage();
    }
  } catch (error) {
    hideSavingMessage();
    notification.error(error);
  }
}

async function getEditingSecretOrNull() {
  const secret = await getNewOrEditSecret();

  return secretsOfEngine.find((x) => x.fullName === secret.fullName);
}

function getSelectedSecretType() {
  const buttons = document.getElementsByClassName('tab_button');

  for (const button of buttons) {
    if (button.classList.contains('active')) {
      return button.id.replace(/button_secret_type_(\w+)/g, '$1');
    }
  }

  return '';
}

function showSavingMessage() {
  form.disable(Page.getButtonSave());

  notification.info(I18n.getMessage('message_saving'), { removeOption: false });
}

function hideSavingMessage() {
  form.enable(Page.getButtonSave());

  notification.clear();
}

async function cancel() {
  try {
    redirectToSecretsPage();
  } catch (error) {
    notification.error(error);
  }
}

async function generateRandomPassword() {
  try {
    const password = Page.getInputPassword();

    const result = Password.generate();

    form.setValue(password, result);
  } catch (error) {
    notification.error(error);
  }
}

async function generateRandomToken() {
  try {
    const token = Page.getInputToken();

    const result = Password.generate({ size: 40 });

    form.setValue(token, result);
  } catch (error) {
    notification.error(error);
  }
}

// Call the function after that page has finished loading.
document.addEventListener('DOMContentLoaded', mainLoaded, false);
