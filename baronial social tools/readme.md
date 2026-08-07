# 📋 Baronial Social Tools — Changelog & Release History

All notable technical updates, feature additions, and schema modifications for the **Baronial Social Tools** project will be documented in this file.

---

## [1.2.0] — 2026-06-05
### ⚙️ Security & Configuration
* Migrated all hardcoded identifiers (Calendar IDs, Webhook URLs, and Group Emails) out of the active spreadsheet and into secure **Google Apps Script Properties**.
* Added multi-key configuration support for regional canton calendars (`CANTON_CC_CALENDAR_ID`, `CANTON_SG_CALENDAR_ID`, `CANTON_AF_CALENDAR_ID`).

### 🚀 Features & Interface
* Rolled out streamlined HTML staging modals (`DigestModal.html` & `DiscordPreview.html`) for previewing digests before firing messages live.
* Standardized multi-stage Discord webhook delivery with built-in rate-limit handling (`Discord.gs`).

---

## [1.1.0] — 2026-05-18
### 🌐 Integrations
* Integrated `OnlineSync.gs` to automatically harvest event listings directly from the SCA Unofficial Online Activities calendar.
* Added `KingdomTools.gs` to support external Kingdom ICS data scraping and alignment.

---

## [1.0.0] — 2026-05-01
### 🎉 Initial Release
* Initial deployment of the Baronial Social Tools framework.
* Established core calendar synchronization, Monday 10:00 AM automated triggers (`DigestAutomation.gs`), and baseline email formatting.
