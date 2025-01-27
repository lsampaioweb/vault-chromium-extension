import { notification, form } from '../common.js';
import { Page } from './removesubdomain-page.js';

const testCases = [
  {
    input: 'br',
    expected: ''
  },
  {
    input: 'com',
    expected: ''
  },
  {
    input: 'com.br',
    expected: ''
  },
  {
    input: 'domain',
    expected: ''
  },
  {
    input: 'domain.com',
    expected: ''
  },
  {
    input: 'domain.com.br',
    expected: ''
  },
  {
    input: 'sub1.domain.com.br',
    expected: 'domain.com.br'
  },
  {
    input: 'sub2.sub1.domain.com.br',
    expected: 'sub1.domain.com.br'
  },
  {
    input: 'sub2.sub1.domain.com',
    expected: 'sub1.domain.com'
  }
];

async function mainLoaded() {
  try {
    const input = Page.getInput();
    const btnTest = Page.getButtonTest();
    const btnTestAll = Page.getButtonTestAll();

    form.addEnterKeydownListener(input, btnTest);
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

    notification.info(input.value + ' - ' + removeSubdomain(input.value));

    Page.setFocusOnFirstElementOrFirstEmpty();
  } catch (error) {
    notification.error(error);
  }
}

async function runAllTests() {
  try {
    notification.clear();

    testCases.forEach(({ input, expected }) => {
      const output = removeSubdomain(input);

      checkResult(input, output, expected);
    });

    Page.setFocusOnFirstElementOrFirstEmpty();
  } catch (error) {
    notification.error(error);
  }
}

function removeSubdomain(text) {
  // co, com, gov, blog | co.uk, com.br, gov.us, blog.br
  const tldRegex = /^([a-z]{2,4})(\.[a-z]{2})?$/i;

  let result = '';
  const list = text.split('.');

  if (list.length > 2) {
    result = list.slice(1).join('.');

    if (RegExp(tldRegex).exec(result)) {
      result = '';
    }
  }

  return result;
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
