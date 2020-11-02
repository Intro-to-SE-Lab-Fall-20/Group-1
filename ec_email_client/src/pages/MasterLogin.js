import React, { useEffect, useState } from "react";
import { Button, FormGroup, FormControl } from "react-bootstrap";
import "./MasterLogin.css";

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
        handleMasterLog(this.state.username, this.state.password);

    }
   
    render() {
        return (
                <div className="MasterLoginDiv">
                    <h1> Master Login Page </h1>

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
                            Login
                        </Button>
                    </form>
                    
                </div>
        );
    }
}




