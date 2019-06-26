const app = require("express");
const path = require("path");
const rfb = require("./readyforbaby")
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var uristring =
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  "mongodb://heroku_6vq3ldh8:7or386dvlcuui1mth13th7lrs1@ds243607.mlab.com:43607/heroku_6vq3ldh8";
const { check, validationResult, sanitizeBody } = require("express-validator");
const PORT = process.env.PORT || 5000;

mongoose.connect(uristring, function(err, res) {
  if (err) {
    console.log("ERROR connecting to: " + uristring + ". " + err);
  } else {
    console.log("Succeeded connected to: " + uristring);
  }
});

let personSchema = new Schema({
  first: { type: String, trim: true },
  last: { type: String, trim: true },
  dob: { type: Date, default: Date.now },
});

let Person = mongoose.model("Person", personSchema);

const POSTAL = {
  stamped: "Letters (Stamped)",
  metered: "Letters (Metered)",
  flats: "Large Envelopes (Flats)",
  retail: "First-Class Package Service—Retail",
};

app()
  .use(app.static(path.join(__dirname, "public")))
  .use(app.urlencoded({ extended: true }))
  .use(app.json())
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => res.render("pages/index"))
  ////////// READYFORBABY ///////////
  .get("/readyforbaby", rfb.getWelcome)
  .get("/readyforbaby/signin", rfb.getSignin)
  .get("/readyforbaby/signup", rfb.getSignup)
  .get("/readyforbaby/checklist", rfb.getChecklist)
  .get("/readyforbaby/checklist/:choice", rfb.getChoice)
  .get("/readyforbaby/checklist/:choice/:products", rfb.getProducts)
  .post(
    "/readyforbaby/signin",
    [
      check("email", "Invalid email").isEmail(),
      check("password", "Invalid password").isLength({ min: 8 }),
      sanitizeBody("email")
        .trim()
        .escape(),
      sanitizeBody("password")
        .trim()
        .escape(),
    ],
    rfb.signin
  )
  /***************************** TEAM ACTIVITIES *****************************/
  ////////// TA 09 //////////
  .get("/team-activities/09", (req, res) =>
    res.render("pages/team-activities/team-09/main")
  )
  .get("/team-activities/09/math", getMath)
  .get("/team-activities/09/math_service", sendMath)
  ////////// TA 10 //////////
  .get("/team-activities/10", (req, res) =>
    res.render("pages/team-activities/team-10/main")
  )
  .get("/team-activities/10/getPerson", getPerson)
  .post("/team-activities/10/addPerson", addPerson)
  /******************************* ASSIGNMENTS *******************************/
  //////// PONDER 09 /////////
  .get("/assignments/09", (req, res) =>
    res.render("pages/assignments/09-prove/main.ejs", POSTAL)
  )
  .get("/assignments/09/get-rates", getRates)
  .listen(PORT, () => console.log(`Listening on ${PORT}`));





















function getPerson(req, res) {
  Person.find({ first: req.query.first }).exec(function(err, result) {
    if (!err) {
      res.json(result);
    } else {
      res.json({ err: "Something bad happened." });
    }
  });
  // res.json({ id: 1, first: "Test", last: "Last", date: new Date() });
}

function addPerson(req, res) {
  console.log(req.body);
  let newPerson = new Person({
    first: req.body.first,
    last: req.body.last,
    dob: new Date(),
  });
  newPerson.save(function(err) {
    if (err) res.json(err);
    else res.json({ status: "Success!" });
  });
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

  let weightRange =
    Math.trunc(query.weight) == query.weight
      ? query.weight
      : parseInt(query.weight) + 1;
  if (query.postal === "stamped" || query.postal === "metered") {
    if (weightRange > 3) weightRange = 3.5;
  } else if (query.postal === "retail") {
    weightRange = 3.3;
  }

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
