import { PageController } from './unwrap-base-controller.js';
import { dependencies } from '../../services/tools.js';

// Initialize controller when i18n translation is complete.
document.addEventListener('i18nReady', () => {
  // Create the instance of the Controller with the necessary dependencies.
  const controller = new UnwrapController(dependencies);

  // Execute the main controller logic.
  controller.main();
}, false);

class UnwrapController extends PageController {

  /**
   * Constructor that accepts dependencies and passes them to the page controller.
   * @param {object} dependencies - The injected dependencies.
   */
  constructor(dependencies) {
    super(dependencies);
  }

  /**
   * Main entry point called after i18n translation is complete.
   * It checks for a valid user token and either displays the unwrap page
   * or redirects to the login page if the token is invalid.
   * @async
   * @returns {Promise<void>}
   */
  async main() {
    try {
      const token = await this.storage.getToken();
      if (this.VaultUtils.isTokenValid(token)) {
        await this.showPage();
      } else {
        this.redirectToLoginPage();
      }
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Initializes the unwrap page by setting up UI element event listeners.
   * It attaches handlers for the unwrap button, the copy-to-clipboard actions,
   * and the Enter key press in the input field.
   * @async
   * @returns {Promise<void>}
   */
  async showPage() {
    try {
      const inputUnwrapHash = this.getInputUnwrapHash();
      const btnUnwrap = this.getButtonUnwrap();
      const unwrapResult = this.getUnwrapResult();
      const unwrapResultCopyImg = this.getUnwrapResultCopyImg();

      this.form.addEnterKeydownListener(inputUnwrapHash, btnUnwrap);

      this.form.addClickListener(btnUnwrap, this.unwrapHandler.bind(this));
      this.form.addClickListener(unwrapResult, this.copyResultToClipboard.bind(this));
      this.form.addClickListener(unwrapResultCopyImg, this.copyResultToClipboard.bind(this));

      this.setFocusOnFirstElementOrFirstEmpty();
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Handles the unwrap operation when the user submits a hash.
   * It validates the input hash, calls the Vault API to unwrap the data,
   * formats the result as a user-friendly JSON string, and displays it in the UI.
   * @async
   * @returns {Promise<void>}
   */
  async unwrapHandler() {
    try {
      this.notification.clear();

      const token = await this.storage.getToken();

      if (!this.VaultUtils.isTokenValid(token)) {
        this.redirectToLoginPage();
        return;
      }

      const inputUnwrapHash = this.getInputUnwrapHash();
      const unwrapLabel = this.getLabelUnwrapResult();
      const unwrapResult = this.getUnwrapResult();

      this.form.setValue(unwrapResult, "");
      this.form.hide(unwrapLabel);

      // Validates the form elements using the specified required fields with a custom validation function.
      const result = this.form.validate({ required: [inputUnwrapHash] }, this.isValid.bind(this));
      if (result) {
        // Show a loading indicator while the unwrap operation is in progress.
        this.showLoading();

        // Create a new Vault instance using the stored URL and user token.
        const vault = this.vaultFactory.create(await this.storage.getUrl(), token);

        // Get the hash value entered in the form by the user.
        const data = this.form.getValue(inputUnwrapHash);

        // Call the Vault API to unwrap the data using the provided hash.
        const unwrappedData = await vault.unwrap(data);

        // Format the unwrapped data into a user-friendly JSON string.
        const userFriendlyResult = this.formatUnwrappedData(unwrappedData);

        // Display the formatted result in the result textarea.
        this.form.setValue(unwrapResult, userFriendlyResult);

        // Adjust the textarea size to fit the result content.
        this.updateTextareaSize(unwrapResult, userFriendlyResult);

        // Show the label for the unwrap result.
        this.form.show(unwrapLabel);

        // Hide the loading indicator after the operation is complete.
        this.hideLoading();
      }
    } catch (error) {
      this.hideLoading();

      this.notification.error(error);
    } finally {
      this.setFocusOnFirstElementOrFirstEmpty();
    }
  }

}
