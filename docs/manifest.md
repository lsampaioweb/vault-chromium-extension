# Understanding the Manifest Configuration

This document explains the `manifest.json` configuration for the `Vault Chromium Extension`, detailing each section’s purpose and necessity for developers and contributors.

### Manifest Overview

The `manifest.json` file defines the `Vault Chromium Extension`’s structure, permissions, and behavior, adhering to Chrome’s Manifest V3 standards. It enables features like credential management and secure `Vault` integration (see [Images](images.md)).

### Host Permissions

The `manifest.json` specifies host permissions to allow interaction with web pages:

1. `<all_urls>`:
    ```json
    "host_permissions": ["<all_urls>"]
    ```
    Grants access to all URLs, enabling the extension to inject scripts, monitor navigation, and manage `Vault` credentials across websites.

    **Why it’s needed**:

    Supports autofilling forms and searching credentials based on the current website URL.

### Permissions

The extension requires specific permissions for its functionality:

1. `activeTab`:
    ```json
    "permissions": ["activeTab"]
    ```
    Allows temporary access to the active tab when the user interacts with the extension.

    **Why it’s needed**:

    Retrieves the current tab’s URL to match credentials or inject scripts for autofill.

1. `webNavigation`:
    ```json
    "permissions": ["webNavigation"]
    ```
    Enables listening for navigation events on websites.

    **Why it’s needed**:

    Detects page loads to trigger credential autofill or other actions.

1. `scripting`:
    ```json
    "permissions": ["scripting"]
    ```
    Permits dynamic script injection into web pages.

    **Why it’s needed**:

    Injects scripts to autofill forms or interact with page content.

1. `storage`:
    ```json
    "permissions": ["storage"]
    ```
    Allows storing and retrieving data using Chrome’s `storage` API.

    **Why it’s needed**:

    Saves settings, preferences, or cached `Vault` tokens securely.

1. `clipboardWrite`:
    ```json
    "permissions": ["clipboardWrite"]
    ```
    Enables copying data to the clipboard.

    **Why it’s needed**:

    Supports copying usernames, passwords, or tokens.

1. `alarms`:
    ```json
    "permissions": ["alarms"]
    ```
    Allows scheduling tasks or alarms.

    **Why it’s needed**:

    Manages background tasks, such as refreshing `Vault` tokens.

### Security Considerations

The `manifest.json` uses a Content Security Policy (CSP) to enhance security:

1. `script-src 'self'`:
    ```json
    "content_security_policy": {
      "extension_pages": "script-src 'self'; object-src 'self'"
    }
    ```
    Restricts scripts to those from the extension itself, preventing external JavaScript execution.

    **Why it’s needed**:

    Protects against Cross-Site Scripting (XSS) attacks.

1. `object-src 'self'`:
    ```json
    "content_security_policy": {
      "extension_pages": "script-src 'self'; object-src 'self'"
    }
    ```
    Limits `<object>` elements to extension-hosted resources.

    **Why it’s needed**:

    Prevents malicious plugins or objects from running.

### Content Scripts

Content scripts enable interaction with web pages:

1. `matches: <all_urls>`:
    ```json
    "content_scripts": [
      {
        "matches": ["<all_urls>"],
        "js": [
          "/js/browser/browser-polyfill.min.js",
          "/js/browser/content.js"
        ],
        "all_frames": true
      }
    ]
    ```
    Injects scripts into all URLs, including iframes (`all_frames: true`).

    **Why it’s needed**:

    Enables autofill and credential detection on any webpage.

    - `/js/browser/browser-polyfill.min.js`:

      Ensures compatibility across browsers.

    - `/js/browser/content.js`:

      Handles form detection and credential injection.

### Web Accessible Resources

Resources accessible by web pages are defined:

1. `matches: <all_urls>`:
    ```json
    "web_accessible_resources": [
      {
        "matches": ["<all_urls>"],
        "resources": [
          "/js/libs/notification.js",
          "/js/libs/html-replace.js",
          "/js/libs/i18n.js",
          "/js/libs/forms.js"
        ]
      }
    ]
    ```
    A list of specific scripts made available for access:

    - **`/js/libs/notification.js`**

      Provides notification functionalities for alerting users.

    - **`/js/libs/html-replace.js`**

      Enables dynamic replacement or manipulation of HTML content.

    - **`/js/libs/i18n.js`**

      Handles internationalization (i18n), making the extension adaptable to different languages.

    - **`/js/libs/forms.js`**

      Offers utilities for handling form data, such as parsing and validation.

    **Why it's needed:**

    These resources are essential for enabling core extension features like dynamic page interactions, internationalization, and user notifications. By explicitly listing them, the extension maintains a secure and controlled set of externally accessible scripts.

### Background

The background script manages core functionality:

1. `service_worker`:
    ```json
    "background": {
      "service_worker": "/js/browser/background.js",
      "type": "module"
    }
    ```
    Specifies `/js/browser/background.js` as the service worker, using ES6 modules (`type: module`).

    **Why it’s needed**:

    Handles events, API calls to `Vault`, and scheduled tasks like token renewal.

For issues, open a ticket in the [GitHub repository](https://github.com/lsampaioweb/vault-chromium-extension).

[Go Back.](../README.md)
