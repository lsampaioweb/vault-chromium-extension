import { HTMLReplacer } from './html-replace.js';

export class I18n {
  static getBrowserHandler() {
    return browser || chrome;
  }

  static getMessage(messageName, substitutions = []) {
    return this.getBrowserHandler().i18n.getMessage(messageName, substitutions);
  }

  static localize(element) {
    try {
      if (!element) {
        return;
      }

      const match = {
        regex: /__MSG_(\w+)__/g,
        func: this.replaceHTMLCallback()
      };

      HTMLReplacer.replace(element, match);
    } catch (error) {
      console.error(error);
    }
  }

  static replaceHTMLCallback() {
    return function (match, v1) {
      return v1 ? I18n.getMessage(v1) : match;
    };
  }
}
