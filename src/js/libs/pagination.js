export class Pagination {
  #PAGINATION_NEW_LIST_ID = 'pagination_list_active';
  #PAGINATION_ITEM_ID_PATTERN = 'pagination_item_';
  #BUTTON_PAGINATION_ITEM_PREVIOUS_ID = 'button_pagination_item_previous';
  #BUTTON_PAGINATION_ITEM_NEXT_ID = 'button_pagination_item_next';
  #BUTTON_PREVIOUS_TEXT = '&lt;';
  #BUTTON_NEXT_TEXT = '&gt;';
  #form;

  constructor(form) {
    this.#form = form;
  }

  createPaginationBar(quantityOfPages, currentPage, callback, maximumNumberOfPaginationButtons, pageObjects) {

    const paginationBar = pageObjects.paginationBar;
    const paginationList = pageObjects.paginationList;
    const paginationItem = pageObjects.paginationItem;

    this.#clearOldPaginationBar(paginationBar);

    const newList = paginationList.cloneNode();
    newList.id = this.#PAGINATION_NEW_LIST_ID;
    paginationBar.appendChild(newList);

    this.#addPreviousButton(newList, paginationItem.cloneNode(), callback, currentPage);

    let initialPaginationIndex = this.#getInitialPaginationIndex(currentPage, maximumNumberOfPaginationButtons, quantityOfPages);

    let addedPaginationButtons = 0;

    for (let index = initialPaginationIndex; index <= quantityOfPages; index++) {
      this.#addPaginationButton(newList, paginationItem.cloneNode(), callback, index, (index == currentPage));

      addedPaginationButtons++;
      if (addedPaginationButtons == maximumNumberOfPaginationButtons) {
        break;
      }
    }

    this.#addNextButton(newList, paginationItem.cloneNode(), callback, currentPage, quantityOfPages);

    this.#form.show(newList);
  }

  #clearOldPaginationBar(paginationBar) {
    this.#form.clear(paginationBar);
  }

  #getInitialPaginationIndex(currentPage, maximumNumberOfPaginationButtons, quantityOfPages) {
    const half = Math.floor(maximumNumberOfPaginationButtons / 2);

    let difference = 0;
    if ((currentPage + half) > quantityOfPages) {
      difference = half - (quantityOfPages - currentPage);
    }

    const initialIndex = currentPage - half - difference;
    return (initialIndex > 0) ? (initialIndex) : 1;
  }

  #addPreviousButton(newList, item, callback, currentPage) {
    item.id = this.#BUTTON_PAGINATION_ITEM_PREVIOUS_ID;

    const pageNumber = (currentPage > 1) ? --currentPage : 1;

    callback = callback.bind(null, pageNumber);

    this.#addButton(newList, item, this.#BUTTON_PREVIOUS_TEXT, callback);
  }

  #addNextButton(newList, item, callback, currentPage, quantityOfPages) {
    item.id = this.#BUTTON_PAGINATION_ITEM_NEXT_ID;

    const pageNumber = (currentPage < quantityOfPages) ? ++currentPage : quantityOfPages;

    callback = callback.bind(null, pageNumber);

    this.#addButton(newList, item, this.#BUTTON_NEXT_TEXT, callback);
  }

  #addPaginationButton(newList, item, callback, value, buttonPointsToCurrentPage) {
    item.id = this.#PAGINATION_ITEM_ID_PATTERN + value;

    callback = callback.bind(null, value);

    this.#addButton(newList, item, value, callback, buttonPointsToCurrentPage);
  }

  #addButton(newList, item, value, callback, buttonPointsToCurrentPage = false) {
    this.#form.setValue(item, value, true);

    if (buttonPointsToCurrentPage) {
      item.classList.add('active');
    }

    this.#form.addClickListener(item, callback);

    newList.appendChild(item);
  }
}
