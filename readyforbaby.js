const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const bcrypt = require("bcrypt");
const url = require("url");
const db = require("./db");
const { validationResult } = require("express-validator");
const PROJECT_PAGES = "pages/project/pages";
const PROJECT_PARTIALS = "views/pages/project/partials";
const fuzzyset = require("fuzzyset.js");

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

function search(req, res) {
  db.Product.find({}).exec((err, results) => {
    if (!err && results) {
      let matches = [];
      let search = req.query.search;
      if (!search) search = req.params.search;
      results.forEach(product => {
        if (product.title.match(RegExp(search, "gi"))) matches.push(product);
      });
      // console.log(matches)
      sendJsonWithHtml(
        req,
        res,
        [
          {
            type: "main",
            name: PROJECT_PARTIALS + "/search.ejs",
            renderData: { data: matches, title: search },
          },
          getNavbar(req),
        ],
        {
          url: "/readyforbaby/search/" + search,
        }
      );
    }
  });
}

exports.search = search;

exports.getSignin = function(req, res) {
  if (!req.session.user || !req.cookies.user_sid) {
    sendJsonWithHtml(
      req,
      res,
      [
        { type: "main", name: PROJECT_PARTIALS + "/signin.ejs" },
        getNavbar(req),
      ],
      { url: "/readyforbaby/signin" }
    );
  } else {
    res.redirect("/readyforbaby/registry");
  }
};

function signin(req, res, email = "", pw = "") {
  // console.log(req.body);
  if (email === "") email = req.body.email;
  if (pw === "") pw = req.body.pw;
  db.User.findOne({ email: req.body.email }).exec(function(err, result) {
    // console.log(result);
    if (!err && result) {
      comparePassword(req.body.password, result.password, (err, user) => {
        // console.log(user);
        if (user) {
          req.session.user = result;
          res.redirect("/readyforbaby/registry");
        } else sendError(res, "Invalid login");
      });
    } else {
      sendError(res, "Invalid login");
    }
  });
}

exports.signin = signin;

exports.getSignup = function(req, res) {
  if (!req.session.user || !req.cookies.user_sid) {
    sendJsonWithHtml(
      req,
      res,
      [
        { type: "main", name: PROJECT_PARTIALS + "/signup.ejs" },
        getNavbar(req),
      ],
      { url: "/readyforbaby/signup" }
    );
  } else {
    res.redirect("/readyforbaby");
  }
};

exports.signup = function(req, res) {
  // console.log(req.body);
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
            if (err) sendError(res, err);
            else {
              signin(req, res, email, password);
            }
          });
        });
      } else {
        sendError(res, "Email already exists.");
      }
    } else {
      sendError(res, "Unable to create account");
    }
  });
};

exports.getRegistry = function(req, res) {
  if (req.session.user && req.cookies.user_sid) {
    db.Registry.findOne({ email: req.session.user.email })
      .populate({ path: "products", model: "Product" })
      .exec((err, data) => {
        if (err) res.send(err);
        if (!data) {
          data = { email: req.session.user.email, products: [] };
        }
        sendJsonWithHtml(
          req,
          res,
          [
            {
              type: "main",
              name: PROJECT_PARTIALS + "/registry.ejs",
              renderData: { data },
            },
            getNavbar(req),
          ],
          {
            url: "/readyforbaby/registry",
          }
        );
      });
  } else {
    redirectSignin(req, res);
  }
};

exports.addToRegistry = function(req, res) {
  // console.log(req.body);
  if (req.session.user && req.cookies.user_sid) {
    db.Product.findOne({ title: req.body.product.title }).exec(
      (err, product) => {
        db.Registry.findOne({ email: req.session.user.email })
          .populate({ path: "products", model: "Product" })
          .exec((err, registry) => {
            if (err) res.send(err);
            if (!registry) {
              registry = db.Registry({
                email: req.session.user.email,
                products: [product._id],
              });
            } else {
              registry.products.push(product._id);
            }
            registry.save(err => {
              if (err) res.json(err);
              else res.json({ status: "Success!" });
            });
          });
      }
    );
  } else {
    redirectSignin(req, res);
  }
};

exports.removeRegistryItem = function(req, res){
  if (req.session.user && req.cookies.user_sid) {
    db.Registry.findOne({ email: req.session.user.email })
      .populate({ path: "products", model: "Product" })
      .exec((err, registry) => {
        if (err) res.send(err);
        registry.products.splice(parseInt(req.body.index), 1);
        registry.save(err => {
          console.log('saved')
          if (err) res.json(err);
          else res.json({status: "success"})
        })
      })
  } else {
    redirectSignin(req, res);
  }
}

exports.getCategories = function(req, res) {
  db.Category.find({}, "title link image", (err, data) => {
    if (err) res.json(err);
    for (let i = 0; i < data.length; i++)
      data[i].title = uppercase(data[i].title);
    sendJsonWithHtml(
      req,
      res,
      [
        {
          type: "main",
          name: PROJECT_PARTIALS + "/categories.ejs",
          renderData: { categories: data },
        },
        getNavbar(req),
      ],
      {
        url: "/readyforbaby/categories",
      }
    );
  });
};

