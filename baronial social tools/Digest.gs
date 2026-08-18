/**
 * Digest.gs - 📜 Baronial Digest Engine
 * Automates the creation of weekly event digests for SCA social channels.
 * Part of the SCA Webministry Suite - Sacred Stone
 */



/* ============================================================
   SECTION I: TITLE CASE UTILITY
   ============================================================ */
function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

/* ============================================================
   SECTION II: EMOJI ASSIGNMENT SYSTEM
   ============================================================ */
function applyEventEmojis(title) {
  var t = title.toLowerCase();
  var emojiMap = [
    { keys: ["class", "workshop", "lecture"], emoji: "📚" },
    { keys: ["arts & sciences", "a&s"], emoji: "🎨" },
    { keys: ["fighter", "heavy", "armored"], emoji: "⚔️" },
    { keys: ["rapier", "fencing"], emoji: "🗡️" },
    { keys: ["bardic", "song", "story"], emoji: "🎤" },
    { keys: ["weaving", "fiber", "lace", "spinning", "dyeing"], emoji: "🧵" },
    { keys: ["heraldry"], emoji: "🛡️" },
    { keys: ["scribal", "calligraphy", "illumination"], emoji: "✒️" },
    { keys: ["gathering", "meetup", "social"], emoji: "🍞" },
    { keys: ["virtual", "zoom", "online"], emoji: "💻" },
    { keys: ["birthday"], emoji: "🎉" },
    { keys: ["court"], emoji: "👑" },
    { keys: ["tournament"], emoji: "🏆" },
    { keys: ["feast"], emoji: "🍽️" },
    { keys: ["war"], emoji: "🛡️⚔️" }
  ];
  for (var i = 0; i < emojiMap.length; i++) {
    var entry = emojiMap[i];
    if (entry.keys.some(function(k) { return t.includes(k); })) {
      return entry.emoji + " " + toTitleCase(title);
    }
  }
  return toTitleCase(title);
}

/* ============================================================
   SECTION III: ZOOM LOCATION NORMALIZATION
   ============================================================ */
function normalizeZoomLocation(loc) {
  if (!loc) return "";
  var lower = loc.toLowerCase();
  if (lower.includes("zoom")) {
    return "Zoom (link posted in Artisans of Meridies)";
  }
  return loc;
}

/* ============================================================
   SECTION IV: EVENT FLYER EXTRACTION
   ============================================================ */
function extractEventFlyerLink(desc) {
  if (!desc) return "";
  let clean = desc.replace(/<[^>]*>/g, " ");
  clean = clean.replace(/">/g, " ");
  const match = clean.match(/https?:\/\/[^\s]+/i);
  if (!match) return "";
  return "Event Flyer: " + match[0];
}

/* ============================================================
   SECTION V: ONLINE DESCRIPTION SCRUBBER
   ============================================================ */
function cleanOnlineDescription(desc) {
  if (!desc) return "";
  var text = desc.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  text = text.replace(/<[^>]*>/g, " ");
  text = text.replace(/(\?|\&)mibextid=[^\s]+/gi, "");
  text = text.replace(/(https?:\/\/\S+)(\s*\1)+/g, "$1");
  var stopBlocks = [/^TUESDAY NIGHTS/i, /^Tuesday Zoom Master/i, /^Google Calendar/i, /^PUBLIC FACEBOOK POSTS/i, /^DISCORD POSTS/i, /^All times listed/i, /^20 Breakout rooms/i, /^The space you enter/i, /^Just ask for assistance/i, /^Teachers and students/i, /^Reach out to/i, /^OTHER VIRTUAL INFO/i, /^Virtual SCA/i, /^Sunday Night/i, /^TIME ZONE CALCULATOR/i];
  var lines = text.split("\n");
  var cleaned = [];
  for (var i = 0; i < lines.length; i++) {
    var trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (stopBlocks.some(function(rx) { return rx.test(trimmed); })) break;
    cleaned.push(trimmed);
  }
  if (cleaned.length === 0) return "";
  var paragraph = cleaned.join(" ");
  var firstSentence = paragraph.split(/(?<=\.)\s+/)[0];
  if (!firstSentence.endsWith(".")) firstSentence += ".";
  return firstSentence.replace(/&amp;/g, "&").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([0-9a-z])\.([A-Z])/g, "$1. $2").replace(/\s{2,}/g, " ").trim();
}

/* ============================================================
   SECTION VI: LOCAL EVENT FORMATTER
   ============================================================ */
