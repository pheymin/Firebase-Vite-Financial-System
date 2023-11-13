import { FBStore } from "../firebase/storeHandler.js";
import $ from 'jquery';
import { loadSummary, getCurrentDate } from "./monthlySummarize.js";

const fbStore = new FBStore();
let user = JSON.parse(localStorage.getItem("user"));

$(document).ready(function () {
    //init
    $("#current-date").text(getCurrentDate());
    loadSummary(fbStore);

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
});