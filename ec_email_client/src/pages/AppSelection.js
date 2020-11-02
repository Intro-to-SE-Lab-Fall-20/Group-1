import React, { useEffect, useState, useRef } from "react";
import "../pages/AppSelection.css";
import { Card, Button, CardTitle, CardText, Row, Col } from 'reactstrap';

export default class AppSelection extends React.Component {
    constructor(props) {
        super(props);
    }
    handleOnClick = (selectionName) => {
        const { handleAppSelect } = this.props;
        handleAppSelect(selectionName);
    }

    render() {
        return (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Row>
                    <Col sm="6">
                        <Card body inverse 
                        style={{ backgroundColor: '#333', borderColor: '#333', width: '250px' }}>
                            <CardTitle>EC Email Client</CardTitle>
                            <CardText>Access your emails here!</CardText>
                            <Button onClick={() => this.handleOnClick("Email")}>EC {'>'} Gmail</Button>
                        </Card>
                    </Col>
                    <Col sm="6">
                        <Card body inverse 
                        style={{ backgroundColor: '#333', borderColor: '#333', width: '250px'}}>
                            <CardTitle>EC Notepad</CardTitle>
                            <CardText>Take notes here!</CardText>
                            <Button onClick={() => this.handleOnClick("Notes")}>I love notes!</Button>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    };
}