import React, { useEffect, useState } from "react";
import { withRouter } from "react-router";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "./CreateEmail.css";


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
/*
  initClient(){
    console.log("HIT INIT CLIENT");

    // Client ID and API key from the Developer Console
    var CLIENT_ID = "461282014069-keh5gggejqgqrrv2gtoir1ilppot3mjq.apps.googleusercontent.com";

    var API_KEY = "AIzaSyDoP8Mj4b34VsEJm7AXNneq93cd3z2dpsk";

    // Array of API discovery doc URLs for APIs used by the quickstart
    var DISCOVERY_DOCS = [
        "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
    ];

    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
    var SCOPES =
        "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.modify";

    window.gapi.client
            .init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES,
            })
  }
*/
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
  handleSubmit(event) {
    //this.initClient();
    event.preventDefault();
    //Must encode subject line
    const utf8Subject = `=?utf-8?B?${Buffer.from(this.state.subject).toString(
          "base64"
    )}?=`;

    const messageParts = [
        `To: <${this.state.recipient}>`,
        "Content-Type: text/html; charset=utf-8",
        "MIME-Version: 1.0",
        `Subject: ${utf8Subject}`,
        "",
        this.state.payload,
    ];
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
        });

    /*console.log(this.state);
    console.log("TESTING ... ");

    var ToSend = createMessage("test from Name", "jawatters1@gmail.com", this.recipient, this.recipient, this.subject, this.payload);
    sendMessage(ToSend);*/
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

       <form id="email-form" onSubmit={this.handleSubmit.bind(this)}>
        <div className="form-group">
            <label>Send To: </label><br />
            <input type="email" className="form-control" value={this.state.recipient} onChange={this.onRecipientChange.bind(this)} />
        </div>
        <div className="form-group">
            <label>CC: </label><br />
            <input type="email" className="form-control"  value={this.state.cc} onChange={this.onCCChange.bind(this)} />
        </div>
        <div className="form-group">
            <label>Subject: </label><br />
            <input type="text" className="form-control" value={this.state.subject} onChange={this.onSubjectChange.bind(this)} />
        </div>
        <div className="form-group">
          <label>Add Attachment: </label>
          <input type="file" className="form-control" value={this.state.name} />
        </div>
        <div className="form-group">
            <label>Message: </label><br />
            <textarea className="form-control" rows="15" value={this.state.message} onChange={this.onPayloadChange.bind(this)} />
        </div>
        <button type="submit" className="submit-button">Send Email</button>
        <button type="cancel" className="cancel-button">Cancel</button>
        </form>
        </div>
     );
  }

}

export default withRouter(EmailComposition);

/*

       <div className="EmailCreation">
       <h2 className="EmailHeader">Send Email</h2>

       <form id="email-form" onSubmit={this.handleSubmit}>
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
*/
