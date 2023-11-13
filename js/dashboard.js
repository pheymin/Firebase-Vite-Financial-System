import { FBStore } from "../firebase/storeHandler.js";
import $, { get } from 'jquery';
import { loadSummary, getCurrentDate, convertToYYYYMM } from "./monthlySummarize.js";

const fbStore = new FBStore();
let user = JSON.parse(localStorage.getItem("user"));

$(document).ready(function () {
    //init
    $("#current-date").text(getCurrentDate());
    loadSummary(fbStore);
    getCategoryData("expenses");
    tabStyle("expenses");

    //event
    $("#prev-date").click(function () {
        var date = new Date($("#current-date").text());
        date.setMonth(date.getMonth() - 1);
        $("#current-date").text(date.toLocaleString('default', { month: 'long' }) + " " + date.getFullYear());
        loadSummary(fbStore);
        renderData();
    });

    $("#after-date").click(function () {
        var date = new Date($("#current-date").text());
        date.setMonth(date.getMonth() + 1);
        $("#current-date").text(date.toLocaleString('default', { month: 'long' }) + " " + date.getFullYear());
        loadSummary(fbStore);
        renderData();
    });

    $("#expenses-tab").click(function () {
        if ($("#expenses-tab").hasClass("dark:text-red-500 dark:border-red-500")) return;
        tabStyle("expenses");
        getCategoryData("expenses");
    });

    $("#earn-tab").click(function () {
        if ($("#earn-tab").hasClass("dark:text-blue-500 dark:border-blue-500")) return;
        tabStyle("earn");
        getCategoryData("earn");
    });
});

function renderData(){
    var hash = window.location.hash;
    hash = hash.substring(1);
    if (hash === "") {
        hash = "expenses";
    }
    console.log(hash);
    getCategoryData(hash);
}

function tabStyle(type) {
    if (type === "expenses") {
        $("#expenses-tab").addClass("dark:text-red-500 dark:border-red-500");
        $("#earn-tab").removeClass("dark:text-blue-500 dark:border-blue-500");
    } else {
        $("#earn-tab").addClass("dark:text-blue-500 dark:border-blue-500");
        $("#expenses-tab").removeClass("dark:text-red-500 dark:border-red-500");
    }
}

function getCategoryData(type) {
    var date = $("#current-date").text();
    var formattedDate = convertToYYYYMM(date);

    var startDate = formattedDate + '-01';
    var endDate = formattedDate + '-32';

    var query = [
        ['date', '>=', startDate],
        ['date', '<', endDate],
        ['type', '==', type]
    ];

    fbStore.query(`users/${user.id}/transactions/`, query)
        .then((querySnapshot) => {
            if (querySnapshot.length > 0) {
                $("#data-display").html(dataDisplay);
                getCategoryPercentage(querySnapshot);
            } else {
                $("#data-display").html(emptyData);
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            throw error;
        });
}

function updateChart(categoryPercentage) {
    const chartOptions = getChartOptions(categoryPercentage);
    const pieChartElement = document.getElementById("pie-chart");

    // Check if the chart instance exists and is defined
    if (pieChartElement && typeof ApexCharts !== 'undefined') {
        $("#pie-chart").empty();
        // Create and render the new chart instance
        console.log(chartOptions);
        const chart = new ApexCharts(pieChartElement, chartOptions);
        chart.render();
    }
}

const getChartOptions = (categoryPercentage) => {
    return {
        series: Object.values(categoryPercentage).map((category) => Number(category.percentage)),
        colors: ["#1C64F2", "#16BDCA", "#9061F9", "#FF6155", "#FFBA08", "#4B5563", "#D1D5DB"],
        chart: {
            height: 420,
            width: "100%",
            type: "pie",
        },
        stroke: {
            colors: ["white"],
            lineCap: "",
        },
        plotOptions: {
            pie: {
                labels: {
                    show: true,
                },
                size: "100%",
                dataLabels: {
                    offset: -25
                }
            },
        },
        labels: Object.values(categoryPercentage).map((category) => category.category),
        dataLabels: {
            enabled: true,
            style: {
                fontFamily: "Inter, sans-serif",
            },
        },
        legend: {
            position: "bottom",
            fontFamily: "Inter, sans-serif",
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return value
                },
            },
        },
        xaxis: {
            labels: {
                formatter: function (value) {
                    return value
                },
            },
            axisTicks: {
                show: false,
            },
            axisBorder: {
                show: false,
            },
        },
    }
}

