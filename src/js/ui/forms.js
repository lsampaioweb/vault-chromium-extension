/**
 * Provides utility methods for form handling, including event listeners,
 * validation, DOM manipulation, and helper functions.
 */
export class Form {
  /**
   * A Notification instance for displaying messages.
   * @type {Notification}
   * @private
   */
  #notification;

  /**
   * Internationalization instance.
   * @type {I18n}
   * @private
   */
  #i18n;

  /**
   * Logger instance for logging operations and error handling.
   * @type {ConsoleLogger}
   * @private
   */
  #logger;

  /**
   * Creates an instance of the Form class.
   * @param {Notification} notification - A Notification instance.
   * @param {I18n} i18nClass - A class with methods for internationalization.
   * @param {ConsoleLogger} logger - Logger instance for logging operations.
   */
  constructor(notification, i18nClass, logger) {
    this.#notification = notification;
    this.#i18n = i18nClass;
    this.#logger = logger;
  }

  /**
   * Adds an event listener to an HTML element if the element exists.
   * @param {HTMLElement | null} element - The HTML element to attach the listener to.
   * @param {string} type - A string representing the event type to listen for.
   * @param {EventListenerOrEventListenerObject} listener - The object that receives a notification.
   * @param {boolean} [useCapture=false] - A boolean value indicating whether events of this type will be dispatched to the registered listener before being dispatched to any EventTarget beneath it in the DOM tree.
   */
  addEventListener(element, type, listener, useCapture = false) {
    if (element) {
      element.addEventListener(type, listener, useCapture);
    }
  }

  /**
   * Adds a 'change' event listener to an HTML element.
   * @param {HTMLElement | null} element - The HTML element.
   * @param {EventListenerOrEventListenerObject} listener - The event listener.
   * @param {boolean} [useCapture=false] - Event capture flag.
   */
  addChangeListener(element, listener, useCapture = false) {
    this.addEventListener(element, 'change', listener, useCapture);
  }

  /**
   * Adds a 'click' event listener to an HTML element.
   * @param {HTMLElement | null} element - The HTML element.
   * @param {EventListenerOrEventListenerObject} listener - The event listener.
   * @param {boolean} [useCapture=false] - Event capture flag.
   */
  addClickListener(element, listener, useCapture = false) {
    this.addEventListener(element, 'click', listener, useCapture);
  }

