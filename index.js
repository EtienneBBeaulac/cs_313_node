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
  .get("/readyforbaby/checklist/:choice/:products" , getProducts)
  ////////// TA 09 //////////
  .get("/team-activities/09", (req, res) =>
    res.render("pages/team-activities/team-09/main")
  )
  .get("/team-activities/09/math", getMath)
  .get("/team-activities/09/math_service", sendMath)
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

/**
 * getChecklist
 * Callback function for displaying the checklist page
 */
function getChecklist(req, res) { // TODO: Make this less static, ejs it
  sendJsonWithHtml(
    req, res,
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
  let renderData = getRenderDataFor(req.params['choice']);
  sendJsonWithHtml(
    req, res,
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
    req, res,
    [
      {
        type: "main",
        name: PROJECT_PARTIALS + "/products.ejs",
        // renderData: renderData,
      },
      { type: "navbar", name: PROJECT_PARTIALS + "/normal-navbar.ejs" },
    ],
    {
      url: "/readyforbaby/checklist/" + req.params['choice'] +  '/' + req.params['products'],
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
