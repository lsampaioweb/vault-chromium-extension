/**
 * @fileoverview Background service worker for Vault Password Manager Extension.
 * Handles installation, content script injection, and automatic token renewal.
 */

import './browser-polyfill.min.js';
import { dependencies } from '../services/background.js';

/**
 * Background service class that manages extension lifecycle, content script injection,
 * and automatic token renewal. Follows the same DI pattern as page controllers.
 */
class BackgroundService {
  /**
   * Logger service for debugging and background operations.
   * @type {object|null}
   */
  logger;

  /**
   * Storage service for managing session data like tokens and URLs.
   * @type {object|null}
   */
  storage;

  /**
   * Vault utility functions for token validation and path management.
   * @type {object|null}
   */
  VaultUtils;

  /**
   * Factory to create Vault instances with dependency injection.
   * @type {object|null}
   */
  vaultFactory;

  /**
   * Constructor that accepts dependencies via dependency injection.
   * @param {object} dependencies - The injected dependencies
   * @param {object} dependencies.logger - Logger instance for background operations
   * @param {object} dependencies.storage - Storage instance for token/URL management
   * @param {object} dependencies.VaultUtils - Utility functions for Vault token management
   * @param {object} dependencies.vaultFactory - Factory to create Vault instances
   * @returns {void}
   */
  constructor(dependencies) {
    this.logger = dependencies.logger;
    this.storage = dependencies.storage;
    this.VaultUtils = dependencies.VaultUtils;
    this.vaultFactory = dependencies.vaultFactory;

    // Constants.
    this.TOKEN_CHECK_ALARM_NAME = 'tokenCheck';
    this.ALARM_SETTINGS = {
      MIN_ALARM_MINUTES: 5,
      DEFAULT_ALARM_MINUTES: 45
    };
    this.RENEWAL_THRESHOLD_MINUTES = 60;
  }

  /**
   * Initialize the background service and register all event listeners.
   * This is the main entry point for the background script.
   * @returns {void}
   */
  initialize() {
    this.#registerEventListeners();

    this.logger.info('Background service initialized successfully.');
  }

  /**
   * Registers all Chrome extension event listeners.
   * @private
   * @returns {void}
   */
  #registerEventListeners() {
    // Listen for extension installation or update events.
    this.#getBrowserHandler().runtime.onInstalled.addListener(this.#handleInstalled.bind(this));

    // Listen for SPA navigation events to re-inject content scripts as needed.
    this.#getBrowserHandler().webNavigation.onHistoryStateUpdated.addListener(this.#handleNavigation.bind(this));

    // Listen for Chrome startup events to trigger token check/renewal.
    this.#getBrowserHandler().runtime.onStartup.addListener(this.#handleStartup.bind(this));

