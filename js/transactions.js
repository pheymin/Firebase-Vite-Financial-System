import { FBStore } from "../firebase/storeHandler.js";
import $ from 'jquery';

const fbStore = new FBStore();
let user = JSON.parse(localStorage.getItem("user"));

$(document).ready(function () {
    //init
    addTransactionDOM("expenses");

    //event
    $("#prev-date").click(function () {
        var date = new Date($("#current-date").text());
        date.setMonth(date.getMonth() - 1);
        $("#current-date").text(date.toLocaleString('default', { month: 'long' }) + " " + date.getFullYear());
        // loadTransactions();
    });

    $("#after-date").click(function () {
        var date = new Date($("#current-date").text());
        date.setMonth(date.getMonth() + 1);
        $("#current-date").text(date.toLocaleString('default', { month: 'long' }) + " " + date.getFullYear());
        // loadTransactions();
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

function getCurrentDate() {
    var date = new Date();
    var month = date.toLocaleString('default', { month: 'long' });
    var year = date.getFullYear();
    return month + " " + year;
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
    class="text-white inline-flex items-center font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-[#27282d] dark:bg-[#27282d] hover:bg-[#212227]">
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
            $("#expenses-btn").addClass("bg-[#ff6155] dark:bg-[#ff6155]");
            $("#submit-btn").addClass("bg-[#ff6155] dark:bg-[#ff6155]");
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
        $("#current-date").text(getCurrentDate());
    } else if (type == "limit") {
        $("#limit-btn").addClass("bg-[#27282d] dark:bg-[#27282d]");
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
    console.log(limit);
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