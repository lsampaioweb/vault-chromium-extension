import { PageBaseController } from '../../ui/page-base-controller.js';

export class PageController extends PageBaseController {

  /**
   * Constructor that accepts dependencies and passes them to the base class.
   * @param {object} dependencies - The injected dependencies
   */
  constructor(dependencies) {
    super(dependencies);
  }

  /**
   * Gets the span element that displays the support email.
   * @returns {HTMLSpanElement|null} The support email span element, or null if not found.
   */
  getSpanSupportMail() {
    return this.getElementById('support_mail');
  }

  /**
   * Gets the copy icon/image associated with the wrap result.
   * @returns {HTMLImageElement|null} The copy image element, or null if not found.
   */
  getSupportMailCopyImg() {
    return this.getElementById('support_mail_copy_img');
  }

  /**
   * Copies the support email to clipboard.
   * @param {Event} event - The event object.
   */
  async copySupportMailToClipboard(event) {
    try {
      await this.copyElementToClipboard(this.getSpanSupportMail());

      // Cancel the default action.
      event.preventDefault();
    } catch (error) {
      this.notification.clear().error(error);
    }
  }

}
