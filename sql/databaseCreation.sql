CREATE DATABASE ecEmail;
USE ecEmail;

CREATE TABLE users
(
    username varchar(25) NOT NULL,
    passwordHash varchar(200),
    UNIQUE (username),
    PRIMARY KEY (username)
);
CREATE TABLE notes
(
    noteName varchar(100),
    username varchar(25),
    noteText varchar(5000),
    FOREIGN KEY (username) REFERENCES users (username)
);
CREATE TABLE tokens
(
    username varchar(25) UNIQUE,
    token varchar(100),
    expires DATETIME,
    FOREIGN KEY (username) REFERENCES users (username)
);


CREATE USER 'testUser'@'%' IDENTIFIED
WITH mysql_native_password BY 'newpassword';
GRANT ALL PRIVILEGES ON ecEmail.* to 'testUser'@'%';

INSERT INTO users
    (username, passwordHash)
VALUES
    ("pbell", "passwordHash123");

-- INSERT INTO users (username, email, id, pubKey) VALUES ("PatricksMSU", "pjb183@msstate.edu", "114493981662126316478", "testPubForMSU");
-- INSERT INTO users (username, email, id, pubKey) VALUES ("PatricksGMail", "mewingfugur@gmail.com", "113467843674295288430", "testPubForGMail");

-- INSERT INTO chats (chatId, chatName, founderId, users) VALUES ("2136482312", "FirstChat", "114493981662126316478", "114493981662126316478,113467843674295288430");
-- INSERT INTO chats (chatId, chatName, founderId, users) VALUES ("-1060544732", "myChat", "114493981662126316478", "114493981662126316478");

-- INSERT INTO messages(id, chatId, messageId, messageContent) VALUES ("114493981662126316478", "2136482312", 1, "FirstMessage");
-- INSERT INTO messages(id, chatId, messageId, messageContent) VALUES ("113467843674295288430", "2136482312", 2, "SecoondMessage");