import './browser-polyfill.min.js';
import { VaultStorage } from '../libs/storage.js';
import { Vault } from '../libs/vault.js';

const tokenCheckAlarm = 'tokenCheck';
const storage = new VaultStorage(browser.storage.session);

const TTL = {
  TEN_MINUTES_IN_SECONDS: 600,
  SIXTY_MINUTES_IN_SECONDS: 3600
};

chrome.runtime.onInstalled.addListener(async () => {
  try {
    for (const script of await chrome.runtime.getManifest().content_scripts) {
      if (script) {
        await addScriptOnActiveTabs(script);
      }
    }
  } catch (error) {
    console.log(error);
  }
});

async function addScriptOnActiveTabs(script) {
  for (const tab of await chrome.tabs.query({ url: script.matches })) {
    try {
      if (tab) {
        await executeScriptOnTab(tab, script);
      }
    } catch (error) {
      console.log(`Error: ${error}. Url: ${tab?.url}`);
    }
  }
}

async function executeScriptOnTab(tab, script) {
  if ((tab.status === 'complete') && (tab.active === true)) {
    await chrome.scripting.executeScript({
      files: script.js,
      target: {
        tabId: tab.id,
        allFrames: script.all_frames
      }
    });
  }
}

async function setupTokenAutoRenew(periodInSeconds = TTL.SIXTY_MINUTES_IN_SECONDS) {
  const alarm = await chrome.alarms.get(tokenCheckAlarm);

  if (alarm) {
    await chrome.alarms.clear(tokenCheckAlarm);
  }

  await chrome.alarms.create(tokenCheckAlarm, {
    periodInMinutes: periodInSeconds / 60
  });
}

chrome.alarms.onAlarm.addListener(async function (alarm) {
  if (alarm.name === tokenCheckAlarm) {
    await renewToken();
  }
});

async function renewToken() {
  let token = await storage.getToken();

  if (Vault.isTokenValid(token)) {
    try {
      const vault = new Vault(await storage.getUrl(), token);

      token = await vault.getCurrentToken();

      console.info(`Token TTL: ${token.data.ttl}`);
      if (isTTLLessThanTenMinutes(token.data.ttl)) {
        const result = await vault.renewToken();

        storage.setToken(result.token);

        setupTokenAutoRenew();
      } else if (isTTLLessThanSixtyMinutes(token.data.ttl)) {
        setupTokenAutoRenew((token.data.ttl / 2));
      }
    } catch (error) {
      storage.setToken(null);

      console.error(error);
    }
  }
}

function isTTLLessThanTenMinutes(ttl) {
  return (ttl < TTL.TEN_MINUTES_IN_SECONDS);
}

function isTTLLessThanSixtyMinutes(ttl) {
  return (ttl < TTL.SIXTY_MINUTES_IN_SECONDS);
}

setupTokenAutoRenew();
