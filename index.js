const app = require("express");
const path = require("path");
const rfb = require("./readyforbaby");
const ta = require("./team-activities");

const { check, sanitizeBody } = require("express-validator");
const PORT = process.env.PORT || 5000;

const POSTAL = {
  stamped: "Letters (Stamped)",
  metered: "Letters (Metered)",
  flats: "Large Envelopes (Flats)",
  retail: "First-Class Package Service—Retail",
};

app()
  .use('/static', app.static(path.join(__dirname, "public")))
  .use(app.urlencoded({ extended: true }))
  .use(app.json())
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => res.render("pages/index"))
  ////////// READYFORBABY ///////////
  .get("/readyforbaby", rfb.getWelcome)
  .get("/readyforbaby/signin", rfb.getSignin)
  .get("/readyforbaby/signup", rfb.getSignup)
  .get("/readyforbaby/registry", rfb.getRegistry)
  .get("/readyforbaby/categories", rfb.getCategories)
  .get("/readyforbaby/checklist", rfb.getChecklist)
  .post("/readyforbaby/addChecklistItem", rfb.addChecklistItem)
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
  .post(
    "/readyforbaby/signup",
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
    rfb.signup
  )
  /***************************** TEAM ACTIVITIES *****************************/
  ////////// TA 09 //////////
  .get("/team-activities/09", (req, res) =>
    res.render("pages/team-activities/team-09/main")
  )
  .get("/team-activities/09/math", ta.getMath)
  .get("/team-activities/09/math_service", ta.sendMath)
  ////////// TA 10 //////////
  .get("/team-activities/10", (req, res) =>
    res.render("pages/team-activities/team-10/main")
  )
  .get("/team-activities/10/getPerson", ta.getPerson)
  .post("/team-activities/10/addPerson", ta.addPerson)
  /******************************* ASSIGNMENTS *******************************/
  //////// PONDER 09 /////////
  .get("/assignments/09", (req, res) =>
    res.render("pages/assignments/09-prove/main.ejs", POSTAL)
  )
  .get("/assignments/09/get-rates", getRates)
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

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
