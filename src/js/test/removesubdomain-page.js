import { form } from '../common.js';
import { PageBase } from '../libs/pagebase.js';

export class Page extends PageBase {

  static getInput() {
    return this.getElementById('input');
  }

  static getButtonTest() {
    return this.getElementById('button_test');
  }

  static getButtonTestAll() {
    return this.getElementById('button_test_all');
  }

  static setFocusOnFirstElementOrFirstEmpty() {
    const input = this.getInput();

    form.setFocusOnFirstElementOrFirstEmpty([input]);
  }
}
