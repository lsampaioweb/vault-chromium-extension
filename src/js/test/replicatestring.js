import { notification, form } from '../common.js';
import { Page } from './replicatestring-page.js';

const testCases = [
  {
    input: { value: 'MeuTexto', length : 3},
    expected: 'Meu'
  },
  {
    input: { value: 'MeuTexto', length : 10},
    expected: 'MeuTextoMe'
  },
  {
    input: { value: 'my-domain', length : 20},
    expected: 'my-domainmy-domainmy'
  },
  {
    input: { value: '123456abcdef', length : 30},
    expected: '123456abcdef123456abcdef123456'
  }
];

async function mainLoaded() {
  try {
    const input = Page.getInput();
    const inputSize = Page.getInputSize();
    const btnTest = Page.getButtonTest();
    const btnTestAll = Page.getButtonTestAll();

    form.addEnterKeydownListener(input, btnTest);
    form.addEnterKeydownListener(inputSize, btnTest);
    form.addClickListener(btnTest, runTest);
    form.addClickListener(btnTestAll, runAllTests);

    Page.setFocusOnFirstElementOrFirstEmpty();
  } catch (error) {
    notification.error(error);
  }
}

async function runTest() {
  try {
    notification.clear();

    const input = Page.getInput();
    const inputSize = Page.getInputSize();

    notification.info(input.value + ' - ' + replicateString(input.value, inputSize.value));

    Page.setFocusOnFirstElementOrFirstEmpty();
  } catch (error) {
    notification.error(error);
  }
}

async function runAllTests() {
  try {
    notification.clear();

    testCases.forEach(({ input, expected }) => {
      const output = replicateString(input.value, input.length);

      checkResult(input.value, output, expected);
    });

    Page.setFocusOnFirstElementOrFirstEmpty();
  } catch (error) {
    notification.error(error);
  }
}

function replicateString(value, length) {
  let stringToReturn = '';
  let stringIndex = 0;

  for (let i = 0; i < length; i++) {
    if (stringIndex == value.length) {
      stringIndex = 0;
    }

    stringToReturn = stringToReturn + value.charAt(stringIndex++);
  }

  return stringToReturn;
}

function checkResult(input, output, expected) {
  if (output === expected) {
    notification.info(input + ' - ' + output + ' - ' + expected);
  } else {
    notification.error(input + ' - ' + output + ' - ' + expected);
  }
}

// Call the function after that page has finished loading.
document.addEventListener('DOMContentLoaded', mainLoaded, false);
