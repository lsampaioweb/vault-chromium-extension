import { form } from '../common.js';
import { PageBase } from '../libs/pagebase.js';

export class Page extends PageBase {

  static getInput() {
    return this.getElementById('input');
  }

  static getInputSize() {
    return this.getElementById('input_size');
  }

  static getButtonTest() {
    return this.getElementById('button_test');
  }

  static getButtonTestAll() {
    return this.getElementById('button_test_all');
  }

  static setFocusOnFirstElementOrFirstEmpty() {
    const input = this.getInput();
    const inputSize = this.getInputSize();

    form.setFocusOnFirstElementOrFirstEmpty([input, inputSize]);
  }
}
