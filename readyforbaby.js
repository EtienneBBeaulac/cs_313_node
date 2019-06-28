const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const db = require("./db");
const { validationResult } = require("express-validator");
const PROJECT_PAGES = "pages/project/pages";
const PROJECT_PARTIALS = "views/pages/project/partials";

// // TODO: Store in database
// const CHECKLIST_ITEMS = [
//   {
//     title: "Feeding",
//     subtitle: "Breastmilk or Formula?",
//     choices: ["Breastmilk", "Formula"],
//   },
//   {
//     title: "Sleeping",
//     subtitle: "",
//     choices: ["", ""],
//   },
//   {
//     title: "Diapering",
//     subtitle: "",
//     choices: ["", ""],
//   },
//   {
//     title: "Clothing",
//     subtitle: "",
//     choices: ["", ""],
//   },
//   {
//     title: "Hygiene",
//     subtitle: "",
//     choices: ["", ""],
//   },
//   {
//     title: "Travel",
//     subtitle: "",
//     choices: ["", ""],
//   },
// ];

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
};

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
};

exports.signin = function signIn(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
  }
  db.User.findOne({ email: req.body.email }).exec(function(err, result) {
    if (!err) {
      console.log(result);
      comparePassword(req.body.password, result.password, (err, match) => {
        if (match) res.json({ cookie: "test cookie" });
        else res.status(400).send({ message: "Invalid login" });
      });
    } else {
      console.log(err);
      // res.json({ err: "Something bad happened." });
    }
  });
};

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
};

exports.signup = function signup(req, res) {
  console.log(req.body);
  let first = req.body.first;
  let last = req.body.last;
  let email = req.body.email;
  let password = req.body.password;
  let cpassword = req.body.cpassword;

  if (
    first === undefined ||
    first === "" ||
    last === undefined ||
    last === "" ||
    email === undefined ||
    email === "" ||
    password === undefined ||
    password === "" ||
    cpassword === undefined ||
    cpassword === "" ||
    password !== cpassword
  )
    return;

  db.User.findOne({ email: req.body.email }).exec(function(err, result) {
    if (!err) {
      if (!result) {
        cryptPassword(password, function(err, pw) {
          let newUser = db.User({
            name: { first: first, last: last },
            email: email,
            password: pw,
          });
          newUser.save(function(err) {
            if (err) res.json(err);
            else res.json({ status: "Success!" });
          });
        });
      } else {
        res.status(400).send({ message: "Email already exists." });
      }
    } else {
      console.log(err);
      // res.json({ err: "Something bad happened." });
    }
  });
};

exports.getRegistry = function(req, res) {
  sendJsonWithHtml(
    req,
    res,
    [
      {
        type: "main",
        name: PROJECT_PARTIALS + "/registry.ejs",
        // renderData: { title: res.title },
      },
      { type: "navbar", name: PROJECT_PARTIALS + "/normal-navbar.ejs" },
    ],
    {
      url: "/readyforbaby/registry",
    }
  );
};

exports.getCategories = function(req, res) {
  sendJsonWithHtml(
    req,
    res,
    [
      {
        type: "main",
        name: PROJECT_PARTIALS + "/categories.ejs",
      },
      { type: "navbar", name: PROJECT_PARTIALS + "/normal-navbar.ejs" },
    ],
    {
      url: "/readyforbaby/categories",
    }
  );
};

/**
 * getChecklist
 * Callback function for displaying the checklist page
 */
exports.getChecklist = function getChecklist(req, res) {
  db.ChecklistItem.find({}, "title", (err, data) => {
    sendJsonWithHtml(
      req,
      res,
      [
        {
          type: "main",
          name: PROJECT_PARTIALS + "/checklist.ejs",
          renderData: { checklistItems: data },
        },
        { type: "navbar", name: PROJECT_PARTIALS + "/normal-navbar.ejs" },
      ],
      {
        url: "/readyforbaby/checklist",
      }
    );
  });
};

exports.addChecklistItem = function(req, res) {
  if (
    !req.body.title ||
    req.body.title === "" ||
    !req.body.subtitle ||
    req.body.subtitle === "" ||
    !req.body.choices ||
    req.body.choices.length === 0 ||
    !req.body.choices[0].title ||
    !req.body.choices[0].description
  ) {
    res.status(400).send({ message: "Can't add checklist item" });
    return;
  }

  db.ChecklistItem.find({ title: req.body.title }, (err, data) => {
    if (!data || data.length === 0) {
      let checklistItem = db.ChecklistItem({
        title: req.body.title,
        subtitle: req.body.subtitle,
        choices: req.body.choices,
      });
      checklistItem.save(err => {
        if (err) res.json(err);
        else res.json({ status: "Success!" });
      });
    }
  });
};

/**
 * getChoice
 * Callback function for displaying the choice page
 */
exports.getChoice = function getChoice(req, res) {
  // let renderData = getRenderDataFor(req.params["choice"]);
  db.ChecklistItem.find(
    { title: uppercase(req.params["choice"]) },
    (err, data) => {
      if (!data || data.length === 0) return;
      sendJsonWithHtml(
        req,
        res,
        [
          {
            type: "main",
            name: PROJECT_PARTIALS + "/choice.ejs",
            renderData: data[0],
          },
          { type: "navbar", name: PROJECT_PARTIALS + "/normal-navbar.ejs" },
        ],
        {
          url: "/readyforbaby/checklist/" + req.params.choice,
        }
      );
    }
  );
};

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
};

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

// /**
//  * getRenderDataFor
//  * Gets the data choice to render to ejs
//  */
// function getRenderDataFor(choice) {
//   for (let i = 0; i < CHECKLIST_ITEMS.length; i++)
//     if (CHECKLIST_ITEMS[i].title.toLowerCase() === choice)
//       return CHECKLIST_ITEMS[i];
// }

/**
 * getFileAsString
 * Gets a file as string
 * @param {string} filepath Path of the file to be read
 */
function getFileAsString(filepath) {
  return fs.readFileSync(filepath).toString("utf8");
}

function cryptPassword(password, callback) {
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return callback(err);

    bcrypt.hash(password, salt, function(err, hash) {
      return callback(err, hash);
    });
  });
}

function comparePassword(plainPass, hashword, callback) {
  bcrypt.compare(plainPass, hashword, function(err, isPasswordMatch) {
    return err == null ? callback(null, isPasswordMatch) : callback(err);
  });
}

function uppercase(str, i = 0) {
  return str.charAt(i).toUpperCase() + str.slice(1);
}
