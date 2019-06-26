const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
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

exports.getWelcome = function getWelcome(req, res) {
  sendJsonWithHtml(
    req,
    res,
    [
      { type: "main", name: PROJECT_PARTIALS + "/welcome-main.ejs" },
      { type: "navbar", name: PROJECT_PARTIALS + "/welcome-navbar.ejs" },
    ],
    { url: "/readyforbaby" }
  );
}

exports.getSignin = function getSignin(req, res) {
  sendJsonWithHtml(
    req,
    res,
    [
      { type: "main", name: PROJECT_PARTIALS + "/signin.ejs" },
      { type: "navbar", name: PROJECT_PARTIALS + "/normal-navbar.ejs" },
    ],
    { url: "/readyforbaby/signin" }
  );
}

exports.signin = function signIn(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
  }
  // User.create({
  //   username: req.body.username,
  //   password: req.body.password
  // }).then(user => res.json(user));
  let body = req.body;
}

exports.getSignup = function getSignup(req, res) {
  sendJsonWithHtml(
    req,
    res,
    [
      { type: "main", name: PROJECT_PARTIALS + "/signup.ejs" },
      { type: "navbar", name: PROJECT_PARTIALS + "/normal-navbar.ejs" },
    ],
    { url: "/readyforbaby/signup" }
  );
}

/**
 * getChecklist
 * Callback function for displaying the checklist page
 */
exports.getChecklist = function getChecklist(req, res) {
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
exports.getChoice = function getChoice(req, res) {
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

exports.getProducts = function getProducts(req, res) {
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
  console.log(req.query);
  let html = {};

  files.forEach(file => {
    filepath = path.resolve(__dirname, file.name);
    // read html file into json if no render data is available
    let fileString = getFileAsString(filepath);
    if (!file.renderData) html[file.type] = fileString;
    else html[file.type] = ejs.render(fileString, file.renderData);
  });
  // console.log({ html: html, data: data });
  if (req.query.r && req.query.r == 0) {
    res.json({ html: html, data: data });
  } else {
    res.render(PROJECT_PAGES + "/main", {
      url: data.url,
      main: html.main,
      navbar: html.navbar,
    });
  }
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