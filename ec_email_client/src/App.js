import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import MasterLogin from "./pages/MasterLogin.js";
import LoginPage from "./pages/LoginPage";
import EmailComposition from "./pages/CreateEmail.js";
import InboxPageComponent from './components/InboxPageComponent.js';
import Modal from "./components/CreateAccountPopup.js"
import { Spinner } from "reactstrap";
import "./App.css";
import AppSelection from "./pages/AppSelection";
// TODO: Have login functions passed as props so each page can check for sign ins and handle them
const axios = require('axios').default;
const serverURL = "http://3.133.110.55:8000";

function App() {
    const [currentPage, setCurrentPage] = useState("MasterLogin");
    const [masterSignedIn, setMasterSignedIn] = useState(false);
    var apiToken = 0;
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

    // Assings signout button logout functionality
    function MasterSignOutButtonHandler() {
        console.log("Master Signing out via button");
        apiToken = 0;
        setMasterSignedIn(false);
        setCurrentPage("MasterLogin");
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
        if (!masterSignedIn){
            setCurrentPage("MasterLogin");
        }
        else if (!signedIn) {
            document.getElementById("signout_button").style.display = "none";
            setCurrentPage("AppSelection");
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

    function handleAppSelection(appSelectionName) {
        if (appSelectionName == "Email") {
            setCurrentPage("Login");
        }
        if (appSelectionName == "Notes") {
            // TODO: Add notes page here
        }
    }

    function handleBackToAppSelect() {
        if (currentPage == "Inbox") {
            window.gapi.auth2.getAuthInstance().signOut();
        }

        setCurrentPage("AppSelection");
    }

    function handleMasterLogin( username, passwordHash ) {
        let data = {
            "username": username, 
            "passwordHash": passwordHash 
        }

        axios.post(serverURL + "/signIn", data, { validateStatus: false }).then((result, e)=>{
            console.log(result.data);
            if (result.data == "Incorrect login"){
                console.log(result.data);
                alert('Incorrect Username/ Password Combination');
            } 

            else if (result.data == "TOO MANY ATTEMPTS"){
                console.log(result.data);
                alert('Too many Incorrect attempts for this account. It has been temporarily locked');
            }

            else if (result.data != ''){
                setMasterSignedIn(true);
                setCurrentPage("AppSelection");
                apiToken = (result.data);
            }


        })
    }

    function handleAccountCreate( username, passwordHash ) {
        let data = {
            "username": username, 
            "passwordHash": passwordHash 
        }

        axios.post(serverURL + "/addUser", data, { validateStatus: false }).then((result, e)=>{
            console.log(result.data);
            if (result.data == "ADDED"){
                console.log(result.data);
                alert('Account Successfully Created');
            } 

            else if (result.data == "TOO MANY ATTEMPTS"){
                console.log(result.data);
                alert('Too many Incorrect attempts for this account. It has been temporarily locked');
            }

            else if (result.data != ''){
                alert('Account Successfully Created');
            }


        })
    }


    return (
        <div className="App">

            {/* Display appropriate EC Banner depending on what page we are on */}
            {(currentPage == "Login" || currentPage == "Inbox" || currentPage == "MasterLogin") && 
            <div className="Title">EC Email Client</div>}
            {currentPage == "AppSelection" && 
            <div className="Title">EC Apps</div>}

            {/* Render signout button */}
            {currentPage == "AppSelection" &&
            <button onClick={MasterSignOutButtonHandler}>Master Sign Out</button>}

            {/* Render signout button */}
            {currentPage != "MasterLogin" && currentPage != "AppSelection" &&
            <button id="signout_button">Sign Out</button>}


            {/* Render Login Page */}
            {currentPage == "Login" && !loadingGapi && <LoginPage />}

            {/* Render Inbox Page */}
            {currentPage == "Inbox" && <InboxPageComponent />}
            
            {/* Render App Selection Page */}
            {currentPage == "AppSelection" && <AppSelection handleAppSelect={handleAppSelection}/>}
            
            {/* Only Display Spinner if not on AppSelectionPage */}
            {currentPage != "AppSelection" && !signedIn && loadingGapi && <Spinner color="primary" />}
            
            {/* Add a "Back To App Selection" button if we are not on the App Selection Page or Inbox Page. (Inbox Page can use signout button) */}
            {currentPage != "AppSelection" && currentPage != "Inbox"  && currentPage != "MasterLogin" &&
            <br/> &&
            <button onClick={handleBackToAppSelect}>Back To App Selection</button>}

            {currentPage == "MasterLogin" && <MasterLogin handleMasterLog={handleMasterLogin}/>}
            {!signedIn && loadingGapi && <Spinner color="primary" />}

            {currentPage == "MasterLogin" && <Modal handleAccountCreate={handleAccountCreate}/>}

        </div>
    );
}

export default App;
