import { notification, form } from '../common.js';
import { Page } from './extractsecretfrom-page.js';

const testCases = [
  {
    input: '',
    expected: {
      fullName: '',
      engine: { name: '' },
      path: '',
      name: ''
    }
  },
  {
    input: '///',
    expected: {
      fullName: '/',
      engine: { name: '' },
      path: '',
      name: ''
    }
  },
  {
    input: 'engine/secretname',
    expected: {
      fullName: 'engine/secretname',
      engine: { name: 'engine' },
      path: '',
      name: 'secretname'
    }
  },
  {
    input: 'engine/path1/secretname',
    expected: {
      fullName: 'engine/path1/secretname',
      engine: { name: 'engine' },
      path: 'path1',
      name: 'secretname'
    }
  },
  {
    input: '/engine/path2/secretname',
    expected: {
      fullName: '/engine/path2/secretname',
      engine: { name: 'engine' },
      path: 'path2',
      name: 'secretname'
    }
  },
  {
    input: 'engine/path3/secretname/',
    expected: {
      fullName: 'engine/path3/secretname/',
      engine: { name: 'engine' },
      path: 'path3',
      name: 'secretname'
    }
  },
  {
    input: '/engine/path4/secretname/',
    expected: {
      fullName: '/engine/path4/secretname/',
      engine: { name: 'engine' },
      path: 'path4',
      name: 'secretname'
    }
  },
  {
    input: 'engine////path5///secretname',
    expected: {
      fullName: 'engine/path5/secretname',
      engine: { name: 'engine' },
      path: 'path5',
      name: 'secretname'
    }
  },
  {
    input: 'engine/path6/path7/pathN/secretname',
    expected: {
      fullName: 'engine/path6/path7/pathN/secretname',
      engine: { name: 'engine' },
      path: 'path6/path7/pathN',
      name: 'secretname'
    }
  },
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

    notification.info(formatOutput(extractSecretFrom(input.value)));

    Page.setFocusOnFirstElementOrFirstEmpty();
  } catch (error) {
    notification.error(error);
  }
}

async function runAllTests() {
  try {
    notification.clear();

    testCases.forEach(({ input, expected }) => {
      const output = extractSecretFrom(input);

      checkResult(output, expected);
    });

    Page.setFocusOnFirstElementOrFirstEmpty();
  } catch (error) {
    notification.error(error);
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

function checkResult(output, expected) {
  if (JSON.stringify(output) === JSON.stringify(expected)) {
    notification.info(formatOutput(output));
  } else {
    notification.error(formatOutput(output));
  }
}

function formatOutput(secret) {
  return `
    Full Name: ${secret.fullName}<br/>
    Engine: ${secret.engine.name}<br/>
    Path: ${secret.path}<br/>
    Name: ${secret.name}`;
}

// Call the function after that page has finished loading.
document.addEventListener('DOMContentLoaded', mainLoaded, false);
