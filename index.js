const app = require("express");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const PORT = process.env.PORT || 5000;

const PROJECT_PAGES = "pages/project/pages";
const PROJECT_PARTIALS = "views/pages/project/partials";

// TODO: Store in database
const CHECKLIST_ITEMS = [
  {
    title: "Feeding",
    subtitle: "Breastmilk or Formula?",
    choices: ["Breastmilk", "Formula"],
  },
  {
    title: "Sleeping",
    subtitle: "",
    choices: ["", ""],
  },
  {
    title: "Diapering",
    subtitle: "",
    choices: ["", ""],
  },
  {
    title: "Clothing",
    subtitle: "",
    choices: ["", ""],
  },
  {
    title: "Hygiene",
    subtitle: "",
    choices: ["", ""],
  },
  {
    title: "Travel",
    subtitle: "",
    choices: ["", ""],
  },
];

const POSTAL = {
  stamped: "Letters (Stamped)",
  metered: "Letters (Metered)",
  flats: "Large Envelopes (Flats)",
  retail: "First-Class Package Service—Retail",
};

app()
  .use(app.static(path.join(__dirname, "public")))
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => res.render("pages/index"))
  ////////// READYFORBABY ///////////
  .get("/readyforbaby", (req, res) =>
    res.render(PROJECT_PAGES + "/main", { url: "/readyforbaby" })
  )
  .get("/readyforbaby/checklist", getChecklist)
  .get("/readyforbaby/checklist/:choice", getChoice)
  .get("/readyforbaby/checklist/:choice/:products", getProducts)
  /***************************** TEAM ACTIVITIES *****************************/
  ////////// TA 09 //////////
  .get("/team-activities/09", (req, res) =>
    res.render("pages/team-activities/team-09/main")
  )
  .get("/team-activities/09/math", getMath)
  .get("/team-activities/09/math_service", sendMath)
  /******************************* ASSIGNMENTS *******************************/
  //////// PONDER 09 /////////
  .get("/assignments/09", (req, res) =>
    res.render("pages/assignments/09-prove/main.ejs", POSTAL)
  )
  .get("/assignments/09/get-rates", getRates)
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

/**
 * getChecklist
 * Callback function for displaying the checklist page
 */
function getChecklist(req, res) {
  // TODO: Make this less static, ejs it
  sendJsonWithHtml(
    req,
    res,
    [
      { type: "main", name: PROJECT_PARTIALS + "/checklist.ejs" },
      { type: "navbar", name: PROJECT_PARTIALS + "/normal-navbar.ejs" },
    ],
    {
      url: "/readyforbaby/checklist",
    }
  );
}

/**
 * getChoice
 * Callback function for displaying the choice page
 */
function getChoice(req, res) {
  let renderData = getRenderDataFor(req.params["choice"]);
  sendJsonWithHtml(
    req,
    res,
    [
      {
        type: "main",
        name: PROJECT_PARTIALS + "/choice.ejs",
        renderData: renderData,
      },
      { type: "navbar", name: PROJECT_PARTIALS + "/normal-navbar.ejs" },
    ],
    {
      url: "/readyforbaby/checklist/" + req.params.choice,
    }
  );
}

function getProducts(req, res) {
  sendJsonWithHtml(
    req,
    res,
    [
      {
        type: "main",
        name: PROJECT_PARTIALS + "/products.ejs",
        // renderData: renderData,
      },
      { type: "navbar", name: PROJECT_PARTIALS + "/normal-navbar.ejs" },
    ],
    {
      url:
        "/readyforbaby/checklist/" +
        req.params["choice"] +
        "/" +
        req.params["products"],
    }
  );
}

/**
 * sendJsonWithHtml
 * Sends html as json
 */
function sendJsonWithHtml(req, res, files, data) {
  console.log(req.url);
  let html = {};

  files.forEach(file => {
    filepath = path.resolve(__dirname, file.name);
    // read html file into json if no render data is available
    let fileString = getFileAsString(filepath);
    if (!file.renderData) html[file.type] = fileString;
    else html[file.type] = ejs.render(fileString, file.renderData);
  });
  // console.log({ html: html, data: data });
  res.json({ html: html, data: data });
}

/**
 * getRenderDataFor
 * Gets the data choice to render to ejs
 */
function getRenderDataFor(choice) {
  for (let i = 0; i < CHECKLIST_ITEMS.length; i++)
    if (CHECKLIST_ITEMS[i].title.toLowerCase() === choice)
      return CHECKLIST_ITEMS[i];
}

/**
 * getFileAsString
 * Gets a file as string
 * @param {string} filepath Path of the file to be read
 */
function getFileAsString(filepath) {
  return fs.readFileSync(filepath).toString("utf8");
}

function getRates(req, res) {
  let query = req.query;
  let prices = {
    stamped: { 1: 0.55, 2: 0.7, 3: 0.85, 3.5: 1 },
    metered: { 1: 0.5, 2: 0.65, 3: 0.8, 3.5: 0.95 },
    flats: {
      1: 1,
      2: 1.15,
      3: 1.3,
      4: 1.45,
      5: 1.6,
      6: 1.75,
      7: 1.9,
      8: 2.05,
      9: 2.2,
      10: 2.35,
      11: 2.5,
      12: 2.65,
      13: 2.8,
    },
    retail: { 3.3: 0.187 },
  };
  console.log(query);
  console.log(query.postal);
  console.log(prices[query.postal]);
  let weightRange =
    Math.trunc(query.weight) == query.weight
      ? query.weight
      : parseInt(query.weight) + 1;
  if (query.postal === "stamped" || query.postal === "metered") {
    if (weightRange > 3) weightRange = 3.5;
  } else if (query.postal === "retail") {
    weightRange = 3.3;
  }
  console.log(weightRange);
  console.log(prices[query.postal][weightRange]);
  let renderData = {
    weight: query.weight,
    postal: POSTAL[query.postal],
    rate: prices[query.postal][weightRange],
  };
  sendJsonWithHtml(
    req,
    res,
    [
      {
        type: "result",
        name: "views/pages/assignments/09-prove/rate.ejs",
        renderData: renderData,
      },
    ],
    {}
  );
  // res.json({ rate: prices[query.postal][Math.trunc(query.weight) + 1] });
  // if (query.postal === "stamped") {
  // } else if (query.postal === "metered") {
  // } else if (query.postal === "flats") {
  // } else if (query.postal === "retail") {
  // } else {
  // }
}

function getMath(req, res) {
  let value = doMath(req.query);
  res.render("pages/team-activities/team-09/math", { value: value });
}

function sendMath(req, res) {
  let value = doMath(req.query);
  res.json({ result: value });
}

function doMath(query) {
  let operand = query.operand;
  let num1 = parseFloat(query.num1);
  let num2 = parseFloat(query.num2);
  let value = 0;

  if (operand === "add") {
    value = num1 + num2;
  } else if (operand === "sub") {
    value = num1 - num2;
  } else if (operand === "mult") {
    value = num1 * num2;
  } else if (operand === "div") {
    value = num1 / num2;
  }
  return value;
}
