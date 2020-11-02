import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import NotesPage from "./pages/NotesPage";
import * as serviceWorker from "./serviceWorker";
import "bootstrap/dist/css/bootstrap.min.css";

ReactDOM.render(
    <React.StrictMode>
        {/* <App /> */}
        <NotesPage username="pbell" token="p3uiwnyjkurxvocji4tja4g0wqgn7ttdp2kttnrcy0qymveno82fg6n3uw2qfidc4za8mrqa1kax7pmrga61fkhnizzilfve4dso"/>
    </React.StrictMode>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();




