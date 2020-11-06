var mysql = require('mysql');
const https = require('https');
const http = require('http');
var cors = require("cors");
var fs = require('fs');
var express = require('express');
const bodyParser = require('body-parser').json();
const { connect } = require('http2');

function getCon(){
    var con = mysql.createConnection({
        host: "localhost",
        user: "testUser",
        password: "newpassword",
        database: "ecEmail"
    });
    
    con.connect(function(err) {
        if (err) throw err;
        // console.log("Connected!");
    });

    return con
}

const app = express();
app.use(cors());



function attemptToAddNewUser(username, passwordHash){
    return new Promise(async (resolve,reject)=>{
        if (await checkUserExits(username)){
            resolve("DUPLICATE");
        } else {
            let query = `INSERT INTO users (username, passwordHash) VALUES (?, ?)`;
            query = mysql.format(query,[username, passwordHash]);
            let con = getCon();
            con.query(query, (error, result)=>{
                resolve("ADDED");
                con.destroy();
            });
        }
    })
}

function getNotesForUser(username){
    return new Promise((resolve,reject)=>{
        let query = `SELECT * FROM notes WHERE username = ?`;
        query = mysql.format(query,[username]);
        let con = getCon();
        con.query(query, (error, result)=>{
            resolve(result);
            con.destroy();
        })
    })
}

