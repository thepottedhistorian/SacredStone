/**
 * OnlineSync.gs - 🌐 Online Sync Engine
 * Maintains the OnlineData sheet by fetching activities from the Unofficial 
 * SCA Online Activities calendar.
 * Part of the SCA Webministry Suite - Sacred Stone
 */


/* ============================================================
   SECTION I: fetchOnlineEventsToSheet
   ============================================================ */
function fetchOnlineEventsToSheet() {
  const ui = SpreadsheetApp.getUi();

  // Step 1: Deployment reminder
  ui.alert(
    "📝 Deployment Reminder",
    "Before pulling new data, did you save your current script under a 'New Deployment' or version?\n\n" +
      "(Go to Deploy > Manage Deployments to save a snapshot of your hard work.)",
    ui.ButtonSet.OK
  );

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("OnlineData");
  if (!sheet) {
    ui.alert("Error: Please create a tab named 'OnlineData' first.");
    return;
  }

  // SANITIZED: Pulling from Script Properties
  const calId = (CONFIG.get("SCA_ONLINEACTIVITIES_UNOFFICIAL_ID") || "").toString().trim();

  // Step 2: Clear the sheet
  wipeOnlineSheet();

  // Step 3: Define the fourteen day window
  let start = new Date();
  start.setHours(0, 0, 0, 0);

  let end = new Date();
  end.setDate(end.getDate() + 14);

  const cal = CalendarApp.getCalendarById(calId);
  if (!cal) {
    ui.alert("Error: Could not find calendar with ID: " + calId);
    return;
  }

  const events = cal.getEvents(start, end);
  const rows = [];

  // Step 4: Process each event
  events.forEach(function(e) {
    // Use the central cleaner to produce consistent, wrapped descriptions
    var cleaned = (typeof cleanOnlineDescription === 'function') ? cleanOnlineDescription(e.getDescription() || "") : ((e.getDescription()||"").replace(/<\/?[^>]+(>|$)/g, " ").trim());

    rows.push([
      // preserve original title case
      e.getTitle(),
      e.getStartTime(),
      formatTime(e.getStartTime()) + " – " + formatTime(e.getEndTime()),
      e.getLocation() || "",
      cleaned,
      true
    ]);
  });

// Step 5: Write, sort, and add checkboxes
  if (rows.length > 0) {
    const range = sheet.getRange(2, 1, rows.length, 6);
    range.setValues(rows);

    // Sort by StartTime (col 2) ascending, then by Title (col 1) ascending
    range.sort([
      { column: 2, ascending: true },
      { column: 1, ascending: true }
    ]);

    sheet.getRange(2, 6, rows.length, 1).insertCheckboxes();
    sheet.autoResizeRows(2, rows.length);
  }

  ui.alert("Data Pulled and Sorted. Review the OnlineData tab.");
}

/* ============================================================
   SECTION II: wipeOnlineSheet
   ============================================================ */
function wipeOnlineSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("OnlineData");
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow, 6).clearContent();
    sheet.getRange(2, 6, lastRow, 1).removeCheckboxes();
  }
}
