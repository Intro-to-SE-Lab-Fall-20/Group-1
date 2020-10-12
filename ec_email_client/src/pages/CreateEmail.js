import React, { useEffect, useState } from "react";
import { renderToString } from "react-dom/server";
import { Editor } from "@tinymce/tinymce-react";
import Alert from "react-bootstrap/Alert";
import "./CreateEmail.css";

class EmailComposition extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            recipient: "",
            subject: "",
            message: "",
            cc: "",
            date: new Date(),
            file: "",
            file64: "",
        };

        // Formats fields if it is a reply
        if (this.props.reply) {
            let recipientField = this.props.replyMessage.from.split("<")[1];
            recipientField = recipientField.substring(
                0,
                recipientField.length - 1
            );

            this.state = {
                recipient: recipientField,
                subject: "Re: " + this.props.replyMessage.subject,
                message: "",
                cc: "",
                date: new Date(),
            };
        }

        // Formats fields if it is a forward
        if (this.props.forward) {
            this.state = {
                recipient: "",
                subject: "FW: " + this.props.forwardMessage.subject,
                message: "",
                cc: "",
                date: new Date(),
            };

            // Puts cursor at top of message box instead of bottom beneath the reply message.
            setTimeout(() => {
                let textBox = document.getElementsByTagName("textarea")[0];
                textBox.focus();
                textBox.selectionEnd = 0;
            }, 500);
        }
    }

    // All funcitons to handle changes
    onRecipientChange(event) {
        this.setState({ recipient: event.target.value });
    }

    onSubjectChange(event) {
        this.setState({ subject: event.target.value });
    }

    onCCChange(event) {
        this.setState({ cc: event.target.value });
    }

    onMessageChange(event) {
        this.setState({ message: event.target.value });
    }

    onEditorChange(content, editor) {
        console.log(content);
        // this.setState({ message: content });
    }

    onFileChange(event) {
        //Only update to file if initializing, not cancelling attachment
        if (event.target.value.length != 0) {
            this.setState({ file: event.target.files[0] });
            let file1 = event.target.files[0];
            if (this.validateAttachment(file1) == false) {
                event.target.value = "";
            }

            //Encode Attachment to base 64
            this.getBase64(file1, (result) => {
                var file64a = result;
                var file64b = result.split("base64,")[1];
                //console.log(file64);
                this.setState({ file64: file64b });
            });
        }
        //No file was chosen, reset values
        else {
            this.setState({ file: "", file64: "" });
            event.target.value = "";
        }
    }

    //Need to keep original file data, but also must encode to send
    getBase64(file, cb) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            cb(reader.result);
        };
        reader.onerror = function (error) {
            console.log("Error: ", error);
        };
    }

    //Testing that file size is under 25MB
    validateAttachment(fileTest) {
        //List of invalid files types as defined by google
        var forbiddenFileTypes = [
            "ade",
            "adp",
            "apk",
            "appx",
            "appxbundle",
            "bat",
            "cab",
            "chm",
            "cmd",
            "com",
            "cpl",
            "dll",
            "dmg",
            "exe",
            "hta",
            "ins",
            "isp",
            "iso",
            "jar",
            "js",
            "jse",
            "lib",
            "lnk",
            "mde",
            "msc",
            "msi",
            "msix",
            "msixbundle",
            "msp",
            "mst",
            "nsh",
            "pif",
            "ps1",
            "scr",
            "sct",
            "shb",
            "sys",
            "vb",
            "vbe",
            "vbs",
            "vxd",
            "wsc",
            "wsf",
            "wsh",
        ];
        if (fileTest.size > 25000000) {
            alert("Attachments cannot exceed 25MB");
            this.setState({ file: "", file64: "" });
            return false;
        }

        var fileExt = fileTest.name.split(".")[1];
        if (forbiddenFileTypes.includes(fileExt)) {
            alert("Invalid File Type. Attachment removed.");
            this.setState({ file: "", file64: "" });
            return false;
        }

        return true;
    }

    //JS Fetch API to send the form data
    handleSubmit(event) {
        event.preventDefault();
        //Must encode subject line
        const utf8Subject = `=?utf-8?B?${Buffer.from(
            this.state.subject
        ).toString("base64")}?=`;

        let threadId = null;
        //PICK UP here

        let messageContent = document
            .getElementsByTagName("iframe")[3]
            .contentWindow.document.getElementById("tinymce").innerHTML;

        //Split the multiple recipients's (if there are multiple) and change commas to tags
        //This solution works if a gmail address goes first???
        var toSend = this.state.recipient.replace(",", ", ");
        var CCs = this.state.cc.replace(",", ", ");

        // TODO: Possible make content editable div to render HTML? Or maybe just display reply email below the text are as a div
        // https://stackoverflow.com/questions/4705848/rendering-html-inside-textarea

        // Could just make all newLines be <br /> or something?

        var messageParts = [
            `To: ${toSend}`,
            `CC: ${CCs}`,
            "Content-Type: text/html; charset=utf-8",
            "MIME-Version: 1.0",
            `Subject: ${utf8Subject}`,
            "",
            messageContent,
        ];

        // If reply
        if (this.props.reply) {
            let tempSubject = `=?utf-8?B?${Buffer.from(
                `${utf8Subject}`
            ).toString("base64")}?=`;

            let inReplyTo = this.props.replyMessage.headers["Message-Id"];

            let references = inReplyTo;
            if (this.props.replyMessage.headers["References"]) {
                references = `${inReplyTo},${this.props.replyMessage.headers["References"]}`;
            }

            threadId = this.props.replyMessage.threadId;

            messageParts = [
                `To: ${toSend}`,
                `CC: ${CCs}`,
                "Content-Type: text/html; charset=utf-8",
                "MIME-Version: 1.0",
                `Subject: ${tempSubject}`,
                `In-Reply-To: ${inReplyTo}`,
                `Reply-To: ${this.props.replyMessage.to}`,
                `References: ${references}`,
                "",
                messageContent,
            ];
        }

        // If forward
        if (this.props.forward) {
            let tempSubject = `=?utf-8?B?${Buffer.from(
                `${utf8Subject}`
            ).toString("base64")}?=`;

            messageParts = [
                `To: ${toSend}`,
                `CC: ${CCs}`,
                "Content-Type: text/html; charset=utf-8",
                "MIME-Version: 1.0",
                `Subject: ${tempSubject}`,
                "",
                messageContent,
            ];
        }

        // TODO: See if adding an attachment to a reply messes it up??

        //If the email has an attachment, it needs to use the multipart structure
        if (this.state.file && this.state.file != "") {
            messageParts = [
                `Content-Type: multipart/mixed; boundary="foo_bar_baz"`,
                "MIME-Version: 1.0",
                `To: ${toSend}`,
                `CC: ${CCs}`,
                `Subject: ${utf8Subject}`,
                "",

                "--foo_bar_baz",
                "Content-Type: text/html; charset=utf-8",
                "MIME-Version: 1.0",
                "Content-Transfer-Encoding: 7bit",
                messageContent,

                "--foo_bar_baz",
                `Content-Type: ${this.state.file.type}`,
                "MIME-Version: 1.0",
                "Content-Transfer-Encoding: base64",
                `Content-Disposition: attachment; filename="${this.state.file.name}"`,
                this.state.file64,
                "--foo_bar_baz",
            ];
        }

        const message = messageParts.join("\n");

        // The body needs to be base64url encoded.
        const encodedMessage = Buffer.from(message)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        window.gapi.client.gmail.users.messages
            .send({
                userId: "me",
                resource: {
                    raw: encodedMessage,
                    threadId: threadId,
                },
            })
            .then((result) => {
                if (result.status == 200) {
                    //Alert that the email sending was a success
                    alert("Message Sent Successfully");
                } else {
                    alert("Message Failed to Sent");
                }
            });

        this.clearForm();
    }

    clearForm() {
        this.setState({
            recipient: "",
            subject: "",
            message: "",
            cc: "",
            file: "",
            file64: "",
        });
        this.props.toggle();
        //Need to add function that takes user back to Inbox Page here
    }

    displayReplyEmail() {
        return (
            <div>
                <br />
                <br />
                <hr />
                <b>From: </b>
                {this.props.replyMessage.from}
                <br />
                <b>To: </b>
                {this.props.replyMessage.to}
                <br />
                <b>Date: </b>
                {this.props.replyMessage.date}
                <br />
                <b>Subject: </b>
                {this.props.replyMessage.subject}
                <br />
                <hr />
                <br />
                {this.props.replyMessage.bodyHTML != "null" && (
                    <div
                        id="replyEmailDiv"
                        dangerouslySetInnerHTML={{
                            __html: this.props.replyMessage.bodyHTML,
                        }}
                    />
                )}
                {this.props.replyMessage.bodyHTML == "null" &&
                    this.props.replyMessage.bodyText}
                <br />
            </div>
        );
    }

    displayForwardEmail() {
        return (
            <div>
                <br />
                <br />
                <hr />
                <b>From: </b>
                {this.props.forwardMessage.from}
                <br />
                <b>To: </b>
                {this.props.forwardMessage.to}
                <br />
                <b>Date: </b>
                {this.props.forwardMessage.date}
                <br />
                <b>Subject: </b>
                {this.props.forwardMessage.subject}
                <br />
                <hr />
                <br />
                {this.props.forwardMessage.bodyHTML != "null" && (
                    <div
                        id="replyEmailDiv"
                        dangerouslySetInnerHTML={{
                            __html: this.props.forwardMessage.bodyHTML,
                        }}
                    />
                )}
                {this.props.forwardMessage.bodyHTML == "null" &&
                    this.props.forwardMessage.bodyText}
                <br />
            </div>
        );
    }

    render() {
        return (
            <div className="EmailCreation">
                <h2 className="EmailHeader">Send Email</h2>

                <form id="email-form" onSubmit={this.handleSubmit.bind(this)}>
                    <div className="form-group">
                        <label>Send To: </label>
                        <br />
                        <input
                            type="email"
                            multiple
                            className="form-control"
                            value={this.state.recipient}
                            onChange={this.onRecipientChange.bind(this)}
                        />
                    </div>
                    <div className="form-group">
                        <label>CC: </label>
                        <br />
                        <input
                            type="email"
                            multiple
                            className="form-control"
                            value={this.state.cc}
                            onChange={this.onCCChange.bind(this)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Subject: </label>
                        <br />
                        <input
                            type="text"
                            className="form-control"
                            value={this.state.subject}
                            onChange={this.onSubjectChange.bind(this)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Add Attachment: </label>
                        <input
                            type="file"
                            className="form-control"
                            name="fileInput"
                            id="formAttachment"
                            onChange={this.onFileChange.bind(this)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Message: </label>
                        <br />
                        {this.props.reply == undefined &&
                            this.props.forward == undefined && (
                                <Editor
                                    apiKey="hxj846tk7ebu40f3mb6v7rjyn6dvort4mlavnl88uvld968u"
                                    id="TestEditor"
                                    init={{
                                        height: 500,
                                        menubar: false,
                                        plugins: [
                                            "advlist autolink lists link image charmap print preview anchor",
                                            "searchreplace visualblocks code fullscreen",
                                            "insertdatetime media table paste code help wordcount",
                                        ],
                                        toolbar:
                                            "undo redo | formatselect | bold italic backcolor | \
                            alignleft aligncenter alignright alignjustify | \
                            bullist numlist outdent indent | removeformat | help",
                                    }}
                                />
                            )}
                        {this.props.reply && (
                            <Editor
                                apiKey="hxj846tk7ebu40f3mb6v7rjyn6dvort4mlavnl88uvld968u"
                                id="TestEditor"
                                initialValue={renderToString(
                                    this.displayReplyEmail()
                                )}
                                init={{
                                    height: 500,
                                    menubar: false,
                                    plugins: [
                                        "advlist autolink lists link image charmap print preview anchor",
                                        "searchreplace visualblocks code fullscreen",
                                        "insertdatetime media table paste code help wordcount",
                                    ],
                                    toolbar:
                                        "undo redo | formatselect | bold italic backcolor | \
                            alignleft aligncenter alignright alignjustify | \
                            bullist numlist outdent indent | removeformat | help",
                                }}
                            />
                        )}
                        {this.props.forward && (
                            <Editor
                                apiKey="hxj846tk7ebu40f3mb6v7rjyn6dvort4mlavnl88uvld968u"
                                id="TestEditor"
                                initialValue={renderToString(
                                    this.displayForwardEmail()
                                )}
                                init={{
                                    height: 500,
                                    menubar: false,
                                    plugins: [
                                        "advlist autolink lists link image charmap print preview anchor",
                                        "searchreplace visualblocks code fullscreen",
                                        "insertdatetime media table paste code help wordcount",
                                    ],
                                    toolbar:
                                        "undo redo | formatselect | bold italic backcolor | \
                            alignleft aligncenter alignright alignjustify | \
                            bullist numlist outdent indent | removeformat | help",
                                }}
                            />
                        )}
                    </div>
                    <button type="submit" className="submit-button">
                        Send Email
                    </button>
                </form>
                <button
                    type="cancel"
                    className="cancel-button"
                    onClick={this.clearForm.bind(this)}
                >
                    Cancel
                </button>
            </div>
        );
    }
}

export default EmailComposition;
