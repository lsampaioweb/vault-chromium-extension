# Images

This document showcases the `Vault Chromium Extension`’s user interface with screenshots, highlighting key features like the `Login` page, `Credentials` management, and `Tools` for password generation and secure sharing. For setup instructions, see [Installation](installation.md) or [Vault Config](vault/vault.md).

## 1. About Page

The `About` page provides an overview of the `Vault Chromium Extension`’s functionality, including version details and feature highlights.

![About](images/app/01-about.png)

## 2. Login

This section demonstrates the `Login` process, including error handling and the interface after successful authentication.

### 2.1 Login Page

The `Login` page lets users enter the `Vault` URL and choose an authentication method (`LDAP` or `userpass`). Use `HTTPS` for secure connections, as shown.

![Login](images/app/02-01-login.png)

### 2.2 Error Handling

If users omit required fields or enter invalid values, the extension displays clear validation messages to guide them.

![Login Error Message](images/app/02-02-login-error-message.png)

### 2.3 Signed-In State

After successful login, users are redirected to the `Credentials` page, with the authenticated `Vault` URL and username briefly displayed.

![Signed In](images/app/02-03-signed-in.png)

## 3. Tools

This section highlights the `Tools` available, including the `Password Generator`, `Wrap`, and `Unwrap` features.

![Tools](images/app/03-01-tools.png)

### 3.1 Password Generator

The `Password Generator` creates secure passwords with customizable options:

1. Include numbers, lowercase, uppercase, or special characters.
1. Set the password length (default: 20 characters).

![Password Generator](images/app/03-02-password-generator.png)

#### 3.1.1 Generated Password (Hidden)

Generated passwords are masked (`****`) by default for security, with a copy option.

![Password Generator Generated (Hide)](images/app/03-03-password-generator-generated-hide.png)

#### 3.1.2 Generated Password (Visible)

Users can click **View** to reveal the password.

![Password Generator Generated (Show)](images/app/03-04-password-generator-generated-show.png)

### 3.2 Wrap

The `Wrap` tool creates wrapped secrets for secure sharing, with `Simple` and `Advanced` options.

#### 3.2.1 Simple Wrap

The `Simple` tab allows a single key-value pair (e.g., key: `password`, value: `xyzabc123@`). Set an expiration time (default: 30 minutes).

![Wrap Simple](images/app/03-05-wrap-simple.png)

A sample key-value entry is provided for reference.

![Wrap Simple Sample](images/app/03-06-wrap-simple-sample.png)

After wrapping, `Vault` returns a wrapped token (hash) for secure sharing.

![Wrap Simple Sample Generated](images/app/03-07-wrap-simple-sample-generated.png)

#### 3.2.2 Advanced Wrap

The `Advanced` tab supports multiple key-value pairs in JSON format, with a sample provided.

![Wrap Advanced](images/app/03-08-wrap-advanced.png)

### 3.3 Unwrap

The `Unwrap` tool retrieves the original content of a wrapped secret using a valid token (hash).

#### 3.3.1 Entering a Wrapped Token

Users enter the received token (hash) to unwrap the secret.

![Unwrap](images/app/03-09-unwrap.png)

#### 3.3.2 Retrieving the Original Content

After submitting the token, `Vault` displays the original secret.

![Unwrap Sample](images/app/03-10-unwrap-sample.png)

#### 3.3.3 Security: One-Time Use

Wrapped tokens are one-time use. Attempting to reuse a token results in an error.

![Unwrap Tried Again](images/app/03-11-unwrap-tried-again.png)

## 4. Create Credentials

This section explains how to create and manage credentials in the `Vault Chromium Extension`. Users define properties like secret engine, path, name, and authentication type, with an optional comment field.

### 4.1 Defining Credential Properties

Users specify the secret engine, path, credential name, and type (`username/password` or `token`). A comment field aids organization.

![Create Credential (User Password)](images/app/04-01-create-credential-user-password.png)

### 4.2 Selecting the Secret Engine

Choose a secret engine from a dropdown listing accessible engines (e.g., personal or team secrets).

![Create Credential (List Secret Engines)](images/app/04-02-create-credential-list-secret-engines.png)

### 4.3 Organizing with Multiple Paths

Create structured paths (e.g., `production/database`, `staging/database`) for organized credential management.

![Create Credential (Multiple Paths)](images/app/04-03-create-credential-multiple-paths.png)

### 4.4 Creating a Token-Based Credential

For token-based credentials, only the `token` field is displayed.

![Create Credential (User Token)](images/app/04-04-create-credential-user-token.png)

## 5. List and Delete Credentials

This section covers viewing, searching, and managing credentials, including pagination and deletion.

### 5.1 Searching for Credentials

The extension searches for credentials based on the current website URL (e.g., `github.com`) when clicking the extension icon. Users can also search manually. Each entry includes actions:

1. Copy `username` (if applicable).
1. Copy `password` (if applicable).
1. Copy `token` (for token-based credentials).
1. Edit credential.
1. Delete credential.

![List Credentials (Small)](images/app/04-05-list-credential-small.png)

### 5.2 Integration with Vault UI Credentials

Credentials created in the `HashiCorp Vault` UI are listed if they use specific field names:

- **Username Keys**:

  `user`, `usuario`, `username`, `user_name`, `login`, `cpf`, `email`

- **Password Keys**:

  `pass`, `senha`, `password`, `secret`

- **Token Keys**:

  `token`, `key`, `chave`

- **Comment Keys**:

  `comment`, `comments`, `comentario`, `comentarios`, `comentário`, `comentários`

Ensure `Vault` credentials follow these conventions for seamless integration.

![List Credentials (Pagination)](images/app/04-06-list-credential-pagination.png)

### 5.3 Pagination for Large Credential Lists

For lists with more than four credentials, a pagination bar appears for easy navigation.

![List Credentials (Pagination)](images/app/04-06-list-credential-pagination.png)

### 5.4 Deleting a Credential

Each credential has a **Delete** button with a confirmation prompt to prevent accidental deletion.

![Delete Credential](images/app/04-07-delete-credential.png)

## 6. Personal Credential Details

In the `Vault` UI, view credential details with options to hide or show secret values. Passwords are encrypted for security.

![Personal Credential Hidden](images/app/04-08-personal-user1-vault-production-vault.dev.homelab-hide.png)

![Personal Credential Shown](images/app/04-09-personal-user1-vault-production-vault.dev.homelab-show.png)

## Current Features

The `Vault Chromium Extension` includes:

1. Secure integration with `HashiCorp Vault` for credential management.
1. User-friendly interface with `Login`, `Credentials`, and `Tools` pages.
1. Support for multiple languages via internationalization (see [Internationalization](i18n.md)).
1. Visual feedback with screenshots for all major features.

For issues or feedback, open a ticket in the [GitHub repository](https://github.com/lsampaioweb/vault-chromium-extension).

[Go Back.](../README.md)