  /**
   * Adds a 'keydown' event listener to an input element that triggers a click
   * on a button element when the 'Enter' key is pressed.
   * @param {HTMLInputElement | null} inputElement - The input field to listen on.
   * @param {HTMLButtonElement | null} buttonElement - The button to click on Enter.
   */
  addEnterKeydownListener(inputElement, buttonElement) {
    // Ensure buttonElement is provided before binding, though addEventListener also checks inputElement.
    if (inputElement && buttonElement) {
      this.addEventListener(inputElement, 'keydown', this.#enterKeydown.bind(buttonElement));
    }
  }

  /**
   * Handles the keydown event for the Enter key.
   * Bound 'this' context will be the buttonElement.
   * @param {KeyboardEvent} event - The keyboard event.
   * @private
   */
  #enterKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      // 'this' is bound to the element in the ...bind(element).
      this?.click();
    }
  }

  /**
   * Validates a set of form elements.
   * @param {object} elements - An object containing 'required' and/or 'optional' arrays of HTML elements.
   * @param {function(HTMLElement): {isValid: boolean, errorMessage?: string}} validateFunction
   * A callback function that takes an HTML element and returns an object
   * indicating if it's valid and an optional error message.
   * @returns {boolean} True if all elements are valid, false otherwise.
   */
  validate(elements, validateFunction) {
    if (elements) {
      // Validate required elements first.
      if (elements.required && !this.#validateElementSet(elements.required, validateFunction, true)) {
        return false; // Fail fast if a required field is invalid.
      }
      // Then validate optional elements.
      if (elements.optional && !this.#validateElementSet(elements.optional, validateFunction, false)) {
        return false;
      }
    }
    // Return true if all validations passed.
    return true;
  }

  /**
   * Validates an array of elements against a set of rules.
   * Sets focus on the first invalid element found.
   * @param {HTMLElement[]} elements - An array of HTML elements to validate.
   * @param {function(HTMLElement): {isValid: boolean, errorMessage?: string}} validateFunction - The validation callback.
   * @param {boolean} isRequired - If true, elements cannot be empty. If false, empty elements are considered valid.
   * @returns {boolean} True if all validated elements are valid, false otherwise.
   * @private
   */
  #validateElementSet(elements, validateFunction, isRequired) {
    let foundElementWithError = false;

    for (const element of elements) {
      if (!element) {
        continue;
      }

      let foundError = false;

      if (isRequired && this.isEmpty(element)) {
        // Required fields fail if they are empty.
        this.#showEmptyElementErrorMessage(element);
        foundError = true;
      } else if (!this.isEmpty(element)) {
        // Both required and optional fields are validated if they are NOT empty.
        const check = validateFunction(element);
        if (!check.isValid) {
          this.#showInvalidElementErrorMessage(element, check);
          foundError = true;
        }
      }

      // If an error was found for this element and it's the first one in the set,
      // set focus to guide the user.
      if (foundError && !foundElementWithError) {
        foundElementWithError = true;
        this.setFocus(element);
      }
    }
    // Return true if no errors were found in this set.
    return !foundElementWithError;
  }

  /**
   * Displays an error message for an invalid element.
   * It uses a specific message from the validation check if available, otherwise falls back to a default message.
   * @param {HTMLElement} element - The invalid HTML element.
   * @param {{isValid: boolean, errorMessage?: string}} check - The validation result object.
   * @private
   */
  #showInvalidElementErrorMessage(element, check) {
    if (check?.errorMessage) {
      this.#showErrorMessage(check.errorMessage);
    } else {
      this.#showInvalidElementDefaultErrorMessage(element, this.getValue(element));
    }
  }

  /**
   * Displays an error message using the notification instance.
   * If no notification instance is available, it logs a warning to the logger.
   * @param {string} message - The error message to display.
   * @private
   */
  #showErrorMessage(message) {
    // Check if #notification exists before using it.
    if (this.#notification) {
      this.#notification.error(message);
    } else {
      this.#logger.warn(this.#i18n.getMessage('error_form_no_notifier_available', [message]));
    }
  }

  /**
   * Displays a standardized error message for a required field that is empty.
   * @param {HTMLElement} element - The empty HTML element.
   * @private
   */
  #showEmptyElementErrorMessage(element) {
    this.#showErrorMessageById(element, 'error_form_field_required');
  }

  /**
   * Displays a standardized default error message for a field with an invalid value.
   * @param {HTMLElement} element - The invalid HTML element.
   * @param {string} value - The invalid value that was entered.
   * @private
   */
  #showInvalidElementDefaultErrorMessage(element, value) {
    this.#showErrorMessageById(element, 'error_form_field_invalid', value);
  }

  /**
   * Constructs and displays a localized error message.
   * It finds the element's name, gets the localized message string, and displays it.
   * @param {HTMLElement} element - The element associated with the error.
   * @param {string} messageId - The i18n message key.
   * @param {string | null} [value=null] - An optional value to substitute into the message.
   * @private
   */
  #showErrorMessageById(element, messageId, value = null) {
    const elementName = this.#getParentElementName(element);

    // If the element is of type="password". The value should not be displayed.
    if ((element.type === 'password') && (value)) {
      value = this.replaceAllCharactersWithAsterisks(value);
    }

    const errorMessage = this.#i18n.getMessage(messageId, [elementName, value]);

    this.#showErrorMessage(errorMessage);
  }

  /**
   * Checks if an element's effective value (after trimming) is empty.
   * @param {HTMLElement | null} element - The element to check.
   * @returns {boolean} True if the element is empty, false otherwise.
   */
  isEmpty(element) {
    return (this.getValue(element).trim().length === 0);
  }

  /**
   * Sets the value of an HTML element.
   * Prioritizes 'value' property for form elements, then 'textContent'.
   * If 'acceptHTML' is true, 'innerHTML' is used.
   * @param {HTMLElement | null} element - The element whose value is to be set.
   * @param {string | number | boolean | null} value - The value to set.
   * @param {boolean} [acceptHTML=false] - If true, sets innerHTML; otherwise, sets text content or value.
   */
  setValue(element, value, acceptHTML = false) {
    // Ensure element exists and value is not undefined (null or empty string are fine).
    if (element && value !== undefined) {
      // Ensure value is a string for textContent/innerHTML.
      const valString = String(value);

      if (acceptHTML) {
        if ('innerHTML' in element) {
          element.innerHTML = valString;
        }
      } else if ('value' in element) {
        element.value = valString;
      } else if ('textContent' in element) {
        element.textContent = valString;
      } else if ('nodeValue' in element) {
        element.nodeValue = valString;
      } else if ('innerText' in element) {
        element.innerText = valString;
      }
    }
  }

  /**
   * Gets the value from an HTML element.
   * Prioritizes 'value' (for form elements), then 'textContent'.
   * Returns an empty string if no suitable value property is found or element is null.
   * @param {HTMLElement | null} element - The element to get the value from.
   * @returns {string} The value of the element, or an empty string.
   */
  getValue(element) {
    if (element) {
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
    }

    // Default for null element or element without a relevant property.
    return '';
  }

  /**
   * Sets focus to the specified HTML element if it exists.
   * @param {HTMLElement | null} element - The element to focus.
   */
  setFocus(element) {
    element?.focus();
  }

  /**
   * Removes focus from the specified HTML element if it exists.
   * @param {HTMLElement | null} element - The element to blur.
   */
  blur(element) {
    element?.blur();
  }

  /**
   * Sets focus on the first visible element in a list, prioritizing the first
   * visible empty element.
   * @param {(HTMLElement | null)[]} elements - An array of HTML elements to consider.
   */
  setFocusOnFirstElementOrFirstEmpty(elements) {
    let firstElement = null;
    let firstEmpty = null;

    for (const element of elements) {
      // Skip if element is null or not visible.
      if (!element || !this.isVisible(element)) {
        continue;
      }

      if (!firstElement) {
        firstElement = element;
      }

      if (this.isEmpty(element)) {
        if (!firstEmpty) {
          firstEmpty = element;
          // Found the first empty visible one, no need to continue.
          break;
        }
      }
    }

    this.setFocus(firstEmpty || firstElement);
  }

  /**
   * Traverses up the DOM tree from a given element to find a "name" for it,
   * typically from a <label> or a parent with descriptive text.
   * The found text is cleaned of common label suffixes like ":" or ":*".
   * @param {HTMLElement} element - The form element to find a name for.
   * @returns {string | null} A descriptive name for the element, or null if not found.
   * @private
   */
  #getParentElementName(element) {
    let currentElement = element;

    // Traverse up the DOM tree.
    while (currentElement) {
      // Get the trimmed innerText of the current element.
      const text = currentElement.innerText?.trim();

      if (text) {
        // Clean up the text by removing ":" and ":*", if present.
        return text.replace(/:\*?$/g, '').trim();
      }

      // Move to the parent element.
      currentElement = currentElement.parentElement;
    }

    // Return null if no matching parent element is found.
    return null;
  }

  /**
   * Truncates a string if its length exceeds a specified size and appends a replacement string.
   * @param {string | number | boolean | null} value - The input value to truncate.
   * @param {number} [size=50] - The maximum desired length before truncation (including replacement string).
   * @param {string} [stringToReplace="..."] - The string to append if truncation occurs.
   * @returns {string} The truncated string or the original string if within size.
   */
  cutTextAfter(value, size = 50, stringToReplace = '...') {
    if ((value) && (value.length > size)) {
      const endIndex = (size - stringToReplace.length);
      value = String(value).slice(0, endIndex) + stringToReplace;
    }

    return value;
  }

  /**
   * Replaces all characters in a string with asterisks.
   * Useful for masking sensitive information.
   * @param {string | number | boolean | null} value - The input value.
   * @returns {string | null | undefined} A string of asterisks of the same length, or the original
   * value if it was null/undefined, or an empty string if the input was an empty string.
   */
  replaceAllCharactersWithAsterisks(value) {
    if (value === null || typeof value === 'undefined' || value === '') {
      return value;
    }

    return String(value).replaceAll(/./g, '*');
  }

  /**
   * Clears the value or text content of an HTML element.
   * For form inputs, it clears the 'value'. For other elements, 'textContent'.
   * @param {HTMLElement | null} element - The element to clear.
   */
  clear(element) {
    this.setValue(element, '', true);
  }

  /**
   * Adds a CSS class to an HTML element if the element exists.
   * @param {HTMLElement | null} element - The HTML element.
   * @param {string} className - The CSS class name to add.
   */
  classListAdd(element, className) {
    if (element) {
      element.classList.add(className);
    }
  }

  /**
   * Removes a CSS class from an HTML element if the element exists.
   * @param {HTMLElement | null} element - The HTML element.
   * @param {string} className - The CSS class name to remove.
   */
  classListRemove(element, className) {
    if (element) {
      element.classList.remove(className);
    }
  }

  /**
   * Replaces an old CSS class with a new CSS class on an HTML element if the element exists.
   * @param {HTMLElement | null} element - The HTML element.
   * @param {string} oldClassName - The CSS class name to replace.
   * @param {string} newClassName - The new CSS class name to add.
   */
  classListReplace(element, oldClassName, newClassName) {
    if (element) {
      element.classList.replace(oldClassName, newClassName);
    }
  }

  /**
   * Shows an HTML element by replacing the 'hidden' class with 'visible'.
   * Assumes 'hidden' and 'visible' CSS classes are defined to control display.
   * @param {HTMLElement | null} element - The HTML element to show.
   */
  show(element) {
    this.classListReplace(element, 'hidden', 'visible');
  }

  /**
   * Hides an HTML element by replacing the 'visible' class with 'hidden'.
   * Assumes 'hidden' and 'visible' CSS classes are defined to control display.
   * @param {HTMLElement | null} element - The HTML element to hide.
   */
  hide(element) {
    this.classListReplace(element, 'visible', 'hidden');
  }

  /**
   * Checks if an HTML element is currently visible.
   * Note: This is a pragmatic check. It covers the most common CSS hiding
   * properties (`display: none` via offsetParent, and `visibility: hidden`)
   * but does not check for more obscure cases like `opacity: 0`,
   * zero dimensions, or off-screen positioning.
   * @param {HTMLElement | null} element - The HTML element to check.
   * @returns {boolean} True if the element is considered visible, false otherwise.
   */
  isVisible(element) {
    if (!element) {
      return false;
    }

    // If element is document.body, offsetParent is null but body is visible.
    // This check is primarily for elements within the body.
    if (!element.offsetParent && element !== document.body) {
      return false;
    }

    if (element.style.display === 'none') {
      return false;
    }

    if (element.style.visibility === 'hidden') {
      return false;
    }

    // Check computed style for visibility only.
    const computedStyle = window.getComputedStyle(element);
    const visibility = computedStyle.getPropertyValue('visibility');

    return visibility !== 'hidden';
  }

  /**
   * Enables a form element (e.g., input, button) if it exists.
   * @param {HTMLElement | null} element - The HTML element to enable.
   */
  enable(element) {
    if (element) {
      element.disabled = false;
    }
  }

  /**
   * Disables a form element (e.g., input, button) if it exists.
   * @param {HTMLElement | null} element - The HTML element to disable.
   */
  disable(element) {
    if (element) {
      element.disabled = true;
    }
  }

  /**
   * Checks if at least one of the provided elements (e.g., checkboxes, radio buttons) is checked.
   * @param {...(HTMLInputElement | null)} elements - A list of elements to check.
   * @returns {boolean} True if at least one element is checked, false otherwise.
   */
  isAnyElementChecked(...elements) {
    // The .some() method will iterate through the elements.
    return elements.some(element => element?.checked);
  }

}
