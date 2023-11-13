import { FBStore } from "../firebase/storeHandler.js";
import $ from 'jquery';
import { loadSummary, getCurrentDate, getCurrentDateData } from "./monthlySummarize.js";

const fbStore = new FBStore();
let user = JSON.parse(localStorage.getItem("user"));
let data = null;

$(document).ready(function () {
    //init
    $("#current-date").text(getCurrentDate());
    addTransactionDOM("expenses");
    loadSummary(fbStore);
    getTransactionData().then(() => {
        loadTransactions();
    });

    //event
    $("#prev-date").click(function () {
        var date = new Date($("#current-date").text());
        date.setMonth(date.getMonth() - 1);
        $("#current-date").text(date.toLocaleString('default', { month: 'long' }) + " " + date.getFullYear());
        loadSummary(fbStore);

        //clear #transaction
        $("#transaction").html("");
        getTransactionData().then(() => {
            loadTransactions();
        });
    });

    $("#after-date").click(function () {
        var date = new Date($("#current-date").text());
        date.setMonth(date.getMonth() + 1);
        $("#current-date").text(date.toLocaleString('default', { month: 'long' }) + " " + date.getFullYear());
        loadSummary(fbStore);

        //clear #transaction
        $("#transaction").html("");
        getTransactionData().then(() => {
            loadTransactions();
        });
    });

    $("#addTransaction").submit(function (event) {
        event.preventDefault();

        $("#type").val() == "limit" ? addLimit() : addTransaction();
    });

    $("#earn-btn").click(function () {
        if ($("#earn-btn").hasClass("bg-primary-500")) {
            return;
        }
        addTransactionDOM("earn");
    });

    $("#expenses-btn").click(function () {
        if ($("#expenses-btn").hasClass("bg-[#ff6155]")) {
            return;
        }
        addTransactionDOM("expenses");
    });

    $("#limit-btn").click(function () {
        if ($("#limit-btn").hasClass("bg-[#27282d]")) {
            return;
        }
        addTransactionDOM("limit");
        checkLimitExist();
    });
});

async function getTransactionData() {
    try {
        data = await getCurrentDateData(fbStore);
    } catch (error) {
        console.error("Error:", error);
    }
}

let addTransactionForm = `
    <div class="grid gap-4 mb-4 grid-cols-2">
        <div class="col-span-2">
            <label for="date" class="block mb-2 text-sm font-medium">Date</label>
            <input type="date" name="date" id="date"
                class="border text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500"
                required="">
        </div>
        <div class="col-span-2">
            <label for="amount"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Amount</label>
            <input type="number" name="amount" id="amount"
                class="border text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500"
                required="" step="0.01" min="0.01" max="999999.99">
        </div>
        <div class="col-span-2">
            <label for="category"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Category</label>
            <select id="category"
                class="border text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500">
            </select>
        </div>
        <div class="col-span-2">
            <label for="note"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Note</label>
            <textarea id="note" name="note" rows="3"
                class="border text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500"></textarea>
        </div>
        <input id="type" type="hidden" name="type">
    </div>
    <button type="submit" id="submit-btn"
    class="text-white inline-flex items-center font-medium rounded-lg text-sm px-5 py-2.5 text-center">
    + Add new transaction
    </button>
`;

let addLimitForm = `
    <div class="grid gap-4 mb-4 grid-cols-2">
        <div class="col-span-2">
            <label for="date" class="block mb-2 text-sm font-medium">Date</label>
            <input type="text" name="date" id="date"
                class="border text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500"
                value="${getCurrentDate()}" disabled>
        </div>
        <div class="col-span-2">
            <label for="amount"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Amount</label>
            <input type="number" name="amount" id="amount"
                class="border text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500"
                required="" step="0.01" min="0.01" max="999999.99">
        </div>
        <input id="type" type="hidden" name="type" value="limit">
    </div>
    <button type="submit" id="submit-btn"
    class="text-white inline-flex items-center font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-gray-900 dark:bg-gray-900 hover:bg-gray-800">
    + Add new limit
    </button>
`;

function addTransactionDOM(type) {
    $("#btn-group button").removeClass(function (index, className) {
        return (className.match(/(^|\s)(bg-\S+|dark:bg-\S+)/g) || []).join(' ');
    });
    $("#submit-btn").removeClass(function (index, className) {
        return (className.match(/(^|\s)(bg-\S+|dark:bg-\S+)/g) || []).join(' ');
    });

    if (type == "expenses" || type == "earn") {
        let categories = [];
        $("#addTransaction").html(addTransactionForm);
        if (type == "expenses") {
            categories = ["Food", "Social", "Pets", "Transportation", "Household", "Entertainment", "Clothing", "Health", "Gift", "Education", "Other"];
            $("#expenses-btn").addClass("bg-red-500 dark:bg-red-500");
            $("#submit-btn").addClass("bg-red-500 dark:bg-red-500");
            $("#type").val("expenses");
        } else if (type == "earn") {
            categories = ["Salary", "Allowance", "Bonus", "Petty Cash", "Other"];
            $("#earn-btn").addClass("bg-blue-500 dark:bg-blue-500");
            $("#submit-btn").addClass("bg-blue-500 dark:bg-blue-500");
            $("#type").val("earn");
        }
        $("#category").append(`<option value="" disabled selected>Select Category</option>`);
        categories.forEach(function (category) {
            $("#category").append(`<option value="${category}">${category}</option>`);
        });

        var today = new Date().toISOString().split('T')[0];
        $('#date').prop('max', today);
    } else if (type == "limit") {
        $("#limit-btn").addClass("bg-gray-900 dark:bg-gray-900");
        $("#addTransaction").html(addLimitForm);
    }
}

