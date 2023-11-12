import { FBStore } from "../firebase/storeHandler.js";
import $ from 'jquery';

$(document).ready(function () {
    $("#loginForm").submit(function (event) {
        event.preventDefault();
        const email = $("#email").val();
        const password = $("#password").val();

        const fbStore = new FBStore();
        let query = [["email", "==", email], ["password", "==", password]];

        // Check if user already exists
        fbStore.query("users", query)
            .then((querySnapshot) => {
                if (querySnapshot.length > 0) {
                    alert("User login successfully");
                    localStorage.setItem("user", JSON.stringify(querySnapshot[0]));
                    window.location.href = "/index.html";
                } else {
                    alert("User not exists, please register");
                    window.location.href = "/register.html";
                }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    });
});