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
  const ageMap = {
    "18-29": "18 - 29",
    "30-44": "30 - 44",
    "45-59": "45 - 59",
    "60-up": "60",
  };

  const age = ageMap[req.params.age];

  const query = `SELECT "Age" FROM earthquake_data`;

  let promise1 = dbSelect(query);

  promise1.then((rows) => {
    res.status(200).json(rows);
  });
});
app.get("/income/:income", (req, res) => {
  const incomeMap = {
    "0-9999": "0 - $9,999",
    "10000-24999": "$10,000 - $24,999",
    "25000-49999": "$25,000 - $49,999",
    "50000-74999": "$50,000 - $74,999",
    "75000-99999": "$75,000 - $99,999",
    "100000-124999": "$100,000 - $124,999",
    "125000-149999": "$125,000 - $149,999",
    "150000-174999": "$150,000 - $174,999",
    "200000-up": "$200,000 and up",
  };

  const income = incomeMap[req.params.income];

  const query = `SELECT "How much total combined money did all members of your HOUSEHOLD earn last year?" FROM earthquake_data`;

  let promise1 = dbSelect(query);

  promise1.then((rows) => {
    res.status(200).json(rows);
  });
});

app.get("/region/:region", (req, res) => {
  // un-abbreviate regions to match the data
  const regionMap = {
    ne: "New England",
    ma: "Middle Atlantic",
    enc: "East North Central",
    wnc: "West North Central",
    sa: "South Atlantic",
    esc: "East South Central",
    wsc: "West South Central",
    m: "Mountain",
    p: "Pacific",
  };

  const region = regionMap[req.params.region];

  let query = `SELECT "US Region" FROM earthquake_data`;

  let promise1 = dbSelect(query);

  promise1.then((rows) => {
    res.status(200).json(rows);
  });
});

app.listen(port, () => {
  console.log("Now listening on port " + port);
});
