/**
 * ==============================================================================
 * PROJECT:     Barony of the Sacred Stone — Quartermaster Portal
 * MODULE:      Project Documentation & Architecture (`README.gs`)
 * AUTHOR:      Ailis inghean Uí Riagáin (Baronial Webminister)
 * CREATED:     July 2026
 * LAST UPDATED:August 2026
 * ==============================================================================
 * 
 * OVERVIEW:
 * This Google Apps Script (GAS) project powers the Barony of the Sacred Stone's 
 * Master Inventory and Asset Request Hub. It connects the live Master Inventory 
 * Google Spreadsheet to a responsive, mobile-friendly HTML frontend web app. 
 * It manages real-time item tracking, status filtering, high-resolution photo 
 * previews, automated liability checkouts, and routed email notifications.
 * 
 * ==============================================================================
 * SYSTEM ARCHITECTURE:
 * ==============================================================================
 * 
 * 1. Backend Controller (`Code.gs`):
 *    - Handles web app routing via `doGet(e)` to serve the frontend interface.
 *    - Parses and flattens the 18-column Master Inventory schema into structured 
 *      JSON objects for high-performance retrieval (`getInventoryData()`).
 *    - Automatically provisions and logs asset requests into the "Checkout Log" tab.
 *    - Dispatches secure email routing notifications to the Quartermaster, 
 *      Exchequer, and Webminister.
 * 
 * 2. Frontend Interface (`Index.html`):
 *    - Built with a custom CSS styling architecture themed around Baronial Green 
 *      and archival parchment tones.
 *    - Features client-side search indexing, instant category and status filtering 
 *      (In Storage vs. Signed Out), and side-by-side high-resolution photo modals.
 *    - Integrates modal drawers for Storage Headquarters details, Borrower Terms, 
 *      Status/Condition Glossaries with color swatches, and system Release Notes.
 * 
 * ==============================================================================
 * CONFIGURATION & SECURITY (SCRIPT PROPERTIES):
 * ==============================================================================
 * To maintain clean security and prevent hardcoded credentials, all sensitive 
 * identifiers and routing targets are stored securely under Apps Script 
 * **Script Properties** (Project Settings > Script Properties):
 * 
 * - SPREADSHEET_ID      : Unique alphanumeric ID of the Master Inventory sheet.
 * - QUARTERMASTER_EMAIL : Primary routing recipient for asset checkout requests.
 * - WEBMINISTER_EMAIL   : Technical backup recipient (CC'd on notifications).
 * - EXCHEQUER_EMAIL     : Financial oversight recipient (CC'd on notifications).
 * 
 * ==============================================================================
 * OPERATIONAL WORKFLOWS:
 * ==============================================================================
 * 
 * - Item Checkouts: Event Stewards select items from the portal, review the 
 *   Financial Liability Acknowledgement terms, agree to Baronial/Financial 
 *   policies, and submit their event details.
 * - Logging & Routing: Submissions instantly append to the "Checkout Log" sheet 
 *   and trigger an automated dispatch summarizing dates, contact info, and IDs.
 * - Bulk Requests: Stewards needing multi-item allocations utilize the linked 
 *   standalone PDF form, coordinate pickup at Olympic Crown Storage (Salisbury, NC), 
 *   and complete physical sign-out with the Quartermaster.
 * 
 * ==============================================================================
 */

function __README_placeholder__() {
  // This function exists solely to satisfy syntax compilation for a documentation script file.
  return "Barony of the Sacred Stone — Quartermaster Portal Documentation Loaded.";
}
