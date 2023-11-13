import { FBStore } from "../firebase/storeHandler.js";
import $ from 'jquery';
import { loadSummary, getCurrentDate, convertToYYYYMM } from "./monthlySummarize.js";

const fbStore = new FBStore();
let user = JSON.parse(localStorage.getItem("user"));

$(document).ready(function () {
    //init
    $("#current-date").text(getCurrentDate());
    loadSummary(fbStore);
    updateChart("expenses");
    tabStyle("expenses");

    //event
    $("#prev-date").click(function () {
        var date = new Date($("#current-date").text());
        date.setMonth(date.getMonth() - 1);
        $("#current-date").text(date.toLocaleString('default', { month: 'long' }) + " " + date.getFullYear());
        loadSummary(fbStore);
    });

    $("#after-date").click(function () {
        var date = new Date($("#current-date").text());
        date.setMonth(date.getMonth() + 1);
        $("#current-date").text(date.toLocaleString('default', { month: 'long' }) + " " + date.getFullYear());
        loadSummary(fbStore);
    });

    $("#expenses-tab").click(function () {
        if ($("#expenses-tab").hasClass("dark:text-red-500 dark:border-red-500")) return;
        tabStyle("expenses");
        debounceUpdate("expenses");
    });

    $("#earn-tab").click(function () {
        if ($("#earn-tab").hasClass("dark:text-blue-500 dark:border-blue-500")) return;
        $("#pie-chart").empty();
        tabStyle("earn");
        debounceUpdate("earn");
    });
});

let debounceTimeout;

function debounceUpdate(type) {
    clearTimeout(debounceTimeout);

    // Debounce by waiting for 300 milliseconds
    debounceTimeout = setTimeout(async () => {
        await updateChart(type);
    }, 300);
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

    return fbStore.query(`users/${user.id}/transactions/`, query)
        .then((querySnapshot) => {
            if (querySnapshot.length > 0) {
                addRow(querySnapshot);
                const categoryCounts = {};
                querySnapshot.forEach((data) => {
                    if (categoryCounts[data.category]) {
                        categoryCounts[data.category]++;
                    } else {
                        categoryCounts[data.category] = 1;
                    }
                });
                return categoryCounts;
            } else {
                return {};
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            throw error;
        });
}

async function updateChart(type) {
    try {
        const categoryCounts = await getCategoryData(type);
        const chartOptions = getChartOptions(categoryCounts);

        const pieChartElement = document.getElementById("pie-chart");

        // Check if the chart instance exists and is defined
        if (pieChartElement && typeof ApexCharts !== 'undefined') {
            // Clear the content of the chart container
            pieChartElement.innerHTML = '';

            // Create and render the new chart instance
            const chart = new ApexCharts(pieChartElement, chartOptions);
            chart.render();
        }
    } catch (error) {
        console.error("Error updating chart:", error);
    }
}

const getChartOptions = (categoryCounts) => {
    return {
        series: Object.values(categoryCounts),
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
        labels: Object.keys(categoryCounts),
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

function addRow(data) {
    $("#summary-table tbody").empty();

    const categoryPercentage = {};
    let totalAmount = 0;

    // Calculate total amount and category percentages
    data.forEach((doc) => {
        totalAmount += Number(doc.amount);

        if (categoryPercentage[doc.category]) {
            categoryPercentage[doc.category] += Number(doc.amount);
        } else {
            categoryPercentage[doc.category] = Number(doc.amount);
        }
    });

    // Add rows to the table
    for (const category in categoryPercentage) {
        const percentage = ((categoryPercentage[category] / totalAmount) * 100).toFixed(2);
        const total = categoryPercentage[category].toFixed(2);

        const row = `<tr class="bg-white border-b dark:bg-[#212227] dark:border-[#4b4c53]">
                        <td class="px-6 py-4">${percentage}%</td>
                        <td class="px-6 py-4">${category}</td>
                        <td class="px-6 py-4">${total}</td>
                    </tr>`;
        $("#summary-table tbody").append(row);
    }
}
