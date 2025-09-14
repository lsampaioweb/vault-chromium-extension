/**
 * Provides static methods to replace text content within HTML elements based on a given regular expression and replacement function.
 */
export class HTMLReplacer {

  /**
  * Defines tags whose text content should not be processed.
  * These tags often contain code or styles, not user-facing text.
  * @type {string[]}
  * @private
  */
  static #IGNORED_TAGS = ['SCRIPT', 'STYLE'];

  /**
   * Replaces text in an element and its descendants using a TreeWalker.
   * @param {HTMLElement} element - The root element to start replacing from.
   * @param {{regex: RegExp, func: function(string, ...string): string}} match - An object containing the regex and replacement function.
   */
  static replace(element, match) {
    try {
      // Return early if the element is not valid.
      if (!element) {
        return;
      }

      // Create a TreeWalker to efficiently traverse Text and Element nodes.
      // NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT tells it to visit both element nodes (for attributes) and text nodes (for content).
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        null, // We don't need a custom filter function.
        false // This argument is deprecated and not used.
      );

      let node;
      // Iterate through each node found by the TreeWalker.
      while ((node = walker.nextNode())) {
        switch (node.nodeType) {
          case Node.ELEMENT_NODE:
            // Process attributes for specific element types.
            this.#replaceElementNode(node, match);
            break;
          case Node.TEXT_NODE:
            // Process text nodes, but only if they are not inside an ignored tag.
            if (node.parentNode && !this.#IGNORED_TAGS.includes(node.parentNode.tagName)) {
              this.#replaceTextNode(node, match);
            }
            break;
        }
      }
    } catch (error) {
      console.error("Error during HTML replacement:", error);
    }
  }

  /**
   * Replaces text in specific attributes of known element types.
   * @param {HTMLElement} element - The element node to process.
   * @param {{regex: RegExp, func: function(string, ...string): string}} match - The match object.
   * @private
   */
  static #replaceElementNode(element, match) {
    // Process attributes only for a predefined set of tags.
    switch (element.tagName) {
      case 'TEXTAREA':
      case 'INPUT':
        element.value = this.#replaceText(element.value, match);
        element.placeholder = this.#replaceText(element.placeholder, match);
        break;
      case 'SPAN':
      case 'BUTTON':
        // Only replace 'title' if the attribute actually exists.
        if (element.hasAttribute('title')) {
          element.title = this.#replaceText(element.title, match);
        }
        break;
      case 'IMG':
        // Only replace 'title' and 'alt' if they exist.
        if (element.hasAttribute('title')) {
          element.title = this.#replaceText(element.title, match);
        }
        if (element.hasAttribute('alt')) {
          element.alt = this.#replaceText(element.alt, match);
        }
        break;
      // default:
      //   console.warn(element.tagName);
      //   break;
    }
  }

  /**
   * Replaces text within a text node.
   * @param {Text} element - The text node to process.
   * @param {{regex: RegExp, func: function(string, ...string): string}} match - The match object.
   * @private
   */
  static #replaceTextNode(element, match) {
    // Directly replace the content of the text node.
    element.nodeValue = this.#replaceText(element.nodeValue, match);
  }

  /**
   * Performs the actual text replacement using the provided regex and function.
   * @param {string | null} text - The text to process.
   * @param {{regex: RegExp, func: function(string, ...string): string}} match - The match object.
   * @returns {string} The processed text, or an empty string if input was null/undefined.
   * @private
   */
  static #replaceText(text, match) {
    // Return empty string if the input text is null, undefined, or doesn't exist.
    if (!text) {
      return '';
    }

    // Use the provided regex and function to replace content.
    return text.replace(match.regex, match.func);
  }
}
