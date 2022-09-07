const express = require("express");

const app = express();
const PORT = 8080; 

const morgan = require("morgan");
app.use(morgan("dev"));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 8)
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};



app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n")
})


// ** Make sure to update the templateVars with what you need to pass to _register and other templates



// Creates a new short url id randomly, and adds the shortID:LongURL pair to our urlDatabase object
// Redirects to the shortened url

app.post("/urls", (req, res) => {
  //console.log(req.body); // Log the post request body to the console
  const shortID = generateRandomString();
  urlDatabase[shortID] = req.body.longURL,
  res.redirect(`/urls/${shortID}`);
});

// Deletes the key from the database object, redirects back to url page

app.post("/urls/:shortID/delete", (req, res) => {
  const shortID = req.params.shortID;
  delete urlDatabase[shortID];
  res.redirect("/urls");
});

app.post("/urls/:shortID", (req, res) => {
  const shortID = req.params.shortID
  urlDatabase[shortID] = req.body.name;
  //console.log("urlDatabase", urlDatabase);
  res.redirect("/urls");
});
 
// Takes in form-data from the login field, creates a cookie with the username value, redirects back to url

app.post("/login", (req, res) => {
  //console.log(req.body.username);
  const loginVal = req.body.username;
  res.cookie("username", loginVal);
  res.redirect("/urls");

});

// Clears the username cookie and redirects back to the urls page

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  res.redirect(longURL);
});




app.get("/urls/new", (req, res) => {
  const templateVars = {username: req.cookies["username"],}
  res.render("urls_new", templateVars);
});

app.get("/urls/register", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    
  };
  res.render("urls_register", templateVars);
});


app.get("/urls", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
    urls: urlDatabase };
  res.render("urls_index", templateVars);
});



app.get("/urls/:id", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    id: req.params.id, longURL: urlDatabase[req.params.id]}
  res.render("urls_show", templateVars);
});



app.get("/", (req, res) => {
  res.send("Hello!");
});



app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});





app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});