# Privacy Policy — LinkedIn Cold DM Generator

**Last updated:** June 2026

---

## Overview

LinkedIn Cold DM Generator is a Chrome/Edge browser extension that uses AI to generate personalized cold direct messages for LinkedIn profiles. This policy explains what data is accessed, how it is used, and what is never stored.

---

## Data We Access

### LinkedIn Profile Data
When you click **Generate & Send DM** on a LinkedIn profile page, the extension reads the following information directly from the page you are viewing:

- **Name** — The profile's display name
- **Headline** — Their professional headline
- **About section** — Their summary (if visible on the page)

This data is used **solely** to personalize the generated message. It is sent to our AI backend to construct the prompt and is **not stored, logged, or retained** after the response is returned.

### Resume (Optional)
If you choose to upload a PDF resume, the file is:
- Read locally in your browser and converted to text
- Temporarily stored in your browser's local extension storage (`chrome.storage.local`) so you don't have to re-upload it every session
- Sent to our backend only when you generate a DM
- **Never uploaded to any database or retained on our servers**

You can remove your resume at any time by clicking the **✕** button on the upload zone.

---

## Data We Do NOT Collect

- We do **not** collect your LinkedIn credentials or cookies
- We do **not** store your name, email, or any personal account information
- We do **not** log or store the DMs generated
- We do **not** sell, share, or transfer any data to third parties
- We do **not** track your browsing activity

---

## Third-Party Services

This extension communicates with the following services:

| Service | Purpose |
|---|---|
| **Groq API** (via our backend) | AI text generation |
| **Our backend** (hosted on Render) | Secure API proxy — processes your request and returns the generated DM |

Our backend receives only the data needed to generate a DM (profile info, context, tone, length, and optionally resume text). No data is persisted after the response is sent.

---

## Data Storage

| Data | Where | How Long |
|---|---|---|
| Uploaded resume (base64) | `chrome.storage.local` on your device | Until you remove it |
| Generated DMs | Not stored anywhere | — |
| LinkedIn profile data | Not stored anywhere | — |

---

## Changes to This Policy

We may update this policy as the extension evolves. The latest version will always be available at this URL.

---

## Contact

For questions or concerns, please open an issue on our [GitHub repository](https://github.com/immohitsen/Linkedin-cold-dm-chrome-extension).
