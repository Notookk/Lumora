# LUMORA Privacy Policy

Last updated: November 26, 2026

LUMORA is a browser extension that replaces the new-tab page with a local, customizable workspace. This policy explains what the extension accesses, what is stored, and when information leaves your device.

## Summary

- LUMORA has no backend, account system, analytics, telemetry, or advertising.
- Settings and API keys are stored locally in your browser.
- Uploaded wallpaper images are stored locally in IndexedDB.
- Media and tab information is used to display and control your local browser workspace.
- Optional Gemini and weather requests go directly to the provider you enable.
- A remote wallpaper URL is requested from the host you choose.

## Information stored on your device

LUMORA stores the following in `chrome.storage.local`:

- Appearance, hero, search, clock, and media preferences.
- Starred-site selections and custom site entries.
- Mochi notification preferences and glow selection.
- Optional Gemini and OpenWeatherMap API keys.
- Optional city and weather coordinates.

Uploaded wallpaper image blobs are stored in IndexedDB. They are not uploaded to a LUMORA server.

During development previews only, settings use browser `localStorage`. Installed extension builds use `chrome.storage.local`.

## Browser and media information

To provide its tab rail and media controls, LUMORA uses the `tabs` permission to access ordinary tab metadata such as title, URL, favicon, active state, audible state, and muted state. Tab URLs are used to identify sources and validate whether a tab can receive the media bridge.

On ordinary HTTP, HTTPS, and permitted local-file pages, a lightweight content script looks for HTML5 `<video>` and `<audio>` elements and reads Media Session metadata when available. This can include:

- Media title, artist, and artwork.
- Source hostname.
- Playback and mute state.
- Current position and duration.

The service worker keeps current media sessions in memory so the new-tab page can display them. This information is not written to a remote LUMORA database. LUMORA does not collect page text, form values, passwords, cookies, or browsing history.

Restricted pages such as `chrome://` and `edge://` are ignored.

## Optional Gemini AI

Gemini is disabled unless you enable it and supply your own API key.

When you send a chat message, the message and the conversation context required for that request are transmitted directly from your browser to Google's Gemini API at `generativelanguage.googleapis.com`. Your API key is sent in the `x-goog-api-key` request header. LUMORA does not send these values to any other party.

Google's handling of API requests is governed by Google's terms and privacy policy.

## Optional weather

Weather is enabled by default unless you disable it. LUMORA can use keyless Open-Meteo with a saved city or browser geolocation. If you enter an OpenWeatherMap key, LUMORA can use that provider instead.

Depending on your configuration, the selected provider may receive:

- Your city search.
- Your latitude and longitude.
- Your API key, when using OpenWeatherMap.

Browser location permission is requested only when you choose browser geolocation. LUMORA does not track location in the background.

## Wallpapers

The default wallpaper is bundled with the extension and requires no network request.

If you enter a remote wallpaper URL, your browser requests that image from the host you provided. The host can receive ordinary request information such as your IP address and browser headers. If you upload an image, it remains in local IndexedDB until you replace or remove it.

## Downloads and notifications

With the `downloads` permission, LUMORA checks Chrome's download-complete event and uses the filename to create a local in-extension notification. The notification is displayed by Mochi on the LUMORA page. It is not a system notification and does not transmit the filename.

## Permissions

| Permission | Purpose |
| --- | --- |
| `tabs` | Display, activate, close, mute, and identify open tabs; support audible-tab media controls. |
| `storage` | Save settings and optional API keys locally with `chrome.storage.local`. |
| `downloads` | Show a local notification when a download completes. |
| `scripting` | Inject the media bridge on demand if a tab does not already have a receiver. |
| `<all_urls>` host access | Read standard media state and relay controls on ordinary web pages; call enabled API and wallpaper hosts. |

The broad host permission is not used to collect content or browsing history. Remote JavaScript is never downloaded or executed by LUMORA.

## Data sharing and sale

LUMORA does not sell personal information, share it for advertising, create user profiles, or use third-party analytics. Information leaves the device only through requests you initiate to your selected wallpaper host, Gemini API, or weather provider.

## Security

LUMORA uses Manifest V3 with an extension Content Security Policy that permits bundled scripts only and does not allow `eval`. API calls use HTTPS. The media bridge runs in an isolated world and does not inject scripts into the host page's main JavaScript world.

## Your choices and deletion

You can disable Mochi, AI, and weather in Settings. You can remove an uploaded wallpaper, reset all settings, or uninstall the extension. Resetting settings restores defaults; removing an uploaded wallpaper deletes its IndexedDB blob. Uninstalling the extension removes its local extension data.

Chat and weather provider records are managed under each provider's own retention and deletion policies.

## Children

LUMORA is not directed to children under 13 and does not knowingly collect personal information from them.

## Changes

This policy may be updated with new extension releases. The current version and effective date will be published with the extension's distribution materials.

## Contact

For privacy questions, open an issue on the public GitHub repository where this LUMORA build is distributed.
