# 🛡️ BARONIAL SOCIAL TOOLS
### *Project Manifest & Technical Folio*

---

**Webminister:** Ailis inghean Ui Riagain  
**Barony:** Sacred Stone, Kingdom of Atlantia  
**Last Unified Update:** June 5, 2026

---

## 🎯 PROJECT PURPOSE
*   **AUTOMATION:** Reducing manual labor by synchronizing Baronial, Kingdom, and Unofficial Online event calendars.
*   **STANDARDIZATION:** Ensuring event listings maintain a professional, consistent format across both Email and Discord.
*   **ACCURACY:** Eliminating "copy-paste" fatigue by pulling data directly from authorized sources.
*   **ACCESSIBILITY:** Delivering a consistent, mobile-friendly digest to the populace every Monday morning.

---

## ⚙️ CONFIGURATION & SECURITY
**SECURITY NOTE:** To protect sensitive data (Calendar IDs, Webhook URLs, and Group Emails), all identifiers have been migrated from the spreadsheet to **Google Apps Script Properties**.

**Setup Instructions:**
1. Open the **Google Apps Script** editor.
2. Click **Project Settings** (the gear icon on the left).
3. Scroll to **Script Properties** and select **Edit script properties**.
4. Add the following keys with your specific values:
    * `DISCORD_WEBHOOK`
    * `BARONIAL_CALENDAR_ID`
    * `KINGDOM_ICS_URL`
    * `SCA_ONLINEACTIVITIES_UNOFFICIAL_ID`
    * `BARONIAL_GROUP_EMAIL`
    * `ADMIN_TEST_EMAIL`
    * `OFFICER_SIGNATURE`
    * `BARONIAL_EVENT_FORM_URL`
    * `MIRROR_CALENDAR_ID`
    * `CANTON_CC_CALENDAR_ID` | `CANTON_SG_CALENDAR_ID` | `CANTON_AF_CALENDAR_ID`

---

## 📁 FILE INDEX
| File Name | Role | Description |
| :--- | :--- | :--- |
| **Main.gs** | 🛡️ The Heart | Manages the custom menu and modal launchers. |
| **Digest.gs** | 🧠 The Brain | Event standardizing and digest assembly logic. |
| **OnlineSync.gs** | 🌐 The Harvester | Connects to the SCA Unofficial Online Activities calendar. |
| **KingdomTools.gs** | 👑 The Scraper | Syncs external Kingdom ICS data. |
| **Automation.gs** | ⚙️ The Workflow | Handles automated processing from request forms. |
| **Discord.gs** | 🚀 The Broadcaster | Multi-stage webhook delivery with rate-limit handling. |
| **DigestAutomation.gs** | ⏰ The Clock | Manages the Monday 10:00 AM automatic triggers. |
| **Patches.gs** | 🛠️ The Janitor | Maintenance patches for description cleaning and data purges. |
| **HTML UI** | 🖥️ Frontend | `DigestModal.html` & `DiscordPreview.html` staging interfaces. |

---

## 🔄 WEEKLY WORKFLOW
1.  **CURATE:** Open the `OnlineData` tab; uncheck 'Keep' for stale events.
2.  **REFRESH:** Click `🛡️ Baronial Social Tools` > `Admin Sync` > `Fetch Online Data`.
3.  **DIGEST:** Click `📅 This Week Digest`; review and "Send to Group."
4.  **DISCORD:** Click `🚀 Post THIS WEEK to Discord`; review and "Fire to Discord."
