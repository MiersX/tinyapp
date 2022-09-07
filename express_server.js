const express = require("express");
const app = express();
const PORT = 8080; 
const morgan = require("morgan");
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true}));

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


// Creates a new short url id, and adds the shortID:LongURL pair to our urlDatabase object
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
  console.log("urlDatabase", urlDatabase);
  res.redirect("/urls");
});
 




app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  res.redirect(longURL);
});




app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});




app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});



app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]}
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