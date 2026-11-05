/**
 * AI Admissions Assistant - Google Sheets Receiver
 * 
 * Setup Instructions:
 * 1. Create a new Google Sheet named "AI Admissions Leads".
 * 2. Go to Extensions > Apps Script.
 * 3. Replace all code in Code.gs with this file.
 * 4. Run `setupHeaders()` once to initialize column headers.
 * 5. Click Deploy > New Deployment.
 * 6. Select Type: Web App.
 *    - Description: "Admissions Lead Webhook"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 7. Copy the Web App URL and set it as `GOOGLE_SHEETS_WEBHOOK_URL` in Cloudflare Worker secrets or wrangler.toml.
 */

function setupHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.setName("Leads");
  
  const headers = [
    "Timestamp (IST)",
    "Full Name",
    "Phone Number",
    "Email",
    "Qualification",
    "Passout Year",
    "Current Status",
    "Interested Course",
    "Callback Requested?",
    "Preferred Time",
    "Lead Score",
    "Lead Tier",
    "Lead Status",
    "Session ID",
    "Lead ID"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1a365d");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Leads") || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Check if lead already exists by phone number or leadId to update instead of creating duplicate rows
    const lastRow = sheet.getLastRow();
    let existingRow = -1;
    
    if (lastRow > 1) {
      const leadIds = sheet.getRange(2, 15, lastRow - 1, 1).getValues();
      for (let i = 0; i < leadIds.length; i++) {
        if (leadIds[i][0] === data.leadId) {
          existingRow = i + 2;
          break;
        }
      }
    }

    const rowData = [
      data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      data.fullName || "Anonymous Prospect",
      data.phoneNumber || "",
      data.email || "",
      data.qualification || "",
      data.graduationYear || "",
      data.currentStatus || "",
      data.interestedCourse || "General",
      data.callbackRequested ? "YES" : "NO",
      data.preferredCallbackTime || "Anytime",
      data.leadScore || 0,
      data.leadTier || "Exploring",
      data.status || "new",
      data.sessionId || "",
      data.leadId || ""
    ];

    if (existingRow > 0) {
      // Update existing lead row
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      // Append new row
      sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", rowUpdated: existingRow > 0 }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
