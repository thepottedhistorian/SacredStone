/**
 * Automation.gs - 🛡️ Baronial Social Tools
 * Handles automated event processing via the "YES" approval trigger and
 * provides manual administrative tools for emailing groups and submitters.
 * Part of the SCA Webministry Suite - Sacred Stone
 */
 
function getOfficeEmail() {
  return CONFIG.get("ADMIN_TEST_EMAIL");
}

/**
 * TRIGGER: installedOnEdit
 */
function installedOnEdit(e) {
  if (!e || !e.range) return;

  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName().trim();
  const column = range.getColumn();
  const cellValue = String(e.value).trim();

  if (sheetName === "Baronial Calendar Requests" && column === 1 && cellValue === "YES") {
    processApprovedRow(sheet, range.getRow());
  }
}

/**
 * CORE LOGIC: processApprovedRow
 */
function processApprovedRow(sheet, row) {
  const data = sheet.getRange(row, 1, 1, 20).getValues()[0];
  const officerSig = CONFIG.get("OFFICER_SIGNATURE");
  const groupEmail = CONFIG.get("BARONIAL_GROUP_EMAIL");
  const adminEmail = getOfficeEmail();

  const submitterEmail = data[4];
  const submitterName  = data[5];
  const localGroup     = data[6] ? data[6].toString().trim() : "";
  const eventName      = data[7];
  const rawLocation    = data[12];
  const description    = data[13];
  const eventUrl       = data[14];
  const facebookUrl    = data[15];

  try {
    const startDT = combineDateAndTime(data[8], data[9]);  
    const endDT   = combineDateAndTime(data[10], data[11]); 
    
    if (isNaN(startDT.getTime())) throw new Error("Start Date/Time is invalid.");

    const title = `${eventName} (${localGroup})`;
    
    let locationDisplay = rawLocation;
    if (/\d/.test(rawLocation)) { 
      const mapLink = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(rawLocation);
      locationDisplay += `\nView on Google Maps: ${mapLink}`;
    }

    const fullDesc = `${description}\n\nEvent Link: ${eventUrl}\nFacebook Link: ${facebookUrl}\n\nSubmitted by: ${submitterName}`;

    // 1. DYNAMIC CALENDAR ROUTING
    const calIds = [];
    const discordCalId = CONFIG.get("DISCORD_CALENDAR_ID");
    if (discordCalId) calIds.push(discordCalId);

    if (localGroup.includes("Charlesbury")) {
      calIds.push(CONFIG.get("CANTON_CC_CALENDAR_ID"));
    } else if (localGroup.includes("Salesberie")) {
      calIds.push(CONFIG.get("CANTON_SG_CALENDAR_ID"));
    } else if (localGroup.includes("Aire Faucon")) {
      calIds.push(CONFIG.get("CANTON_AF_CALENDAR_ID"));
    } else {
      calIds.push(CONFIG.get("BARONIAL_CALENDAR_ID"));
    }

    calIds.forEach(id => {
      const cleanId = id.trim();
      if (cleanId) {
        const cal = CalendarApp.getCalendarById(cleanId);
        if (cal) {
          cal.createEvent(title, startDT, endDT, {description: fullDesc, location: rawLocation});
          
          // Discord Webhook Trigger
          if (discordCalId && cleanId === discordCalId.trim()) {
            const discordMsg = `🔔 **New Event Added!**\n**${title}**\n📅 Date: ${Utilities.formatDate(startDT, TIME_ZONE, "MMMM d, yyyy h:mm a")}`;
            sendToDiscordWebhook(discordMsg);
          }
        }
      }
    });

    // 2. GOOGLE GROUP NOTIFICATION (Updated to include times, full description, and links)
    const timeDisplay = isNaN(endDT.getTime()) 
      ? Utilities.formatDate(startDT, TIME_ZONE, "MMMM d, yyyy h:mm a")
      : `${Utilities.formatDate(startDT, TIME_ZONE, "MMMM d, yyyy h:mm a")} - ${Utilities.formatDate(endDT, TIME_ZONE, "h:mm a")}`;

    const groupBody = `Greetings Sacred Stone!\n\nNew Upcoming Event Added!\n\n` +
                      `Event Name: ${eventName}\n` +
                      `Group: ${localGroup}\n` +
                      `Time: ${timeDisplay}\n\n` +
                      `Location: ${locationDisplay}\n\n` +
                      `Description:\n${description}\n\n` +
                      (eventUrl ? `Event Link: ${eventUrl}\n` : '') +
                      (facebookUrl ? `Facebook Link: ${facebookUrl}\n` : '') +
                      `\nYours in Service,\n${officerSig}\nBaronial Webminister`;
    
    GmailApp.sendEmail(groupEmail, `New Upcoming Event: ${eventName}`, groupBody, {
      name: "Sacred Stone Webminister",
      replyTo: submitterEmail,
      cc: adminEmail 
    });

    // 3. AUTOMATIC SUBMITTER CONFIRMATION NOTICE
    const subBody = `Hi ${submitterName},\n\nYour event request "${eventName}" has been successfully reviewed, added to the Google Calendar, posted to the Google Group, and sent to Discord.\n\n` +
                    `Event Date & Time: ${timeDisplay}\n` +
                    `Location: ${rawLocation}\n\n` +
                    `Thank you for keeping the Barony informed!\n\n--\n${officerSig}\nBaronial Webminister\n${adminEmail}`;
    
    GmailApp.sendEmail(submitterEmail, `Event Added & Posted: ${eventName}`, subBody, {
      name: "Sacred Stone Webminister",
      replyTo: adminEmail,
      bcc: adminEmail
    });

    sheet.getRange(row, 2).setValue("Email Sent — " + new Date().toLocaleString());
    sheet.getRange(row, 1).setBackground("#d9ead3"); 

  } catch (err) {
    console.error(err);
    GmailApp.sendEmail(getOfficeEmail(), "🚨 CALENDAR SCRIPT ERROR", err.toString());
    sheet.getRange(row, 1).setBackground("#f4cccc");
  }
}