function formatEventEntry(e) {
  var title = applyEventEmojis(e.getTitle());
  var start = e.getStartTime();
  var end = e.getEndTime();
  var dateLine = "📅 " + start.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  if (e.isAllDayEvent() && (end - start) > 86400000) {
    var totalDays = Math.ceil((end - start) / 86400000);
    var endDate = new Date(end.getTime() - 86400000);
    dateLine = "📅 " + start.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) + " — " + endDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) + " (" + totalDays + "-day event)";
  }
  var timeLine = e.isAllDayEvent() ? "Time: All Day" : "Time: " + formatTime(start) + " – " + formatTime(end);
  var rawLocation = e.getLocation() || "";
  var location = normalizeZoomLocation(rawLocation);
  var locationLine = location ? "Location: " + location : "";
  var desc = removeURLs(stripHTML(e.getDescription() || ""));
  var flyer = extractEventFlyerLink(e.getDescription() || "");
  var detailsLine = desc ? "Details: " + desc : "";
  if (flyer) detailsLine += "\n" + flyer;
  var lowerLoc = location.toLowerCase();
  var virtualTag = (lowerLoc.includes("zoom") || lowerLoc.includes("virtual") || lowerLoc.includes("online")) ? "Type: 💻 Virtual Event" : "";
  return "📌 " + title + "\n" + dateLine + "\n" + timeLine + "\n" + (locationLine ? locationLine + "\n" : "") + (detailsLine ? detailsLine + "\n" : "") + (virtualTag ? virtualTag + "\n" : "") + "\n\n";
}

/* ============================================================
   SECTION VII: ICS KINGDOM EVENT FORMATTER
   ============================================================ */
function formatICSKingdomEvent(ev) {
  const start = ev.start;
  const end = ev.end || new Date(start.getTime() + 86400000);
  const dateStr = formatDateRange(start, end);
  return `📌 ${applyEventEmojis(ev.title)}\n📅 ${dateStr}\nTime: All Day\nLocation: ${ev.location}\nEvent Flyer: ${ev.url || "None"}\n\n`;
}

/* ============================================================
   SECTION VIII: ONLINE EVENT FORMATTER
   ============================================================ */
function formatOnlineEvent(title, date, time, loc, desc) {
  var emojiTitle = applyEventEmojis(title);
  var dateObj = new Date(date);
  var dateLine = "📅 " + dateObj.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  var location = stripHTML(normalizeZoomLocation(loc || ""));
  var flyer = extractEventFlyerLink(desc || "");
  var cleanDesc = stripHTML(cleanOnlineDescription(desc || ""));
  var lowerLoc = location.toLowerCase();
  var virtualTag = lowerLoc.includes("zoom") ? "Type: 💻 Virtual Event" : "";
  return "📌 " + emojiTitle + "\n" + dateLine + "\n" + "Time: " + (time || "Time not specified") + "\n" + "Location: " + (location || "Location not specified") + "\n" + (cleanDesc ? "Details: " + cleanDesc + "\n" : "") + (flyer ? flyer + "\n" : "") + (virtualTag ? virtualTag + "\n" : "") + "\n\n";
}

/* ============================================================
   SECTION IX: MAIN DIGEST FORMATTER
   ============================================================ */
/**
 * Formats calendar events and online activities into structured sections for distribution.
 *
 * @param {Array<Object>} baronyEvents - Array of local Baronial event objects.
 * @param {Array<Object>} kingdomEvents - Array of Kingdom event objects.
 * @param {Date} start - Start date threshold for the digest period.
 * @param {Date} end - End date threshold for the digest period.
 * @param {string} platform - Target platform for formatting output.
 * @returns {Object} Formatted content strings split by section (header, barony, kingdom, online, footer).
 */
