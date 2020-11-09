import Modal, {closeStyle} from 'simple-react-modal'
import React from "react";
import { Button, FormGroup, FormControl } from "react-bootstrap";
var md5 = require('md5');

 
export default class CreateAccountPopup extends React.Component{
 
    constructor(props){
        super(props)
        this.state = {
            username: '',
            password: ''
        }
    }
    
    show(){
        this.setState({show: true})
    }
    
    close(){
        this.setState({show: false})
    }


      // All funcitons to handle changes
    onUsernameChange(event) {
        this.setState({ username: event.target.value });
    }

    onPasswordChange(event) {
        this.setState({ password: event.target.value });
    }


    handleSubmit(event) {
        event.preventDefault();
        const { handleAccountCreate } = this.props;
        var hashedPassword = md5(this.state.password);
        handleAccountCreate(this.state.username, hashedPassword);

    }
 
 
  render(){
    return (
      <div>
      <Button onClick={this.show.bind(this)}>Create Account</Button>
      <Modal
      closeOnOuterClick={true}
      show={this.state.show}
      onClose={this.close.bind(this)}>
 
      <a style={closeStyle} onClick={this.close.bind(this)}>X</a>
      <div style={{fontWeight: "bold"}} >Please Enter A Username And Password To Create An Account.</div>
      <form onSubmit={this.handleSubmit.bind(this)}>      
            <div className="form-group">
                    <label>Username: </label>
                    <br />
                    <input
                        type="username"
                        className="form-control"
                        value={this.state.username}
                        onChange={this.onUsernameChange.bind(this)}
                    />
            </div>
            <div className="form-group">
                    <label>Password: </label>
                    <br />
                    <input
                        type="password"
                        className="form-control"
                        value={this.state.password}
                        onChange={this.onPasswordChange.bind(this)}
                    />
            </div>
            
            <Button block bsSize="large" type="submit">
                Create Account
            </Button>
        </form>
      </Modal>
      </div>
    )
  }
}