import React, { useEffect, useState } from "react";
import { withRouter } from "react-router";

function LoginPage(props) {
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
            authorizeButton.style.display = "none";
            signoutButton.style.display = "block";

            if (props.signInCallbacks) {
                props.signInCallbacks.forEach((callback) => {
                    callback();
                });
            }

            // Redirects to inbox page after login
            setInterval(() => {
                props.history.push("/inbox");
            }, 1000);
        } else {
            authorizeButton.style.display = "block";
            signoutButton.style.display = "none";

            if (props.signOutCallbacks) {
                props.signOutCallbacks.forEach((callback) => {
                    callback();
                });
            }
        }
    }

    // Process: handleClientLoad -> initClient -> updateSigninStatus

    // Loads the script
    useEffect(() => {
        const script = document.createElement("script");

        script.src = "https://apis.google.com/js/api.js";
        script.async = true;

        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Just waits 1 seconds for it to load.
    // TODO: CHANGE THIS, just for testing rn
    useEffect(() => {
        setTimeout(() => {
            handleClientLoad();
        }, 1000);
    }, []);

    return (
        <>
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
        </>
    );
}

export default withRouter(LoginPage);
