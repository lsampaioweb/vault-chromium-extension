import { PageController } from './replicatestring-base-controller.js';
import { dependencies } from '../../services/test.js';

// Initialize controller when i18n translation is complete.
document.addEventListener('i18nReady', () => {
  // Create the instance of the Controller with the necessary dependencies.
  const controller = new ReplicateStringController(dependencies);

  // Execute the main controller logic.
  controller.main();
}, false);

class ReplicateStringController extends PageController {

  /**
   * Crypto provider base class for accessing crypto utility functions.
   * @type {object|null}
   */
  CryptoProviderBase;

  /**
   * Constructor that accepts dependencies and passes them to the page controller.
   * @param {object} dependencies - The injected dependencies.
   */
  constructor(dependencies) {
    super(dependencies);

    // Extract specific dependencies this controller needs.
    this.CryptoProviderBase = dependencies.CryptoProviderBase;
  }

  /**
   * Main entry point called after i18n translation is complete.
   * @async
   * @returns {Promise<void>}
   */
  async main() {
    try {
      const input = this.getInput();
      const inputSize = this.getInputSize();
      const btnTest = this.getButtonTest();
      const btnTestAll = this.getButtonTestAll();

      this.form.addEnterKeydownListener(input, btnTest);
      this.form.addEnterKeydownListener(inputSize, btnTest);
      this.form.addClickListener(btnTest, this.runTest.bind(this));
      this.form.addClickListener(btnTestAll, this.runAllTests.bind(this));

      this.setFocusOnFirstElementOrFirstEmpty();
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Runs a single test with the current input values.
   * @async
   * @returns {Promise<void>}
   */
  async runTest() {
    try {
      this.notification.clear();

      const input = this.getInput();
      const inputSize = this.getInputSize();

      const result = this.CryptoProviderBase.replicateString(input.value, parseInt(inputSize.value, 10));
      this.notification.info(input.value + ' - ' + result);

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
        const output = this.CryptoProviderBase.replicateString(input.value, input.length);

        this.checkResult(input.value, output, expected);
      });

      this.setFocusOnFirstElementOrFirstEmpty();
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Checks if the test result matches the expected output.
   * @param {string} input - The test input value
   * @param {string} output - The actual test output
   * @param {string} expected - The expected test output
   */
  checkResult(input, output, expected) {
    if (output === expected) {
      this.notification.info(input + ' - ' + output + ' - ' + expected);
    } else {
      this.notification.error(input + ' - ' + output + ' - ' + expected);
    }
  }

  /**
   * Test cases for the replicateString functionality.
   */
  get testCases() {
    return [
      {
        input: { value: 'MeuTexto', length: 3 },
        expected: 'Meu'
      },
      {
        input: { value: 'MeuTexto', length: 10 },
        expected: 'MeuTextoMe'
      },
      {
        input: { value: 'my-domain', length: 20 },
        expected: 'my-domainmy-domainmy'
      },
      {
        input: { value: '123456abcdef', length: 30 },
        expected: '123456abcdef123456abcdef123456'
      }
    ];
  }

}
