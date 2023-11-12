import { FBStore } from "../firebase/storeHandler.js";
import $ from 'jquery';

$(document).ready(function () {
    $("#registerForm").submit(function (event) {
        event.preventDefault();
        const email = $("#email").val();
        const password = $("#password").val();

        const user = {
            email,
            password,
        };

        const fbStore = new FBStore();
        let query = ["email", "==", email];

        // Check if user already exists
        fbStore.query("users", query)
            .then((querySnapshot) => {
                if (querySnapshot.length > 0) {
                    alert("User already exists, please login");
                    window.location.href = "login.html";
                } else {
                    // User doesn't exist, proceed with registration
                    return fbStore.write("users", user);
                }
            })
            .then((docID) => {
                if (docID) {
                    alert("User registered successfully");
                    window.location.href = "login.html";
                }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    });
});