/**
 * MANUAL MENU FUNCTION: manualPostToGroup
 */
function manualPostToGroup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const row = ss.getActiveCell().getRow();
  if (row < 2) return;

  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Confirm Manual Post', 'Post Row ' + row + ' to the Google Group?', ui.ButtonSet.YES_NO) == ui.Button.YES) {
    try {
      const data = sheet.getRange(row, 1, 1, 20).getValues()[0];
      const startDT = combineDateAndTime(data[8], data[9]);
      const endDT = combineDateAndTime(data[10], data[11]);
      
      let locationDisplay = data[12];
      if (/\d/.test(data[12])) {
        const mapLink = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(data[12]);
        locationDisplay += `\nView on Google Maps: ${mapLink}`;
      }

      const timeDisplay = isNaN(endDT.getTime()) 
        ? Utilities.formatDate(startDT, TIME_ZONE, "MMMM d, yyyy h:mm a")
        : `${Utilities.formatDate(startDT, TIME_ZONE, "MMMM d, yyyy h:mm a")} - ${Utilities.formatDate(endDT, TIME_ZONE, "h:mm a")}`;

      const groupBody = `New Upcoming Event!\n\n` +
                        `Event Name: ${data[7]}\n` +
                        `Group: ${data[6]}\n` +
                        `Time: ${timeDisplay}\n\n` +
                        `Location: ${locationDisplay}\n\n` +
                        `Description:\n${data[13]}\n\n` +
                        (data[14] ? `Event Link: ${data[14]}\n` : '') +
                        (data[15] ? `Facebook Link: ${data[15]}\n` : '') +
                        `\nYours in Service,\n${CONFIG.get("OFFICER_SIGNATURE")}\nBaronial Webminister\n${getOfficeEmail()}`;
                       
      GmailApp.sendEmail(CONFIG.get("BARONIAL_GROUP_EMAIL"), `New Upcoming Event: ${data[7]}`, groupBody, {
        name: "Sacred Stone Webminister",
        replyTo: data[4],
        cc: getOfficeEmail() 
      });
      ui.alert("Success! Sent to Group.");
    } catch (err) { ui.alert("Error: " + err.toString()); }
  }
}

