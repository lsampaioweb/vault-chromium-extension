export class HTMLReplacer {
  static replace(element, match) {
    try {
      if (!element) {
        return;
      }

      if (element.childNodes.length > 0) {
        for (const childNode of element.childNodes) {
          this.replace(childNode, match);
        }
      }

      switch (element.nodeType) {
        case Node.ELEMENT_NODE:
          this.#replaceElementNode(element, match);
          break;
        case Node.TEXT_NODE:
          this.#replaceTextNode(element, match);
          break;
        // default:
        //   console.log(element.nodeType);
        //   break;
      }
    } catch (error) {
      console.error(error);
    }
  }

  static #replaceElementNode(element, match) {
    switch (element.tagName) {
      case 'INPUT':
        element.value = this.#replaceText(element.value, match);
        element.placeholder = this.#replaceText(element.placeholder, match);
        break;
      case 'TEXTAREA':
        element.title = this.#replaceText(element.title, match);
        break;
      case 'SPAN':
        element.title = this.#replaceText(element.title, match);
        break;
      case 'IMG':
        element.title = this.#replaceText(element.title, match);
        element.alt = this.#replaceText(element.alt, match);
        break;
      case 'BUTTON':
        element.title = this.#replaceText(element.title, match);
        break;
      // default:
      //   console.log(element.tagName);
      //   break;
    }
  }

  static #replaceTextNode(element, match) {
    element.nodeValue = this.#replaceText(element.nodeValue, match);
  }

  static #replaceText(text, match) {
    if (!text) {
      return '';
    }

    return text.replace(match.regex, match.func);
  }
}
