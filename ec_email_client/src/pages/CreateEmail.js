import React, { useEffect, useState } from "react";
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
            file: '',
            file64: ''
        };
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

    onFileChange(event) {
        this.setState({file: event.target.files[0]});
        let file1 = event.target.files[0];
        this.validateAttachment(file1);

        //Encode Attachment to base 64
        this.getBase64(file1, (result) => {
            var file64a = result;
            var file64b = result.split('base64,')[1];
            //console.log(file64);
            this.setState({file64: file64b});
        });

    }

    //Need to keep original file data, but also must encode to send
    getBase64(file, cb) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            cb(reader.result)
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
    }

    //Testing that file size is under 25MB
    validateAttachment(fileTest){
        if(fileTest.size > 25000000){
            alert("Attachments cannot exceed 25MB");
            this.setState({file: '',
                           file64: ''});
        }
    }

    //JS Fetch API to send the form data
    handleSubmit(event) {
        event.preventDefault();
        //Must encode subject line
        const utf8Subject = `=?utf-8?B?${Buffer.from(
            this.state.subject
        ).toString("base64")}?=`;

        //PICK UP here

        //Split the multiple recipients's (if there are multiple) and change commas to tags
        //This solution works if a gmail address goes first???
        var toSend = this.state.recipient.replace(",", ", ");
        var CCs = this.state.cc.replace(",", ", ");

        var messageParts = [
            `To: ${toSend}`,
            `CC: ${CCs}`,
            "Content-Type: text/html; charset=utf-8",
            "MIME-Version: 1.0",
            `Subject: ${utf8Subject}`,
            "",
            this.state.message,
        ];


        //If the email has an attachment, it needs to use the multipart structure
        if (this.state.file != "") {

            var messageParts = [
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
                this.state.message,

                "--foo_bar_baz",
                `Content-Type: ${this.state.file.type}`,
                "MIME-Version: 1.0",
                "Content-Transfer-Encoding: base64",
                `Content-Disposition: attachment; filename="${this.state.file.name}"`,
                this.state.file64,
                "--foo_bar_baz",

            ];
        }

        console.log(messageParts);

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
                },
            })
            .then((result) => {
                console.log(result);
                console.log(result.status);
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
        this.setState({ recipient: "", subject: "", message: "", cc: "", file: "", file64: ""});
        this.props.toggle();
        //Need to add function that takes user back to Inbox Page here
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
                            name="file"
                            onChange={this.onFileChange.bind(this)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Message: </label>
                        <br />
                        <textarea
                            className="form-control"
                            rows="15"
                            value={this.state.message}
                            onChange={this.onMessageChange.bind(this)}
                        />
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
