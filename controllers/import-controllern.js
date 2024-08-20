const ExcelJS = require('exceljs');

const import_xls = async (req, res, next) => {
    const fileBuffer = req.file.buffer; // Get the file buffer from memory
    const password = '31121999'; // The password for the Excel file

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer, { password });

        // Access the first worksheet
        const worksheet = workbook.getWorksheet(1);

        // Prepare to store the parsed data
        let parsedData = [];

        // Iterate over rows and columns
        worksheet.eachRow((row, rowNumber) => {
            console.log(`Row ${rowNumber}: ${row.values}`);
            parsedData.push(row.values);
        });

        // Respond with parsed data (or render it in a view, etc.)
        res.json(parsedData);

    } catch (error) {
        console.error('Error reading Excel file:', error);
        res.status(500).send('Failed to parse Excel file');
    }
}

module.exports = import_xls;