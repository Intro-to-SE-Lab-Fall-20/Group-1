import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { withRouter } from "react-router";
import logo from "./logo.svg";
import LoginPage from "./pages/LoginPage";
import InboxPage from "./pages/InboxPage";
import "./App.css";

// TODO: Have login functions passed as props so each page can check for sign ins and handle them

function App() {
    // Returns profile info (email, # of messages, # of threads)
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
            <Router>
                <Link to="/">Login Page</Link>
                <br />
                <Link to="/inbox">Inbox Page</Link>
                <Switch>
                    <Route path="/inbox">
                        <InboxPage />
                    </Route>
                    <Route path="/">
                        <LoginPage
                            signInCallbacks={[logProfileInfo]}
                            signOutCallbacks={[logSignOut]}
                        />
                    </Route>
                </Switch>
            </Router>
        </div>
    );
}

export default App;
