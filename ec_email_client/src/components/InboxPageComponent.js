import React, { useEffect, useState, useRef } from "react";
import "../pages/InboxPage.css";
import {
    Table,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Spinner,
} from "reactstrap";
import EmailComposition from "../pages/CreateEmail.js";
import { render } from "@testing-library/react";

export default class InboxPageComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            createEmailModalIsOpen: false,
            searchTerm: null,
            nextPageToken: null,
            loadedEmails: [],
            displayedEmails: [],
            refreshEnabled: true
        }

        // Binding functions to 'this' for maintaining context
        this.LoadEmails = this.LoadEmails.bind(this);
        this.ScrollCheck = this.ScrollCheck.bind(this);
        this.toggleCreateEmailModal = this.toggleCreateEmailModal.bind(this);
        this.Search = this.Search.bind(this);
        this.handelSubmit = this.handleSubmit.bind(this);
        this.handelReset = this.handleReset.bind(this);
        this.getMessages = this.getMessages.bind(this);
        this.getMessagesIds = this.getMessagesIds.bind(this);
        this.getLatestMessagesIds = this.getLatestMessagesIds.bind(this);
        this.getMessage = this.getMessage.bind(this);
        this.decodeBase64 = this.decodeBase64.bind(this);
        this.decodeBase64HTML = this.decodeBase64HTML.bind(this);
        this.refreshInbox = this.refreshInbox.bind(this);
        this.toggleCreateEmailModal = this.toggleCreateEmailModal.bind(this);
    }

    async getMessages() {
        return new Promise(async (resolve, reject) => {
            let messageIds = await this.getMessagesIds("me");
            let messages = [];
            for (var i = 0; i < messageIds.length; i++) {
                try {
                    messages.push(this.getMessage(messageIds[i].id));
                } catch {
                    console.log("Failed on ", messageIds[i].id);
                }
            }

            Promise.all(messages).then((values) => {
                resolve(values);
            });
        });
    }

    async getMessagesIds(userId) {
        // To get userId of logged in user, give "me"
        if (userId === undefined) userId = "me";

        return new Promise((resolve, reject) => {
            window.gapi.client.gmail.users.messages
                .list({
                    userId: userId,
                    labelIds: ["INBOX"],
                    q: this.state.searchTerm,
                    pageToken: this.state.nextPageToken
                })
                .then((response) => {
                    this.setState({nextPageToken: response.result.nextPageToken});
                    resolve(response.result.messages);
                });
        });
    }

    async getLatestMessagesIds(userId) {
        // To get userId of logged in user, give "me"
        if (userId === undefined) userId = "me";

        return new Promise((resolve, reject) => {
            window.gapi.client.gmail.users.messages
                .list({
                    userId: userId,
                    labelIds: ["INBOX"],
                })
                .then((response) => {
                    resolve(response.result.messages);
                });
        });
    }

    async getMessage(messageId) {
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
                .then((response) => {
                    // console.log(response.result);

                    // If it has two payload parts
                    if (
                        !!response.result.payload.parts &&
                        response.result.payload.parts.length > 1
                    ) {
                        message.bodyText = this.decodeBase64HTML(
                            response.result.payload.parts[0].body.data
                        );
                        message.bodyHTML = this.decodeBase64HTML(
                            response.result.payload.parts[1].body.data
                        );
                    } else if (
                        !!response.result.payload.body &&
                        !!response.result.payload.body.data
                    ) {
                        message.bodyText = this.decodeBase64HTML(
                            response.result.payload.body.data
                        );

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

    decodeBase64(data) {
        return atob(data);
    }

    decodeBase64HTML(data) {
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

        return this.decodeBase64(input);
    }

    ScrollCheck() {
        var tbodyElement = document.getElementById("InboxDisplay");

        if (tbodyElement.getBoundingClientRect().bottom.toString().includes(640)) {
            this.LoadEmails();
        }
        console.log(tbodyElement.getBoundingClientRect().bottom);
    }

    LoadEmails() {
        if (this.state.displayedEmails.length + 20 < this.state.loadedEmails.length) {
            var emailsToBeDisplayed = this.state.loadedEmails.slice(0, this.state.displayedEmails.length + 20)
            this.setState({displayedEmails: emailsToBeDisplayed});
        } else {
            this.getMessages().then((emails) => {
                this.setState({loadedEmails: emails});

                var emailsToBeDisplayed = emails.slice(0, this.state.displayedEmails.length + 20);
                this.setState({displayedEmails: emailsToBeDisplayed});
            });
        }
    }

    async refreshInbox() {
        if (this.state.refreshEnabled) {
            var newLoadedEmails = this.state.loadedEmails;
            var newDisplayEmails = this.state.displayedEmails;

            var promise = new Promise(async (resolve, reject) => {
                let messageIds = await this.getLatestMessagesIds("me");
                let newEmails = [];
                for (var i = 0; i < 10; i++) {
                    try {
                        var alreadyLoaded = false;
                        newLoadedEmails.forEach(loadedEmail => {
                            if (loadedEmail.id == messageIds[i].id) {
                                alreadyLoaded = true;
                            }
                        });
        
                        if (!alreadyLoaded) {
                            newEmails.push(this.getMessage(messageIds[i].id));
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
                        newLoadedEmails.unshift(newEmail);
                        newDisplayEmails.unshift(newEmail);
                    });

                    console.log("New emails processed:");
                    console.log(newEmails);
        
                    this.setState({
                        loadedEmails: newLoadedEmails,
                        displayedEmails: newDisplayEmails
                    })
                }
            });
        }
    }

    toggleCreateEmailModal() {
        this.setState({createEmailModalIsOpen: !this.state.createEmailModalIsOpen});
    }

    Search() {
        return (
            <div>
                <form onSubmit={(e) => this.handleSubmit(e)}>
                    <input
                        type="text"
                        value={this.state.searchTerm}
                        onBlur={(e) => this.setState({searchTerm: e.target.value})}
                    />
                    <input type="submit" value="Submit" />
                    <button type="button" onClick={(e) => this.handleReset(e)}>
                        Reset
                    </button>
                </form>
            </div>
        );
    }

    handleSubmit(event){
        this.getMessages().then((emails) => {
            this.setState({loadedEmails: emails});

            var emailsToBeDisplayed = emails.slice(0, this.state.displayedEmails.length + 20);
            this.setState({displayedEmails: emailsToBeDisplayed});
        });
        this.setState({refreshEnabled: false});
        event.preventDefault();
    }

    handleReset(event) {
        this.setState({searchTerm: null})
        this.getMessages().then((emails) => {
            this.setState({loadedEmails: emails});

            var emailsToBeDisplayed = emails.slice(0, this.state.displayedEmails.length + 20);
            this.setState({displayedEmails: emailsToBeDisplayed});
        });
        this.setState({refreshEnabled: true});
        event.preventDefault();
    }

    componentDidMount() {
        this.getMessages().then((emails) => {
            this.setState({loadedEmails: emails});

            this.setState({displayedEmails: emails.slice(0, this.state.displayedEmails.length + 20)});
        })

        setInterval(() => {
            this.refreshInbox();
        }, 15000);
    }

    render() {
        return (
            <>
                <button id="create_email" onClick={this.toggleCreateEmailModal}>
                    Compose Email
                </button>
                {this.Search()}
                <CreateEmailModal
                    isOpen={this.state.createEmailModalIsOpen}
                    toggle={this.toggleCreateEmailModal}
                />
                <div class="tableFixHead" onScroll={this.ScrollCheck}>
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
                            {this.state.displayedEmails.map((email) => {
                                return <InboxEmailRow key={email.id} message={email} />;
                            })}
                        </tbody>
                    </Table>
                </div>
                {this.state.displayedEmails.length == 0 && (
                    <div style={{ "text-align": "center" }}>
                        <Spinner color="primary" />
                    </div>
                )}
            </>
        );
    }
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