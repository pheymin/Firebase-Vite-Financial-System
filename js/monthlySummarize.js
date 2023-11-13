import $ from 'jquery';

let user = JSON.parse(localStorage.getItem("user"));

function getCurrentDate() {
    var date = new Date();
    var month = date.toLocaleString('default', { month: 'long' });
    var year = date.getFullYear();
    return month + " " + year;
}

function convertToYYYYMM(dateString) {
    // Assuming dateString is in the format: month year
    var parts = dateString.split(' ');
    var month = parts[0].toLowerCase(); // Convert to lowercase for consistent comparison
    var year = parts[1]; // Extract last two digits of the year

    var monthMap = {
        january: '01',
        february: '02',
        march: '03',
        april: '04',
        may: '05',
        june: '06',
        july: '07',
        august: '08',
        september: '09',
        october: '10',
        november: '11',
        december: '12'
    };

    var formattedDate = year + '-' + monthMap[month];

    return formattedDate;
}

async function getCurrentDateData(fbStore) {
    var date = $("#current-date").text();
    var formattedDate = convertToYYYYMM(date);

    var startDate = formattedDate + '-01';
    var endDate = formattedDate + '-32';

    var query = [
        ['date', '>=', startDate],
        ['date', '<', endDate]
    ];

    try {
        const querySnapshot = await fbStore.query(`users/${user.id}/transactions/`, query);
        return querySnapshot.length > 0 ? querySnapshot : [];
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

async function getLimit(fbStore) {
    var date = $("#current-date").text();
    var query = ['date', '==', date];
    try {
        const querySnapshot = await fbStore.query(`users/${user.id}/limits/`, query);
        return querySnapshot.length > 0 ? querySnapshot : [];
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

async function loadSummary(fbStore) {
    try {
        let data = await getCurrentDateData(fbStore);
        let limit = await getLimit(fbStore);
        let monthlyEarn = calculateMonthlyTrans(data, "earn");
        let monthlyExpenses = calculateMonthlyTrans(data, "expenses");
        let monthlyBalance = (monthlyEarn - monthlyExpenses);

        $("#monthly-limit").text(formatDecimal(limit[0].amount));
        $("#monthly-earn").text(monthlyEarn);
        $("#monthly-expenses").text(monthlyExpenses);
        $("#monthly-balance").text(formatDecimal(monthlyBalance));

    } catch (error) {
        console.error("Error in loadSummary:", error);
    }
}

function formatDecimal(number) {
    //if number is not number, convert to number
    if (typeof number !== "number") {
        number = Number(number);
    }
    return number.toFixed(2);
}

function calculateMonthlyTrans(data, type) {
    let monthlyTotal = 0;
    data.forEach((doc) => {
        if (doc.type === type) {
            doc.amount = Number(doc.amount);
            monthlyTotal += doc.amount;
        }
    });
    
    return formatDecimal(monthlyTotal);
}

export { loadSummary, getCurrentDate };