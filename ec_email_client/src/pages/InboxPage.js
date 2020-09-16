import React, { useEffect, useState } from "react";
import { withRouter } from "react-router";
import "./InboxPage.css";
import {
    Table,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "reactstrap";

function InboxPage(props) {
    const [gapiIsLoaded, setGapiIsLoaded] = useState(false);

    async function getMessagesIds(userId) {
        // To get userId of logged in user, give "me"
        if (userId === undefined) userId = "me";

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

    async function getMessage(messageId) {
        // https://developers.google.com/gmail/api/reference/rest/v1/users.messages.attachments#MessagePartBody
        // console.log("Getting specific message for " + messageId);

        let message = {
            bodyHTML: "null",
            bodyText: "null",
            from: "null",
            to: "null",
            subject: "null",
            headers: {},
            id: "null",
        };

        return new Promise((resolve, reject) => {
            window.gapi.client.gmail.users.messages
                .get({
                    userId: "me",
                    id: messageId,
                })
                .then(function (response) {
                    // console.log(response.result);

                    // If it has two payload parts
                    if (
                        !!response.result.payload.parts &&
                        response.result.payload.parts.length > 1
                    ) {
                        message.bodyText = decodeBase64HTML(
                            response.result.payload.parts[0].body.data
                        );
                        message.bodyHTML = decodeBase64HTML(
                            response.result.payload.parts[1].body.data
                        );
                    } else if (
                        !!response.result.payload.body &&
                        !!response.result.payload.body.data
                    ) {
                        message.bodyText = decodeBase64HTML(
                            response.result.payload.body.data
                        );
                    } else {
                        console.log(
                            "Failed getting message body for:",
                            response.result
                        );
                    }

                    // Gets all headers, turns in to dict
                    let headers = {};
                    response.result.payload.headers.forEach((header) => {
                        headers[header.name] = header.value;
                        if (header.name === "Subject") {
                            message.subject = header.value;
                        }
                        if (header.name === "To") {
                            message.to = header.value;
                        }
                        if (header.name === "From") {
                            message.from = header.value;
                        }
                    });
                    message.headers = headers;

                    message.id = response.result.id;
                    resolve(message);
                });
        });
    }

    async function getAllMessages(numOfMessages) {
        // To get userId of logged in user, give "me"
        return new Promise(async (resolve, reject) => {
            let messageIds = await getMessagesIds("me");
            let messages = [];
            for (var i = 0; i < numOfMessages; i++) {
                try {
                    messages.push(getMessage(messageIds[i].id));
                } catch {
                    console.log("Failed on ", messageIds[i].id);
                }
            }

            Promise.all(messages).then((values) => {
                resolve(values);
            });
        });
    }

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
        } else {
            setGapiIsLoaded(!gapiIsLoaded);
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
        var SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

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
                    } else {
                        setGapiIsLoaded(!gapiIsLoaded);
                    }
                },
                function (error) {
                    console.log(
                        "INIT CLIENT ERROR: " + JSON.stringify(error, null, 2)
                    );
                }
            );
    }

    function decodeBase64(data) {
        return atob(data);
    }

    function decodeBase64HTML(data) {
        // Replace non-url compatible chars with base64 standard chars
        if (data == undefined) {
            return "";
        }
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

    const [emails, setEmails] = useState([]);

    useEffect(() => {
        checkIfSignedIn();
        console.log("Inbox page checked if logged in");
    }, []);

    useEffect(() => {
        console.log(gapiIsLoaded);
        if (gapiIsLoaded) {
            getAllMessages(10).then((emails) => {
                setEmails(emails);
            });
        }
    }, [gapiIsLoaded]);

    return (
        <>
            <div className="Title">EC Email Client</div>
            <button id="signout_button">Sign Out</button>
            <Table>
                <thead>
                    <tr>
                        <td>
                            <b>From</b>
                        </td>
                        <td>
                            <b>Subject</b>
                        </td>
                        <td>
                            <b>Message</b>
                        </td>
                    </tr>
                </thead>
                <tbody>
                    {emails.map((email) => {
                        return <InboxEmailRow key={email.id} message={email} />;
                    })}
                </tbody>
            </Table>
        </>
    );
}

function InboxEmailRow(props) {
    function tellEmailIdOnClick() {
        console.log("Email ID Clicked: " + props.message.id);
        toggleModalOpen();
    }

    const [modalIsOpen, setModalIsOpen] = useState(false);
    function toggleModalOpen() {
        setModalIsOpen(!modalIsOpen);
    }

    let from = props.message.from.split(" <")[0];
    if (from.split(" <")[0].length > 30) {
        subject = from.substring(0, 30) + "...";
    }

    let subject = props.message.subject;
    if (subject.length > 30) {
        subject = subject.substring(0, 30) + "...";
    }

    let bodyText = props.message.bodyText;
    if (bodyText.length > 100) {
        bodyText = bodyText.substring(0, 100) + "...";
    }

    return (
        <>
            <tr onClick={tellEmailIdOnClick}>
                <td>{from}</td>
                <td>
                    <b>{subject}</b>
                </td>
                <td>{bodyText}</td>
            </tr>
            <ViewEmailModal
                modalIsOpen={modalIsOpen}
                toggleModalOpen={toggleModalOpen}
                email={props.message}
            />
        </>
    );
}

function ViewEmailModal(props) {
    // Modal docs https://reactstrap.github.io/components/modals/
    return (
        <Modal
            isOpen={props.modalIsOpen}
            toggle={props.toggleModalOpen}
            id="emailPopupModal"
        >
            <ModalHeader toggle={props.toggleModalOpen}>
                {props.email.subject}
            </ModalHeader>
            <ModalBody>
                <b>From:</b> {props.email.from}
                <br />
                <b>To:</b> {props.email.to}
                <br />
                <b>Subject:</b> {props.email.subject}
                <hr />
                <div
                    dangerouslySetInnerHTML={{ __html: props.email.bodyHTML }}
                />
                <br />
            </ModalBody>
            <ModalFooter>
                <Button color="primary" onClick={props.toggleModalOpen}>
                    Reply
                </Button>{" "}
                <Button color="primary" onClick={props.toggleModalOpen}>
                    Forward
                </Button>{" "}
                <Button color="secondary" onClick={props.toggleModalOpen}>
                    Cancel
                </Button>
            </ModalFooter>
        </Modal>
    );
}

export default withRouter(InboxPage);
