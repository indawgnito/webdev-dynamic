import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";

import { default as express } from "express";
import { default as sqlite3 } from "sqlite3";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 8000;
const root = path.join(__dirname, "public");
const template = path.join(__dirname, "templates");

const db = new sqlite3.Database(
  path.join(__dirname, "db", "earthquake_data.db"),
  sqlite3.OPEN_READONLY,
  (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the earthquake database.");
  }
);

function dbSelect(query, params) {
  let p = new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
  return p;
}

let app = express();
app.use(express.static(root));

app.get("/age/:age", (req, res) => {
  const age = req.params.age;

  let query = `SELECT * FROM earthquake_data`;
});

app.get("/income/:income", (req, res) => {
  const income = req.params.income;

  let query = `SELECT * FROM earthquake_data`;
});

app.get("/region/:region", (req, res) => {
  const region = req.params.region;

  let query = `SELECT * FROM earthquake_data`;
});

app.listen(port, () => {
  console.log("Now listening on port " + port);
});
