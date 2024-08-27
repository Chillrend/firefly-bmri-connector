const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const { syncTransaction } = require('./util/firefly-util');

const sync_to_firefly = async (req, res, next) => {
    const db = getFirestore();

    try {
        // Get transactions from Firestore
        const transactionsSnapshot = await db.collection('bmri-tx').get();
        const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        for (const transaction of transactions) {
            if (transaction.syncedToFirefly) {
                console.log(`Transaction ${transaction.transaction_number} already synced, skipping.`);
                continue;
            }


            // Determine the transaction type and amount
            let transactionType, amount;
            if (transaction.amount_incoming != null) {
                transactionType = 'deposit';
                amount = transaction.amount_incoming;
            } else if (transaction.amount_outgoing != null) {
                transactionType = 'withdrawal';
                amount = transaction.amount_outgoing;
            } else {
                console.log(`Transaction ${transaction.transaction_number} has no amount, skipping.`);
                continue;
            }

            const iso_date = convertTimestampToISO(transaction.timestamp);
            // Sync transaction to Firefly III
            await syncTransaction(transactionType, iso_date, amount, transaction.transaction_remarks);

            // // Update Firestore document to mark as synced
            // await db.collection('your-transaction-collection').doc(transaction.id).update({
            //     syncedToFirefly: true,
            // });
        }

        res.status(200).send('Transactions synced successfully.');
    } catch (error) {
        console.error('Error syncing to Firefly:', error);
        res.status(500).send('Failed to sync to Firefly');
    }
}

const convertTimestampToISO = (timestamp) => {
    const date = new Date(timestamp); // Convert the timestamp to a Date object

    // Format the date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Get the timezone offset in hours and minutes
    const timezoneOffset = -date.getTimezoneOffset();
    const offsetSign = timezoneOffset >= 0 ? '+' : '-';
    const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');

    // Construct the ISO 8601 string
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

module.exports = sync_to_firefly;