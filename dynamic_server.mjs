import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";

import { default as express } from "express";
import { default as sqlite3 } from "sqlite3";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 8000;
const root = path.join(__dirname, "public");
const templates = path.join(__dirname, "templates");

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

// GET ROUTE 1:
// Age
app.get("/age/:age", (req, res) => {

  const ageMap = {
    "18-29": "18 - 29",
    "30-44": "30 - 44",
    "45-59": "45 - 59",
    "60-up": "60",
  };

  const age = ageMap[req.params.age];

  const possibleAges = ["18-29", "30-44", "45-59", "60-up"];
  const currentIndex = possibleAges.indexOf(req.params.age);

  if (currentIndex === -1) {
    res.status(404).send("Error: Age group not found");
    return;
  }

  const prevAge = possibleAges[currentIndex - 1];
  const nextAge = possibleAges[currentIndex + 1];

  const query = `SELECT "In general, how worried are you about earthquakes?", "Have you ever experienced an earthquake?" FROM earthquake_data where "Age" = ?`;

  let promise1 = dbSelect(query, [age]);
  let promise2 = fs.promises.readFile(path.join(templates, "age.html"), "utf-8");

  Promise.all([promise1, promise2])
    .then((results) => {
      const worryMap = calculateWorry(results[0]);
      const experienceMap = calculateExperience(results[0]);

      let table_body = "";
      for (const key in worryMap) {
        if (worryMap.hasOwnProperty(key)) {
          const value = worryMap[key];
          const rowHtml = `
              <tr>
                  <td>${key}</td>
                  <td>${value}</td>
              </tr>
          `;
          table_body += rowHtml;
        }
      }

      let table_body2 = "";
      for (const key in experienceMap) {
        if (experienceMap.hasOwnProperty(key)) {
          const value = experienceMap[key];
          const rowHtml = `
              <tr>
                  <td>${key}</td>
                  <td>${value}</td>
              </tr>
          `;
          table_body2 += rowHtml;
        }
      }

      let response = results[1];
      response = response.replace("$$WORRY_MAP$$", JSON.stringify(worryMap));
      response = response.replace("$AGE_GROUP$", age);
      response = response.replace("$TABLE_DATA$", table_body);
      response = response.replace("$TABLE_DATA2$", table_body2);

      // Add "Previous" and "Next" links to the response
      response = response.replace("$PREV_LINK$", prevAge ? `/age/${prevAge}` : "#");
      response = response.replace("$NEXT_LINK$", nextAge ? `/age/${nextAge}` : "#");

      res.status(200).type("html").send(response);
    })
    .catch((err) => {
      console.log(err);
      res.status(404).send("Error: Age group not found");
    });
});


// GET ROUTE 2:
// Income
app.get("/income/:income", (req, res) => {
  const incomeMap = {
    "0-9999": "$0 to $9,999",
    "10000-24999": "$10,000 to $24,999",
    "25000-49999": "$25,000 to $49,999",
    "50000-74999": "$50,000 to $74,999",
    "75000-99999": "$75,000 to $99,999",
    "100000-124999": "$100,000 to $124,999",
    "125000-149999": "$125,000 to $149,999",
    "150000-174999": "$150,000 to $174,999",
    "175000-199999": "$175,000 to $199,999",
    "200000-up": "$200,000 and up",
  };

  const income = incomeMap[req.params.income];

  const possibleIncomes = [
    "0-9999",
    "10000-24999",
    "25000-49999",
    "50000-74999",
    "75000-99999",
    "100000-124999",
    "125000-149999",
    "150000-174999",
    "175000-199999",
    "200000-up",
  ];
 
  const currentIndex = possibleIncomes.indexOf(req.params.income);

  if (currentIndex === -1) {
    res.status(404).send("Error: Income group not found");
    return;
  }

  const prevIncome = possibleIncomes[currentIndex - 1];
  const nextIncome = possibleIncomes[currentIndex + 1];
 

  const query = `SELECT "In general, how worried are you about earthquakes?", "Have you ever experienced an earthquake?" FROM earthquake_data where "How much total combined money did all members of your HOUSEHOLD earn last year?" = ?`;

  let promise1 = dbSelect(query, [income]);
  let promise2 = fs.promises.readFile(
    path.join(templates, "income.html"),
    "utf-8"
  );
  Promise.all([promise1, promise2]).then((results) => {
    let income_group = [income];
    const worryMap = calculateWorry(results[0]);
    const experienceMap = calculateExperience(results[0]);
    let table_body = "";
    for (const key in worryMap) {
      if (worryMap.hasOwnProperty(key)) {
        const value = worryMap[key];
        const rowHtml = `
              <tr>
                  <td>${key}</td>
                  <td>${value}</td>
              </tr>
          `;
        table_body += rowHtml;
      }
    }
    let table_body2 = "";
    for (const key in experienceMap) {
      if (experienceMap.hasOwnProperty(key)) {
        const value = experienceMap[key];
        const rowHtml = `
              <tr>
                  <td>${key}</td>
                  <td>${value}</td>
              </tr>
          `;
        table_body2 += rowHtml;
      }
    }

    //let response = results[1].replace("$INCOME_GROUP$", income_group);
    let response = results[1];
    response = response.replace("$$WORRY_MAP$$", JSON.stringify(worryMap));
    response = response.replace("$INCOME_GROUP$", income_group);
    response = response.replace("$TABLE_DATA$", table_body);
    response = response.replace("$TABLE_DATA2$", table_body2);
    //console.log(response);

    // Add "Previous" and "Next" links to the response
    response = response.replace("$PREV_LINK$", prevIncome ? `/income/${prevIncome}` : "#");
    response = response.replace("$NEXT_LINK$", nextIncome ? `/income/${nextIncome}` : "#");
    res.status(200).type("html").send(response);
  })
  .catch((err) => {
    console.log(err);
    res.status(404).send("Error: Income group not found");
  });
});

