import { PageController } from './extractsecretfrom-base-controller.js';
import { dependencies } from '../../services/test.js';

// Initialize controller when i18n translation is complete.
document.addEventListener('i18nReady', () => {
  // Create the instance of the Controller with the necessary dependencies.
  const controller = new ExtractSecretFromController(dependencies);

  // Execute the main controller logic.
  controller.main();
}, false);

class ExtractSecretFromController extends PageController {

  /**
   * Constructor that accepts dependencies and passes them to the page controller.
   * @param {object} dependencies - The injected dependencies.
   */
  constructor(dependencies) {
    super(dependencies);
  }

  /**
   * Main entry point called after i18n translation is complete.
   * @async
   * @returns {Promise<void>}
   */
  async main() {
    try {
      const input = this.getInput();
      const btnTest = this.getButtonTest();
      const btnTestAll = this.getButtonTestAll();

      this.form.addEnterKeydownListener(input, btnTest);
      this.form.addClickListener(btnTest, this.runTest.bind(this));
      this.form.addClickListener(btnTestAll, this.runAllTests.bind(this));

      this.setFocusOnFirstElementOrFirstEmpty();
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Runs a single test with the current input value.
   * @async
   * @returns {Promise<void>}
   */
  async runTest() {
    try {
      this.notification.clear();

      const input = this.getInput();

      this.notification.info(this.formatOutput(this.extractSecretFrom(input.value)));

      this.setFocusOnFirstElementOrFirstEmpty();
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Runs all predefined test cases.
   * @async
   * @returns {Promise<void>}
   */
  async runAllTests() {
    try {
      this.notification.clear();

      this.testCases.forEach(({ input, expected }) => {
        const output = this.extractSecretFrom(input);

        this.checkResult(output, expected);
      });

      this.setFocusOnFirstElementOrFirstEmpty();
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Checks if the test result matches the expected output.
   * @param {Object} output - The actual test output
   * @param {Object} expected - The expected test output
   */
  checkResult(output, expected) {
    if (JSON.stringify(output) === JSON.stringify(expected)) {
      this.notification.info(this.formatOutput(output));
    } else {
      this.notification.error(this.formatOutput(output));
    }
  }

  /**
   * Formats the output for display.
   * @param {Object} secret - The secret object to format
   * @returns {string} Formatted output string
   */
  formatOutput(secret) {
    return `
    Full Name: ${secret.fullName},
    Engine: ${secret.engine.name},
    Path: ${secret.path},
    Name: ${secret.name}`;
  }

  /**
   * Test cases for the extractSecretFrom functionality.
   */
  get testCases() {
    return [
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
  }

}
