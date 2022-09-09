// ** ------------ Requirements and Middleware ----------- ** //

const express = require("express");
const app = express();
const PORT = 8080; 

const morgan = require("morgan");
app.use(morgan("dev"));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  secret: '7H1515453CR3757R1NG',
}));

const bcrypt = require("bcryptjs");

const { userEmailLookup } = require('./helpers');
const { generateRandomString } = require('./helpers');
const { urlsForUser } = require('./helpers');


// ** ---------- Databases---------- ** //

// Database of stored short URLS : Long URLS

const urlDatabase = {};

// Database of users

const users = {};


// ** ------- Routes and Endpoints ------- ** //


// .POST......Register a new user for the users database, using data passed from register template form. 
// Hashes password. Sets an encrypted cookie based on their randomly generated ID. Redirects to urls index page.

app.post("/register", (req, res) => {
  const randomID = generateRandomString();
   if (!req.body.email || !req.body.password) {
      res.status(400).send("Uh-oh! An empty email or password field was detected, please try again.");
      return;
   }
  if (!userEmailLookup(req.body.email, users)) {
   const newUser = {
    id: randomID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
   }
   users[randomID] = newUser;
  } else {
    res.status(400).send("Uh-oh! That email is already registered with us, please try again.");
    return;
  }
  req.session.user_id = (randomID);
  res.redirect("/urls");
});

// .POST......Generates a random short URL ("ID"), and adds the shortID:LongURL pair to our urlDatabase.
// Keys the users userID to the value of their cookie. Redirects to the shortened url page.

app.post("/urls", (req, res) => {
  const cookieID = req.session.user_id;
  const shortID = generateRandomString();
    if (cookieID) {
     urlDatabase[shortID] = { 
      longURL: req.body.longURL,
      userID: cookieID,
    };
    res.redirect(`/urls/${shortID}`);
  } else {
      res.status(403).send("Only registered users are able to access the shorten URL feature!");
  }
});

// .POST......Deletes the requested keyed object from the URL database, if user meets authentication conditions.
// Error handles conditional failures. Redirects back to url page.

app.post("/urls/:shortID/delete", (req, res) => {
  const cookieID = req.session.user_id;
  const shortID = req.params.shortID;
    if (cookieID !== urlDatabase[shortID].userID) {
      res.status(403).send("You're not the owner of this URL");
      return;
    }
    if (!cookieID) {
      res.status(403).send("You need to be logged-in to access this");
      return;
    }
    if (!shortID) {
      res.status(404).send("This id wasn't found");
      return;
    }
  delete urlDatabase[shortID];
  res.redirect("/urls");
});

// .POST......Edits the longURL value held in the urlDatabase, if user meets authentication conditions.
// Error handles appropriate messages based on condition failures. 

app.post("/urls/:shortID", (req, res) => {
  const cookieID = req.session.user_id;
  const shortID = req.params.shortID
    if (cookieID !== urlDatabase[shortID].userID) {
      res.status(403).send("You're not the owner of this URL");
      return;
    }
    if (!cookieID) {
      res.status(403).send("You need to be logged-in to access this");
      return;
    }
    if (!shortID) {
      res.status(404).send("This id wasn't found");
      return;
    }
    urlDatabase[shortID] = {
      longURL: req.body.name,
      userID: cookieID,
    };
  res.redirect("/urls");
});
 
// .POST......Searches through users database with provided email.
// If no user found, or passwords do not match, error handle.
// If both match -> Logs in, (re-)sets the user specific cookie, redirects to /urls index page

app.post("/login", (req, res) => {
  const userObj = userEmailLookup(req.body.email, users);
    if(!userObj) {
      res.status(403).send("Email or password is incorrect.");
    }
  if (bcrypt.compareSync(req.body.password, userObj.password)) {
    req.session.user_id = userObj.id;
    res.redirect("/urls");
    return;
  } else {
    res.status(403).send("Email or password is incorrect.");
    return;
  };
});

// .POST......Clears the encrypted session.cookie when the logout button is submitted.
// "Logging out" current user, and redirecting back to the urls index page

app.post("/logout", (req, res) => {
  req.session = null; 
  res.redirect("/urls");
});

// .GET......Accesses the requested short url, keyed in our database. 
// If it exists: redirects them to the source "long URL" website. If not: "Shows appropriate error message".

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (longURL) {
  res.redirect(longURL);
  } else {
    res.status(400).send("This short URL doesn't exist yet...Create it with our tool!")
  }
});

// .GET......Renders the urls login page.
// If user is logged-in already, redirects to /urls index page.

app.get("/login", (req, res) => {
  const cookieID = req.session.user_id;
  const templateVars = {user: users[cookieID],}
    if (cookieID) {
    res.redirect("/urls");
  } else {
  res.render("urls_login", templateVars);
  };
});

// .GET.......Renders the user registration page.
// If a user is currently logged-in, redirects to /urls index page.

app.get("/register", (req, res) => {
  const cookieID = req.session.user_id;
  const templateVars = {user: users[cookieID],};
    if (cookieID) {
      res.redirect("/urls")
    } else {
      res.render("urls_register", templateVars);
    };
});

// .GET...... Authenticates if user is logged in.
// If yes: renders the create new url page. If no: redirects to login page.

app.get("/urls/new", (req, res) => {
  const cookieID = req.session.user_id;
  const templateVars = {user: users[cookieID],};
    if (cookieID) {
      res.render("urls_new", templateVars);
    } else {
      res.redirect("/login");
    }
  });

// .GET......Renders the url index page
// urls_index template authenticates, and shows an appropriate page if user is or isn't logged in.

app.get("/urls", (req, res) => {
  const cookieID = req.session.user_id;
  const userURLS = urlsForUser(cookieID, urlDatabase);
  const templateVars = { 
    user: users[cookieID],
    urls: userURLS };
  res.render("urls_index", templateVars);
});

// .GET......Renders / "shows" the specific short URL page. 
// Error handles if it hasn't been created. URLS_show template displays appropriate page depending on authorization.

app.get("/urls/:id", (req, res) => {
  const cookieID = req.session.user_id;
  const userURLS = urlsForUser(cookieID, urlDatabase);
  const shortID = req.params.id;
  const longID = urlDatabase[req.params.id];
  const templateVars = {user: users[cookieID], urls: userURLS, shortID, longID,};

   if (!urlDatabase[shortID]) {
    res.status(404).send("Sorry, this TinyURL hasn't been created yet!")
    return;
  }
  res.render("urls_show", templateVars);
});


// ** ------------Listener ------------- ** //

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});