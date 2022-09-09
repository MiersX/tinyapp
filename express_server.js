// ** ------------ Requirements and Middleware ----------- ** //

const express = require("express");

const app = express();
const PORT = 8080; 

const morgan = require("morgan");
app.use(morgan("dev"));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

/*
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: [ //secret keys ],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
*/

const bcrypt = require("bcryptjs");
// const hashPassword = bcrypt.hashSync(password, 8) -> to hash pass
// bcrypt.compareSync(password, user.password) -> comparison matching purposes

const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 8)
};

const userEmailLookup = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
}

const urlsForUser = (id) => {
  const ownedURLS = {};

    for (const obj in urlDatabase) {
      if (urlDatabase[obj].userID === id) {
        ownedURLS[obj] = {
          longURL: urlDatabase[obj].longURL,
          userID: id,
        }    
      }
    }
  return ownedURLS;
}
  

// ** ---------- Databases---------- ** //


// Database of stored short URLS : Long URLS

const urlDatabase = {};

// Database of users

const users = {};

// ** ------- Routes and Endpoints ------- ** //


// Create new user for the users database, using data passed from register template form. 
// Matches users external id as their internal id key.
// Sets a cookie "user_id" to their id value.

app.post("/register", (req, res) => {
  const randomID = generateRandomString();
   if (!req.body.email || !req.body.password) {
      res.status(400).send("Uh-oh! An empty email or password field was detected, please try again.");
      return;
   }
  if (!userEmailLookup(req.body.email)) {
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
  res.cookie("user_id", randomID);
  res.redirect("/urls");
});



// Generates random short URL ("ID"), and adds the shortID:LongURL pair to our urlDatabase.
// Redirects to the shortened url.

// ** //
app.post("/urls", (req, res) => {
  const cookieID = req.cookies["user_id"];
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


// Deletes the requested keyed object from the URL database if user meets conditions, redirects back to url page.

app.post("/urls/:shortID/delete", (req, res) => {
  const cookieID = req.cookies["user_id"];
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

// Edits the longURL value held in the urlDatabase if user meets conditions 

app.post("/urls/:shortID", (req, res) => {
  const cookieID = req.cookies["user_id"];
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
 


// Handles login post-request. Uses the email provided to search through our users database.
// If no user found, or passwords do not match, error handle.
// If both match - resets the users specific cookie, redirects to /urls

app.post("/login", (req, res) => {
  const userObj = userEmailLookup(req.body.email);

  if (!userObj) {
    res.status(403).send("Email or password is incorrect.");
    return;
  };
  if (bcrypt.compareSync(req.body.password, userObj.password)) {
    res.cookie("user_id", userObj.id);
    res.redirect("/urls");
    return;
  }  else {
    res.status(403).send("Email or password is incorrect.");
    return;
  };
});


// Clears the user_id cookie when the logout button is submitted.
// Redirects back to the urls page

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
  //req.session = null; removes cookies?
});


// Accesses the short url key in our database, and redirects them to the source website.

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (longURL) {
  res.redirect(longURL);
  } else {
    res.status(400).send("This short URL doesn't exist yet...Create it with our tool!")
  }
});


// Route to handle the get /login request and render the urls_login template.
// If user is logged-in already, redirects to /urls.

app.get("/login", (req, res) => {
  const cookieID = req.cookies["user_id"];
  const templateVars = {user: users[cookieID],}
    if (cookieID) {
    res.redirect("/urls");
  } else {
  res.render("urls_login", templateVars);
  };
});

// Route for the /register endpoint. Renders our urls_register page
// If a user is currently logged-in, redirects to /urls.

app.get("/register", (req, res) => {
  const cookieID = req.cookies["user_id"];
  const templateVars = {user: users[cookieID],};
    if (cookieID) {
      res.redirect("/urls")
    } else {
      res.render("urls_register", templateVars);
    };
});


// Handles the get request for the urls/new endpoint.
// If user is not logged in, redirects to login page.

app.get("/urls/new", (req, res) => {
  const cookieID = req.cookies["user_id"];
  const templateVars = {user: users[cookieID],}
    if (cookieID) {
      res.render("urls_new", templateVars);
    } else {
      res.redirect("/login");
    }
  });



app.get("/urls", (req, res) => {
  const cookieID = req.cookies["user_id"];
  const userURLS = urlsForUser(cookieID);
  const templateVars = { 
    user: users[cookieID],
    urls: userURLS };
  res.render("urls_index", templateVars);
});



app.get("/urls/:id", (req, res) => {

  const cookieID = req.cookies["user_id"];
  const userURLS = urlsForUser(cookieID);
  const shortID = req.params.id;
  const longID = urlDatabase[req.params.id].longURL

  const templateVars = {
    user: users[cookieID],
    urls: userURLS,
    shortID,
    longID,
  };
   if (!urlDatabase[shortID]) {
    res.status(404).send("Sorry, this TinyURL hasn't been created yet!")
    return;
  }
  res.render("urls_show", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



// ** ------------Listener ------------- ** //

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




/*
 id: req.params.id, 
    longURL: urlDatabase[req.params.id].longURL}
    */