function formatForSocialMedia(baronyEvents, kingdomEvents, start, end, platform) {
  var longDate = start.toLocaleDateString(undefined, { 
    month: "long", 
    day: "numeric", 
    year: "numeric" 
  });

  // --- Header Assembly ---
  var headerBody = "Greetings Sacred Stone!\n\n" +
    "Check Out Upcoming Events for the Week of " + longDate + "!\n\n" +
    "📣 Help us keep our community informed!\n" +
    "Have an event or news to share? If you are hosting an activity or have a milestone to share, please click here to add it to the Baronial Calendar:\n" +
    CONFIG.get("BARONIAL_EVENT_FORM_URL") + "\n\n\n";

  // --- Footer Note & Signature ---
  var footerNote = "For SCA ONLINE ACTIVITIES (UNOFFICIAL) Events, Please Note:\n" +
    "* Google Calendar (Known World activities) - https://tinyurl.com/SCA-classes\n" +
    "* Tuesday Master Schedule - https://tinyurl.com/Tuesday-Master-Schedule\n" +
    "* Ads are posted in Artisans of Meridies public Facebook Group\n" +
    "* All times listed are Central Time Zone / Chicago / USA\n" +
    "* 20 Breakout rooms are open weekly and are used the same as online collegiums.\n" +
    "* The space you enter is not the actual class space.\n" +
    "* Just ask for assistance if you are new to breakout rooms\n" +
    "* Teachers and students from all kingdoms are welcome.\n" +
    "* Reach out to Ellen DeLacey on FB to schedule a class.\n" +
    "* Time zone calculator: https://www.worldtimebuddy.com/";

  var signature = "For any questions or if you need assistance, please email the Baronial Webminister at " +
    CONFIG.get("ADMIN_TEST_EMAIL") + "\n\n" +
    "Yours in Service,\n" +
    CONFIG.get("OFFICER_SIGNATURE");

  // --- Initialize Sections Container ---
  var sections = {
    header: headerBody,
    barony: "=== 🏰 BARONIAL & CANTON EVENTS ===\n\n",
    kingdom: "=== 👑 KINGDOM EVENTS ===\n\n",
    online: "=== 🌐 SCA ONLINE ACTIVITIES (UNOFFICIAL) ===\n\n",
    footer: "\n" + footerNote + "\n\n-------------------------------------------\n\n" + signature
  };

  // --- Process Baronial Events ---
  if (baronyEvents && baronyEvents.length > 0) {
    baronyEvents.forEach(function(e) {
      sections.barony += formatEventEntry(e);
    });
  } else {
    sections.barony += "No local events scheduled.\n\n";
  }

  // --- Process Kingdom Events ---
  if (kingdomEvents && kingdomEvents.length > 0) {
    kingdomEvents.forEach(function(ev) {
      sections.kingdom += formatICSKingdomEvent(ev);
    });
  } else {
    sections.kingdom += "No kingdom events scheduled.\n\n";
  }

  // --- Process Online Activities ---
  var onlineSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("OnlineData");
  if (onlineSheet) {
    var data = onlineSheet.getDataRange().getValues();
    var hasOnline = false;

    // Skip header row and iterate over rows
    data.slice(1).forEach(function(row) {
      var title = row[0];
      var date = row[1];
      var time = row[2];
      var loc = row[3];
      var desc = row[4];
      var keep = row[5];

      var rowDate = new Date(date);
      var isKeep = (keep === true || keep === "TRUE");

      if (isKeep && rowDate >= start && rowDate < end) {
        sections.online += formatOnlineEvent(title, date, time, loc, desc);
        hasOnline = true;
      }
    });

    if (!hasOnline) {
      sections.online += "No curated online activities scheduled.\n\n";
    }
  } else {
    sections.online += "No curated online activities scheduled.\n\n";
  }

  return sections;
}
/* ============================================================
   SECTION X: SUPPORTING UTILITIES
   ============================================================ */
function formatTime(dateObj) { return dateObj.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
function stripHTML(text) { return text.replace(/<[^>]*>/g, "").replace(/\s{2,}/g, " ").trim(); }
function removeURLs(text) { return text.replace(/https?:\/\/\S+/g, "").trim(); }

/* ============================================================
   SECTION XI: DIGEST LAUNCHERS
   ============================================================ */
function launchThisWeekGG() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  
  const baronyCalId = CONFIG.get("BARONIAL_CALENDAR_ID");
  const baronyCal = CalendarApp.getCalendarById(baronyCalId);
  const baronyEvents = baronyCal.getEvents(start, end);
  const kingdomEvents = getICSEvents(start, end);
  
  const digest = formatForSocialMedia(baronyEvents, kingdomEvents, start, end, "social");
  
  // Combine the parts into the full body string
  const fullBody = digest.header + digest.barony + digest.kingdom + digest.online + digest.footer;
  
  // Launch the custom modal instead of the alert
  showDigestModal(fullBody, "Upcoming Events for the Week of " + start.toLocaleDateString());
}

function launchNextWeekGG() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  
  const baronyCalId = CONFIG.get("BARONIAL_CALENDAR_ID");
  const baronyCal = CalendarApp.getCalendarById(baronyCalId);
  const baronyEvents = baronyCal.getEvents(start, end);
  const kingdomEvents = getICSEvents(start, end);
  
  const digest = formatForSocialMedia(baronyEvents, kingdomEvents, start, end, "social");
  const fullBody = digest.header + digest.barony + digest.kingdom + digest.online + digest.footer;
  
  showDigestModal(fullBody, "Next Week Digest");
}
