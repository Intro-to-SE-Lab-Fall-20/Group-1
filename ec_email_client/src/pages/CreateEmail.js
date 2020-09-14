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
  handleSubmit(e) {
      e.preventDefault();

      fetch('http://localhost:3002/send',{
          method: "POST",
          body: JSON.stringify(this.state),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        }).then(
        (response) => (response.json())
         ).then((response)=>{
        if (response.status === 'success'){
          alert("Message Sent."); 
          this.resetForm()
        }else if(response.status === 'fail'){
          alert("Message failed to send.")
        }
      })
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


export default EmailComposition;