function checkUserExits(username){
    return new Promise((resolve,reject)=>{
        let query = `SELECT username FROM users WHERE username = ?`;
        query = mysql.format(query,[username]);
        let con = getCon();
        con.query(query, (error, result)=>{
            if (result.length > 0){
                resolve(true)
            } else{
                resolve(false)
            }
            con.destroy();
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
                let query = `INSERT INTO notes (noteName, username, noteText) VALUES (?,?,?);`;
                query = mysql.format(query,[noteName, username, noteText]);
                let con = getCon();
                con.query(query, (error, result)=>{
                    resolve("ADDED");   
                    con.destroy();
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
                let query = `UPDATE notes SET noteText = ? WHERE username = ? AND noteName = ?;`
                query = mysql.format(query,[noteText, username, noteName]);
                let con = getCon();
                con.query(query, (error, result)=>{
                    if (error) console.log(error)
                    resolve("UPDATED")   ;
                    con.destroy();         
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
        let con = getCon();
        con.query(query, (error, result)=>{
            resolve(result) 
            con.destroy();           
        })
    })
}

function getNoteNames(username){
    return new Promise (async (resolve, reject)=>{
        if (await checkUserExits(username)){
            let query = `SELECT noteName FROM notes WHERE username = ?;`
            query = mysql.format(query,[username]);
            let con = getCon();
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
                con.destroy();
            })
        } else{
            resolve("USER NOT EXIST");
        }
    })
}

function getNoteText(username, noteName){
    return new Promise (async (resolve, reject)=>{
        if (await checkUserExits(username)){
            let query = `SELECT noteText FROM notes WHERE username = ? AND noteName = ?;`
            query = mysql.format(query,[username, noteName]);
            let con = getCon();
            con.query(query, (error, result)=>{
                if (result.length > 0){
                    resolve(result[0].noteText);
                } else{
                    resolve("NOTE DOESN'T EXIST");
                }
                con.destroy();
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
        
        let query = `REPLACE INTO tokens (username, token, expires) values(?,?,?)`
        query = mysql.format(query,[username, token, date]);
        let con = getCon();
        con.query(query, (error, result)=>{
            if (error) console.log(error);
            resolve(token);
            con.destroy();
        });
    });
};

function loginIsCorrect(username, passwordHash){
    return new Promise((resolve, reject)=>{
        let query = `SELECT * FROM users WHERE username = ?;`;
        query = mysql.format(query,[username]);
        let conn = getCon();
        conn.query(query, (error, result)=>{
            if (result.length > 0 && result[0].passwordHash == passwordHash){
                resolve(true);
            } else {
                resolve(false);
            }
            conn.destroy();
        })
    })
}

function authenticateToken(username, token){
    return new Promise((resolve, reject)=>{
        let con = getCon();
        if (username == undefined || token == undefined){
            resolve(false);
        }else {
            let query = `SELECT * FROM tokens WHERE username = ?;`
            query = mysql.format(query,[username]);
            con.query(query, (error, result)=>{
                if (result.length > 0) {
                    let currentTime = new Date();
                    // Have to add +0000 to convert to global time
                    let expireTime = new Date(result[0].expires + " +0000");
                    if (result[0].token == token && currentTime < expireTime) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } else {
                    resolve(false);
                }
                con.destroy();
            });
        }
    });
};

// Handles too many login attempts. return of 'False' means too many attempts
// Curretly only protects against login attempts on existing users
function checkLoginAttempts(username, isFail){
    return new Promise(async (resolve, reject)=>{
        let con = getCon();
        // If user doesn't exist, resolve true or else it would say too many login attemps
        let userExists = await checkUserExits(username);
        if (!userExists){
            resolve(true);
            return;
        }

        let query = "SELECT * FROM loginAttempts WHERE username = ?;"
        query = mysql.format(query, [username]);
        con.query(query, (error, result)=>{
            // If first fail, add the attempt
            if (error) console.log(error);
            if (isFail && result.length == 0){
                let time = new Date();
                query = "INSERT INTO loginAttempts (username, attempts, lastTime) VALUES (?,?,?);"
                query = mysql.format(query, [username, 1, time]);
                con.query(query, (error, result)=>{
                    if (error) console.log(error);
                    resolve(true);
                    con.destroy();
                })
            // If login is correct
            } else if (!isFail){
                // Check if they are within fail limit
                if (result.length != 0){
                    let expireTime = new Date(result[0].lastTime)
                    expireTime = expireTime.setMinutes(expireTime.getMinutes() + 1);
                    expireTime = new Date(expireTime);
                    let currentTime = new Date();
                    // Time hasn't expired and had 3+ attempts
                    if (currentTime < expireTime && result[0].attempts >= 3){
                        resolve(false);
                    // Time hasnt expire but haven't had 3 failed attempts
                    } else if (currentTime < expireTime && result[0].attempts < 3){
                        query = "DELETE FROM loginAttempts WHERE username = ?;"
                        query = mysql.format(query, [username]);
                        con.query(query, (error, result)=>{
                            resolve(true)
                            con.destroy();
                        });
                    // The time is expired, delete record
                    } else if (currentTime > expireTime){
                        query = "DELETE FROM loginAttempts WHERE username = ?;"
                        query = mysql.format(query, [username]);
                        con.query(query, (error, result)=>{
                            resolve(true)
                            con.destroy();
                        });
                    }
                } else {
                    resolve(true);
                }
                // Else delete any existing record
            } else if (isFail && result.length != 0){
                let expireTime = new Date(result[0].lastTime)
                expireTime = expireTime.setMinutes(expireTime.getMinutes() + 1);
                expireTime = new Date(expireTime);
                let currentTime = new Date();
                
                // Is expired - delete and TRUE
                if (currentTime > expireTime){
                    query = "DELETE FROM loginAttempts WHERE username = ?;"
                    query = mysql.format(query, [username]);
                    con.query(query, (error, result)=>{
                        resolve(true)
                        con.destroy();
                    });
                }
                // Not expired and but less than 3 - increment and TRUE
                if (currentTime < expireTime && result[0].attempts < 3){
                    query = "UPDATE loginAttempts SET attempts = ? WHERE username = ? ;"
                    query = mysql.format(query, [result[0].attempts +1, username]);
                    con.query(query, (error, result)=>{
                        if (error) console.log(error);
                        resolve(true)
                        con.destroy();
                    });
                }
                // Not expired and is 3 - FALSE
                if (currentTime < expireTime && result[0].attempts >= 3){
                    resolve(false)
                }
            }
        })
    })



    // Log time of first fail
    // If failed 3 times in last 1 minute(s), return 'tooManyAttempts'
    // If failed less than 3 times in last 1 minute and failed again, increment fail
    // If success, delete record


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
    let token = req.body.token;

    let isAuth = await authenticateToken(username, token);
    if (!isAuth){
        res.status(401).send("UNAUTHENTICATED");
        return;
    }

    let response = await addNewNote(username, noteName, noteText);
    res.send(response)
});

app.post("/updateNote", bodyParser, async(req, res)=>{
    let username = req.body.username;
    let noteName = req.body.noteName;
    let noteText = req.body.noteText;
    let token = req.body.token;

    let isAuth = await authenticateToken(username, token);
    if (!isAuth){
        res.status(401).send("UNAUTHENTICATED");
        return;
    }

    let response = await updateNote(username, noteName, noteText);
    res.send(response)
})

app.post("/getNoteNames", bodyParser, async(req, res)=>{
    let username = req.body.username;
    let token = req.body.token;

    let isAuth = await authenticateToken(username, token);
    if (!isAuth){
        res.status(401).send("UNAUTHENTICATED");
        return;
    }

    let response = await getNoteNames(username);
    res.send(response)
})

app.post("/getNoteText", bodyParser, async(req, res)=>{
    let username = req.body.username;
    let noteName = req.body.noteName;
    let token = req.body.token;

    let isAuth = await authenticateToken(username, token);
    if (!isAuth){
        res.status(401).send("UNAUTHENTICATED");
        return;
    }

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

    let correctLogin = await loginIsCorrect(username, passwordHash);
    let notTooManyAttempts = await checkLoginAttempts(username, !correctLogin);

    if (correctLogin && notTooManyAttempts){
        let token = await getNewTokenForUsername(username);
        res.send(token);
    } else if (correctLogin && !notTooManyAttempts){
        res.send("TOO MANY ATTEMPTS");
    } else if (!correctLogin && notTooManyAttempts){
        res.send("Incorrect login");
    } else if (!correctLogin && !notTooManyAttempts){
        res.send("TOO MANY ATTEMPTS");
    }
})

app.listen(8000);
