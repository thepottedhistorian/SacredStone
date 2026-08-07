/**
 * ==============================================================================
 * PROJECT:     Barony of the Sacred Stone — Master Inventory Aggregator
 * MODULE:      Backend Controller (`Code.gs`)
 * PURPOSE:     Dynamically aggregates category sheets into "Master Inventory" 
 *              to maintain accurate data sourcing for the Quartermaster portal.
 * ==============================================================================
 */

/**
 * Retrieves the spreadsheet ID from Script Properties.
 * @return {string} The active spreadsheet ID.
 * @private
 */
function getSpreadsheetId_() {
  const scriptProps = PropertiesService.getScriptProperties();
  const id = scriptProps.getProperty("SPREADSHEET_ID");
  if (!id) {
    throw new Error("SPREADSHEET_ID is not configured in Script Properties.");
  }
  return id;
}

/**
 * ==============================================================================
 * SECTION: AGGREGATION & SYNCHRONIZATION ENGINE
 * ==============================================================================
 */

/**
 * Compiles items from all designated category sheets into the Master Inventory sheet.
 */
function updateMasterInventory() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId_());
    const masterSheetName = "Master Inventory";
    let masterSheet = ss.getSheetByName(masterSheetName);
    
    // Create Master Inventory sheet if it doesn't already exist
    if (!masterSheet) {
      masterSheet = ss.insertSheet(masterSheetName);
    }
    
    // List of category sheets corresponding to the workbook tabs
    const categorySheets = [
      "Regalia", 
      "A&S Supplies", 
      "Decor", 
      "Marshal Items", 
      "Tents", 
      "Camp Gear", 
      "Food Items", 
      "Misc Equip", 
      "WOW", 
      "CooksGuild"
    ];
    
    let headers = [];
    let allData = [];
    
    // Loop through each category sheet to aggregate data safely
    categorySheets.forEach((sheetName) => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        
        if (lastRow > 1 && lastCol > 0) {
          // Capture headers from the first valid sheet encountered
          if (headers.length === 0) {
            headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
            headers.push("Category"); // Append source tracker column matching portal schema
          }
          
          // Extract data rows excluding the header row
          const dataRows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
          
          // Append the source sheet name to each row for tracking and web app categorization
          dataRows.forEach(row => {
            row.push(sheetName);
            allData.push(row);
          });
        }
      }
    });
    
    // Clear previous master content before repopulating
    masterSheet.clear();
    
    if (headers.length > 0) {
      // Write headers to the Master Inventory sheet with portal styling standards
      masterSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Write compiled item rows if data exists
      if (allData.length > 0) {
        masterSheet.getRange(2, 1, allData.length, headers.length).setValues(allData);
      }
      
      // Apply archival table styling and freeze the header row
      masterSheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#1b3b22")
        .setFontColor("#FFFFFF");
      masterSheet.setFrozenRows(1);
    }
    
    Logger.log("Master Inventory successfully updated from category sheets.");
  } catch (err) {
    Logger.log("CRITICAL ERROR in updateMasterInventory: " + err.toString());
    throw new Error(err.toString());
  }
}

/**
 * ==============================================================================
 * SECTION: AUTOMATION INSTALLER
 * ==============================================================================
 */

/**
 * Installs an automated onEdit trigger so the master sheet updates 
 * dynamically whenever changes are made across category sheets.
 */
function setupAutomationTrigger() {
  try {
    // Clear existing triggers to prevent duplicates
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
    
    // Create a new edit trigger tied to the target spreadsheet
    ScriptApp.newTrigger('updateMasterInventory')
      .forSpreadsheet(SpreadsheetApp.openById(getSpreadsheetId_()))
      .onEdit()
      .create();
      
    Logger.log("Automation trigger successfully configured for MasterInventorySync.");
  } catch (err) {
    Logger.log("CRITICAL ERROR in setupAutomationTrigger: " + err.toString());
    throw new Error(err.toString());
  }
}
