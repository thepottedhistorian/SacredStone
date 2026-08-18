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
  
  // Strip HTML but keep line breaks for structure
  text = text.replace(/<[^>]*>/g, " ");
  // Remove tracking query fragments
  text = text.replace(/(\?|\&)mibextid=[^\s]+/gi, "");
  // Collapse duplicated URLs
  text = text.replace(/(https?:\/\/\S+)(\s*\1)+/g, "$1");

  // Remove leading date/time fragments often pasted into descriptions
  text = text.replace(/^\s*(Details:\s*)?(?:[A-Za-z]{3,9}\s+\d{1,2},\s*\d{4}\s*(?:--|—|-|:)\s*)?/i, "");
  // Remove stray inline time zone mentions like '6pm Central'
  text = text.replace(/\b\d{1,2}(:\d{2})?\s*(am|pm)\b\s*(Central|CT|CST|CDT|EST|EDT)?/gi, "");

  // Remove common leading bullet/hyphen markers and excessive leading punctuation
  text = text.replace(/^\s*[\-\u2022\*]+\s*/gm, "");
  text = text.replace(/^[\s\-—–]+$/gm, "");

  // Expanded stop-blocks to catch known repetitive boilerplates
  var stopBlocks = [
    /TUESDAY NIGHTS/i, 
    /Tuesday Zoom Master/i, 
    /Google Calendar/i, 
    /PUBLIC FACEBOOK POSTS/i, 
    /DISCORD POSTS/i, 
    /All times listed/i, 
    /20 Breakout rooms/i, 
    /The space you enter/i, 
    /Just ask for assistance/i, 
    /Teachers and students/i, 
    /Reach out to/i, 
    /OTHER VIRTUAL INFO/i, 
    /Virtual SCA/i, 
    /Sunday Night/i, 
    /TIME ZONE CALCULATOR/i,
    /--\s*--/i,                          // Captures '-- --' horizontal dividers
    /Event Accessibility/i,             // Captures accessibility boilerplate
    /Zoom codes will be posted/i,       // Captures master schedule copy
    /Master Schedule/i
  ];

  var lines = text.split("\n");
  var cleaned = [];
  for (var i = 0; i < lines.length; i++) {
    var trimmed = lines[i].trim();
    if (!trimmed) continue;
    
    // Stop as soon as any stopBlock pattern matches anywhere in the line
    if (stopBlocks.some(function(rx) { return rx.test(trimmed); })) break;
    cleaned.push(trimmed);
  }
  if (cleaned.length === 0) return "";

  // Collapse adjacent duplicate paragraphs while preserving order
  var uniqueParas = [];
  var seenPara = {};
  cleaned.forEach(function(p) {
    if (!seenPara[p]) { uniqueParas.push(p); seenPara[p] = true; }
  });

  // Preserve paragraph structure when possible
  var normalizedText = uniqueParas.join("\n\n");

  // Ensure common subheadings start as their own paragraph
  var headings = ["What to Expect", "Martial Arts & Practices", "Fellowship", "What to Bring", "Questions"];
  headings.forEach(function(h) {
    var rx = new RegExp("\\\n?\\s*" + h.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1") + "\\s*[:\-]?\\s*", "gi");
    normalizedText = normalizedText.replace(rx, "\n\n" + h + ":\n");
  });

  // Safe reflow/cleanup
  var final = normalizedText
    .replace(/&amp;/g, "&")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([0-9a-z])\.([A-Z])/g, "$1. $2")
    .replace(/\s{2,}/g, " ")
    .trim();

  return final;
}

/* ============================================================
   SECTION V.B: TEXT RE-FLOW / WRAPPING UTILITY
   ------------------------------------------------------------
   Simple word-wrap that preserves existing paragraphs and bullets.
   Keeps lines at or under the provided width and avoids breaking
   words, while preserving leading bullet/number prefixes.
   ------------------------------------------------------------ */
