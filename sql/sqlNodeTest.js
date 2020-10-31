var mysql = require('mysql');
const https = require('https');
const http = require('http');
var fs = require('fs');
var express = require('express');
const bodyParser = require('body-parser').json();
const { connect } = require('http2');

var con = mysql.createConnection({
    host: "localhost",
    user: "testUser",
    password: "newpassword",
    database: "ecEmail"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});


const app = express();




function attemptToAddNewUser(username, passwordHash){
    return new Promise(async (resolve,reject)=>{
        let query = `SELECT * FROM users WHERE username = "${username}"`;

        if (await checkUserExits(username)){
            resolve("DUPLICATE");
        } else {
            query = `INSERT INTO users (username, passwordHash) VALUES ("${username}", "${passwordHash}")`;
            con.query(query, (error, result)=>{
                resolve("ADDED");
            });
        }
    })
}

function getNotesForUser(username){
    return new Promise((resolve,reject)=>{
        let query = `SELECT * FROM notes WHERE username = "${username}"`;
        con.query(query, (error, result)=>{
            resolve(result);
        })
    })
}

function checkUserExits(username){
    return new Promise((resolve,reject)=>{
        let query = `SELECT username FROM users WHERE username = "${username}"`;
        con.query(query, (error, result)=>{
            if (result.length > 0){
                resolve(true)
            } else{
                resolve(false)
            }
        })
    })
}

function addNewNote(username, noteName, noteText){
    return new Promise(async (resolve,reject)=>{
        let existingNotes = await getNotesForUser(username);
        let noDuplicates = true;

        if (await checkUserExits(username)){
            // Makes sure no duplicate name
            existingNotes.forEach(note=>{
                if (note.noteName == noteName){
                    resolve("DUPLICATE");
                    noDuplicates = false;
                }
            })

            if (noDuplicates){
                let query = `INSERT INTO notes (noteName, username, noteText) VALUES ("${noteName}","${username}","${noteText}");`;
                con.query(query, (error, result)=>{
                    resolve("ADDED");   
                })
            }
        } else {
            resolve("USER NOT EXIST");
        }
    })

}

function updateNote(username, noteName, noteText){
    return new Promise(async (resolve,reject)=>{
        let existingNotes = await getNotesForUser(username);
        let noteExists = false;

        if (await checkUserExits(username)){
            existingNotes.forEach(note=>{
                if (note.noteName == noteName){
                    noteExists = true;
                }
            })
    
            if (!noteExists){
                resolve("NOTE DOESN'T EXIST");
            } else {
                let query = `UPDATE notes SET noteText = "${noteText}" WHERE username = "${username}" AND noteName = "${noteName}";`
                con.query(query, (error, result)=>{
                    resolve("UPDATED")            
                })
            }    
        } else {
            resolve("USER NOT EXIST")
        }
    });
}

function healthCheck(){
    return new Promise((resolve, reject)=>{
        let query = "SHOW DATABASES;"
        con.query(query, (error, result)=>{
            resolve(result)            
        })
    })
}

function getNoteNames(username){
    return new Promise (async (resolve, reject)=>{
        if (await checkUserExits(username)){
            let query = `SELECT noteName FROM notes WHERE username = "${username}";`
            con.query(query, (error, result)=>{
                if (result.length > 0){
                    let names = [];
                    result.forEach(item =>{
                        names.push(item.noteName);
                    });
                    resolve(names);
                } else{
                    resolve([]);
                }
            })
        } else{
            resolve("USER NOT EXIST");
        }
    })
}

function getNoteText(username, noteName){
    return new Promise (async (resolve, reject)=>{
        if (await checkUserExits(username)){
            let query = `SELECT noteText FROM notes WHERE username = "${username}" AND noteName = "${noteName}";`
            con.query(query, (error, result)=>{
                if (result.length > 0){
                    resolve(result[0].noteText);
                } else{
                    resolve("NOTE DOESN'T EXIST");
                }
            })
        } else{
            resolve("USER NOT EXIST");
        }
    })
}

function createNewToken(){
    var rand = function() {
        return Math.random().toString(36).substr(2); 
    };

    let value = "";
    while (value.length < 100){
        value = value + rand();
    }

    return value.substr(0,100);
}

function getNewTokenForUsername(username){
    return new Promise((resolve, reject)=>{
        let token = createNewToken();
        
        // Converts date to datetime for SQL, gives token 1 hour until expires
        let date = new Date();
        date.setHours(date.getHours() + 1);
        date = date.toISOString().slice(0, 19).replace('T', ' ');
        
        let query = `REPLACE INTO tokens (username, token, expires) values("${username}","${token}","${date}")`
        con.query(query, (error, result)=>{
            resolve(token);
        });
    })


}

function loginIsCorrect(username, passwordHash){
    return new Promise((resolve, reject)=>{
        let query = `SELECT * FROM users WHERE username = "${username}";`;
        con.query(query, (error, result)=>{
            if (result.length > 0 && result[0].passwordHash == passwordHash){
                resolve(true);
            } else {
                resolve(false);
            }
        })
    })
}

function authenticateToken(username, token){
    return new Promise((resolve, reject)=>{
        let query = `SELECT * FROM tokens WHERE username = "${username}";`
        console.log(query)
        con.query(query, (error, result)=>{
            if (result.length > 0) {
                let currentTime = new Date();
                let expireTime = new Date(result[0].expires);
                console.log(currentTime);
                console.log(expireTime);
                if (result[0].token == token && currentTime < expireTime) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } else {
                resolve(false);
            }
        });
    })
}

// ----------- Endpoints -----------

app.post("/addUser", bodyParser, async (req, res) => {
    let username = req.body.username;
    let passwordHash = req.body.passwordHash;
    let response = await attemptToAddNewUser(username, passwordHash);
    res.send(response);
});

app.post("/addNote", bodyParser, async(req, res)=>{
    let username = req.body.username;
    let noteName = req.body.noteName;
    let noteText = req.body.noteText;
    let response = await addNewNote(username, noteName, noteText);
    res.send(response)
})

app.post("/updateNote", bodyParser, async(req, res)=>{
    let username = req.body.username;
    let noteName = req.body.noteName;
    let noteText = req.body.noteText;
    let response = await updateNote(username, noteName, noteText);
    res.send(response)
})

app.post("/getNoteNames", bodyParser, async(req, res)=>{
    let username = req.body.username;
    let response = await getNoteNames(username);
    res.send(response)
})

app.post("/getNoteText", bodyParser, async(req, res)=>{
    let username = req.body.username;
    let noteName = req.body.noteName;
    let response = await getNoteText(username, noteName);
    res.send(response)
})

// Health Check: makes sure there are DBs available and sends 200, otherwise sends 500
app.get("/health", bodyParser, async(req, res)=>{
    let result = await healthCheck();
    if (result.length > 0){
        res.send();
    } else {
        res.status(500).send();
    }
})

app.post("/signIn", bodyParser, async(req, res)=>{
    let username = req.body.username;
    let passwordHash = req.body.passwordHash;

    if (await loginIsCorrect(username, passwordHash)){
        let token = await getNewTokenForUsername(username);
        res.send(token);
    } else {
        res.send("Incorrect login");
    }
})

app.post("/testAuth", bodyParser, async (req, res)=>{
    let username = req.body.username;
    let token = req.body.token;

    res.send(await authenticateToken(username, token));

})


app.listen(8000);       
// http.createServer(app).listen(8080, function(){
//     console.log("Server is listening on port 8080...");
// });