/**
 * MANUAL MENU FUNCTION: manualSendSubmitterNotice
 */
function manualSendSubmitterNotice() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const row = ss.getActiveCell().getRow();
  if (row < 2) return;

  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Confirm Notice', 'Send confirmation notice to submitter on Row ' + row + '?', ui.ButtonSet.YES_NO) == ui.Button.YES) {
    try {
      const data = sheet.getRange(row, 1, 1, 20).getValues()[0];
      const startDT = combineDateAndTime(data[8], data[9]);
      const endDT = combineDateAndTime(data[10], data[11]);
      const timeDisplay = isNaN(endDT.getTime()) 
        ? Utilities.formatDate(startDT, TIME_ZONE, "MMMM d, yyyy h:mm a")
        : `${Utilities.formatDate(startDT, TIME_ZONE, "MMMM d, yyyy h:mm a")} - ${Utilities.formatDate(endDT, TIME_ZONE, "h:mm a")}`;

      const subBody = `Hi ${data[5]},\n\nYour event request "${data[7]}" has been processed, added to the Google Calendar, and posted to the Google Group and Discord.\n\n` +
                      `Event Date & Time: ${timeDisplay}\n` +
                      `Location: ${data[12]}\n\n` +
                      `--\n${CONFIG.get("OFFICER_SIGNATURE")}\nBaronial Webminister\n${getOfficeEmail()}`;
      
      GmailApp.sendEmail(data[4], `Event Added: ${data[7]}`, subBody, {
        name: "Sacred Stone Webminister",
        replyTo: getOfficeEmail(),
        bcc: getOfficeEmail()
      });
      ui.alert("Success! Sent to Submitter.");
    } catch (err) { ui.alert("Error: " + err.toString()); }
  }
}

/**
 * HELPER: combineDateAndTime
 */
function combineDateAndTime(dateVal, timeVal) {
  let date = new Date(dateVal);
  let hours = 0; let minutes = 0;
  if (timeVal instanceof Date) {
    hours = timeVal.getHours(); minutes = timeVal.getMinutes();
  } else if (timeVal) {
    const match = timeVal.toString().match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      hours = parseInt(match[1]); minutes = parseInt(match[2]);
      const ampm = match[3];
      if (ampm && ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (ampm && ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
    }
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
}

/**
 * MANUAL MENU FUNCTION: manualPostToDiscord
 * Posts the selected row to the Discord Webhook manually.
 */
function manualPostToDiscord() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const row = ss.getActiveCell().getRow();
  
  if (row < 2) {
    SpreadsheetApp.getUi().alert("Please select a valid event row.");
    return;
  }

  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert('Confirm Discord Post', 'Post the event on Row ' + row + ' to Discord?', ui.ButtonSet.YES_NO);
  
  if (confirm == ui.Button.YES) {
    try {
      const data = sheet.getRange(row, 1, 1, 20).getValues()[0];
      const title = `${data[7]} (${data[6]})`;
      const startDT = combineDateAndTime(data[8], data[9]);
      
      const discordMsg = `🔔 **Event Post:**\n**${title}**\n📅 Date: ${Utilities.formatDate(startDT, TIME_ZONE, "MMMM d, yyyy h:mm a")}\n📍 Location: ${data[12]}`;
      
      sendToDiscordWebhook(discordMsg);
      ui.alert("Success! Event posted to Discord.");
    } catch (err) {
      ui.alert("Error: " + err.toString());
    }
  }
}
