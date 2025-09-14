import { PageBaseController } from '../../ui/page-base-controller.js';

export class PageController extends PageBaseController {

  /**
   * Constructor that accepts dependencies and passes them to the base class.
   * @param {object} dependencies - The injected dependencies
   */
  constructor(dependencies) {
    super(dependencies);
  }

  getInput() {
    return this.getElementById('input');
  }

  getInputSize() {
    return this.getElementById('input_size');
  }

  getButtonTest() {
    return this.getElementById('button_test');
  }

  getButtonTestAll() {
    return this.getElementById('button_test_all');
  }

  setFocusOnFirstElementOrFirstEmpty() {
    const input = this.getInput();
    const inputSize = this.getInputSize();

    this.form.setFocusOnFirstElementOrFirstEmpty([input, inputSize]);
  }
}
