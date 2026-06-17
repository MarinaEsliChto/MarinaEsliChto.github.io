const SPREADSHEET_ID = "1Ky6CqLptFrnaYexFdQ5W8kKVBEQVQtUj0wd0xLaOO_Q";
const SHEET_NAME = "Ответы";

function doPost(event) {
  const payload = JSON.parse(event.postData.contents || "{}");
  const sheet = getSheet_();

  ensureHeaders_(sheet);
  const meat = Array.isArray(payload.meat) ? payload.meat.join(", ") : "";
  const drinks = Array.isArray(payload.drinks) ? payload.drinks.join(", ") : "";
  const hasNameColumn = getHeaders_(sheet).indexOf("Имя") !== -1;
  const row = hasNameColumn ? [
    new Date(),
    "",
    meat,
    drinks,
    payload.comment || "",
    payload.page || "",
  ] : [
    new Date(),
    meat,
    drinks,
    payload.comment || "",
    payload.page || "",
  ];

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getHeaders_(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    return [];
  }

  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "birthday-survey" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() > 0) {
    return;
  }

  sheet.appendRow([
    "Дата",
    "Мясо",
    "Напитки",
    "Комментарий",
    "Страница",
  ]);
}
