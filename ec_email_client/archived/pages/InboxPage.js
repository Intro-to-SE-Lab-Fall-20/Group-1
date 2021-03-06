import React, { useEffect, useState, useRef } from "react";
import "./InboxPage.css";
import {
    Table,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Spinner,
} from "reactstrap";
import EmailComposition from "./CreateEmail.js";
import { render } from "@testing-library/react";

// TODO: implement a check to see if GAPI is loaded & signed in, if not, then load and sign in

function InboxPage(props) {
    const [createEmailModalIsOpen, setCreateEmailModalIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(null);
    const [nextPage, setNextPage] = useState(null);
    const [loadedEmails, setLoadedEmails] = useState([]);
    const [displayedEmails, setDisplayedEmails] = useState([]);
    const loadedEmailsRef = useRef([]);
    const displayedEmailsRef = useRef([]);

    // Initialize emails
    useEffect(() => {
        getMessages().then((emails) => {
            loadedEmailsRef.current = emails;
            setLoadedEmails(emails);
            
            var emailsToDisplay = emails.slice(0, displayedEmails.length + 20)
            displayedEmailsRef.current = emailsToDisplay;
            setDisplayedEmails(emailsToDisplay);
        });
    }, [searchTerm]);

    useEffect(() => {
        refreshInbox.bind(displayedEmailsRef);
    }, []);

    // Initialize refresh (Executes every 60 seconds)
    useEffect(() => {
        setInterval(() => {
            refreshInbox();
        }, 5000);
    }, []);

    useEffect(() => {
        console.log(displayedEmails);
    }, [loadedEmailsRef]);

    async function getMessagesIds(userId) {
        // To get userId of logged in user, give "me"
        if (userId === undefined) userId = "me";

        return new Promise((resolve, reject) => {
            window.gapi.client.gmail.users.messages
                .list({
                    userId: userId,
                    labelIds: ["INBOX"],
                    q: searchTerm,
                    pageToken: nextPage
                })
                .then(function (response) {
                    setNextPage(response.result.nextPageToken);
                    resolve(response.result.messages);
                });
        });
    }

    // Call to API to get data about the attachment 
    async function getAttachmentData(messageID, parts){
        var attachId = parts.body.attachmentId;
        var request = window.gapi.client.gmail.users.messages.attachments
            .get({
                'id': attachId,
                'messageId': messageID,
                'userId': 'me'
            });
        return request;
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
            attachmentName: "null",
            attachment: "",
            headers: {},
            id: "null",
            snippet: "null",
            threadId: "null",
            date: "",
        };

        return new Promise((resolve, reject) => {
            window.gapi.client.gmail.users.messages
                .get({
                    userId: "me",
                    id: messageId,
                })
                .then(function (response) {
                    //console.log(response.result);


                    // We need to actually iterate through the email parts and see what they are and properly assign them 
                    var partsCounter;
                    if (
                        !!response.result.payload.parts &&
                        response.result.payload.parts.length > 1
                    ) {
                        // Iterate through all the message parts and check if there is a file name, and check MimeType to assign correctly  
                        for (partsCounter = 0; partsCounter < response.result.payload.parts.length; partsCounter++) {
                            
                            // There are many different MIME Types for attachments, just check if filename exists, if true, we have a file
                            if (response.result.payload.parts[partsCounter].filename) {
                                message.attachmentName = 
                                    response.result.payload.parts[partsCounter].filename;

                                //Need to check for mime type so download works correctly
                                var mimeTypeCheck = response.result.payload.parts[partsCounter].mimeType;

                                //Must build correct .attachment format for download function
                                var MessageData = getAttachmentData(messageId, response.result.payload.parts[partsCounter]);
                                MessageData.then(function (result){
                                    message.attachment = 'data:'+mimeTypeCheck+';base64,'+result.result.data;
                                });
                            }
                            //We still need to properly assign part to correct piece of email based on mime type
                            if (response.result.payload.parts[partsCounter].mimeType == "text/html") {
                                message.bodyHTML = decodeBase64HTML(
                                    response.result.payload.parts[partsCounter].body.data
                                );
                            }
                            if (response.result.payload.parts[partsCounter].mimeType == "text/plain") {
                                message.bodyText = decodeBase64HTML(
                                    response.result.payload.parts[partsCounter].body.data
                                );
                            }
                        }

                    // If message only has one (1) part, properly assign its data to corresponding piece 
                    } else if (
                        !!response.result.payload.body &&
                        !!response.result.payload.body.data
                    ) {

                        switch (response.result.payload.mimeType) {
                            case ("text/plain"):
                                message.bodyText = decodeBase64HTML(
                                    response.result.payload.body.data
                                );
                                break;

                            case ("text/html"):
                                message.bodyHTML = decodeBase64HTML(
                                    response.result.payload.body.data
                                );
                                break;
                        }


                        // Checks if HTML was put in body.data
                        if (
                            message.bodyText
                                .substr(0, 10)
                                .toLowerCase()
                                .includes("html")
                        ) {
                            message.bodyHTML = message.bodyText;
                        }
                    } else {
                        console.log(
                            "Failed getting message body for:",
                            response.result
                        );
                    }

                    // Adds snippet for preview
                    if (response.result.snippet) {
                        message.snippet = response.result.snippet;
                    }

                    if (response.result.threadId)
                        message.threadId = response.result.threadId;

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
                        if (header.name === "Date") {
                            message.date = header.value;
                        }
                    });
                    message.headers = headers;

                    message.id = response.result.id;
                    resolve(message);
                });

        });
    }

    async function getMessages() {
        // To get userId of logged in user, give "me"
        return new Promise(async (resolve, reject) => {
            let messageIds = await getMessagesIds("me");
            let messages = [];
            for (var i = 0; i < messageIds.length; i++) {
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

    async function getLatestMessagesIds(userId) {
        // To get userId of logged in user, give "me"
        if (userId === undefined) userId = "me";

        return new Promise((resolve, reject) => {
            window.gapi.client.gmail.users.messages
                .list({
                    userId: userId,
                    labelIds: ["INBOX"],
                })
                .then(function (response) {
                    setNextPage(response.result.nextPageToken);
                    resolve(response.result.messages);
                });
        });
    }

    function decodeBase64(data) {
        return atob(data);
    }

    function ScrollCheck() {
        var tbodyElement = document.getElementById("InboxDisplay");

        if (tbodyElement.getBoundingClientRect().bottom.toString().includes(640)) {
            LoadEmails();
        }
        console.log(tbodyElement.getBoundingClientRect().bottom);
    }

    function LoadEmails() {
        if (displayedEmails.length + 20 < loadedEmails.length) {
            var emailsToBeDisplayed = loadedEmails.slice(0, displayedEmails.length + 20)
            displayedEmailsRef.current = emailsToBeDisplayed
            setDisplayedEmails(emailsToBeDisplayed);
        } else {
            getMessages().then((emails) => {
                loadedEmailsRef.current = emails;
                setLoadedEmails(emails);

                var emailsToBeDisplayed = emails.slice(0, displayedEmails.length + 20);
                displayedEmailsRef = emailsToBeDisplayed;
                setDisplayedEmails(emails.slice(emailsToBeDisplayed));
            });
        }
    }

    async function refreshInbox() {
        var promise = new Promise(async (resolve, reject) => {
            let messageIds = await getLatestMessagesIds("me");
            let newEmails = [];
            for (var i = 0; i < 10; i++) {
                try {
                    var alreadyLoaded = false;
                    loadedEmailsRef.current.forEach(loadedEmail => {
                        if (loadedEmail.id == messageIds[i].id) {
                            alreadyLoaded = true;
                        }
                    });
    
                    if (!alreadyLoaded) {
                        newEmails.push(getMessage(messageIds[i].id));
                    }
                } catch {
                    console.log("Failed on ", messageIds[i].id);
                }
            }

            Promise.all(newEmails).then((values) => {
                resolve(values);
            });
        }).then((newEmails) => {
            if (newEmails.length > 0) {
                newEmails.forEach(newEmail => {
                    loadedEmailsRef.current.unshift(newEmail);
                    displayedEmailsRef.current.unshift(newEmail);
                });

                console.log("New emails processed:");
                console.log(newEmails);
    
                setLoadedEmails(loadedEmailsRef.current);
                setDisplayedEmails(displayedEmailsRef.current);
            }
        });
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

    function toggleCreateEmailModal() {
        setCreateEmailModalIsOpen(!createEmailModalIsOpen);
    }

    function handelSubmit(event){
        getMessages();
        event.preventDefault();
    }

    function handelReset(event) {
        setSearchTerm(null);
        getMessages();
        event.preventDefault();
    }

    function Search() {
        return (
            <div>
                <form onSubmit={(e) => handelSubmit(e)}>
                    <input
                        type="text"
                        value={searchTerm}
                        onBlur={(e) => setSearchTerm(e.target.value)}
                    />
                    <input type="submit" value="Submit" />
                    <button type="button" onClick={(e) => handelReset(e)}>
                        Reset
                    </button>
                </form>
            </div>
        );
    }

    return (
        <>
            <button id="create_email" onClick={toggleCreateEmailModal}>
                Compose Email
            </button>
            <Search />
            <CreateEmailModal
                isOpen={createEmailModalIsOpen}
                toggle={toggleCreateEmailModal}
            />
            <div class="tableFixHead" onScroll={ScrollCheck}>
                <Table id="InboxDisplay">
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
                        {displayedEmails.map((email) => {
                            return <InboxEmailRow key={email.id} message={email} />;
                        })}
                    </tbody>
                </Table>
            </div>
            {displayedEmails.length == 0 && (
                <div style={{ "text-align": "center" }}>
                    <Spinner color="primary" />
                </div>
            )}
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

    const [replyEmailModalIsOpen, setReplyEmailModalIsOpen] = useState(false);
    function toggleReplyEmailModal() {
        setReplyEmailModalIsOpen(!replyEmailModalIsOpen);
    }
    const [forwardEmailModalIsOpen, setForwardEmailModalIsOpen] = useState(
        false
    );
    function toggleForwardEmailModal() {
        setForwardEmailModalIsOpen(!forwardEmailModalIsOpen);
    }

    function setupReply() {
        setModalIsOpen(false);
        setReplyEmailModalIsOpen(true);
        console.log("Should be replying");
    }

    function setupForward() {
        setModalIsOpen(false);
        setForwardEmailModalIsOpen(true);
        console.log("Should be forwarding");
    }

    function downloadAttachment() {
        let dataBase64Rep = props.message.attachment.replace(/-/g, '+').replace(/_/g, '/')
        var attachmentForDownload = document.createElement("a");
        attachmentForDownload.href = dataBase64Rep;
        attachmentForDownload.download = props.message.attachmentName;
        attachmentForDownload.click();
    }

    let from = props.message.from.split(" <")[0];
    if (from.length > 30) {
        from = from.substring(0, 30) + "...";
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
                <td>{props.message.snippet}</td>
            </tr>
            <ViewEmailModal
                modalIsOpen={modalIsOpen}
                toggleModalOpen={toggleModalOpen}
                email={props.message}
                replyFunction={setupReply}
                forwardFunction={setupForward}
                downloadFunction={downloadAttachment}
            />
            <CreateEmailModal
                isOpen={forwardEmailModalIsOpen}
                toggle={toggleForwardEmailModal}
                forward={true}
                forwardMessage={props.message}
            />
            <CreateEmailModal
                isOpen={replyEmailModalIsOpen}
                toggle={toggleReplyEmailModal}
                reply={true}
                replyMessage={props.message}
            />
        </>
    );
}

function ViewEmailModal(props) {
    // Modal docs https://reactstrap.github.io/components/modals/
    // console.log(props.email);

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
                <b>Date:</b> {props.email.date}
                <br />
                <b>Subject:</b> {props.email.subject}
                <br />
                {props.email.attachmentName !== "null" && (
                    <div><b>Attachment: </b>{props.email.attachmentName} <br />
                        <Button color="success" onClick={props.downloadFunction}>
                            Download Attachment
                        </Button>{" "}
                    </div>
                )}
                <hr />
                {props.email.bodyHTML !== "null" && (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: props.email.bodyHTML,
                        }}
                    />
                )}
                {props.email.bodyHTML === "null" && (
                    <div>{props.email.bodyText}</div>
                )}
                <br />
            </ModalBody>
            <ModalFooter>
                <Button color="primary" onClick={props.replyFunction}>
                    Reply
                </Button>{" "}
                <Button color="primary" onClick={props.forwardFunction}>
                    Forward
                </Button>{" "}
                <Button color="secondary" onClick={props.toggleModalOpen}>
                    Cancel
                </Button>
            </ModalFooter>
        </Modal>
    );
}

function CreateEmailModal(props) {
    return (
        <Modal isOpen={props.isOpen} toggle={props.toggle} id="emailPopupModal">
            <ModalHeader toggle={props.toggle}>Create Email</ModalHeader>
            <ModalBody>
                <EmailComposition
                    toggle={props.toggle}
                    reply={props.reply}
                    replyMessage={props.replyMessage}
                    forward={props.forward}
                    forwardMessage={props.forwardMessage}
                />
            </ModalBody>
        </Modal>
    );
}

export default InboxPage;