function reflowText(text, width) {
  if (!text) return "";
  width = width || 78;
  var paragraphs = text.split(/\n\s*\n/);
  var wrapped = paragraphs.map(function(p) {
    var lines = p.split(/\n/).map(function(l){ return l.trim(); }).filter(Boolean);
    var prefix = "";
    var m = lines[0].match(/^([\u2022\-\*\d\)\.\s]+)\s*(.*)$/);
    if (m) {
      prefix = m[1];
      lines[0] = m[2];
    }
    var words = lines.join(' ').split(/\s+/);
    var out = [];
    var line = prefix ? prefix + " " : "";
    words.forEach(function(w) {
      if ((line + (line.trim() ? " " : "") + w).length > width) {
        out.push(line.trimRight());
        line = prefix ? prefix + " " + w : w;
      } else {
        line += (line.trim() ? " " : "") + w;
      }
    });
    if (line) out.push(line.trimRight());
    return out.join("\n");
  });
  return wrapped.join("\n\n");
}

/* ============================================================
   SECTION VI-A: LOCAL DESCRIPTION FORMATTER
   ============================================================ */
function formatLocalDescription(desc) {
  if (!desc) return "";

  var text = desc
    // 1. Convert Google Calendar HTML break tags to real line breaks
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<div>/gi, "\n")
    // 2. Strip remaining HTML tags
    .replace(/<[^>]*>/g, "")
    // 3. Strip raw URLs (flyer link is extracted separately)
    .replace(/https?:\/\/\S+/g, "")
    .trim();

  // 4. Ensure standalone headers ("What to Expect:", "What to Bring:") have NO blank line after them
  text = text.replace(/(What to Expect:)\s*\n+/gi, "$1\n");
  text = text.replace(/(What to Bring:)\s*\n+/gi, "$1\n");

  // 5. Remove blank lines between items in list sections (e.g., under "What to Bring:")
  text = text.replace(/(Outside food is allowed[^\n]*)\n+/gi, "$1\n");
  text = text.replace(/(Your favorite crafting supplies[^\n]*)\n+/gi, "$1\n");

  // 6. Ensure double paragraph breaks exist before key subheadings
  var headings = [
    "What to Expect:",
    "Martial Arts & Practices:",
    "Fellowship:",
    "What to Bring:",
    "Be sure to check"
  ];

  headings.forEach(function(h) {
    var escapedH = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var rx = new RegExp("([^\\n])\\s*(" + escapedH + ")", "gi");
    text = text.replace(rx, "$1\n\n$2");
  });

  // 7. Clean up extra spaces on individual lines
  var lines = text.split("\n");
  var cleanedLines = lines.map(function(line) {
    return line.replace(/[ \t]+/g, " ").trim();
  });

  return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* ============================================================
   SECTION VI: LOCAL EVENT FORMATTER
   ============================================================ */
