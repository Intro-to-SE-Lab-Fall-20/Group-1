import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import LoginPage from "./pages/LoginPage";
import EmailComposition from "./pages/CreateEmail.js";
import InboxPageComponent from './components/InboxPageComponent.js';
import { Spinner } from "reactstrap";
import "./App.css";
// TODO: Have login functions passed as props so each page can check for sign ins and handle them

function App() {
    const [currentPage, setCurrentPage] = useState("Login");
    const [signedIn, setSignedIn] = useState(false);
    const [loadingGapi, setLoadingGapi] = useState(true);

    function checkIfSignedIn() {
        // Loads/signs in if not loaded
        if (!window.gapi) {
            console.log("GAPI was not loaded...loading now");
            const script = document.createElement("script");
            script.src = "https://apis.google.com/js/api.js";
            script.async = true;
            document.body.appendChild(script);
            document.body.removeChild(script);

            setTimeout(() => {
                window.gapi.load("client:auth2", initClient);
            }, 2000);
        } else if (!window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
            console.log("GAPI was loaded but not signed in");
            initClient();
            // var authorizeButton = document.getElementById("authorize_button");
            // authorizeButton.onclick = handleAuthClick;
        } else if (
            window.gapi &&
            window.gapi.auth2 &&
            window.gapi.auth2.getAuthInstance().isSignedIn.get()
        ) {
            // Already signed in -- Is this needed?
            setSignedIn(true);
        }
    }

    function initClient() {
        // Client ID and API key from the Developer Console
        var CLIENT_ID =
            "461282014069-keh5gggejqgqrrv2gtoir1ilppot3mjq.apps.googleusercontent.com";
        var API_KEY = "AIzaSyDoP8Mj4b34VsEJm7AXNneq93cd3z2dpsk";

        // Array of API discovery doc URLs for APIs used by the quickstart
        var DISCOVERY_DOCS = [
            "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
        ];

        // Authorization scopes required by the API; multiple scopes can be
        // included, separated by spaces.
        var SCOPES =
            "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.modify";

        var authorizeButton = document.getElementById("authorize_button");
        window.gapi.client
            .init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES,
            })
            .then(
                function () {
                    // Listen for sign-in state changes.
                    window.gapi.auth2
                        .getAuthInstance()
                        .isSignedIn.listen(updateSigninStatus);

                    // Handle the initial sign-in state.
                    updateSigninStatus(
                        window.gapi.auth2.getAuthInstance().isSignedIn.get()
                    );
                    // authorizeButton.onclick = handleAuthClick;
                    // signoutButton.onclick = handleSignoutClick;
                },
                function (error) {
                    console.log(
                        "INIT CLIENT ERROR: " + JSON.stringify(error, null, 2)
                    );
                }
            );
    }

    // Assings signout button logout functionality
    function signOutButtonHandler() {
        document.getElementById("signout_button").onclick = () => {
            window.gapi.auth2.getAuthInstance().signOut();
            console.log("Signing out via button");
        };
    }

    async function updateSigninStatus(isSignedIn) {
        console.log("Sign in status: " + isSignedIn);
        setSignedIn(isSignedIn);
        setLoadingGapi(false);
    }

    // Process: handleClientLoad -> initClient -> updateSigninStatus

    // Loads the script
    useEffect(() => {
        checkIfSignedIn();
    }, []);

    useEffect(() => {
        if (signedIn && currentPage == "Login") setCurrentPage("Inbox");
        if (signedIn) signOutButtonHandler();
        if (!signedIn) {
            document.getElementById("signout_button").style.display = "none";
            setCurrentPage("Login");
            // var authorizeButton = document.getElementById("authorize_button");
            // authorizeButton.onclick = handleAuthClick;
        } else {
            document.getElementById("signout_button").style.display = "";
        }
    }, [signedIn]);

    // Returns profile info (email, # of messages, # of threads)
    async function getProfileInfo(userId) {
        // To get userId of logged in user, give "me"
        if (userId === undefined) userId = "me";

        return new Promise((resolve, reject) => {
            window.gapi.client.gmail.users
                .getProfile({
                    userId: userId,
                })
                .then((response) => {
                    resolve(response.result);
                });
        });
    }

    // Console logs the profile info after sign in
    async function logProfileInfo() {
        console.log(await getProfileInfo("me"));
    }

    // Console logs that the profile logged out
    async function logSignOut() {
        console.log("Just signed out");
    }

    return (
        <div className="App">
            <div className="Title">EC Email Client</div>
            <button id="signout_button">Sign Out</button>
            {currentPage == "Login" && !loadingGapi && <LoginPage />}
            {currentPage == "Inbox" && <InboxPageComponent />}
            {!signedIn && loadingGapi && <Spinner color="primary" />}
        </div>
    );
}

export default App;
