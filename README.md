# LinkedIn Cold DM Generator

> **Generate highly personalized LinkedIn cold DMs in one click — powered by Groq AI.**

A Chrome/Edge browser extension that reads a LinkedIn profile, combines it with your context and resume, and writes a tailored cold message directly into the LinkedIn chat box. Ready to review and send.

---

## ✨ Features

- **One-click generation** — Opens on any LinkedIn profile or messaging thread
- **Auto-scrapes profile** — Reads name, headline, and about section automatically
- **Resume upload** — Upload your PDF resume once; AI uses your background to write better messages
- **Tone & length control** — Professional, Casual, Direct, or Enthusiastic · Short, Medium, or Long
- **Suggestion chips** — Pre-built context templates you can edit
- **Auto-injects** — Writes the DM directly into the LinkedIn message box
- **No API key needed** — Backend handles everything securely
- **Privacy first** — No data stored, no tracking

---

## 📸 Preview

> *(Screenshots coming soon)*

---

## 🚀 Installation

### Option A — Load Unpacked (Immediate, Free)

1. Download the latest release ZIP from the [Releases](https://github.com/immohitsen/Linkedin-cold-dm-chrome-extension/releases) page
2. Unzip the file
3. Open Chrome/Edge → go to `chrome://extensions`
4. Enable **Developer Mode** (top-right toggle)
5. Click **Load Unpacked** → select the unzipped `linkedin_ext` folder
6. The extension icon will appear in your toolbar

### Option B — Microsoft Edge Add-ons Store *(Coming Soon)*

> One-click install — no developer mode needed.

---

## 🛠 How to Use

1. Go to any **LinkedIn profile** and open the **message box**
2. Click the **extension icon** in your browser toolbar
3. Choose your preferred **tone** and **message length**
4. Select a **suggestion chip** or type your own reason for reaching out
5. *(Optional)* Upload your **PDF resume** for a more personalized message
6. Hit **Generate & Send DM**
7. Review the AI-written message in the chat box → hit **Send**

> **Note:** The first request after a period of inactivity may take 20–40 seconds as the server wakes up. Subsequent requests are instant.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Extension | Chrome Manifest V3, Vanilla JS |
| Backend | Python, FastAPI |
| AI | Groq API · Llama 3.1 8B Instant |
| PDF Parsing | pdfplumber |
| Hosting | Render (free tier) |

---

## 🔒 Privacy

This extension does **not** store any personal data.

- LinkedIn profile data is used only to generate the DM and is discarded immediately
- Your resume is stored locally on your device only (`chrome.storage.local`)
- No browsing data, credentials, or messages are ever logged

Read the full [Privacy Policy](./PRIVACY_POLICY.md).

---

## 🗂 Project Structure

```
Extensions/
├── linkedin_ext/         # Chrome Extension (frontend)
│   ├── manifest.json
│   ├── popup.html / popup.css / popup.js
│   ├── background.js
│   ├── content.js
│   ├── options.html
│   └── icons/
└── lnk_backend/          # FastAPI Backend
    ├── main.py
    └── requirements.txt
```

---

## 🤝 Contributing

Found a bug or want to add a feature? Open an issue or submit a PR — contributions are welcome.

---

## 📄 License

MIT License — free to use, modify, and distribute.
