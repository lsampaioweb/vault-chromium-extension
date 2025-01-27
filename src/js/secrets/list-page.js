import { form, pagination } from '../common.js';
import { PageBase } from '../libs/pagebase.js';

export class Page extends PageBase {

  static getInputSearch() {
    return this.getElementById('search');
  }

  static getButtonSearch() {
    return this.getElementById('button_search');
  }

  static getButtonNewSecret() {
    return this.getElementById('button_new_secret');
  }

  static getSecretList() {
    return this.getElementById('secret_list');
  }

  static getSecretPage() {
    return this.getElementById('secret_list_page');
  }

  static getSecretTemplate() {
    return this.getElementById('secret_template');
  }

  static getPaginationBar() {
    return this.getElementById('pagination_bar');
  }

  static getPaginationList() {
    return this.getElementById('pagination_list');
  }

  static getPaginationItem() {
    return this.getElementById('pagination_item');
  }

  static getSearchFromQueryString() {
    return this.getQueryString('search');
  }

  static getPageFromQueryString() {
    return this.getQueryString('page');
  }

  static isValid(element) {
    if (element) {
      if (element.id === 'search') {
        return Page.isValidSearch(element.value);
      }
    }

    return {
      isValid: false,
      errorMessage: ''
    };
  }

  static isValidSearch(text) {
    return {
      // Regex: ^(.)+$
      // - ^ and $: Ensure the entire string matches.
      // - (.): Matches any single character (except line breaks).
      // - +: Requires at least one character.
      isValid: this.isValidElement(text, /^(.)+$/gi),
      errorMessage: ''
    };
  }

  static setFocusOnFirstElementOrFirstEmpty() {
    const search = this.getInputSearch();

    form.setFocusOnFirstElementOrFirstEmpty([search]);
  }

  static createPaginationBar(quantityOfPages, currentPage, callback, maximumNumberOfPaginationButtons = 5) {
    if (quantityOfPages <= 1)
      return;

    const pageObjects = {
      paginationBar: this.getPaginationBar(),
      paginationList: this.getPaginationList(),
      paginationItem: this.getPaginationItem()
    };

    pagination.createPaginationBar(quantityOfPages, currentPage, callback, maximumNumberOfPaginationButtons, pageObjects);
  }

}
