import { PageController } from './removesubdomain-base-controller.js';
import { dependencies } from '../../services/test.js';

// Initialize controller when i18n translation is complete.
document.addEventListener('i18nReady', () => {
  // Create the instance of the Controller with the necessary dependencies.
  const controller = new RemoveSubdomainController(dependencies);

  // Execute the main controller logic.
  controller.main();
}, false);

class RemoveSubdomainController extends PageController {

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

      this.notification.info(input.value + ' - ' + this.removeSubdomain(input.value));

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
        const output = this.removeSubdomain(input);

        this.checkResult(input, output, expected);
      });

      this.setFocusOnFirstElementOrFirstEmpty();
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Checks if the test result matches the expected output.
   * @param {string} input - The test input
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
   * Test cases for the removeSubdomain functionality.
   */
  get testCases() {
    return [
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
  }

}
