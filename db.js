const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var uristring =
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  "mongodb://heroku_6vq3ldh8:7or386dvlcuui1mth13th7lrs1@ds243607.mlab.com:43607/heroku_6vq3ldh8";

mongoose.connect(uristring, { useNewUrlParser: true }, function(err, res) {
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

let userSchema = new Schema({
  name: {
    first: { type: String, trim: true, require: true },
    last: { type: String, trim: true, require: true },
  },
  email: { type: String, trim: true, require: true },
  password: { type: String, trim: true, require: true },
});

let User = mongoose.model("User", userSchema);

let checklistItemSchema = new Schema({
  title: { type: String, trim: true, require: true },
  subtitle: { type: String, trim: true, require: true },
  choices: [
    {
      title: { type: String, trim: true, require: true },
      description: { type: String, trim: true, require: true },
    },
  ],
});

let ChecklistItem = mongoose.model("ChecklistItem", checklistItemSchema);

let productSchema = new Schema({
  title: { type: String, trim: true, require: true },
  description: { type: String, trim: true, require: true },
  link: { type: String, trim: true, require: true },
  imageLink: { type: String, trim: true, require: true },
});

let Product = mongoose.model("Product", productSchema);

module.exports = {
  Person,
  User,
  ChecklistItem,
  Product,
};
