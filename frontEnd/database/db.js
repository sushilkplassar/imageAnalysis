let mysql = require("mysql");

let connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// let connection = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "asdf@123"
//   // database: process.env.DB_NAME
// });

connection.connect();

module.exports = connection;
