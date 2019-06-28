const db = require('./db');

exports.getPerson = function getPerson(req, res) {
  db.Person.find({ first: req.query.first }).exec(function(err, result) {
    if (!err) {
      res.json(result);
    } else {
      res.json({ err: "Something bad happened." });
    }
  });
  // res.json({ id: 1, first: "Test", last: "Last", date: new Date() });
}

exports.addPerson = function addPerson(req, res) {
  console.log(req.body);
  let newPerson = new db.Person({
    first: req.body.first,
    last: req.body.last,
    dob: new Date(),
  });
  newPerson.save(function(err) {
    if (err) res.json(err);
    else res.json({ status: "Success!" });
  });
}

exports.getMath = function getMath(req, res) {
  let value = doMath(req.query);
  res.render("pages/team-activities/team-09/math", { value: value });
}

exports.sendMath = function sendMath(req, res) {
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