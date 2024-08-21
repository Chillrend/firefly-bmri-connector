const ExcelJS = require('@zurmokeeper/exceljs');

const array_index = [null, "numb"]

const import_xls = async (req, res, next) => {
    const fileBuffer = req.file.buffer; // Get the file buffer from memory
    const password = '31121999'; // The password for the Excel file

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer, { password });

        // Access the first worksheet
        const worksheet = workbook.getWorksheet(1);

        const lastRow = worksheet.lastRow;
        const rows = worksheet.getRows(18,worksheet.lastRow.number-18)

        // Prepare to store the parsed data
        let parsedData = [];

        // Iterate over rows and columns
        for (let i = 0; i < rows.length; i++) {
            const transactionArray = rows[i].values;

            // Skip if transaction number is null
            if (transactionArray[1] == null) continue;

            // Check if the current entry is a time entry by checking if the date is missing
            if (i > 0 && transactionArray[5].includes("WIB")) {
                // Merge date and time
                parsedData[parsedData.length - 1].time = ` ${transactionArray[5]}`;
                const fullDateTime = `${parsedData[parsedData.length - 1].date}${parsedData[parsedData.length - 1].time}`;
                console.log(convert_to_date(fullDateTime))
                parsedData[parsedData.length - 1].timestamp = new Date(fullDateTime).getTime();
                console.log(parsedData[parsedData.length - 1].timestamp)
            } else {
                const cleanRemarks = transactionArray[8].replace(/\n/g, ' ');
                const values = {
                    transaction_number: transactionArray[1],
                    date: transactionArray[5],
                    time: null,
                    timestamp: null,
                    transaction_remarks: cleanRemarks,
                    amount_incoming: transactionArray[16] ? parseFloat(transactionArray[16].replace(/\./g, '').replace(',', '.')) : null,
                    amount_outgoing: transactionArray[20] ? parseFloat(transactionArray[20].replace(/\./g, '').replace(',', '.')) : null
                };
                parsedData.push(values);
            }
        }

        // Respond with parsed data (or render it in a view, etc.)
        res.json(parsedData);

    } catch (error) {
        console.error('Error reading Excel file:', error);
        res.status(500).send('Failed to parse Excel file');
    }
}

const convert_to_date = (date_string) => {
    const dateString = "16 Aug 2024 18:16:20 WIB";

    const cleanDateString = dateString.replace(' WIB', '');

    const dateObject = new Date(cleanDateString);

    const timezoneOffset = 7 * 60; // WIB is UTC+7, so convert hours to minutes
    dateObject.setMinutes(dateObject.getMinutes() - dateObject.getTimezoneOffset() + timezoneOffset);

    return dateObject;

}

module.exports = import_xls;