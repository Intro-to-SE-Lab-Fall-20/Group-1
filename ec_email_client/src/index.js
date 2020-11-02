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
        <NotesPage username="pbell" token="g6idwqytgtp46e156ggsdhutkf9sehnbh49rfzho6c7eulgfbka3ryji154blfm1s75nnq319ygk9vcnye9sym6yx8m5mvcw9sis"/>
    </React.StrictMode>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();