exports.getCategory = function(req, res) {
  db.Category.findOne({ link: req.params.category })
    .populate({
      path: "productCategories",
      model: "ProductCategory",
      populate: { path: "products", model: "Product" },
    })
    .exec((err, data) => {
      if (data) {
        data.title = uppercase(data.title);
        for (let i = 0; i < data.productCategories.length; i++)
          data.productCategories[i].title = uppercase(
            data.productCategories[i].title
          );
        sendJsonWithHtml(
          req,
          res,
          [
            {
              type: "main",
              name: PROJECT_PARTIALS + "/products.ejs",
              renderData: data,
            },
            getNavbar(req),
          ],
          {
            url: "/readyforbaby/categories/" + req.params["category"],
          }
        );
      }
    });
};

exports.getAllCategories = function(req, res) {
  db.Category.find({}, (err, data) => {
    if (!err) res.json(data);
    else sendError(res, err);
  });
};

exports.addCategories = function(req, res) {
  let categories = [];
  for (let i = 0; i < req.body.categories.length; i++) {
    if (!req.body.categories[i]) req.body.categories[i] = [];
    let category = db.Category({
      title: req.body.categories[i].title,
      link: req.body.categories[i].link,
      image: req.body.categories[i].image,
      productCategories: req.body.categories[i].productCategories,
    });
    categories.push(category);
  }
  db.Category.collection.insert(categories, err => {
    if (err) res.json(err);
    else res.json({ status: "Success!" });
  });
};

/**
 * getChecklist
 * Callback function for displaying the checklist page
 */
