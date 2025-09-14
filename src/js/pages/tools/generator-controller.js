import { PageController } from './generator-base-controller.js';
import { dependencies } from '../../services/tools.js';

// Initialize controller when i18n translation is complete.
document.addEventListener('i18nReady', () => {
  // Create the instance of the Controller with the necessary dependencies.
  const controller = new GeneratorController(dependencies);

  // Execute the main controller logic.
  controller.main();
}, false);

class GeneratorController extends PageController {

  /**
   * Password generation service for creating secure passwords with customizable options.
   * @type {object|null}
   */
  Password;

  /**
   * Flag indicating whether the generated password should be displayed in plain text or masked.
   * @type {boolean}
   */
  showPassword = false;

  /**
   * Constructor that accepts dependencies and passes them to the page controller.
   * @param {object} dependencies - The injected dependencies.
   */
  constructor(dependencies) {
    super(dependencies);

    // Extract specific dependencies this controller needs.
    this.Password = dependencies.Password;
  }

  /**
   * Main entry point called after i18n translation is complete.
   * Initializes the password generator page after the DOM is ready.
   * It finds all necessary UI elements and attaches the required event listeners
   * for generating passwords, toggling visibility, and copying the result.
   * @async
   * @returns {Promise<void>}
   */
  async main() {
    try {
      const size = this.getInputSize();
      const btnGenerate = this.getButtonGenerate();
      const generatedPasswordElement = this.getGeneratedPassword();
      const generatedPasswordToggleView = this.getGeneratedPasswordToggleView();
      const generatedPasswordCopyImg = this.getGeneratedPasswordCopyImg();

      this.form.addClickListener(btnGenerate, this.generatePasswordHandler.bind(this));
      this.form.addClickListener(generatedPasswordToggleView, this.toggleShowPasswordHandler.bind(this));
      this.form.addClickListener(generatedPasswordElement, this.copyPasswordToClipboard.bind(this));
      this.form.addClickListener(generatedPasswordCopyImg, this.copyPasswordToClipboard.bind(this));

      this.form.addEnterKeydownListener(size, btnGenerate);

      this.setFocusOnFirstElementOrFirstEmpty();
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Handles the password generation process.
   * It reads the user's selected criteria (length, character types), validates the input,
   * calls the Password library to generate a new password, and displays the result in the UI.
   * @returns {void}
   */
  generatePasswordHandler() {
    try {
      this.notification.clear();

      const generatedPasswordElement = this.getGeneratedPassword();
      const hiddenGeneratedPasswordElement = this.getHiddenGeneratedPassword();

      this.form.hide(this.getLabelGeneratedPassword());
      this.form.setValue(generatedPasswordElement, '');
      this.form.setValue(hiddenGeneratedPasswordElement, '');

      const numbers = this.getInputNumbersYes();
      const lowercase = this.getInputLowercaseYes();
      const uppercase = this.getInputUppercaseYes();
      const specialCharacters = this.getInputSpecialCharactersYes();
      const size = this.getInputSize();

      if (!this.form.isAnyElementChecked(numbers, lowercase, uppercase, specialCharacters)) {
        this.notification.error(this.I18n.getMessage(PageController.i18nKeys.messages.ERROR_PASSWORD_GENERATOR_OPTION_REQUIRED));
      } else {
        const result = this.form.validate({ required: [size] }, this.isValid.bind(this));
        if (result) {
          const generatedPassword = this.Password.generate({
            useNumbers: numbers.checked,
            useLowercase: lowercase.checked,
            useUppercase: uppercase.checked,
            useSpecialCharacters: specialCharacters.checked,
            size: parseInt(size.value, 10),
          });

          this.form.setValue(hiddenGeneratedPasswordElement, generatedPassword);

          this.setGeneratedPasswordToElementInForm(generatedPasswordElement, generatedPassword, this.showPassword);

          this.form.show(this.getLabelGeneratedPassword());
        }
      }

      this.setFocusOnFirstElementOrFirstEmpty();
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Toggles the visibility of the generated password in the UI.
   * It switches between showing the actual password and a masked version (asterisks),
   * and updates the corresponding show/hide icon.
   * @returns {void}
   */
  toggleShowPasswordHandler() {
    try {
      this.showPassword = !this.showPassword;

      this.toggleShowPassword(this.showPassword);
    } catch (error) {
      this.notification.error(error);
    }
  }

}
