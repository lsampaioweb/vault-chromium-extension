import { PageController } from './login-base-controller.js';
import { dependencies } from '../../services/auth.js';

// Initialize controller when i18n translation is complete.
document.addEventListener('i18nReady', () => {
  // Create the instance of the Controller with the necessary dependencies.
  const controller = new LoginController(dependencies);

  // Execute the main controller logic.
  controller.main();
}, false);

class LoginController extends PageController {

  /**
   * Constructor that accepts dependencies and passes them to the page controller.
   * @param {object} dependencies - The injected dependencies.
   */
  constructor(dependencies) {
    super(dependencies);
  }

  /**
   * Main entry point called after i18n translation is complete.
   * Checks if user has a valid token and shows either the logged-in
   * page or the login form accordingly.
   *
   * @async
   * @returns {Promise<void>}
   */
  async main() {
    try {
      const token = await this.storage.getToken();

      if (this.VaultUtils.isTokenValid(token)) {
        await this.showLoggedInPage();
      } else {
        await this.showLoginPage();
      }
    } catch (error) {
      this.notification.error(error);
    }
  }

  /**
   * Displays the logged-in state interface.
   * Hides the login form, shows logout interface, and displays
   * current Vault URL and username information.
   *
   * @async
   * @returns {Promise<void>}
   */
  async showLoggedInPage() {
    this.hideLoginForm();
    this.showLogoutForm();

    const loggedinUrl = this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_LOGGED_IN_URL, [await this.storage.getUrl()]);
    const loggedinUser = this.I18n.getMessage(PageController.i18nKeys.messages.UI_MESSAGE_LOGGED_IN_USER, [await this.storage.getUsername()]);

    this.form.setValue(this.getLabelLoggedInUrl(), loggedinUrl);
    this.form.setValue(this.getLabelLoggedInUser(), loggedinUser);

    this.form.addClickListener(this.getButtonLogout(), this.logout.bind(this));
  }

  /**
   * Displays the login form interface.
   * Hides logout interface, shows login form, and pre-fills form fields
   * with any stored values from previous sessions.
   *
   * @async
   * @returns {Promise<void>}
   */
  async showLoginPage() {
    this.hideLogoutForm();
    this.showLoginForm();

    const url = this.getInputUrl();
    const authMethod = this.getInputAuthMethod();
    const username = this.getInputUsername();
    const password = this.getInputPassword();

    // Set value of the elements if there is any in the storage.
    this.form.setValue(url, await this.storage.getUrl() || this.I18n.getMessage(PageController.i18nKeys.messages.CONFIG_VAULT_URL));
    this.form.setValue(username, await this.storage.getUsername());

    const btnLogin = this.getButtonLogin();
    this.form.addClickListener(btnLogin, this.login.bind(this));

    this.form.addEnterKeydownListener(url, btnLogin);
    this.form.addEnterKeydownListener(authMethod, btnLogin);
    this.form.addEnterKeydownListener(username, btnLogin);
    this.form.addEnterKeydownListener(password, btnLogin);

    this.setFocusOnFirstElementOrFirstEmpty();
  }

  /**
   * Handles the login process when user submits credentials.
   * Validates form data, authenticates with Vault using provided credentials,
   * stores the authentication token, and redirects to the secrets page.
   *
   * @async
   * @returns {Promise<void>}
   */
  async login() {
    try {
      this.notification.clear();

      const url = this.getInputUrl();
      const authMethod = this.getInputAuthMethod();
      const username = this.getInputUsername();
      const password = this.getInputPassword();

      const isValid = this.form.validate({ required: [url, authMethod, username, password] }, this.isValid.bind(this));
      if (isValid) {
        this.showLoginLoading();

        this.storage.setUrl(url.value);
        this.storage.setUsername(username.value);

        const vault = this.vaultFactory.create(url.value);
        const result = await vault.login(username.value, password.value, authMethod.value);

        this.storage.setToken(result.token);

        this.redirectToSecretsPage();
      }
    } catch (error) {
      this.hideLoginLoading();
      this.notification.error(error);
    }
  }

  /**
   * Handles the logout process when user clicks logout.
   * Revokes the current token with Vault server, clears stored credentials,
   * and reloads the page to return to login state.
   *
   * @async
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      this.notification.clear();

      const token = await this.storage.getToken();

      if (this.VaultUtils.isTokenValid(token)) {
        this.showLogoutLoading();

        const vault = this.vaultFactory.create(await this.storage.getUrl(), token);
        await vault.logout();
      }

      location.reload();
    } catch (error) {
      this.hideLogoutLoading();
      this.notification.error(error);
    } finally {
      this.storage.setToken(null);
    }
  }

}
