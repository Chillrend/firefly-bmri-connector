const ExcelJS = require('@zurmokeeper/exceljs');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

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
                parsedData[parsedData.length - 1].timestamp = convert_to_date(fullDateTime).getTime();
                console.log(parsedData[parsedData.length-1].timestamp)

                await check_and_insert('bmri-tx', ''+parsedData[parsedData.length - 1].timestamp, parsedData[parsedData.length - 1])

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

const check_and_insert = async (collectionName, docId, data) => {
    const db = getFirestore();
    const docRef = db.collection(collectionName).doc(docId);
    const doc = await docRef.get();

    if (doc.exists) {
        console.log('Document already exists!');
        return false;  // or you can return the existing document data: return doc.data();
    } else {
        await docRef.set(data);
        console.log('Document inserted successfully!');
        return true;
    }
}

const convert_to_date = (date_string) => {


    const cleanDateString = date_string.replace(' WIB', '');

    const dateObject = new Date(cleanDateString);

    const timezoneOffset = 7 * 60; // WIB is UTC+7, so convert hours to minutes
    dateObject.setMinutes(dateObject.getMinutes() - dateObject.getTimezoneOffset() + timezoneOffset);

    return dateObject;

}

module.exports = import_xls;