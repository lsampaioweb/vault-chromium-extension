import { PageController } from './about-base-controller.js';
import { dependencies } from '../../services/simple.js';

// Initialize controller when i18n translation is complete.
document.addEventListener('i18nReady', () => {
  // Create the instance of the Controller with the necessary dependencies.
  const controller = new AboutController(dependencies);

  // Execute the main controller logic.
  controller.main();
}, false);

class AboutController extends PageController {

  /**
   * Constructor that accepts dependencies and passes them to the page controller.
   * @param {object} dependencies - The injected dependencies
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
      const supportMail = this.getSpanSupportMail();
      const supportMailCopyImg = this.getSupportMailCopyImg();

      this.form.addClickListener(supportMail, this.copySupportMailToClipboard.bind(this));
      this.form.addClickListener(supportMailCopyImg, this.copySupportMailToClipboard.bind(this));

    } catch (error) {
      this.notification.error(error);
    }
  }
}
