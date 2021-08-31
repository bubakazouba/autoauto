const VALUE_INPUT_OPTIONS = {
    USER_ENTERED: "USER_ENTERED",
    RAW: "RAW",
};
const INPUT_DATA_OPTIONS = {
    OVERWRITE: "OVERWRITE",
    INSERT_ROWS: "INSERT_ROWS",
};

function getSheet(spreadsheetId, range = "Sheet1") {
    let p = new Promise(resolve => {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: range,
        }).then(function(response) {
            console.log(`Got ${response.result.values.length} rows back`)
            resolve(response);
        });
    });
}

// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
// https://stackoverflow.com/questions/46256676/google-sheets-api-v4-method-spreadsheets-values-append
// Example writing multiple ranges: https://developers.google.com/sheets/api/guides/values#javascript_1
function appendSheet(spreadsheetId, range = "A1", values = [ ["hi"] ]) {
    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: "Sheet1",
        valueInputOption: VALUE_INPUT_OPTIONS.USER_ENTERED,
        insertDataOption: INPUT_DATA_OPTIONS.OVERWRITE,
        includeValuesInResponse: true,
        resource: { /*"range": range,*/ "values": values, "majorDimension": "ROWS" },
    }).then(function(response) {
        console.log("I wrote data to sheet", response);
    });
}

function writeSheet(spreadsheetId, range = "A1", values = [ ["hi"] ]) {
    // https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: range,
        includeValuesInResponse: true,
        valueInputOption: VALUE_INPUT_OPTIONS.RAW,
        resource: { "values": values, "majorDimension": "ROWS" },
    }).then(function(response) {
        console.log("I wrote data to sheet", response);
    });
}