function formatEventEntry(e) {
  var title = applyEventEmojis(toTitleCase(e.getTitle()));
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
  
  var desc = formatLocalDescription(e.getDescription() || "");
  var flyer = extractEventFlyerLink(e.getDescription() || "");
  
  var lowerLoc = location.toLowerCase();
  var virtualTag = (lowerLoc.includes("zoom") || lowerLoc.includes("virtual") || lowerLoc.includes("online")) ? "Type: 💻 Virtual Event" : "";

  var output = "📌 " + title + "\n" +
               dateLine + "\n" +
               timeLine + "\n" +
               (locationLine ? locationLine + "\n" : "") +
               (desc ? "Details: " + desc + "\n" : "") +
               (virtualTag ? virtualTag + "\n" : "") +
               (flyer ? flyer + "\n" : "") + "\n";
               
  return output;
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
  var emojiTitle = applyEventEmojis(toTitleCase(title));
  var dateObj = new Date(date);
  var dateLine = "📅 " + dateObj.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  
  var location = stripHTML(normalizeZoomLocation(loc || ""));
  var cleanDesc = cleanOnlineDescription(desc || "");
  var flyer = extractEventFlyerLink(desc || "");
  
  var lowerLoc = location.toLowerCase();
  var virtualTag = lowerLoc.includes("zoom") ? "Type: 💻 Virtual Event" : "";

  var output = "📌 " + emojiTitle + "\n" +
               dateLine + "\n" +
               "Time: " + (time || "Time not specified") + "\n" +
               (virtualTag ? virtualTag + "\n" : "") +
               "Location: " + (location || "Location not specified") + "\n" +
               (cleanDesc ? "Details: " + cleanDesc + "\n" : "") +
               (flyer ? flyer + "\n" : "") + "\n";

  return output;
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
    "- Zoom codes will be posted around 3pm Central/Chicago on Tuesdays in comments of original post on FB Artisans of Meridies and in Discord Society for Creative Anachronism and Discord The Known World A&S channel -\n\n" +
    "Google Calendar of Known World Virtual Activity for reminders -\n" +
    "Tuesday Master Schedule -\n" +
    "(Document) Known World Virtual SCA links, calendars, and Videos information -\n\n" +
    "TUESDAY NIGHTS\n" +
    "Tuesday Zoom Master Schedule (Tuesday only, all Tues activities) - https://tinyurl.com/Tuesday-Master-Schedule\n" +
    "Use the Google Calendar for reminders. This is Known World Virtual classes and activities that I am aware of - https://tinyurl.com/SCA-classes .\n" +
    "Zoom codes are posted about 3pm central on Tuesday evenings\n" +
    "PUBLIC FACEBOOK POSTS: Artisans of Meridies Facebook Group\n" +
    "DISCORD POSTS: Society for Creative Anachronism # Arts-and-sciences-chat.\n" +
    "All times listed are Central Time Zone / Chicago / USA\n" +
    "Teachers and students from all kingdoms are welcome.\n" +
    "20 Breakout rooms are open weekly and are used the same as online collegiums.\n" +
    "The space you enter is not the actual class space.\n" +
    "Just ask for assistance if you are new to breakout rooms\n" +
    "Reach out to Ellen DeLacey on FB to schedule a class.\n\n" +
    "OTHER VIRTUAL INFO\n" +
    "Google Calendar of Virtual classes and activities that I am aware of. These can be hosted anywhere in the known world - https://tinyurl.com/SCA-classes .\n" +
    "Virtual SCA Known World activity (living document) links, calendars, and long range information for even more activities around the Known World - https://tinyurl.com/SCA-Virtual\n" +
    "Sunday Night with the Scribes Webpage with Google calendar in multiple timezones: https://scribal.art/ . Contact Hellen Haldane on Facebook to schedule a class. Sunday zoom opens 6pm Central. Classes start at 7pm Central. Zoom closes at 10pm Central\n" +
    "Scribal Facebook events can always be found at Sunday Night with the Scribes Facebook Page - https://www.facebook.com/ScribalSunday\n\n" +
    "TIME ZONE CALCULATOR\n" +
    "https://www.worldtimebuddy.com/";

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
    var normalizedLocal = baronyEvents.map(function(a) {
      var evObj = a && a.ev ? a.ev : a;
      
      var isAllDay = (evObj && typeof evObj.isAllDayEvent === 'function') ? evObj.isAllDayEvent() : false;
      var startObj = (evObj && typeof evObj.getStartTime === 'function') ? evObj.getStartTime() : (a && a.start || evObj && (evObj.start || evObj.date || evObj.dt) || new Date());
      
      var startMs = (startObj && startObj.getTime) ? startObj.getTime() : new Date(startObj).getTime();

      // If it's an all-day event, adjust UTC midnight offset to local start of day
      if (isAllDay && startObj) {
        var localDate = new Date(startObj.getUTCFullYear(), startObj.getUTCMonth(), startObj.getUTCDate(), 0, 0, 0);
        startMs = localDate.getTime();
      }

      return { ev: evObj, startMs: startMs, calendarId: a && a.calendarId ? a.calendarId : null };
    });

    normalizedLocal.sort(function(x, y) { return x.startMs - y.startMs; });

    try {
      var locDiag = [];
      normalizedLocal.forEach(function(it) {
        var t = typeof it.ev.getTitle === 'function' ? it.ev.getTitle() : (it.ev.title || it.ev.summary || '<unknown>');
        var dt = (it.startMs && !isNaN(it.startMs)) ? new Date(it.startMs).toLocaleString() : 'no-date';
        locDiag.push(' - ' + dt + ' | ' + t + (it.calendarId ? ' | ' + it.calendarId : ''));
      });
      if (typeof diag !== 'undefined') diag += 'DEBUG: Local events detail:\n' + locDiag.join('\n') + '\n\n';
    } catch(e) {}

    normalizedLocal.forEach(function(item) {
      sections.barony += formatEventEntry(item.ev);
    });
  } else {
    sections.barony += "No local events scheduled.\n\n";
  }

  // --- Process Kingdom Events ---
  if (kingdomEvents && kingdomEvents.length > 0) {
    var normalizedKingdom = kingdomEvents.map(function(ev) {
      var startObj = ev.start || ev.date || ev.dt || ev.startDate || new Date();
      var startMs = (startObj && startObj.getTime) ? startObj.getTime() : new Date(startObj).getTime();
      return { ev: ev, startMs: startMs };
    });
    
    normalizedKingdom.sort(function(x, y) { return x.startMs - y.startMs; });
    
    normalizedKingdom.forEach(function(item) {
      sections.kingdom += formatICSKingdomEvent(item.ev);
    });
  } else {
    sections.kingdom += "No kingdom events scheduled.\n\n";
  }

  // --- Process Online Activities ---
  var onlineSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("OnlineData");
  if (onlineSheet) {
    var data = onlineSheet.getDataRange().getValues();
    var items = [];

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
        var dt = parseDateTime(date, time);
        items.push({title: title, date: date, time: time, loc: loc, desc: desc, dt: dt});
      }
    });

    if (items.length > 0) {
      items.sort(function(a,b){ return a.dt - b.dt; });
      items.forEach(function(it) {
        sections.online += formatOnlineEvent(it.title, it.date, it.time, it.loc, it.desc);
      });
    } else {
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

function parseDateTime(dateVal, timeStr) {
  var d = new Date(dateVal);
  if (!timeStr) return d;
  var m = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/);
  if (m) {
    var h = parseInt(m[1],10);
    var min = m[2]?parseInt(m[2],10):0;
    var ampm = m[3];
    if (ampm) {
      if (ampm.toLowerCase() === 'pm' && h < 12) h += 12;
      if (ampm.toLowerCase() === 'am' && h === 12) h = 0;
    }
    d.setHours(h);
    d.setMinutes(min);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  }
  var m2 = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (m2) {
    var h2 = parseInt(m2[1],10);
    var min2 = m2[2]?parseInt(m2[2],10):0;
    var ampm2 = m2[3];
    if (ampm2) {
      if (ampm2.toLowerCase() === 'pm' && h2 < 12) h2 += 12;
      if (ampm2.toLowerCase() === 'am' && h2 === 12) h2 = 0;
    }
    d.setHours(h2); d.setMinutes(min2); d.setSeconds(0); d.setMilliseconds(0);
  }
  return d;
}