    // Listen for alarm events to trigger token renewal checks.
    this.#getBrowserHandler().alarms.onAlarm.addListener(this.#handleAlarm.bind(this));
  }

  /**
   * Finds an alarm object by its name from a list of alarms.
   *
   * @param {Array<Object>} alarms - Array of alarm objects.
   * @param {string} name - The name of the alarm to find.
   * @returns {Object|undefined} The alarm object with the specified name, or undefined if not found.
   * @private
   */
  #getAlarmByName(alarms, name) {
    return alarms.find(alarm => alarm.name === name);
  }

  /**
   * Clears the specified token renewal alarm if it exists.
   * Used to stop automatic token renewal when logging out or when errors occur.
   *
   * @async
   * @param {string} [alarmName=TOKEN_CHECK_ALARM_NAME] - The name of the alarm to clear.
   * @returns {Promise<void>}
   * @private
   */
  async #clearTokenAlarm(alarmName = this.TOKEN_CHECK_ALARM_NAME) {
    try {
      const alarm = this.#getAlarmByName(await this.#getBrowserHandler().alarms.getAll(), alarmName);

      if (alarm) {
        await this.#getBrowserHandler().alarms.clear(alarmName);
        this.logger.info(`Alarm '${alarmName}' cleared successfully.`);
      }

    } catch (error) {
      this.logger.error(`Failed to clear alarm '${alarmName}':`, error);
    }
  }

  /**
   * A central function to initialize the extension's background tasks.
   * It sets up the repeating alarm. This should only be called on install or startup.
   * @async
   * @param {number} [periodInMinutes=ALARM_SETTINGS.DEFAULT_ALARM_MINUTES] - The alarm period in minutes.
   * @returns {Promise<void>}
   * @private
   */
  async #initializeAlarm(periodInMinutes = this.ALARM_SETTINGS.DEFAULT_ALARM_MINUTES) {
    try {
      this.logger.info(`Setting up repeating alarm '${this.TOKEN_CHECK_ALARM_NAME}' to run every ${periodInMinutes} minutes.`);

      // Create the alarm. It will fire first after the period elapses, and then repeat automatically.
      await this.#getBrowserHandler().alarms.create(this.TOKEN_CHECK_ALARM_NAME, {
        periodInMinutes: periodInMinutes
      });
    } catch (error) {
      this.logger.error(`Failed to create alarm '${this.TOKEN_CHECK_ALARM_NAME}':`, error);
    }
  }

  /**
   * Sets up or resets the periodic alarm for automatic token renewal checks.
   * Creates a Chrome alarm that fires at the specified interval to check token validity.
   *
   * @async
   * @param {number} [periodInMinutes=ALARM_SETTINGS.DEFAULT_ALARM_MINUTES] - The alarm period in minutes.
   * @returns {Promise<void>}
   * @private
   */
  async #setupTokenAutoRenew(periodInMinutes = this.ALARM_SETTINGS.DEFAULT_ALARM_MINUTES) {
    try {
      // Clear any existing alarm first.
      await this.#clearTokenAlarm();

      // Ensure the period respects both Chrome's minimum (1) and our defined minimum.
      const safePeriodInMinutes = Math.max(this.ALARM_SETTINGS.MIN_ALARM_MINUTES, periodInMinutes);

      // Initialize the alarm with the safe period.
      await this.#initializeAlarm(safePeriodInMinutes);
    } catch (error) {
      this.logger.error("Error setting up token alarm:", error);
    }
  }

  /**
   * Checks the current token's validity and TTL, renewing it if necessary.
   * Validates the stored token, checks its remaining lifetime, and reschedules
   * the renewal alarm based on the new TTL. Clears the alarm if token is invalid.
   *
   * @async
   * @returns {Promise<void>}
   * @private
   */
  async #renewToken() {
    let token;
    try {
      // Retrieve the token from storage.
      token = await this.storage.getToken();

      // Check if the token is valid.
      if (!this.VaultUtils.isTokenValid(token)) {
        this.logger.info("Token not found or invalid.");

        return;
      }

    } catch (error) {
      this.logger.error("Error retrieving token from storage:", error);

      return;
    }

    // If we reach this point, it means the token exists and is valid (in the memory of the browser).
    try {
      // Create a Vault instance with the retrieved token.
      // Create a Vault instance with the retrieved token.
      const vault = this.vaultFactory.create(await this.storage.getUrl(), token);

      // Check on Vault what is the token's real TTL (Time-To-Live).
      const currentTTLInMinutes = await this.#getCurrentTokenTTLInMinutes(vault);

      if (currentTTLInMinutes === null) {
        return;
      }

      // If we reach this point, it means the token exists and is valid (in Vault).
      this.logger.info(`Current Token TTL: ${currentTTLInMinutes} minutes.`);

      if (currentTTLInMinutes < this.RENEWAL_THRESHOLD_MINUTES) {
        this.logger.info(`TTL is low (< ${this.RENEWAL_THRESHOLD_MINUTES} min), attempting to renew token...`);

        // Attempt to renew the token.
        const renewedTokenResult = await vault.renewToken();

        // Store the renewed token.
        await this.storage.setToken(renewedTokenResult.token);

        // Get the new TTL after renewal.
        const newTTLInMinutes = await this.#getCurrentTokenTTLInMinutes(vault);

        if (newTTLInMinutes === null) {
          this.logger.error("Failed to get TTL after renewal. Using default alarm.");
        } else {
          this.logger.info(`Token renewed. New TTL: ${newTTLInMinutes} minutes.`);
        }
      }
    } catch (error) {
      this.logger.error("Failed to check/renew token:", error);

      // Clear token on error.
      await this.storage.setToken(null);
    }
  }

  /**
   * Retrieves the Time-To-Live (TTL) of the current Vault token in minutes.
   * Queries Vault for token information and calculates remaining lifetime.
   *
   * @async
   * @param {Vault} vault - The Vault instance to query.
   * @returns {Promise<number>} The token TTL in minutes, or default value on error.
   * @private
   */
  async #getCurrentTokenTTLInMinutes(vault) {
    try {
      // Query Vault for the current token's details.
      const tokenData = await vault.getCurrentToken();

      // Extract the TTL (time-to-live) in seconds from the token data.
      const ttlInSeconds = tokenData?.data?.ttl || null;

      // If TTL is available, convert it to minutes (rounding down).
      if (ttlInSeconds !== null) {
        // Convert seconds to minutes and round down to nearest whole minute.
        return Math.floor(ttlInSeconds / 60);
      }

      // Return null if TTL could not be determined.
      return null;

    } catch (error) {
      this.logger.error("Error retrieving current token TTL:", error);

      // Return null if TTL could not be determined.
      return null;
    }
  }

  /**
   * Returns the appropriate browser API object (browser or chrome).
   * Uses the 'browser' object (from webextension-polyfill) if available, otherwise falls back to 'chrome'.
   * @returns {object} The browser API object.
   * @private
   */
  #getBrowserHandler() {
    return browser || chrome;
  }

  /**
   * Returns the extension manifest.
   * @returns {object} The extension manifest.
   * @private
   */
  #getManifest() {
    return this.#getBrowserHandler().runtime.getManifest();
  }

  /**
   * Retrieves the content scripts array from the extension manifest.
   * @returns {Array<Object>} The array of content script configuration objects.
   * @private
   */
  #getContentScripts() {
    return this.#getManifest().content_scripts;
  }

  /**
   * A robust, central function to handle all content script injections.
   * It can inject into a specific tab or query all tabs.
   * It intelligently checks the tab's URL against the manifest's `matches` patterns
   * before injecting to prevent running on unintended pages.
   * @param {number} [tabId] - An optional tab ID. If provided, injects only into this tab.
   * If omitted, queries all tabs and injects into all matching ones.
   * @async
   * @private
   */
  async #injectScripts(tabId) {
    try {
      const contentScripts = this.#getContentScripts();

      for (const script of contentScripts) {
        if (!script) {
          continue;
        }

        // This is the function that performs the actual injection.
        const executeInjection = async (tab) => {
          try {
            this.logger.info(`Injecting content script in: [${tab.id}] - (${tab.url}).`);

            await this.#getBrowserHandler().scripting.executeScript({
              files: script.js,
              target: {
                tabId: tab.id,
                allFrames: script.all_frames
              },
            });
          } catch (error) {
            // This error is common on special pages (e.g., chrome://) where injection is not allowed.
            // We can log it quietly for debugging without alarming the user.
            this.logger.info(`Could not inject script into tab [${tab.id}] - (${tab.url}): ${error.message}`);
          }
        };

        // Query all tabs that match the content script URL patterns.
        const tabs = await this.#getBrowserHandler().tabs.query({ url: script.matches });

        // Filter out any tabs that are not fully loaded.
        const filteredTabs = tabs.filter(tab => tab.status === 'complete');

        if (tabId) {
          // Scenario 1: A specific tab ID was provided.
          // Create an array of promises for each injection, filtering out any that are not complete.
          const tab = filteredTabs.find(tab => tab.id === tabId);

          // Now, check if this specific tab's URL matches our patterns.
          if (tab) {
            await executeInjection(tab);
          }
        } else {
          // Scenario 2: No tab ID, so query all tabs that match the manifest URL patterns.
          // Create an array of promises for each injection, filtering out any that are not complete.
          const injectionPromises = filteredTabs.map(tab => executeInjection(tab));

          // Wait for all injections to complete.
          await Promise.all(injectionPromises);
        }
      }

    } catch (error) {
      this.logger.error(`Error during script injection: ${error}`);
    }
  }

  /**
   * Handles extension installation or update events.
   * Automatically injects content scripts into existing tabs that match
   * the script patterns to ensure the extension works on already-open pages.
   *
   * @listens chrome.runtime.onInstalled
   * @async
   * @returns {Promise<void>}
   * @private
   */
  async #handleInstalled() {
    try {
      // Inject content scripts into all tabs.
      this.logger.info("Extension installed/updated. Injecting scripts into existing tabs...");
      await this.#injectScripts();

      // Initialize the token renewal process.
      this.logger.info("Extension installed/updated. Setting up token auto-renewal...");
      await this.#setupTokenAutoRenew();
    } catch (error) {
      this.logger.error("Error during onInstalled script injection:", error);
    }
  }

  /**
   * Handles navigation events in Single-Page Applications (SPAs).
   * This listener fires when the URL changes without a full page reload, which is
   * common in modern web apps (e.g., React, Angular, Vue). We use this event to
   * re-inject our content scripts to ensure the extension remains functional on
   * these "virtual" page transitions.
   *
   * @listens chrome.webNavigation.onHistoryStateUpdated
   * @param {object} details - An object containing details about the navigation event.
   * @param {number} details.frameId - The ID of the frame in which the navigation occurred. 0 indicates the main page, others are iframes.
   * @param {number} details.tabId - The ID of the tab in which the navigation occurred.
   * @private
   */
  async #handleNavigation(details) {
    try {
      // We only need to act on top-level frame navigations to avoid injecting
      // the script multiple times for each iframe on a page.
      if (details.frameId === 0) {
        this.logger.info(`SPA navigation detected on tab ${details.tabId}. Re-injecting content scripts.`);

        // Re-inject content scripts into the specified tab. We don't await this
        // as it's a "fire-and-forget" operation within the event listener.
        this.#injectScripts(details.tabId);
      }
    } catch (error) {
      this.logger.error("Error during onHistoryStateUpdated script injection:", error);
    }
  }

  /**
   * Handles Chrome startup events.
   * Triggers a token check and renewal when the browser starts up.
   *
   * @listens chrome.runtime.onStartup
   * @private
   */
  async #handleStartup() {
    try {
      this.logger.info("Chrome startup detected. Checking token...");

      // Check and renew the token as needed.
      await this.#renewToken();

    } catch (error) {
      this.logger.error("Error during token check:", error);
    }
  }

  /**
   * Handles Chrome alarm events for token renewal checks.
   * Listens for the token check alarm and triggers token validation
   * and renewal process when the alarm fires.
   *
   * @listens chrome.alarms.onAlarm
   * @async
   * @param {chrome.alarms.Alarm} alarm - The alarm object that triggered this event.
   * @returns {Promise<void>}
   * @private
   */
  async #handleAlarm(alarm) {
    try {
      if (alarm.name === this.TOKEN_CHECK_ALARM_NAME) {
        this.logger.info(`Alarm '${this.TOKEN_CHECK_ALARM_NAME}' fired. Checking token...`);

        // Check and renew the token as needed.
        await this.#renewToken();
      }
    } catch (error) {
      this.logger.error("Error during token check:", error);
    }
  }
}

// Initialize the background service.
const backgroundService = new BackgroundService(dependencies);
backgroundService.initialize();