function getCategoryPercentage(data) {
    const categoryPercentage = {};
    let totalAmount = 0;

    data.forEach((doc) => {
        totalAmount += Number(doc.amount);

        if (categoryPercentage[doc.category]) {
            categoryPercentage[doc.category] += Number(doc.amount);
        } else {
            categoryPercentage[doc.category] = Number(doc.amount);
        }
    });

    // Calculate percentage after the loop
    for (const category in categoryPercentage) {
        const percentage = ((categoryPercentage[category] / totalAmount) * 100).toFixed(2);
        categoryPercentage[category] = {
            percentage: percentage,
            category: category,
            total: categoryPercentage[category].toFixed(2),
        };
    }

    addRow(categoryPercentage);
    updateChart(categoryPercentage);
}

function addRow(categoryPercentage) {
    $("#summary-table tbody").empty();

    // Add rows to the table
    for (const category in categoryPercentage) {
        const { percentage, category: categoryName, total } = categoryPercentage[category];

        const row = `<tr class="bg-white border-b dark:bg-[#212227] dark:border-[#4b4c53]">
                        <td class="px-6 py-4">${percentage}%</td>
                        <td class="px-6 py-4">${categoryName}</td>
                        <td class="px-6 py-4">${total}</td>
                    </tr>`;
        $("#summary-table tbody").append(row);
    }
}

let dataDisplay = `
    <div class="w-full bg-white rounded-lg shadow dark:bg-[#212227] p-4 md:p-6">
        <div class="flex justify-between items-start w-full">
            <div class="flex-col items-center">
                <div class="flex items-center mb-1">
                    <h5 class="text-xl font-bold leading-none me-1">Analytic</h5>
                </div>
            </div>
            <div class="flex justify-end items-center">
                <button id="widgetDropdownButton" data-dropdown-toggle="widgetDropdown"
                    data-dropdown-placement="bottom" type="button"
                    class="inline-flex items-center justify-center text-gray-500 w-8 h-8 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm"><svg
                        class="w-3.5 h-3.5 text-gray-800 dark:text-white" aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 3">
                        <path
                            d="M2 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6.041 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
                    </svg><span class="sr-only">Open dropdown</span>
                </button>
                <div id="widgetDropdown"
                    class="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
                    <ul class="py-2 text-sm text-gray-700 dark:text-gray-200"
                        aria-labelledby="widgetDropdownButton">
                        <li>
                            <a href="#"
                                class="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"><svg
                                    class="w-3 h-3 me-2" aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                    viewBox="0 0 20 20">
                                    <path
                                        d="M14.707 7.793a1 1 0 0 0-1.414 0L11 10.086V1.5a1 1 0 0 0-2 0v8.586L6.707 7.793a1 1 0 1 0-1.414 1.414l4 4a1 1 0 0 0 1.416 0l4-4a1 1 0 0 0-.002-1.414Z" />
                                    <path
                                        d="M18 12h-2.55l-2.975 2.975a3.5 3.5 0 0 1-4.95 0L4.55 12H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Zm-3 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
                                </svg>Download data
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Line Chart -->
        <div class="py-6" id="pie-chart"></div>
    </div>

    <div class="relative overflow-x-auto rounded-lg">
        <table id="summary-table" class="w-full text-sm text-left rtl:text-right">
            <thead class="text-xs uppercase bg-gray-50 dark:bg-[#4b4c53]">
                <tr>
                    <th scope="col" class="px-6 py-3">
                        Percentage
                    </th>
                    <th scope="col" class="px-6 py-3">
                        Category
                    </th>
                    <th scope="col" class="px-6 py-3">
                        Total Amount
                    </th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
`

let emptyData = `
    <div class="w-full text-center col-span-2">No data</div>
`;