/* ============================================================
   SECTION XI: DIGEST LAUNCHERS
   ============================================================ */
function collectEventsFromCalendarIds(ids, start, end) {
  var combined = [];
  var seen = {}; 
  var seenByTitle = {}; 
  ids = ids || [];

  var uniqIds = [];
  ids.forEach(function(rawId) {
    if (!rawId) return;
    var id = rawId.toString().trim();
    if (!id) return;
    if (uniqIds.indexOf(id) === -1) uniqIds.push(id);
  });

  var priority = {};
  uniqIds.forEach(function(id, idx){ priority[id] = idx; });

  uniqIds.forEach(function(id) {
    try {
      var cal = CalendarApp.getCalendarById(id);
      if (!cal) return;
      var evs = cal.getEvents(start, end);
      evs.forEach(function(ev) {
        var title = (typeof ev.getTitle === 'function') ? ev.getTitle() : (ev.title || '');
        var startObj = (typeof ev.getStartTime === 'function') ? ev.getStartTime() : (ev.start || ev.date || ev.dt);
        var startMs = startObj && startObj.getTime ? startObj.getTime() : (new Date(startObj)).getTime();
        var loc = (typeof ev.getLocation === 'function') ? (ev.getLocation() || '') : (ev.location || '');

        function normalizeStr(s) { return (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim(); }
        var tKey = normalizeStr(title);
        var lKey = normalizeStr(loc);
        var key = tKey + '|' + startMs + '|' + lKey;

        var wrapper = { ev: ev, calendarId: id, startMs: startMs };

        if (seen[key]) {
          var existing = seen[key];
          var pExisting = priority[existing.calendarId] != null ? priority[existing.calendarId] : Infinity;
          var pNew = priority[id] != null ? priority[id] : Infinity;
          if (pNew < pExisting) {
            seen[key] = wrapper;
            var arr = seenByTitle[tKey] || [];
            for (var j = 0; j < arr.length; j++) {
              if (Math.abs(arr[j].startMs - existing.startMs) <= 5*60*1000) { arr[j] = wrapper; break; }
            }
          }
          return;
        }

        var titleEntry = seenByTitle[tKey] || [];
        for (var i = 0; i < titleEntry.length; i++) {
          if (Math.abs(titleEntry[i].startMs - startMs) <= 5 * 60 * 1000) {
            var existing = titleEntry[i];
            var pExisting = priority[existing.calendarId] != null ? priority[existing.calendarId] : Infinity;
            var pNew = priority[id] != null ? priority[id] : Infinity;
            if (pNew < pExisting) {
              var oldKey = normalizeStr((existing.ev.getTitle?existing.ev.getTitle():existing.ev.title)) + '|' + existing.startMs + '|' + normalizeStr(existing.ev.getLocation?existing.ev.getLocation():existing.ev.location);
              delete seen[oldKey];
              titleEntry[i] = wrapper;
              seen[key] = wrapper;
            }
            return;
          }
        }

        seen[key] = wrapper;
        titleEntry.push(wrapper);
        seenByTitle[tKey] = titleEntry;
        combined.push(wrapper);
      });
    } catch (err) {
      console.warn('Failed fetching calendar ' + id + ': ' + err.message);
    }
  });

  return combined;
}

function launchThisWeekGG() {
  const today = new Date();
  
  // Roll back to the most recent Monday (Day 1)
  const day = today.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1; // If Sunday (0), go back 6 days
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diffToMonday);
  
  // End on the following Sunday (7 full days total: Mon -> Sun)
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  var calIds = [];
  calIds.push(CONFIG.get("BARONIAL_CALENDAR_ID"));
  ['CANTON_AF_CALENDAR_ID','CANTON_CC_CALENDAR_ID','CANTON_SG_CALENDAR_ID','CANTON_MD_CALENDAR_ID'].forEach(function(k){ 
    var v = CONFIG.get(k); 
    if (v) calIds.push(v); 
  });

  try {
    var includeMirror = (PropertiesService.getScriptProperties().getProperty('INCLUDE_MIRROR_IN_BARONY') || "").toString().toLowerCase() === 'true';
    if (includeMirror) {
      if (CONFIG.get('DISCORD_CALENDAR_ID')) calIds.push(CONFIG.get('DISCORD_CALENDAR_ID'));
      if (CONFIG.get('MIRROR_CALENDAR_ID')) calIds.push(CONFIG.get('MIRROR_CALENDAR_ID'));
    }
  } catch (e) { }

  const baronyEvents = collectEventsFromCalendarIds(calIds, start, end);
  const kingdomEvents = getICSEvents(start, end);

  const digest = formatForSocialMedia(baronyEvents, kingdomEvents, start, end, "social");
  const fullBody = digest.header + digest.barony + digest.kingdom + digest.online + digest.footer;

  showDigestModal(fullBody, "Upcoming Events for the Week of " + start.toLocaleDateString());
}