// GET ROUTE 3:
// Region
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

  const possibleRegions = [
    "ne", "ma", "enc", "wnc", "sa", "esc", "wsc", "m", "p"
  ];

  const currentIndex = possibleRegions.indexOf(req.params.region);

  if (currentIndex === -1) {
    res.status(404).send("Error: Income group not found");
    return;
  }

  const prevRegion = possibleRegions[currentIndex - 1];
  const nextRegion = possibleRegions[currentIndex + 1];


  let query = `SELECT "In general, how worried are you about earthquakes?", "Have you ever experienced an earthquake?" FROM earthquake_data where "US Region" = ?`;

  let promise1 = dbSelect(query, [region]);
  let promise2 = fs.promises.readFile(
    path.join(templates, "region.html"),
    "utf-8"
  );
  Promise.all([promise1, promise2]).then((results) => {
    let region_name = [region];
    const worryMap = calculateWorry(results[0]);
    const experienceMap = calculateExperience(results[0]);
    let table_body = "";
    for (const key in worryMap) {
      if (worryMap.hasOwnProperty(key)) {
        const value = worryMap[key];
        const rowHtml = `
              <tr>
                  <td>${key}</td>
                  <td>${value}</td>
              </tr>
          `;
        table_body += rowHtml;
      }
    }
    let table_body2 = "";
    for (const key in experienceMap) {
      if (experienceMap.hasOwnProperty(key)) {
        const value = experienceMap[key];
        const rowHtml = `
              <tr>
                  <td>${key}</td>
                  <td>${value}</td>
              </tr>
          `;
        table_body2 += rowHtml;
      }
    }

    //let response = results[1].replace("$REGION$", region_name);
    let response = results[1];
    response = response.replace("$$WORRY_MAP$$", JSON.stringify(worryMap));
    response = response.replace("$REGION$", region_name);
    response = response.replace("$TABLE_DATA$", table_body);
    response = response.replace("$TABLE_DATA2$", table_body2);
    // Add "Previous" and "Next" links to the response
    response = response.replace("$PREV_LINK$", prevRegion ? `/region/${prevRegion}` : "#");
    response = response.replace("$NEXT_LINK$", nextRegion ? `/region/${nextRegion}` : "#");
    res.status(200).type("html").send(response);
  })
  .catch((err) => {
    console.log(err);
    res.status(404).send("Error: Region not found");
  });
});

app.listen(port, () => {
  console.log("Now listening on port " + port);
});

// FUNCTION DEFINITIONS

// calculateWorry
function calculateWorry(rows) {
  let worryMap = {
    "Not at all worried": 0,
    "Not so worried": 0,
    "Somewhat worried": 0,
    "Very worried": 0,
    "Extremely worried": 0,
  };

  for (let i = 0; i < rows.length; i++) {
    const worry = rows[i]["In general, how worried are you about earthquakes?"];

    worryMap[worry] += 1;
  }

  return worryMap;
}

// calculateExperience
function calculateExperience(rows) {
  let experienceMap = {
    No: 0,
    "Yes, one or more minor ones": 0,
    "Yes, one or more major ones": 0,
  };

  for (let i = 0; i < rows.length; i++) {
    const experience = rows[i]["Have you ever experienced an earthquake?"];

    experienceMap[experience] += 1;
  }

  return experienceMap;
}
