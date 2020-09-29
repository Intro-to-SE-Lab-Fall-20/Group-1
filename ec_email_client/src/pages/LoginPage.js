import React, { useEffect, useState } from "react";
import "./LoginPage.css";

function LoginPage(props) {
    function handleAuthClick(event) {
        console.log("Should be signing in...");
        window.gapi.auth2.getAuthInstance().signIn();
    }

    useEffect(() => {
        // var authorizeButton = document.getElementById("authorize_button");
        // authorizeButton.onclick = handleAuthClick;
    }, []);

    return (
        <>
            <div className="GoogleSigninButton">
                <button
                    className="GoogleSigninButton"
                    id="authorize_button"
                    style={{
                        // display: "none",
                        border: "none",
                        color: "transparent",
                        background: "transparent",
                        textAlign: "center",
                    }}
                    onClick={handleAuthClick}
                >
                    <img
                        style={{ cursor: "pointer" }}
                        src="https://raw.githubusercontent.com/react-native-community/google-signin/master/img/signin-button.png?sanitize=false"
                    />
                </button>
            </div>
        </>
    );
}

export default LoginPage;