function launchNextWeekGG() {
  const today = new Date();
  
  // Find the upcoming Monday
  const day = today.getDay();
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntilNextMonday);
  
  // End on the Sunday after that (7 full days)
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  var calIds = [];
  calIds.push(CONFIG.get("BARONIAL_CALENDAR_ID"));
  ['CANTON_AF_CALENDAR_ID','CANTON_CC_CALENDAR_ID','CANTON_SG_CALENDAR_ID','CANTON_MD_CALENDAR_ID'].forEach(function(k){ 
    var v = CONFIG.get(k); 
    if (v) calIds.push(v); 
  });

  try {
    var includeMirror = (PropertiesService.getScriptProperties().getProperty('INCLUDE_MIRROR_IN_BARONY') || "").toString().toLowerCase() === 'true';
    if (includeMirror) {
      if (CONFIG.get('DISCORD_CALENDAR_ID')) calIds.push(CONFIG.get('DISCORD_CALENDAR_ID'));
      if (CONFIG.get('MIRROR_CALENDAR_ID')) calIds.push(CONFIG.get('MIRROR_CALENDAR_ID'));
    }
  } catch (e) { }

  const baronyEvents = collectEventsFromCalendarIds(calIds, start, end);
  const kingdomEvents = getICSEvents(start, end);

  const digest = formatForSocialMedia(baronyEvents, kingdomEvents, start, end, "social");
  const fullBody = digest.header + digest.barony + digest.kingdom + digest.online + digest.footer;

  showDigestModal(fullBody, "Next Week Digest");
}
