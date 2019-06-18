const app = require("express");
const path = require("path");
const PORT = process.env.PORT || 5000;

app()
  .use(app.static(path.join(__dirname, "public")))
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => res.render("pages/index"))
  .get("/assignments", (req, res) => res.render("pages/assignments"))
  .get("/team-activities", (req, res) => res.render("pages/team-activities"))
  .get("/team-activities/09", (req, res) =>
    res.render("pages/team-activities/team-09/main")
  )
  .get("/team-activities/09/math", getMath)
  .get("/team-activities/09/math_service", sendMath)
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

function getMath(req, res) {
  let value = doMath(req.query);
  res.render("pages/team-activities/team-09/math", { value: value });
}

function sendMath(req, res) {
  let value = doMath(req.query);
  res.json({ result: value })
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


