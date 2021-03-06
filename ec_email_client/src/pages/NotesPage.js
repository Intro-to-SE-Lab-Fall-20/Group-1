import React, { useEffect, useState, useRef } from "react";
import "./InboxPage.css";
import "../App.css";
import "./CreateEmail.css";
import {
    Table,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Spinner,
} from "reactstrap";
import { Editor } from "@tinymce/tinymce-react";
const axios = require('axios').default;

// May need a handle request function or a class dedicated to making requests? Just need to handle an error/in-auth
const serverURL = "http://3.133.110.55:8000";

function NotesPage(props){
    const [noteNames, setNoteNames] = useState([]);
    const [unAuthenticated, setUnAuthenticated] = useState(false);
    const [createNoteModalIsOpen, setCreateNoteModalIsOpen] = useState(false);

    function toggleCreateNoteModal(){
        setCreateNoteModalIsOpen(!createNoteModalIsOpen);
    }

    useEffect(()=>{
        // TODO: THIS
        if (unAuthenticated){
            console.log("IS UNAUTHENTICATED. DO SOMETHING...")
            alert("User is unauthenticated or your login has expired\n\nYour page will be redirected to the login page");
            setTimeout(()=>{
                document.location.reload();
            }, 1000) 

        }

    }, [unAuthenticated])

    useEffect(()=>{
        getNoteNames()
    }, [])

    function handleNewNote(){
        getNoteNames();
    }

    function getNoteNames(){
        let data = {
            username: props.username,
            token: props.token
        }
        axios.post(serverURL + "/getNoteNames", data, { validateStatus: false }).then((result, e)=>{
            if (result.data == "UNAUTHENTICATED"){
                setUnAuthenticated(true);
                return;
            } else {
                setNoteNames(result.data);
            }
        })
    }

    return (
        <>
        <h1>EC Notes</h1>
            <button id="create_email" onClick={toggleCreateNoteModal}>
                Compose Note
            </button>
            {createNoteModalIsOpen && <CreateNoteModal isOpen={createNoteModalIsOpen} toggle={toggleCreateNoteModal} username={props.username} token={props.token} handleNewNote={handleNewNote} setUnAuthenticated={setUnAuthenticated}/>}
            <div class="tableFixHead" style={{width: "80%", left: "10%", position: "relative"}}>
                <Table id="InboxDisplay">
                    <thead>
                        <tr>
                            <td>
                                <b>Note Name</b>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        {noteNames.map((name) => {
                            return <NoteNameRow key={name} noteName={name} username={props.username} token={props.token} setUnAuthenticated={setUnAuthenticated}/>;
                        })}
                    </tbody>
                </Table>
            </div>
        </>
    );
}

function NoteNameRow(props) {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [noteText, setNoteText] = useState("");

    function toggleModal(){
        setModalIsOpen(!modalIsOpen);
    }

    function getNoteText(){
        let data = {
            username: props.username,
            token: props.token,
            noteName: props.noteName
        }
        axios.post(serverURL + "/getNoteText", data, { validateStatus: false }).then((result)=>{
            if (result.data == "UNAUTHENTICATED"){
                props.setUnAuthenticated(true);
                return;
            } else {
                setNoteText(result.data);
                toggleModal();
            }
        });
    }

    return (
        <>
            <tr onClick={getNoteText}>
                <td>
                    {props.noteName}<EditNotePage isOpen={modalIsOpen} toggle={toggleModal} noteText={noteText}  noteName={props.noteName} username={props.username} token={props.token} />
                </td>
            </tr>
        </>
    );
}

function EditNotePage(props){
    const tinyMCEConfig = {
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
    };

    const tinyMCEApiKey = "hxj846tk7ebu40f3mb6v7rjyn6dvort4mlavnl88uvld968u";

    function saveNote(){
        let noteContent = document
            .getElementsByTagName("iframe")[2].contentWindow.document.getElementById("tinymce").innerHTML;
        
        let data = {
            username: props.username,
            token: props.token,
            noteName: props.noteName,
            noteText: noteContent
        }

        axios.post(serverURL + "/updateNote", data, { validateStatus: false }).then((result)=>{
            if (result.data == "UNAUTHENTICATED"){
                props.setUnAuthenticated(true);
                return;
            } else {
                props.toggle();
            }
        })
    }

    return (
        <Modal isOpen={props.isOpen} toggle={props.toggle} id="emailPopupModal">
            <ModalHeader toggle={props.toggle}>Edit Note: {props.noteName}</ModalHeader>
            <ModalBody>
                <Editor
                    apiKey={tinyMCEApiKey}
                    initialValue={props.noteText}
                    init={tinyMCEConfig}
                />
                <br />
                <Button onClick={saveNote} >Save</Button>
            </ModalBody>
        </Modal>
    );
}

function CreateNoteModal(props){
    const [newNoteName, setNewNoteName] = useState("");
    const [errorMsg, setErrorMsg] = useState("")

    function handleChange(event){
        setNewNoteName(event.target.value);
    }

    function createNote(){
        let data = {
            username: props.username,
            token: props.token,
            noteName: newNoteName,
            noteText: ""
        }
        axios.post(serverURL + "/addNote", data, { validateStatus: false }).then((result)=>{
            if (result.data == "UNAUTHENTICATED"){
                props.setUnAuthenticated(true);
                return;
            } else if (result.data == "DUPLICATE") {
                setErrorMsg("Duplicate Note Name");
            } else {
                props.handleNewNote()
                props.toggle();
            }
        })
    }


    return (
        <Modal isOpen={props.isOpen} toggle={props.toggle} id="emailPopupModal">
            <ModalHeader >Edit Note: {props.noteName}</ModalHeader>
            <ModalBody>
                <b>Note Name:</b> <input onChange={handleChange} />
                <p style={{color:"red"}}><b>{errorMsg}</b></p>
                <br />
                <Button onClick={createNote}>Create</Button>
            </ModalBody>
        </Modal>
    )
}


export default NotesPage;