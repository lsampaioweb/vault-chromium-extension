import { I18n } from './i18n.js';

export class Form {
  #notification;

  constructor(notification) {
    this.#notification = notification;
  }

  addEventListener(element, type, listener, useCapture = false) {
    if (element) {
      element.addEventListener(type, listener, useCapture);
    }
  }

  addChangeListener(element, listener, useCapture = false) {
    this.addEventListener(element, 'change', listener, useCapture);
  }

  addClickListener(element, listener, useCapture = false) {
    this.addEventListener(element, 'click', listener, useCapture);
  }

  addEnterKeydownListener(inputElement, buttonElement) {
    this.addEventListener(inputElement, 'keydown', this.#enterKeydown.bind(buttonElement));
  }

  #enterKeydown(event) {
    if (event.key === 'Enter') {
      // Cancel the default action, if needed.
      event.preventDefault();

      // Trigger the button element with a click.
      this?.click();
    }
  }

  validate(elements, validateFunction) {
    if (elements) {
      if (elements.required) {
        if (!this.#validateRequiredElements(elements.required, validateFunction)) {
          return false;
        }
      }

      if (elements.optional) {
        return (this.#validateOptionalElements(elements.optional, validateFunction));
      }
    }

    return true;
  }

  #validateRequiredElements(elements, validateFunction) {
    let foundElementWithError = false;

    for (const element of elements) {
      if (!element) {
        continue;
      }
      let foundError = false;

      if (this.isEmpty(element)) {
        this.#showEmptyElementErrorMessage(element);

        foundError = true;
      } else {
        const check = validateFunction(element);

        if (!check.isValid) {
          this.#showInvalidElementErrorMessage(element, check);

          foundError = true;
        }
      }

      if ((foundError) && (!foundElementWithError)) {
        foundElementWithError = true;
        this.setFocus(element);
      }
    }

    return !foundElementWithError;
  }

  #validateOptionalElements(elements, validateFunction) {
    let foundElementWithError = false;

    for (const element of elements) {
      if (!element) {
        continue;
      }

      const check = validateFunction(element);

      if ((!this.isEmpty(element)) && (!check.isValid)) {
        this.#showInvalidElementErrorMessage(element, check);

        if (!foundElementWithError) {
          foundElementWithError = true;
          this.setFocus(element);
        }
      }
    }

    return !foundElementWithError;
  }

  isEmpty(element) {
    return (this.getValue(element).trim().length === 0);
  }

  setValue(element, value, acceptHTML = false) {
    if ((element) && (value !== undefined)) {
      if (acceptHTML) {
        if ('innerHTML' in element) {
          element.innerHTML = value;
        }
      } else if ('value' in element) {
        element.value = value;
      } else if ('textContent' in element) {
        element.textContent = value;
      } else if ('nodeValue' in element) {
        element.nodeValue = value;
      } else if ('innerText' in element) {
        element.innerText = value;
      }
    }
  }

  getValue(element) {
    if ('value' in element) {
      return element.value;
    } else if ('textContent' in element) {
      return element.textContent;
    } else if ('nodeValue' in element) {
      return element.nodeValue;
    } else if ('innerText' in element) {
      return element.innerText;
    } else if ('innerHTML' in element) {
      return element.innerHTML;
    }
    return '';
  }

  setFocus(element) {
    element?.focus();
  }

  blur(element) {
    element?.blur();
  }

  setFocusOnFirstElementOrFirstEmpty(elements) {
    let firstElement = null;
    let firstEmpty = null;

    for (const element of elements) {
      if (!this.isVisible(element)) {
        continue;
      }

      if (!firstElement) {
        firstElement = element;
      }

      if (this.isEmpty(element)) {
        if (!firstEmpty) {
          firstEmpty = element;
          break;
        }
      }
    }

    this.setFocus(firstEmpty || firstElement);
  }

  #showInvalidElementErrorMessage(element, check) {
    if (check?.errorMessage) {
      this.#notification.error(check.errorMessage);
    }
    else {
      this.#showInvalidElementDefaultErrorMessage(element, this.getValue(element));
    }
  }

  #showEmptyElementErrorMessage(element) {
    this.#showErrorMessageById(element, 'form_empty_element');
  }

  #showInvalidElementDefaultErrorMessage(element, value) {
    this.#showErrorMessageById(element, 'form_invalid_element', value);
  }

  #showErrorMessageById(element, messageId, value = null) {
    const elementName = this.#getParentElementName(element);

    // If the element is of type="password". The value should not be displayed.
    if ((element.type === 'password') && (value)) {
      value = this.replaceAllCharactersWithAsterisks(value);
    }

    const errorMessage = I18n.getMessage(messageId, [elementName, value]);

    this.#notification.error(errorMessage);
  }

  #getParentElementName(element) {
    let currentElement = element;

    // Traverse up the DOM tree.
    while (currentElement) {
      const text = currentElement.textContent?.trim();

      if (text) {
        // Clean up the text by removing ":" and ":*", if present.
        return text.replace(/:\*?/g, '');
      }

      // Move up to the parent.
      currentElement = currentElement.parentElement;
    }

    // Return null if no matching parent element is found.
    return null;
  }

  cutTextAfter(value, size = 50, stringToReplace = '...') {
    if ((value) && (value.length > size)) {
      const endIndex = (size - stringToReplace.length);
      value = value.substr(0, endIndex) + stringToReplace;
    }

    return value;
  }

  replaceAllCharactersWithAsterisks(value) {
    if (value) {
      value = value.replaceAll(/./gi, '*');
    }

    return value;
  }

  clear(element) {
    this.setValue(element, '', true);
  }

  classListAdd(element, className) {
    if (element) {
      element.classList.add(className);
    }
  }

  classListRemove(element, className) {
    if (element) {
      element.classList.remove(className);
    }
  }

  classListReplace(element, oldClassName, newClassName) {
    if (element) {
      element.classList.replace(oldClassName, newClassName);
    }
  }

  show(element) {
    if (element) {
      this.classListReplace(element, 'hidden', 'visible');
    }
  }

  hide(element) {
    if (element) {
      this.classListReplace(element, 'visible', 'hidden');
    }
  }

  isVisible(element) {
    if (!element) {
      return false;
    }

    if (!element.offsetParent) {
      return false;
    }

    if (element.style.display === 'none') {
      return false;
    }

    if (element.style.visibility === 'hidden') {
      return false;
    }

    const computedStyle = window.getComputedStyle(element);
    const visibility = computedStyle.getPropertyValue('visibility');

    return visibility !== 'hidden';
  }

  enable(element) {
    if (element) {
      element.disabled = false;
    }
  }

  disable(element) {
    if (element) {
      element.disabled = true;
    }
  }

  isAnyElementChecked(...elements) {
    // Works the same way for both checkboxes and radio buttons.
    return elements.some(element => element.checked);
  }

}
