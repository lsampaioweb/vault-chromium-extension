import { I18n, notification, form } from '../common.js';

export class PageBase {

  static getElementById(id) {
    return document.getElementById(id);
  }

  static getCurrentURL() {
    return new URL(document.location.toString());
  }

  static getURLSearchParams(url) {
    if (!url) {
      url = this.getCurrentURL();
    }

    return new URLSearchParams(url.search);
  }

  static getQueryString(name) {
    const searchParams = this.getURLSearchParams();

    return searchParams.get(name);
  }

  static deleteAllQueryStrings() {
    const url = this.getCurrentURL();

    const searchParams = this.getURLSearchParams(url);

    while (searchParams.size > 0) {
      for (const key of searchParams.keys()) {
        searchParams.delete(key);
      }
    }

    window.history.replaceState(null, null, url.pathname);
  }

  static isValidURL(text) {
    let isValid;
    try {
      new URL(text);

      isValid = true;
    } catch (error) {
      isValid = false;
    }

    return {
      isValid: isValid,
      errorMessage: ''
    };
  }

  static isValidElement(text, regexp) {
    return (text) ? text.match(regexp) : false;
  }

  static async getActiveTabs() {
    const queryOptions = { active: true, currentWindow: true };

    const tabs = await browser.tabs.query(queryOptions);

    if (!tabs) {
      throw new Error(I18n.getMessage('failed_to_query_tab'));
    }

    return tabs;
  }

  static async getCurrentAndActiveTab() {
    // 'tab' will either be a 'tabs[0]' instance or 'undefined'.
    const [tab] = await this.getActiveTabs();

    return tab;
  }

  static async getHostnameFromCurrentActiveTab() {
    const tab = await this.getCurrentAndActiveTab();

    const url = new URL(tab.url);

    return url.hostname;
  }

  static async getAllFramesFrom(tabId) {
    return browser.webNavigation.getAllFrames({ tabId: tabId });
  }

  static getValueIfDataHasKey(data, list) {
    list = list.toLowerCase().replace(' ', '').split(',');

    if (data) {
      for (const [key, value] of Object.entries(data)) {
        for (const keyToSearch of list) {
          if (key.toLowerCase() === keyToSearch) {
            return value;
          }
        }
      }
    }

    return null;
  }

  static getAllSubdomains(text) {
    const results = [];

    while (text) {
      results.push(text);

      text = this.removeSubdomain(text);
    }

    return results;
  }

  static removeSubdomain(text) {
    // co, com, gov, blog | co.uk, com.br, gov.us, blog.br
    const tldRegex = /^([a-z]{2,4})(\.[a-z]{2})?$/i;

    let result = '';
    const list = text.split('.');

    if (list.length > 2) {
      result = list.slice(1).join('.');

      if (RegExp(tldRegex).exec(result)) {
        result = '';
      }
    }

    return result;
  }

  static async hasClipboardWritePermission() {
    const write = await navigator.permissions.query({
      name: 'clipboard-write'
    });

    return (write.state === 'granted');
  }

  static async copyElementToClipboard(element) {
    try {
      await this.copyValueToClipboard(form.getValue(element));
    } catch (error) {
      notification.clear().error(error);
    }
  }

  static async copyValueToClipboard(value) {
    try {
      const hasPermissions = await this.hasClipboardWritePermission();

      if ((hasPermissions) && (document.hasFocus())) {

        await navigator.clipboard.writeText(value);

        notification.clear().info(I18n.getMessage('content_copied_to_clipboard'),
          {
            removeOption: false,
            time: 3000
          });
      }
    } catch (error) {
      notification.clear().error(error);
    }
  }

  static openTab(tabId) {
    const tabs = document.getElementsByClassName('tab_content');

    for (const tab of tabs) {
      const button = PageBase.getElementById(PageBase.getButtonIdFromDivId(tab));

      if (tab.id === (tabId)) {
        form.classListAdd(button, 'active');
        form.show(tab);
      } else {
        form.classListRemove(button, 'active');
        form.hide(tab);
      }
    }
  }

  static getButtonIdFromDivId(tab) {
    return tab.id.replace('div_', 'button_');
  }

}
