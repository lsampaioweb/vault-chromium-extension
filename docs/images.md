### Images

## 1. About Page
This section shows the About page of the extension, giving users an overview of its functionality.

![About](images/app/01-about.png)

## 2. Login
This section showcases the login process, error handling, and the interface after a successful login.

### 2.1 Login Page
The login page allows users to enter the Vault URL and choose an authentication method. We recommend using **HTTPS** for security, as shown in the example. Users can authenticate using either **local Vault credentials** or **LDAP authentication**.

![Login](images/app/02-01-login.png)

### 2.2 Error Handling
If the user does not provide all required fields or enters invalid values, the extension displays validation messages to guide them. This ensures a smoother experience by preventing common mistakes.

![Login Error Message](images/app/02-02-login-error-message.png)

### 2.3 Signed-In State
Once logged in, the interface displays the authenticated **Vault URL** and the **user's name**, confirming a successful login. This provides users with clear feedback that they are connected to the correct Vault instance.

![Signed In](images/app/02-03-signed-in.png)

## 3. Tools
This section highlights the available tools within the extension, including the **Password Generator**, **Wrap**, and **Unwrap** functionalities.

![Tools](images/app/03-01-tools.png)

### 3.1 Password Generator
The **Password Generator** tool allows users to create secure passwords with customizable options. Users can specify:
- Inclusion of **numbers**, **lowercase letters**, **uppercase letters**, and **special characters**
- Desired **password length** (default is **20 characters**)

![Password Generator](images/app/03-02-password-generator.png)

#### 3.1.1 Generated Password (Hidden)
Once a random password is generated, it is displayed as **masked characters ("****")** by default. This allows users to copy the password securely without exposing it on the screen.

![Password Generator Generated (Hide)](images/app/03-03-password-generator-generated-hide.png)

#### 3.1.2 Generated Password (Visible)
If needed, users can click the **"View"** button to reveal the generated password.

![Password Generator Generated (Show)](images/app/03-04-password-generator-generated-show.png)

### 3.2 Wrap
The Wrap tool simplifies the process of creating wrapped secrets, offering both simple and advanced options.

![Wrap Simple](images/app/03-05-wrap-simple.png)
![Wrap Simple Sample](images/app/03-06-wrap-simple-sample.png)
![Wrap Simple Sample Generated](images/app/03-07-wrap-simple-sample-generated.png)
![Wrap Advanced](images/app/03-08-wrap-advanced.png)

### 3.3 Unwrap
The Unwrap tool allows users to securely retrieve the contents of a wrapped secret.

![Unwrap](images/app/03-09-unwrap.png)
![Unwrap Sample](images/app/03-10-unwrap-sample.png)
![Unwrap Tried Again](images/app/03-11-unwrap-tried-again.png)

## 4. Create Credentials
This section shows how to create and manage credentials using the extension.

![Create Credential (User Password)](images/app/04-01-create-credential-user-password.png)
![Create Credential (List Secret Engines)](images/app/04-02-create-credential-list-secret-engines.png)
![Create Credential (Multiple Paths)](images/app/04-03-create-credential-multiple-paths.png)
![Create Credential (User Token)](images/app/04-04-create-credential-user-token.png)

### 4.1 List and Delete Credentials
View and manage your credentials, including pagination and deletion features.

![List Credentials (Small)](images/app/04-05-list-credential-small.png)
![List Credentials (Pagination)](images/app/04-06-list-credential-pagination.png)
![Delete Credential](images/app/04-07-delete-credential.png)

### 4.2 Personal Credential Details
Using the Vault UI, you can view credential details, with the option to hide or show secret values. It's important to note that the password is securely stored in an encrypted format within Vault, ensuring its protection even when viewed in the UI.

![Personal Credential Hidden](images/app/04-08-personal-user1-vault-production-vault.dev.homelab-hide.png)
![Personal Credential Shown](images/app/04-09-personal-user1-vault-production-vault.dev.homelab-show.png)

[Go Back.](../README.md)
