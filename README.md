# Telegram Bot Client

A lightweight, Telegram-styled client for managing and chatting through your own Telegram bots — no external servers, no accounts, no cloud storage. Everything runs locally through a native WebView window (or straight in your browser).

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS%20%7C%20Android-informational)
![Made with](https://img.shields.io/badge/made%20with-C%2B%2B%20%2F%20HTML%2FCSS%2FJS-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

Telegram Bot Client lets you talk to one or more Telegram bots through a familiar, Telegram-inspired chat interface instead of the raw Bot API or a Telegram group. Add a bot with its token, and the app polls Telegram's `getUpdates` endpoint in the background, turning every incoming update into a real-time chat bubble — grouped by conversation, complete with avatars, unread badges, and day dividers.

The app ships in multiple forms:

- **Native desktop app** — a small C++ shell built on [webview](https://github.com/webview/webview) that opens the UI in a native window (no browser, no Electron overhead). Available for Windows, Linux, and macOS.
- **Android app** — the same interface packaged for mobile.
- **Plain web page** — the same interface opened directly in your default browser via `web.bat` / `web.sh`, for quick testing without installing anything.

Prebuilt releases for Windows, Linux, macOS, and Android are available on the [Releases](../../releases) page.

## Features

- **Multi-bot support** — add and switch between as many bots as you like, each with its own isolated chat history.
- **Telegram-style chat UI** — familiar bubbles, avatars, unread counters, day separators, and a responsive layout that adapts down to mobile-sized windows.
- **Real-time updates** — long-polling against the Telegram Bot API (`getUpdates`) delivers new messages as they arrive, no manual refresh needed.
- **Local-first storage** — bots, chats, and message history are saved in `localStorage`; nothing leaves your machine except direct calls to Telegram's API.
- **Chat search** — quickly filter your chat list by name.
- **Cross-platform** — native builds for Windows, Linux, macOS, and Android, plus a browser mode using the same codebase.
- **Zero frontend dependencies** — plain HTML/CSS/JavaScript, no build step, no framework.

## How it works

1. You paste a bot token (created via [@BotFather](https://t.me/BotFather)) into the "Add a bot" dialog.
2. The app calls `getMe` to validate the token and fetch the bot's identity.
3. Once added, the app calls `deleteWebhook` (to make sure polling isn't blocked by an existing webhook) and starts long-polling `getUpdates`.
4. Every incoming message is grouped into its chat, saved locally, and rendered live if that chat is currently open — otherwise it increments an unread badge.
5. Sending a message calls `sendMessage` directly against the Telegram Bot API, with an optimistic UI update while the request is in flight.

All of this happens client-side — the app talks directly to `api.telegram.org` and never routes your bot token or messages through a third-party backend.

## Getting started

### Download a release

Grab the build for your platform (Windows, Linux, macOS, or Android) from the [Releases](../../releases) page and run it directly — no setup required.

### Run it as a web page

No installation required.

```bash
# Windows
web.bat

# Linux / macOS
./web.sh
```

This simply opens `src/assets/index.html` in your default browser.

## Project structure

```
├── src/
│   ├── assets/
│   │   ├── index.html          # App shell / markup
│   │   ├── css/
│   │   │   └── style.css       # Telegram-inspired styling
│   │   └── js/
│   │       ├── app.js          # Main application logic & UI state
│   │       ├── helpers.js      # Formatting, avatars, small utilities
│   │       ├── storage.js      # localStorage persistence layer
│   │       └── telegram-api.js # Thin wrapper around the Telegram Bot API
│   ├── main.cpp                 # Native WebView shell (Windows/Linux/macOS)
│   └── resources/
│       ├── resources.rc         # Windows resource script (icon, metadata)
│       └── resources.o          # Compiled resource object
├── web.bat                      # Opens the UI in a browser (Windows)
└── web.sh                       # Opens the UI in a browser (Linux/macOS)
```

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | C++17, [webview](https://github.com/webview/webview) |
| Android app | Native Android wrapper around the same web UI |
| UI | Vanilla HTML5, CSS3, JavaScript (no frameworks) |
| Data | Telegram Bot API, browser `localStorage` |

## Notes & limitations

- Bot tokens and message history are stored **locally and unencrypted** in `localStorage` — keep this in mind if you share the machine or the built executable with others.
- The app uses long polling, so it must remain open/running to receive new messages; it does not support webhooks.
- Media messages (photos, files, stickers, etc.) currently render as a placeholder (`[non-text message]`) rather than being displayed inline.

## Contributing

Issues and pull requests are welcome. If you're adding a feature, try to keep the frontend dependency-free and the storage layer backward-compatible with existing saved data.

## License

This project is licensed under the MIT License — feel free to use, modify, and distribute it.
