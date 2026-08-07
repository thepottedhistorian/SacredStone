/**
 * ==============================================================================
 * PROJECT:     Barony of the Sacred Stone — Quartermaster Portal Backend
 * MODULE:      Backend Controller (`Code.gs`)
 * PURPOSE:     Maps schema, logs checkouts, and handles routing via Script Properties.
 * ==============================================================================
 */

function getSpreadsheetId_() {
  const scriptProps = PropertiesService.getScriptProperties();
  const id = scriptProps.getProperty("SPREADSHEET_ID");
  if (!id) {
    throw new Error("SPREADSHEET_ID is not configured in Script Properties.");
  }
  return id;
}

function doGet(e) {
  try {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Barony of the Sacred Stone — Portal')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput("<h3>Server Error:</h3><p>" + err.toString() + "</p>");
  }
}

function getInventoryData() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId_());
    const targetSheet = ss.getSheetByName("Master Inventory");
    
    if (!targetSheet) {
      throw new Error("Master Inventory sheet not found. Please run your aggregator script first.");
    }
    
    let data = targetSheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const rows = data.slice(1);

    return rows.map((row, rIdx) => {
      let itemId = row[0] ? String(row[0]) : "ITEM-" + (rIdx + 1);
      let itemName = row[1] ? String(row[1]) : "";
      if (!itemName) return null; // Skip empty rows

      return {
        itemId: itemId,
        itemName: itemName,
        category: row[2] ? String(row[2]) : "General",
        subCategory: row[3] ? String(row[3]) : "",
        classification: row[4] ? String(row[4]) : "",
        status: row[5] ? String(row[5]) : "Storage",
        totalQty: row[6] !== "" && !isNaN(row[6]) ? Number(row[6]) : 1,
        signedOutQty: row[7] !== "" && !isNaN(row[7]) ? Number(row[7]) : 0,
        accountedFor: row[8] ? String(row[8]) : "",
        condition: row[9] ? String(row[9]) : "Good",
        storageLocation: row[10] ? String(row[10]) : "Unassigned Storage",
        signOutDate: row[11] ? String(row[11]) : "",
        signedOutTo: row[12] ? String(row[12]) : "",
        expectedReturn: row[13] ? String(row[13]) : "",
        photoUrl: row[14] ? String(row[14]) : "",
        photoUrl2: row[15] ? String(row[15]) : "",
        notes: row[16] ? String(row[16]) : ""
      };
    }).filter(item => item !== null);

  } catch (err) {
    Logger.log("CRITICAL ERROR in getInventoryData: " + err.toString());
    throw new Error(err.toString());
  }
}

function submitCheckoutRequest(requestData) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId_());
    let logSheet = ss.getSheetByName('Checkout Log');
    
    if (!logSheet) {
      logSheet = ss.insertSheet('Checkout Log');
      logSheet.appendRow([
        "Timestamp", "Event Steward / SCA Name", "Modern Name", "Email", 
        "Phone", "Event & Location", "Event Date", "Item ID", 
        "Read Baronial Policies", "Read Financial Policies", "Status"
      ]);
      logSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#1b3b22").setFontColor("#FFFFFF");
      logSheet.setFrozenRows(1);
    }

    const timestamp = new Date();

    logSheet.appendRow([
      timestamp,
      requestData.scaName,
      requestData.legalName,
      requestData.email,
      requestData.phone,
      requestData.event,
      requestData.eventDate,
      requestData.itemId,
      requestData.readBaronialPolicies ? "Yes" : "No",
      requestData.readFinancialPolicies ? "Yes" : "No",
      "Pending Approval"
    ]);

    // Fetch secure recipients and IDs dynamically from Script Properties
    const scriptProps = PropertiesService.getScriptProperties();
    const quartermasterEmail = scriptProps.getProperty("QUARTERMASTER_EMAIL");
    const webministerEmail = scriptProps.getProperty("WEBMINISTER_EMAIL");
    const exchequerEmail = scriptProps.getProperty("EXCHEQUER_EMAIL");

    // Send routed email notification
    try {
      if (quartermasterEmail) {
        const emailSubject = `[Asset Request] Item ${requestData.itemId} — ${requestData.event}`;
        const emailBody = `A new Baronial asset checkout request has been submitted through the portal.\n\n` +
          `--- REQUEST DETAILS ---\n` +
          `• Item ID Requested: ${requestData.itemId}\n` +
          `• Event Steward / SCA Name: ${requestData.scaName}\n` +
          `• Modern Name: ${requestData.legalName}\n` +
          `• Email: ${requestData.email}\n` +
          `• Phone: ${requestData.phone}\n` +
          `• Event / Location: ${requestData.event}\n` +
          `• Event Date: ${requestData.eventDate}\n` +
          `• Read Baronial Policies: ${requestData.readBaronialPolicies ? "Yes" : "No"}\n` +
          `• Read Financial Policies: ${requestData.readFinancialPolicies ? "Yes" : "No"}\n` +
          `• Submission Time: ${timestamp}\n\n` +
          `This request has been logged as "Pending Approval" in the Master Inventory Checkout Log sheet.`;

        let ccList = [];
        if (webministerEmail) ccList.push(webministerEmail);
        if (exchequerEmail) ccList.push(exchequerEmail);

        MailApp.sendEmail({
          to: quartermasterEmail,
          cc: ccList.join(","),
          subject: emailSubject,
          body: emailBody,
          replyTo: requestData.email
        });
      }
    } catch (emailErr) {
      Logger.log("Warning: Failed to dispatch email notification: " + emailErr.toString());
    }

    return { success: true, message: "Checkout request successfully logged and routed to the Quartermaster (Exchequer & Webminister CC'd)." };
  } catch (err) {
    throw new Error("Failed to submit request: " + err.message);
  }
}