exports.getChecklist = function getChecklist(req, res) {
  db.ChecklistItem.find({}, "title skip", (err, data) => {
    // console.log(data[4]);
    sendJsonWithHtml(
      req,
      res,
      [
        {
          type: "main",
          name: PROJECT_PARTIALS + "/checklist.ejs",
          renderData: { checklistItems: data },
        },
        getNavbar(req),
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
    !req.body.choices ||
    req.body.choices.length === 0
  ) {
    res.status(400).send({ message: "Can't add checklist item" });
    return;
  }

  db.ChecklistItem.find({ title: req.body.title }, (err, data) => {
    if (!data || data.length === 0) {
      if (!req.body.choices) req.body.choice = [];
      let checklistItem = db.ChecklistItem({
        title: req.body.title,
        subtitle: req.body.subtitle,
        skip: req.body.skip,
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
exports.getChecklistItem = function(req, res) {
  // let renderData = getRenderDataFor(req.params["choice"]);
  db.ChecklistItem.findOne({ title: uppercase(req.params["checklistItem"]) })
    .populate({ path: "choices", model: "Choice" })
    .exec((err, data) => {
      // console.log(data);
      if (!data) return;
      if (err) console.log(err);
      for (let i = 0; i < data.choices.length; i++)
        data.choices[i].title = uppercase(data.choices[i].title);
      sendJsonWithHtml(
        req,
        res,
        [
          {
            type: "main",
            name: PROJECT_PARTIALS + "/choice.ejs",
            renderData: data,
          },
          getNavbar(req),
        ],
        {
          url: "/readyforbaby/checklist/" + req.params.checklistItem,
        }
      );
    });
};

exports.addChoicesToChecklistItem = function(req, res) {
  if (!req.body.title || req.body.title === "") {
    res.status(400).send({ message: "Can't add choices to checklist item" });
    return;
  }
  db.ChecklistItem.findOne({ title: req.body.title }, (err, data) => {
    data.choices.push(...req.body.choices);
    data.save(err => {
      if (err) return res.send(err);
      res.json({ status: "done" });
    });
  });
};

exports.getProductCategory = function(req, res) {
  db.ProductCategory.findOne({ title: req.query.title })
    .populate({ path: "products", model: "Product" })
    .exec((err, data) => {
      if (!err) res.json(data);
    });
};

exports.getAllProductCategories = function(req, res) {
  db.ProductCategory.find({})
    .populate({ path: "products", model: "Product" })
    .exec((err, data) => {
      if (!err) res.json(data);
    });
};

exports.addProductCategory = function(req, res) {
  if (!req.body.title || req.body.title === "") {
    res.status(400).send({ message: "Can't add product category item" });
    return;
  }

  db.ProductCategory.find({ title: req.body.title }, (err, data) => {
    if (!data || data.length === 0) {
      if (!req.body.products) req.body.product = [];
      let productCategory = db.ProductCategory({
        title: req.body.title,
        description: req.body.description,
        products: req.body.products,
      });
      productCategory.save(err => {
        if (err) res.json(err);
        else res.json({ status: "Success!" });
      });
    }
  });
};

exports.addProductsToProductCategory = function(req, res) {
  if (!req.body.title || req.body.title === "") {
    res.status(400).send({ message: "Can't add product category item" });
    return;
  }
  db.ProductCategory.findOne({ title: req.body.title }, (err, data) => {
    data.products.push(...req.body.products);
    data.save(err => {
      if (err) return res.send(err);
      res.json({ status: "done" });
    });
  });
};

exports.addChoiceCategory = function(req, res) {
  if (!req.body.title || req.body.title === "") {
    res.status(400).send({ message: "Can't add product category item" });
    return;
  }

  db.Choice.find({ title: req.body.title }, (err, data) => {
    if (!data || data.length === 0) {
      if (!req.body.productCategories) req.body.productCategories = [];
      let choice = db.Choice({
        title: req.body.title,
        description: req.body.description,
        linkText: req.body.linkText,
        linkUrl: req.body.linkUrl,
        productCategories: req.body.productCategories,
      });
      choice.save(err => {
        if (err) res.json(err);
        else res.json({ status: "Success!" });
      });
    }
  });
};

exports.addProductCategoriesToChoice = function(req, res) {
  if (!req.body.title || req.body.title === "") {
    res.status(400).send({ message: "Can't add to choice" });
    return;
  }

  db.Choice.findOne({ title: req.body.title }, (err, data) => {
    data.productCategories.push(...req.body.productCategories);
    data.save(err => {
      if (err) return res.send(err);
      res.json({ status: "done" });
    });
  });
};

exports.getChoiceCategories = function(req, res) {
  // console.log(req.params);
  db.Choice.findOne({ title: req.params.choice.toLowerCase() })
    .populate({
      path: "productCategories",
      model: "ProductCategory",
      populate: { path: "products", model: "Product" },
    })
    .exec((err, data) => {
      if (!err) {
        data.title = uppercase(data.title);
        for (let i = 0; i < data.productCategories.length; i++)
          data.productCategories[i].title = uppercase(
            data.productCategories[i].title
          );
        sendJsonWithHtml(
          req,
          res,
          [
            {
              type: "main",
              name: PROJECT_PARTIALS + "/products.ejs",
              renderData: data,
            },
            getNavbar(req),
          ],
          {
            url:
              "/readyforbaby/checklist/" +
              req.params.checklistItem +
              "/" +
              req.params.choice,
          }
        );
      } else {
        console.log(err);
        res.json(err);
      }
    });
};

exports.getAllChoiceCategories = function(req, res) {
  db.Choice.find({}, (err, data) => {
    if (!err) res.json(data);
  });
};

// exports.getProducts = function getProducts(req, res) {
//   sendJsonWithHtml(
//     req,
//     res,
//     [
//       {
//         type: "main",
//         name: PROJECT_PARTIALS + "/products.ejs",
//         // renderData: renderData,
//       },
//       getNavbar(req),
//     ],
//     {
//       url:
//         "/readyforbaby/checklist/" +
//         req.params["choice"] +
//         "/" +
//         req.params["products"],
//     }
//   );
// };

exports.getAllProducts = function(req, res) {
  db.Product.find({}, (err, data) => {
    if (!err) res.json(data);
  });
};

exports.addProduct = function(req, res) {
  if (
    !req.body.title ||
    req.body.title === "" ||
    !req.body.link ||
    req.body.link === "" ||
    !req.body.imageLink ||
    req.body.imageLink === ""
  ) {
    res.status(400).send({ message: "Can't add product" });
    return;
  }

  db.Product.find({ title: req.body.title }, (err, data) => {
    if (!data || data.length === 0) {
      let product = db.Product({
        title: req.body.title,
        link: req.body.link,
        imageLink: req.body.imageLink,
      });
      product.save(err => {
        if (err) res.json(err);
        else res.json({ status: "Success!" });
      });
    }
  });
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

function redirectSignin(req, res) {
  // console.log("redirected to sign in");
  sendJsonWithHtml(
    req,
    res,
    [
      {
        type: "main",
        name: PROJECT_PARTIALS + "/signin.ejs",
        // renderData: { title: res.title },
      },
      getNavbar(req),
    ],
    {
      url: "/readyforbaby/signin",
    }
  );
}

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

function getNavbar(req) {
  let data = {};
  if (req.session.user && req.cookies.user_sid) {
    console.log(req.session.user);
    data.user = req.session.user;
  }
  // data.push({paths: url.parse(req.url).pathname.split('/')})
  let paths = url
    .parse(req.url)
    .pathname.substr(1)
    .split("/");
  data.paths = [];
  let totalPath = "";
  for (let i = 0; i < paths.length; ++i) {
    let name = paths[i];
    if (paths[i] === "readyforbaby") name = "home";
    if (i !== 0 && name === paths[i - 1]) continue;
    name = name.split("-").join(" ");
    totalPath += "/" + paths[i];
    data.paths.push({ name: name, href: totalPath });
  }
  return {
    type: "navbar",
    name: PROJECT_PARTIALS + "/normal-navbar.ejs",
    renderData: { data: data },
  };
}

function sendError(res, error) {
  res.json({ err: error });
}
