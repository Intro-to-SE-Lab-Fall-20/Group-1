import React from 'react';
import './CreateEmail.css';

class EmailComposition extends React.Component {
  constructor(props){
    super(props);
    this.state =  { recipient: '', 
                    subject: '', 
                    payload: '', 
                    cc: '',
                    date: new  Date()
                  };
  }

  // All funcitons to handle changes
  onRecipientChange(event) {
    this.setState({recipient: event.target.value})
  }

  onSubjectChange(event) {
    this.setState({subject: event.target.value})
  }

  onCCChange(event) {
    this.setState({cc: event.target.value})
  }

  onPayloadChange(event) {
    this.setState({payload: event.target.value})
  }

  //JS Fetch API to send the form data
  handleSubmit() {
      console.log("Handle submit place holder");
  }

  clearForm(){
    this.setState({ recipient: '', 
                    subject: '', 
                    payload: '', 
                    cc: ''
                  })
  }

  render(){
     return(
       <div className="EmailCreation">
       <h2 className="EmailHeader">Send Email</h2>

       <form id="contact-form" onSubmit={this.handleSubmit.bind(this)} method="POST">
        <div className="form-group">
            <label htmlFor="name">Send To: </label><br />
            <input type="email" className="form-control" aria-describedby="emailHelp" value={this.state.email} onChange={this.onRecipientChange.bind(this)} />
        </div>
        <div className="form-group">
            <label htmlFor="name">CC: </label><br />
            <input type="email" className="form-control" aria-describedby="emailHelp" value={this.state.cc} onChange={this.onCCChange.bind(this)} />
        </div>
        <div className="form-group">
            <label htmlFor="exampleInputEmail1">Subject: </label><br />
            <input type="text" className="form-control" value={this.state.subject} onChange={this.onSubjectChange.bind(this)} />
        </div>
        <div className="form-group">
          <label>Add Attachment: </label>
          <input type="file" className="form-control" value={this.state.name} />
        </div>
        <div className="form-group">
            <label htmlFor="message">Message: </label><br />
            <textarea className="form-control" rows="15" value={this.state.message} onChange={this.onPayloadChange.bind(this)} />
        </div>
        <button type="submit" className="submit-button">Send Email</button>
        <button type="cancel" className="cancel-button">Cancel</button>
        </form>
        </div>
     );
  }

}



function createMessage(
        fromName,
        fromEmail,
        toName,
        toEmail,
        subject,
        messageContent
    ) {
        // https://developers.google.com/gmail/api/reference/rest/v1/users.messages#Message
        // https://whatismyipaddress.com/email-header
        // Look at this sample: https://github.com/googleapis/google-api-nodejs-client/blob/master/samples/gmail/send.js
        // Fix https://stackoverflow.com/questions/30590988/failed-sending-mail-through-google-api-with-javascript

        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString(
            "base64"
        )}?=`;
        const messageParts = [
            `From: ${fromName} <${fromEmail}>`,
            `To: ${toName} <${toEmail}>`,
            "Content-Type: text/html; charset=utf-8",
            "MIME-Version: 1.0",
            `Subject: ${utf8Subject}`,
            "",
            messageContent,
        ];
        const message = messageParts.join("\n");

        // The body needs to be base64url encoded.
        const encodedMessage = Buffer.from(message)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        return encodedMessage;
    }

    async function sendMessage(encodedMessage) {
        // Look at this sample: https://github.com/googleapis/google-api-nodejs-client/blob/master/samples/gmail/send.js
        // Fix https://stackoverflow.com/questions/30590988/failed-sending-mail-through-google-api-with-javascript

        window.gapi.client.gmail.users.messages
            .send({
                userId: "me",
                resource: {
                    raw: encodedMessage,
                },
            })
            .then((result) => {
                console.log(result);
            });
    }

export default EmailComposition;