function addTransaction() {
    var date = $("#date").val();
    var amount = $("#amount").val();
    var category = $("#category").val();
    var note = $("#note").val();
    var type = $("#type").val();

    var transaction = {
        date: date,
        amount: amount,
        category: category,
        note: note,
        type: type,
        timestamp: fbStore.getServerTimestamp(),
    };

    fbStore.writeSubCollection("users", user.id, "transactions", transaction)
        .then((docID) => {
            if (docID) {
                alert("Transaction added successfully");
                window.location.href = "transactions.html";
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

function addLimit() {
    var date = $("#date").val();
    var amount = $("#amount").val();

    var limit = {
        date: date,
        amount: amount,
        timestamp: fbStore.getServerTimestamp(),
    };
    fbStore.writeSubCollection("users", user.id, "limits", limit)
        .then((docID) => {
            if (docID) {
                alert("Limit added successfully");
                window.location.href = "transactions.html";
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

function checkLimitExist() {
    var date = $("#current-date").text();
    var query = [["date", "==", date]];

    fbStore.query(`users/${user.id}/limits/`, query)
        .then((querySnapshot) => {
            if (querySnapshot.length > 0) {
                $("#amount").prop("disabled", true);
                $("#submit-btn").prop("disabled", true);
                $("#amount").val(querySnapshot[0].amount);
            } else {
                $("#amount").prop("disabled", false);
                $("#submit-btn").prop("disabled", false);
                $("#amount").val("");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

function loadTransactions() {
    // Create an object to store daily totals
    let dailyTotals = {};

    data.forEach(function (transaction) {
        let date = transaction.date.split("-");
        let day = date[2];

        // Initialize daily total if not already created
        if (!dailyTotals[day]) {
            dailyTotals[day] = { earnTotal: 0, expensesTotal: 0 };
        }

        // Update daily totals based on transaction type
        if (transaction.type === "earn") {
            dailyTotals[day].earnTotal += Number(transaction.amount);
        } else if (transaction.type === "expenses") {
            dailyTotals[day].expensesTotal += Number(transaction.amount);
        }
    });

    // Extract days into an array and sort in descending order
    const sortedDays = Object.keys(dailyTotals).sort((a, b) => parseInt(b) - parseInt(a));

    // Iterate through sorted days and create tables
    for (let day of sortedDays) {
        createTable(day);
        addTableHead(day, dailyTotals[day].earnTotal, dailyTotals[day].expensesTotal);

        let dayTransactions = data.filter(transaction => transaction.date.split("-")[2] === day);

        // Add rows for each transaction
        dayTransactions.forEach(transaction => addTableRow(day, transaction));
    }
}

function addTableRow(tableId, transaction) {
    let textColorClass = transaction.type === "earn" ? "text-[#54a6fd]" : "text-[#ff6155]";

    let row = `
    <tr class="bg-white border-b dark:bg-[#212227] dark:border-[#4b4c53]">
        <th scope="row" class="px-6 py-4 font-medium whitespace-nowrap text-[#54555a]">${transaction.category}</td>
        <td class="px-6 py-4">${transaction.note}</td>
        <td class="px-6 py-4"></td>
        <td class="px-6 py-4 ${textColorClass}">${transaction.amount}</td>
    </tr>`;

    $('#' + tableId + ' tbody').append(row);
}

function addTableHead(tableId, totalEarn, totalExpenses) {
    let head = `
    <tr>
        <th scope="col" class="px-6 py-3 text-lg w-1/5">${tableId}</th>
        <th scope="col" class="px-6 py-3 w-2/5"></th>
        <th scope="col" class="text-sm px-6 py-3 w-1/5 text-[#54a6fd]">${totalEarn}</th>
        <th scope="col" class="text-sm px-6 py-3 w-1/5 text-[#ff6155]">${totalExpenses}</th>
    </tr>`;

    $('#' + tableId + ' thead').append(head);
}

function createTable(tableId) {
    let table = `
    <div id="${tableId}" class="relative overflow-x-auto mb-4">
        <table class="w-full text-sm text-left rtl:text-right">
            <thead class="text-xs uppercase bg-gray-50 dark:bg-[#4b4c53]"></thead>
            <tbody></tbody>
        </table>
    </div>`;
    $("#transaction").append(table);
}