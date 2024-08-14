/*********************************************************************************
 *  WEB322 – Assignment 06
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part
 *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Larry Okuonghae Student ID: 145203238 Date: 08/14/2024
 *
 *  Vercel Web App URL: https://web322-app-six-umber.vercel.app/
 *
 *  GitHub Repository URL: https://github.com/Elo07/web322-app.git
 *
 ********************************************************************************/

//okuonghaelarry
//QpgtsTkDD1LAPmd8
//mongodb+srv://okuonghaelarry:QpgtsTkDD1LAPmd8@cluster0.lvz98.mongodb.net/cluster0?retryWrites=true&w=majority&appName=Cluster0

const path = require("path");
const express = require("express"); // "require" the Express module
const app = express(); // obtain the "app" object
const storeService = require("./store-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const authData = require("./auth-service");
const HTTP_PORT = process.env.PORT || 8080;
const clientSessions = require("client-sessions");

// Handlebars helpers
const hbs = exphbs.create({
  extname: ".hbs",
  defaultLayout: "main",
  helpers: {
    navLink: function (url, options) {
      return (
        "<li" +
        (url === app.locals.activeRoute ? ' class="active"' : "") +
        '><a href="' +
        url +
        '">' +
        options.fn(this) +
        "</a></li>"
      );
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue !== rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
    formatDate: function (dateObj) {
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    },
  },
});

app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "views"));

app.use((req, res, next) => {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.use(
  clientSessions({
    cookieName: "session",
    secret: "Sessions",
    duration: 24 * 60 * 60 * 1000, // 24 hours
    activeDuration: 30 * 60 * 1000, // 30 minutes
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

cloudinary.config({
  cloud_name: "dds0nbuc4",
  api_key: "598547286389728",
  api_secret: "NY-ixOgeXCzolmOHkomP0MCVXoQ",
  secure: true,
});

const upload = multer(); // no { storage: storage } since we are not using disk storage

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Redirect root to /shop
app.get("/", (req, res) => {
  res.redirect("/shop");
});

// Serve the about.html file
app.get("/about", (req, res) => {
  res.render("about");
});

// Route to get all published items
app.get("/shop", async (req, res) => {
  let viewData = {};

  try {
    let items = [];

    if (req.query.category) {
      items = await storeService.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await storeService.getPublishedItems();
    }

    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    let item = items[0];

    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "No results";
  }

  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "No results";
  }

  res.render("shop", { data: viewData });
});

app.get("/shop/:id", async (req, res) => {
  let viewData = {};

  try {
    let items = [];

    if (req.query.category) {
      items = await storeService.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await storeService.getPublishedItems();
    }

    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    viewData.items = items;
  } catch (err) {
    viewData.message = "No results";
  }

  try {
    viewData.item = await storeService.getItemById(req.params.id);
  } catch (err) {
    viewData.message = "No results";
  }

  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "No results";
  }

  res.render("shop", { data: viewData });
});

// Route to get all items
app.get("/items", ensureLogin, async (req, res) => {
  try {
    let items;
    if (req.query.category) {
      items = await storeService.getItemsByCategory(req.query.category);
    } else if (req.query.minDate) {
      items = await storeService.getItemsByMinDate(req.query.minDate);
    } else {
      items = await storeService.getAllItems();
    }

    if (items.length > 0) {
      res.render("items", { items: items });
    } else {
      res.render("items", { message: "No items found" });
    }
  } catch (err) {
    res.render("items", { message: "No results" });
  }
});

app.get("/item/:id", ensureLogin, (req, res) => {
  storeService
    .getItemById(req.params.id)
    .then((item) => {
      res.json(item);
    })
    .catch((err) => {
      res.status(404).send(err);
    });
});

// Route to get all categories
app.get("/categories", ensureLogin, async (req, res) => {
  try {
    const categories = await storeService.getCategories();
    if (categories.length > 0) {
      res.render("categories", { categories: categories });
    } else {
      res.render("categories", { message: "No categories found" });
    }
  } catch (err) {
    res.render("categories", { message: "No results" });
  }
});

// Route to render the add item page with categories
app.get("/items/add", ensureLogin, (req, res) => {
  storeService
    .getCategories()
    .then((categories) => {
      res.render("addItem", { categories });
    })
    .catch(() => {
      res.render("addItem", { categories: [] }); // In case of an error, render with an empty categories array
    });
});

app.post("/items/add", upload.single("featureImage"), ensureLogin, (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processItem(uploaded.url);
    });
  } else {
    processItem("");
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;
    storeService
      .addItem(req.body)
      .then(() => {
        res.redirect("/items");
      })
      .catch((err) => {
        res.status(500).send(err.message);
      });
  }
});

// GET route to render add category form
app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory");
});

// POST route to handle add category form submission
app.post("/categories/add", ensureLogin, (req, res) => {
  storeService
    .addCategory(req.body)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
});

// GET route to delete a category by ID
app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  storeService
    .deleteCategoryById(req.params.id)
    .then(() => res.redirect("/categories"))
    .catch(() => res.status(500).send("Unable to Remove Category / Category not found"));
});

// Route to delete an item by ID
app.get("/items/delete/:id", ensureLogin, (req, res) => {
  storeService
    .deleteItemById(req.params.id)
    .then(() => {
      res.redirect("/items");
    })
    .catch(() => {
      res.status(500).send("Unable to Remove Item / Item not found");
    });
});


// Route to render the login page
app.get("/login", (req, res) => {
  try {
    res.render("login");
  } catch (err) {
    console.error("Error rendering login page:", err);
    res.status(500).send("Server error");
  }
});

// Route to render the registration page
app.get("/register", (req, res) => {
  try {
    res.render("register");
  } catch (err) {
    console.error("Error rendering register page:", err);
    res.status(500).send("Server error");
  }
});

// Route to handle user registration
app.post("/register", async (req, res) => {
  try {
    await authData.registerUser(req.body);
    res.render("register", { successMessage: "User created" });
  } catch (err) {
    res.render("register", { errorMessage: err, userName: req.body.userName });
  }
});

// Route to handle user login
app.post("/login", async (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  try {
    const user = await authData.checkUser(req.body);
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory,
    };
    res.redirect("/items");
  } catch (err) {
    res.render("login", { errorMessage: err, userName: req.body.userName });
  }
});

// Route to handle user logout
app.get("/logout", (req, res) => {
  req.session.reset(); // or req.session.destroy() depending on your session management
  res.redirect("/");
});

// Route to render the user history page, accessible only to logged-in users
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

// Handle 404 - Page Not Found
app.use((req, res) => {
  res.status(404).render("404");
});

// Initialize store-service and start the server
console.log("Initializing store service...");
storeService
  .initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("app listening on: " + HTTP_PORT);
      console.log(`Server is running at http://localhost:${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log("Unable to start server: " + err);
  });