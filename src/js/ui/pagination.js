/**
 * Handles the creation and management of a pagination UI component.
 */
export class Pagination {
  /** @private @readonly */
  #PAGINATION_NEW_LIST_ID = 'pagination_list_active';
  /** @private @readonly */
  #PAGINATION_ITEM_ID_PATTERN = 'pagination_item_';
  /** @private @readonly */
  #BUTTON_PAGINATION_ITEM_PREVIOUS_ID = 'button_pagination_item_previous';
  /** @private @readonly */
  #BUTTON_PAGINATION_ITEM_NEXT_ID = 'button_pagination_item_next';
  /** @private @readonly */
  #BUTTON_PREVIOUS_TEXT = '&lt;';
  /** @private @readonly */
  #BUTTON_NEXT_TEXT = '&gt;';
  /** @private */
  #form;

  /**
   * Creates an instance of the Pagination class.
   * @param {Form} form - An instance of the Form utility class.
   */
  constructor(form) {
    this.#form = form;
  }

  /**
   * Creates and populates the pagination bar with page number buttons.
   * @param {number} quantityOfPages - The total number of pages.
   * @param {number} currentPage - The currently active page.
   * @param {function} callback - The function to call when a page button is clicked. It will receive the page number as an argument.
   * @param {number} maximumNumberOfPaginationButtons - The maximum number of page number buttons to display at once.
   * @param {object} pageObjects - An object containing the required DOM elements (paginationBar, paginationList, paginationItem).
   */
  createPaginationBar(quantityOfPages, currentPage, callback, maximumNumberOfPaginationButtons, pageObjects) {
    const { paginationBar, paginationList, paginationItem } = pageObjects;

    this.#clearOldPaginationBar(paginationBar);

    const newList = paginationList.cloneNode();
    newList.id = this.#PAGINATION_NEW_LIST_ID;
    paginationBar.appendChild(newList);

    this.#addPreviousButton(newList, paginationItem.cloneNode(), callback, currentPage);

    let initialPaginationIndex = this.#getInitialPaginationIndex(currentPage, maximumNumberOfPaginationButtons, quantityOfPages);

    let addedPaginationButtons = 0;

    for (let index = initialPaginationIndex; index <= quantityOfPages; index++) {
      this.#addPaginationButton(newList, paginationItem.cloneNode(), callback, index, (index === currentPage));
      addedPaginationButtons++;
      if (addedPaginationButtons >= maximumNumberOfPaginationButtons) {
        break;
      }
    }

    this.#addNextButton(newList, paginationItem.cloneNode(), callback, currentPage, quantityOfPages);

    this.#form.show(newList);
  }

  /**
   * Clears the previous pagination bar from the DOM.
   * @param {HTMLElement} paginationBar - The container element for the pagination bar.
   * @private
   */
  #clearOldPaginationBar(paginationBar) {
    this.#form.clear(paginationBar);
  }

  /**
   * Calculates the starting page number to display in the pagination bar
   * to keep the current page centered.
   * @private
   */
  #getInitialPaginationIndex(currentPage, maximumNumberOfPaginationButtons, quantityOfPages) {
    const half = Math.floor(maximumNumberOfPaginationButtons / 2);
    let difference = 0;
    if ((currentPage + half) > quantityOfPages) {
      difference = half - (quantityOfPages - currentPage);
    }

    const initialIndex = currentPage - half - difference;
    return (initialIndex > 0) ? initialIndex : 1;
  }

  /**
   * Adds the 'Previous' button to the pagination bar.
   * @private
   */
  #addPreviousButton(newList, item, callback, currentPage) {
    item.id = this.#BUTTON_PAGINATION_ITEM_PREVIOUS_ID;

    // Calculate the target page number without mutating the original currentPage variable.
    const pageNumber = (currentPage > 1) ? (currentPage - 1) : 1;
    const boundCallback = callback.bind(null, pageNumber);

    this.#addButton(newList, item, this.#BUTTON_PREVIOUS_TEXT, boundCallback);
  }

  /**
   * Adds the 'Next' button to the pagination bar.
   * @private
   */
  #addNextButton(newList, item, callback, currentPage, quantityOfPages) {
    item.id = this.#BUTTON_PAGINATION_ITEM_NEXT_ID;

    // Calculate the target page number without mutating the original currentPage variable.
    const pageNumber = (currentPage < quantityOfPages) ? (currentPage + 1) : quantityOfPages;
    const boundCallback = callback.bind(null, pageNumber);

    this.#addButton(newList, item, this.#BUTTON_NEXT_TEXT, boundCallback);
  }

  /**
   * Adds a numbered page button to the pagination bar.
   * @private
   */
  #addPaginationButton(newList, item, callback, value, isCurrentPage) {
    item.id = this.#PAGINATION_ITEM_ID_PATTERN + value;
    const boundCallback = callback.bind(null, value);

    this.#addButton(newList, item, value, boundCallback, isCurrentPage);
  }

  /**
   * Generic helper to create and append a pagination button.
   * @private
   */
  #addButton(newList, item, value, callback, isCurrentPage = false) {
    // Using setValue with acceptHTML=true is appropriate here for '<' and '>'.
    this.#form.setValue(item, value, true);

    if (isCurrentPage) {
      this.#form.classListAdd(item, 'active');
    }

    this.#form.addClickListener(item, callback);

    newList.appendChild(item);
  }
}
