/**
 * main.gs - 🛡️ Baronial Social Tools (Main Controller)
 * Orchestrates menu creation, UI previews, and unified delivery logic.
 * Part of the SCA Webministry Suite - Sacred Stone
 */

/**
 * CONFIGURATION HELPER
 * Retrieves values from Script Properties to keep code clean and secure.
 */
const CONFIG = {
  get(key) {
    const value = PropertiesService.getScriptProperties().getProperty(key);
    if (!value) {
      console.warn(`Missing Script Property: ${key}`);
      return "";
    }
    return value;
  }
};

/* ============================================================
   SECTION I: CUSTOM MENU
   ============================================================ */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("🛡️ Baronial Social Tools")
    .addItem("📅 This Week Digest", "launchThisWeekGG")
    .addItem("📅 Next Week Digest", "launchNextWeekGG")
    .addSeparator()
    .addItem("🚀 Post THIS WEEK to Discord", "launchDiscordThisWeek")
    .addItem("🚀 Post NEXT WEEK to Discord", "launchDiscordNextWeek")
    .addSeparator()
    .addSubMenu(
      ui.createMenu("⚙️ Admin Sync")
        .addItem("📥 Fetch Online Data", "fetchOnlineEventsToSheet")
        .addItem("🧹 Wipe Online Sheet", "wipeOnlineSheet")
        .addItem("🔲 Uncheck All Keep Boxes", "uncheckAllKeepBoxes")
        .addSeparator()
        .addItem("🤖 Initialize Weekly Automation", "setupWeeklyDigestTrigger")
        .addSeparator()
        .addItem("🔄 Refresh ICS Now", "refreshICSNow")
        .addItem("🧪 Test ICS Event", "testICSEvent")
        .addItem("🔓 Check Permissions", "checkCalendarAccess")
    )
    .addToUi();
}

/* ============================================================
   SECTION II: DISCORD LAUNCHERS — ICS ONLY
   ============================================================ */

function launchDiscordThisWeek() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const baronyCalId = (CONFIG.get("BARONIAL_CALENDAR_ID") || "").toString().trim();
  const baronyCal = CalendarApp.getCalendarById(baronyCalId);
  const baronyEvents = baronyCal.getEvents(start, end);

  const kingdomEvents = getICSEvents(start, end);

  const sections = formatForSocialMedia(baronyEvents, kingdomEvents, start, end, "Discord");
  showDiscordReviewModal(sections, "Review This Week for Discord");
}

function launchDiscordNextWeek() {
  const start = new Date();
  start.setDate(start.getDate() + 7);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const baronyCalId = (CONFIG.get("BARONIAL_CALENDAR_ID") || "").toString().trim();
  const baronyCal = CalendarApp.getCalendarById(baronyCalId);
  const baronyEvents = baronyCal.getEvents(start, end);

  const kingdomEvents = getICSEvents(start, end);

  const sections = formatForSocialMedia(baronyEvents, kingdomEvents, start, end, "Discord");
  showDiscordReviewModal(sections, "Review Next Week for Discord");
}

/* ============================================================
   SECTION III: DISCORD FINAL DELIVERY
   ============================================================ */

function finalSendToDiscord(finalSectionsJson) {
  try {
    const sections = JSON.parse(finalSectionsJson);
    sendDiscordDigest(sections);
    return "Sent to Discord in 4 stages!";
  } catch (e) {
    throw new Error(e.message);
  }
}

function showDiscordReviewModal(sections, title) {
  const template = HtmlService.createTemplateFromFile("DiscordPreview");
  template.sections = JSON.stringify(sections);

  const html = template
    .evaluate()
    .setWidth(850)
    .setHeight(800)
    .setTitle(title);

  SpreadsheetApp.getUi().showModalDialog(html, title);
}

/* ============================================================
   INSERTED FUNCTION: EMAIL DIGEST MODAL
   ============================================================ */

function showDigestModal(content, title) {
  const template = HtmlService.createTemplateFromFile("DigestModal");
  template.content = content;
  template.subject = title;

  const html = template
    .evaluate()
    .setWidth(750)
    .setHeight(700)
    .setTitle(title);

  SpreadsheetApp.getUi().showModalDialog(html, title);
}

/* ============================================================
   SECTION IV: EMAIL DIGEST LAUNCHERS — ICS ONLY
   ============================================================ */

function launchThisWeekGG_old() {
  // Deprecated wrapper: forward to the unified Digest implementation which aggregates multiple calendars.
  // The authoritative implementation lives in Digest.gs as launchThisWeekGG().
  if (typeof launchThisWeekGG === 'function') {
    return launchThisWeekGG();
  }
  return null;
}

function launchNextWeekGG_old() {
  // Deprecated wrapper: forward to the unified Digest implementation which aggregates multiple calendars.
  // The authoritative implementation lives in Digest.gs as launchNextWeekGG().
  if (typeof launchNextWeekGG === 'function') {
    return launchNextWeekGG();
  }
  return null;
}

/* ============================================================
   SECTION V: UNIFIED EMAIL SENDING
   ============================================================ */

function sendToGroup(subject, body, isTest) {
  try {
    console.log("Starting sendToGroup. isTest: " + isTest);

    const targetEmail = isTest
      ? CONFIG.get("ADMIN_TEST_EMAIL")
      : CONFIG.get("BARONIAL_GROUP_EMAIL");

    if (!targetEmail) {
      throw new Error("Target email is blank. Check your Script Properties.");
    }

    const finalSubject = isTest ? "[TEST] " + subject : subject;

    const htmlBody =
      '<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">' +
      body.replace(/\n/g, "<br>") +
      "</div>";

    MailApp.sendEmail({
      to: targetEmail,
      subject: finalSubject,
      htmlBody: htmlBody,
      body: body
    });

    return "Email sent successfully to " + targetEmail;

  } catch (e) {
    return "Error: " + e.message;
  }
}
