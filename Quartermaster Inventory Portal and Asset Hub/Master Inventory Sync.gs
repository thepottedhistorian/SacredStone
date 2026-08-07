/**
 * ==============================================================================
 * PROJECT:     Barony of the Sacred Stone — Master Inventory Aggregator
 * MODULE:      Automation Utility (`MasterInventoryBuilder.gs`)
 * PURPOSE:     Strictly compiles the 10 official category tabs into the 
 *              Master Inventory sheet, flattening headers into sub-categories.
 * ==============================================================================
 */

function buildMasterInventoryOnly() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // The 10 official tabs to compile
  const targetCategorySheets = [
    "Regalia", "A&S Supplies", "Decor", "Marshal Items", "Tents", 
    "Camp Gear", "Food Items", "Misc Equip", "WOW", "CooksGuild"
  ];

  // 1. Setup Master Inventory Sheet
  const masterSheetName = "Master Inventory";
  let masterSheet = ss.getSheetByName(masterSheetName);
  
  if (!masterSheet) {
    masterSheet = ss.insertSheet(masterSheetName);
  } else {
    masterSheet.clear();
  }

  const headers = [
    "Item ID", "Item Name", "Category", "Sub Category", "Classification", 
    "Status", "Total Qty", "Signed Out Qty", "Accounted For", "Condition", 
    "Storage Location", "Sign Out Date", "Signed Out To", "Expected Return", 
    "Photo 1", "Photo 2", "Notes / Item Details", "Last Updated"
  ];
  
  masterSheet.appendRow(headers);
  masterSheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#1b3b22")
    .setFontColor("#FFFFFF");
  masterSheet.setFrozenRows(1);

  // 2. Aggregate and Flatten Data
  let allMasterRows = [];
  let categoryCount = 0;
  let allSheets = ss.getSheets();

  for (let i = 0; i < targetCategorySheets.length; i++) {
    let targetName = targetCategorySheets[i].toLowerCase().trim();
    let matchedSheet = null;

    for (let s = 0; s < allSheets.length; s++) {
      if (allSheets[s].getName().toLowerCase().trim() === targetName) {
        matchedSheet = allSheets[s];
        break;
      }
    }

    if (!matchedSheet) continue;

    let data = matchedSheet.getDataRange().getValues();
    if (data.length < 2) continue; 
    
    let currentSubCategory = "General";
    let sheetRowsAdded = 0;

    for (let r = 1; r < data.length; r++) {
      let row = data[r];
      let colA = row[0] ? String(row[0]).trim() : "";
      let colB = row[1] ? String(row[1]).trim() : "";
      
      // Header/Spacer detection logic
      let isHeaderRow = (colA.length > 0 && colB === "") || (colB === "" && row[2] === "" && row[5] === "");

      if (isHeaderRow) {
        if (colA.length > 0) currentSubCategory = colA;
        continue;
      }

      // Valid Item Row
      if (colB.length > 0) {
        let cleanRow = [];
        // Map 18 columns strictly
        for (let c = 0; c < 18; c++) {
          if (c === 2) { // Column C: Category
            cleanRow.push(row[2] || matchedSheet.getName());
          } else if (c === 3) { // Column D: Sub Category
            cleanRow.push(currentSubCategory);
          } else {
            cleanRow.push(row[c] !== undefined ? row[c] : "");
          }
        }
        allMasterRows.push(cleanRow);
        sheetRowsAdded++;
      }
    }
    if (sheetRowsAdded > 0) categoryCount++;
  }

  // 3. Final Write
  if (allMasterRows.length > 0) {
    masterSheet.getRange(2, 1, allMasterRows.length, headers.length).setValues(allMasterRows);
  }

  SpreadsheetApp.getUi().alert(
    "Master Inventory Built Successfully!\n\n" +
    "• Category Sheets Processed: " + categoryCount + "\n" +
    "• Total Items Compiled: " + allMasterRows.length
  );
}
