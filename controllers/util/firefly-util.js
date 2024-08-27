// fireflyUtils.js
const axios = require('axios');

const fireflyAxios = axios.create({
    baseURL: `${process.env.FIREFLY_BASE_URL}/api/v1`,
    headers: {
        Authorization: `Bearer ${process.env.FIREFLY_ACCESS_TOKEN}`,
    },
});

const syncTransaction = async (transactionType, date, amount, description) => {
    try {
        let transactionsObj = {
            transactions: [
                {
                    type: transactionType,
                    date: date,
                    amount: amount,
                    description: description,
                    // Add other required fields for Firefly III here
                },
            ],
        }

        if(transactionType === "deposit"){
            transactionsObj.transactions[0].destination_id = "1"
        }else{
            transactionsObj.transactions[0].source_id = "1"
            transactionsObj.transactions[0].destination_name = "IMPORTED FROM CONNECTOR"
        }

        const response = await fireflyAxios.post('/transactions', transactionsObj);

        console.log(`Transaction synced successfully: ${description}`);
        return response.data;
    } catch (error) {
        console.error('Error syncing transaction:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const getTransactions = async (startDate, endDate, searchQuery) => {
    try {
        const response = await fireflyAxios.get('/transactions', {
            params: {
                start: startDate,
                end: endDate,
                search: searchQuery,
            },
        });

        return response.data.data;
    } catch (error) {
        console.error('Error fetching transactions:', error.response ? error.response.data : error.message);
        throw error;
    }
};

module.exports = {
    syncTransaction,
    getTransactions,
};
