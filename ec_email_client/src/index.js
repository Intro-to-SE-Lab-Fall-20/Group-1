import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import NotesPage from "./pages/NotesPage";
import * as serviceWorker from "./serviceWorker";
import "bootstrap/dist/css/bootstrap.min.css";

ReactDOM.render(
    <React.StrictMode>
        <App />
        {/* <NotesPage username="pbell" token="qsto2iwsljl7fbpqfxf9me2cb2cst6fyrx1zilkk0xjdl8m6cg5i5urwycctuew3d0khq1rhwrqum87gpgc8inxk2pk9ughdyr2e"/> */}
    </React.StrictMode>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();




