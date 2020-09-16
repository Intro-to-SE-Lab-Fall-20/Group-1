import React, { useEffect, useState } from "react";
import { withRouter } from "react-router";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "./InboxPage.css";
import EmailComposition from "./CreateEmail.js";

// TODO: implement a check to see if GAPI is loaded & signed in, if not, then load and sign in

function InboxPage(props) {
    function checkIfSignedIn() {
        // Loads/signs in if not loaded
        if (!window.gapi) {
            console.log("INBOX - GAPI was not loaded...loading now");
            const script = document.createElement("script");
            script.src = "https://apis.google.com/js/api.js";
            script.async = true;
            document.body.appendChild(script);
            document.body.removeChild(script);

            // Sets up gapi, assigns signout button function
            setTimeout(() => {
                window.gapi.load("client:auth2", initClient);
                signOutButtonHandler();
            }, 1000);

            // If not signed in, go to login page
        } else if (!window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
            console.log("INBOX - GAPI was loaded but not signed in");
            props.history.push("/");
        }

        // If button doesn't have funciton, give it logout handler
        if (document.getElementById("signout_button").onclick == undefined) {
            signOutButtonHandler();
        }

    }

    // Assings signout button logout functionality
    function signOutButtonHandler() {
        document.getElementById("signout_button").onclick = () => {
            window.gapi.auth2.getAuthInstance().signOut();
            console.log("INBOX - Signing out via button");
            setTimeout(() => {
                props.history.push("/");
            }, 500);
        };
    }

    function initClient() {
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
        "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.modify";

        window.gapi.client
            .init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES,
            })
            .then(
                function () {
                    // If not logged in, redirect to login page
                    if (!window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
                        props.history.push("/");
                    }
                },
                function (error) {
                    console.log(
                        "INIT CLIENT ERROR: " + JSON.stringify(error, null, 2)
                    );
                }
            );
    }

    useEffect(() => {
        checkIfSignedIn();
        console.log("Inbox page checked if logged in");
    }, []);

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

    // Returns list of all message ids
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

    // Returns an html object of the message contents
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

    return (
        <>
            <div className="Title">Inbox Page
                <button id="signout_button">Sign Out</button>
            </div>
            <Router>
                <Link to="/email" id="emailCompButton">Create Email</Link>
                <Switch>
                    <Route path="/email">
                        <EmailComposition />
                    </Route>
                </Switch>
            </Router>

            <br/>

        </>


    );
}

export default withRouter(InboxPage);
