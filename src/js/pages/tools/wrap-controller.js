import { PageController } from './wrap-base-controller.js';
import { dependencies } from '../../services/tools.js';

// Initialize controller when i18n translation is complete.
document.addEventListener('i18nReady', () => {
  // Create the instance of the Controller with the necessary dependencies.
  const controller = new WrapController(dependencies);

  // Execute the main controller logic.
  controller.main();
}, false);

class WrapController extends PageController {

  /**
   * Constructor that accepts dependencies and passes them to the page controller.
   * @param {object} dependencies - The injected dependencies.
   */
  constructor(dependencies) {
    super(dependencies);
  }

  /**
   * Main entry point called after i18n translation is complete.
   * It checks for a valid user token and either displays the wrap page
   * or redirects to the login page if the token is invalid.
   * @async
   * @returns {Promise<void>}
   */
  async main() {
    try {
      const token = await this.storage.getToken();
      if (this.VaultUtils.isTokenValid(token)) {
        this.showPage();
      } else {
        this.redirectToLoginPage();
      }
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Initializes the wrap page by setting up UI element event listeners.
   * It attaches handlers for tab switching, the main wrap button,
   * copy-to-clipboard actions, and Enter key presses in the input fields.
   * @async
   * @returns {Promise<void>}
   */
  async showPage() {
    try {
      const btnWrapTypeSimple = this.getButtonWrapTypeSimple();
      const btnWrapTypeComplex = this.getButtonWrapTypeComplex();

      const wrapKey = this.getInputWrapKey();
      const wrapValue = this.getInputWrapValue();
      const wrapTTL = this.getInputWrapTTL();

      const btnWrap = this.getButtonWrap();

      const wrapResult = this.getWrapResult();
      const wrapResultCopyImg = this.getWrapResultCopyImg();

      this.form.addClickListener(btnWrapTypeSimple, this.openTabTypeSimple());
      this.form.addClickListener(btnWrapTypeComplex, this.openTabTypeComplex());

      this.form.addClickListener(btnWrap, this.wrapHandler.bind(this));
      this.form.addClickListener(wrapResult, this.copyResultToClipboard.bind(this));
      this.form.addClickListener(wrapResultCopyImg, this.copyResultToClipboard.bind(this));

      this.form.addEnterKeydownListener(wrapKey, btnWrap);
      this.form.addEnterKeydownListener(wrapValue, btnWrap);
      this.form.addEnterKeydownListener(wrapTTL, btnWrap);

      this.showWrapTypeSimpleTab();
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Handles the wrapping operation when the user submits data.
   * It determines the active tab (simple or complex), validates the relevant inputs,
   * calls the Vault API to wrap the data with the specified TTL, and displays the resulting hash.
   * @async
   * @returns {Promise<void>}
   */
  async wrapHandler() {
    try {
      this.notification.clear();

      const token = await this.storage.getToken();

      if (!this.VaultUtils.isTokenValid(token)) {
        this.redirectToLoginPage();
        return;
      }

      const wrapTTL = this.getInputWrapTTL();
      const wrapLabel = this.getLabelWrapResult();
      const wrapResult = this.getWrapResult();

      this.form.setValue(wrapResult, "");
      this.form.hide(wrapLabel);

      let isValid;
      let data;

      const selectedTab = this.getSelectedSecretType();
      if (selectedTab === PageController.i18nKeys.constants.TAB_TYPE_SIMPLE) {
        const wrapKey = this.getInputWrapKey();
        const wrapValue = this.getInputWrapValue();

        isValid = this.form.validate({ required: [wrapKey, wrapValue, wrapTTL] }, this.isValid.bind(this));

        if (isValid) {
          const key = this.form.getValue(wrapKey);
          const value = this.form.getValue(wrapValue);

          // Create a simple key-value pair object.
          data = { [key]: value };
        }
      } else if (selectedTab === PageController.i18nKeys.constants.TAB_TYPE_COMPLEX) {
        const wrapJson = this.getInputWrapJson();

        isValid = this.form.validate({ required: [wrapJson, wrapTTL] }, this.isValid.bind(this));

        if (isValid) {
          // Converts the string to a valid object.
          data = JSON.parse(this.form.getValue(wrapJson));
        }
      }

      if (isValid) {
        // Show a loading indicator while the wrap operation is in progress.
        this.showLoading();

        // Create a new Vault instance using the current URL and token.
        const vault = this.vaultFactory.create(await this.storage.getUrl(), token);

        // Get the TTL (time-to-live) value from the input field.
        const ttl = this.form.getValue(wrapTTL);

        // Call the Vault API to wrap the data with the specified TTL (in minutes).
        const wrappedHash = await vault.wrap(data, `${ttl}m`);

        // Display the resulting wrapped hash in the result field.
        this.form.setValue(wrapResult, wrappedHash);

        // Show the label for the wrap result.
        this.form.show(wrapLabel);

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
