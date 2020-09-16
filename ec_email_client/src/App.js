import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { withRouter } from "react-router";
import logo from "./logo.svg";
import LoginPage from "./pages/LoginPage";
import InboxPage from "./pages/InboxPage";
import "./App.css";
import InboxPage from "./pages/InboxPage";

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
    var SCOPES =
        "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.modify";

    const [profileInfo, setProfileInfo] = useState(null);

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
            setProfileInfo(await getProfileInfo("me"));
            // let messageIds = await getMessagesIds();
            // console.log(messageIds);
            // console.log(await getMessage(messageIds[0].id));
            // console.log(await getAllMessages());
            let messageToSend = createMessage(
                "ECCLIENT",
                "test@email.com",
                "TestEmail",
                "ecclient@mailinator.com",
                "EC Email",
                "Hey, this is a test email from EC client...dope"
            );
            // sendMessage(messageToSend);
            authorizeButton.style.display = "none";
            signoutButton.style.display = "block";
        } else {
            authorizeButton.style.display = "block";
            signoutButton.style.display = "none";
        }
    }

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

    function createMessage(
        fromName,
        fromEmail,
        toName,
        toEmail,
        subject,
        messageContent
    ) {
        // https://developers.google.com/gmail/api/reference/rest/v1/users.messages#Message
        // https://whatismyipaddress.com/email-header
        // Look at this sample: https://github.com/googleapis/google-api-nodejs-client/blob/master/samples/gmail/send.js
        // Fix https://stackoverflow.com/questions/30590988/failed-sending-mail-through-google-api-with-javascript

        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString(
            "base64"
        )}?=`;
        const messageParts = [
            `From: ${fromName} <${fromEmail}>`,
            `To: ${toName} <${toEmail}>`,
            "Content-Type: text/html; charset=utf-8",
            "MIME-Version: 1.0",
            `Subject: ${utf8Subject}`,
            "",
            messageContent,
        ];
        const message = messageParts.join("\n");

        // The body needs to be base64url encoded.
        const encodedMessage = Buffer.from(message)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        return encodedMessage;
    }

    async function sendMessage(encodedMessage) {
        // Look at this sample: https://github.com/googleapis/google-api-nodejs-client/blob/master/samples/gmail/send.js
        // Fix https://stackoverflow.com/questions/30590988/failed-sending-mail-through-google-api-with-javascript

        window.gapi.client.gmail.users.messages
            .send({
                userId: "me",
                resource: {
                    raw: encodedMessage,
                },
            })
            .then((result) => {
                console.log(result);
            });
    }

    // Process: handleClientLoad -> initClient -> updateSigninStatus

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.async = true;
        document.body.appendChild(script);

        // Handles Auth after load
        setTimeout(() => {
            handleClientLoad();
        }, 1000);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div className="App">
            <div className="Title">EC Email Client</div>
            <div className="GoogleSigninButton">
                <button
                    className="GoogleSigninButton"
                    id="authorize_button"
                    style={{
                        display: "none",
                        border: "none",
                        color: "transparent",
                        background: "transparent",
                        textAlign: "center",
                    }}
                >
                    <img
                        style={{ cursor: "pointer" }}
                        src="https://raw.githubusercontent.com/react-native-community/google-signin/master/img/signin-button.png?sanitize=false"
                    />
                </button>
            </div>
            <button id="signout_button" style={{ display: "none" }}>
                Sign Out
            </button>
            {/* Once profile is loaded, we know GAPI is loaded, so get emails */}
            {profileInfo && <InboxPage />}
        </div>
    );
}

export default App;
