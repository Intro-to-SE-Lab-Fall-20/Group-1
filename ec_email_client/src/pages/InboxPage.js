import React, { useEffect, useState } from "react";
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

// TODO: implement a check to see if GAPI is loaded & signed in, if not, then load and sign in

function InboxPage(props) {
    const [createEmailModalIsOpen, setCreateEmailModalIsOpen] = useState(false);
    const [loadedEmails, setLoadedEmails] = useState([]);
    const [displayedEmails, setDisplayedEmails] = useState([]);
    const [searchTerm, setSearchTerm] = useState(null);
    const [nextPage, setNextPage] = useState(null);

    useEffect(() => {
        getMessages().then((emails) => {
            setLoadedEmails(emails);
            setDisplayedEmails(emails.slice(0, displayedEmails.length + 20));
        });
    }, [searchTerm]);

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

    async function getMessage(messageId) {
        // https://developers.google.com/gmail/api/reference/rest/v1/users.messages.attachments#MessagePartBody
        // console.log("Getting specific message for " + messageId);

        let message = {
            bodyHTML: "null",
            bodyText: "null",
            from: "null",
            to: "null",
            subject: "null",
            attachmentName: "",
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
                    console.log(response.result);


                    // We need to actually iterate through the email parts and see what they are.. [1] is not always the html piece, could be attachment
                    var partsCounter;
                    if (
                        !!response.result.payload.parts &&
                        response.result.payload.parts.length > 1
                    ) {
                        // Iterate through all the message parts and check if there is a file name, and check MimeType to assign correctly  
                        for (partsCounter = 0; partsCounter < response.result.payload.parts.length; partsCounter++){
                            // There are many different MIME Types for attachments, just check if filename exists
                            if (response.result.payload.parts[partsCounter].filename){
                                message.attachmentName = 
                                response.result.payload.parts[partsCounter].filename
                            }
                            if (response.result.payload.parts[partsCounter].mimeType == "text/html"){
                                message.bodyHTML = decodeBase64HTML(
                                    response.result.payload.parts[partsCounter].body.data
                                );
                            }
                            if (response.result.payload.parts[partsCounter].mimeType == "text/plain"){
                                message.bodyText = decodeBase64HTML(
                                    response.result.payload.parts[partsCounter].body.data
                                );
                            }
                        }


                    } else if (
                        !!response.result.payload.body &&
                        !!response.result.payload.body.data
                    ) {
                        if (response.result.payload.mimeType == "text/plain") {
                            message.bodyText = decodeBase64HTML(
                                response.result.payload.body.data
                            );
                        }

                        else if (response.result.payload.mimeType == "text/html") {
                            message.bodyHTML = decodeBase64HTML(
                                response.result.payload.body.data
                            );
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

    function decodeBase64(data) {
        return atob(data);
    }

    function ScrollCheck() {
        var tbodyElement = document.getElementById("InboxDisplay");

        if (tbodyElement.getBoundingClientRect().bottom == 640) {
            LoadEmails();
        }
    }

    function LoadEmails() {
        if (displayedEmails.length + 20 < loadedEmails.length) {
            setDisplayedEmails(loadedEmails.slice(0, displayedEmails.length + 20));
        } else {
            getMessages().then((emails) => {
                setLoadedEmails(emails);
                setDisplayedEmails(emails.slice(0, displayedEmails.length + 20));
            });
        }
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
            <Search></Search>
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
            {loadedEmails.length == 0 && (
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
                <b>Attachment:</b> {props.email.attachmentName}
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
