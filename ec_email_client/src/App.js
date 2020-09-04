import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
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
    var SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

    function handleClientLoad() {
        console.log("About to loadwindow.gapi");
        window.gapi.load("client:auth2", initClient);
    }

    function initClient() {
        var authorizeButton = document.getElementById("authorize_button");
        var signoutButton = document.getElementById("signout_button");
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
                    authorizeButton.onclick = handleAuthClick;
                    signoutButton.onclick = handleSignoutClick;
                },
                function (error) {
                    console.log(
                        "INIT CLIENT ERROR: " + JSON.stringify(error, null, 2)
                    );
                }
            );
    }

    function handleAuthClick(event) {
        window.gapi.auth2.getAuthInstance().signIn();
    }

    function handleSignoutClick(event) {
        window.gapi.auth2.getAuthInstance().signOut();
    }

    async function updateSigninStatus(isSignedIn) {
        var authorizeButton = document.getElementById("authorize_button");
        var signoutButton = document.getElementById("signout_button");
        console.log("Sign in status: " + isSignedIn);
        if (isSignedIn) {
            console.log("Profile Info: ", await getProfileInfo("me"));
            authorizeButton.style.display = "none";
            signoutButton.style.display = "block";
        } else {
            authorizeButton.style.display = "block";
            signoutButton.style.display = "none";
        }
    }

    function decodeBase64(data) {
        return atob(data);
    }

    function decodeBase64HTML(data) {
        // Replace non-url compatible chars with base64 standard chars
        let input = data.replace(/-/g, "+").replace(/_/g, "/");

        // Pad out with standard base64 required padding characters
        var pad = input.length % 4;
        if (pad) {
            if (pad === 1) {
                throw new Error(
                    "InvalidLengthError: Input base64url string is the wrong length to determine padding"
                );
            }
            input += new Array(5 - pad).join("=");
        }

        return decodeBase64(input);
    }

    async function listMessagesIds(userId) {
        // To get userId of logged in user, give "me"
        if (userId == undefined) userId = "me";

        return new Promise((resolve, reject) => {
            window.gapi.client.gmail.users.messages
                .list({
                    userId: userId,
                })
                .then(function (response) {
                    resolve(response.result.messages);
                });
        });
    }

    async function listMessage(messageId) {
        // https://developers.google.com/gmail/api/reference/rest/v1/users.messages.attachments#MessagePartBody
        console.log("Getting specific message for " + messageId);

        return new Promise((resolve, reject) => {
            window.gapi.client.gmail.users.messages
                .get({
                    userId: "me",
                    id: messageId,
                })
                .then(function (response) {
                    console.log(response.result);
                    resolve(
                        decodeBase64HTML(
                            response.result.payload.parts[1].body.data
                        )
                    );
                });
        });
    }

    async function getProfileInfo(userId) {
        // To get userId of logged in user, give "me"
        if (userId == undefined) userId = "me";

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

    const [gapiIsLoaded, setGapiIsLoaded] = useState(false);

    // Process: handleClientLoad -> initClient -> updateSigninStatus

    useEffect(() => {
        const script = document.createElement("script");

        script.src = "https://apis.google.com/js/api.js";
        script.async = true;

        document.body.appendChild(script);
        // setGapiIsLoaded(true);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Just waits 2 seconds for it to load.
    // TODO: CHANGE THIS, just for testing rn
    useEffect(() => {
        setTimeout(() => {
            handleClientLoad();
        }, 1000);
    }, [gapiIsLoaded]);

    return (
        <div className="App">
            <button id="authorize_button" style={{ display: "none" }}>
                Authorize
            </button>
            <button id="signout_button" style={{ display: "none" }}>
                Sign Out
            </button>
            <pre id="content" style={{ "white-space": "pre-wrap" }}></pre>
        </div>
    );
}

export default App;
