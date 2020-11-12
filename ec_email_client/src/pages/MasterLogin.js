import React, { useEffect, useState } from "react";
import { Button, FormGroup, FormControl } from "react-bootstrap";
import "./MasterLogin.css";
import Modal from "../components/CreateAccountPopup.js"
var md5 = require('md5');

export default class MasterLogin extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: ''
        };
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
        const { handleMasterLog } = this.props;
        var hashedPassword = md5(this.state.password);
        // TODO Change 'this.state.password' to hashedPassword
        // Currently keeping it as password so group members can test with 'pbell' login. 
        // After we have create account loading hashed password in the DB we can change this to send the hashed password to the login function
        handleMasterLog(this.state.username, hashedPassword);

    }
   
    render() {
        return (
                <div className="MasterLoginDiv">
                    <h1> EC Application Login </h1>

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

                        <Button block bssize="large" type="submit">
                            Login
                        </Button>
                        <br />
                        {/* Create account link will go here */ }
                    </form>
                    
                </div>
        );
    }
}




