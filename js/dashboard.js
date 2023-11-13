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

        const row = `<tr class="bg-[#212227] border-[#4b4c53] border-b dark:bg-[#212227] dark:border-[#4b4c53]">
                        <td class="px-6 py-4">${percentage}%</td>
                        <td class="px-6 py-4">${categoryName}</td>
                        <td class="px-6 py-4">${total}</td>
                    </tr>`;
        $("#summary-table tbody").append(row);
    }
}

let dataDisplay = `
    <div class="w-full bg-[#212227] rounded-lg shadow dark:bg-[#212227] p-4 md:p-6">
        <div class="w-full text-center mb-1">
            <h5 class="text-xl font-bold leading-none me-1 text-center">Analytic</h5>
        </div>

        <!-- Line Chart -->
        <div class="py-6" id="pie-chart"></div>
    </div>

    <div class="relative overflow-x-auto rounded-lg">
        <table id="summary-table" class="w-full text-sm text-left rtl:text-right">
            <thead class="text-xs uppercase bg-gray-600 dark:bg-[#4b4c53]">
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