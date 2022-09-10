const { assert } = require('chai');
const { userEmailLookup } = require('../helpers.js');
const { generateRandomString } = require('../helpers.js');
const { urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48BBB"
  },
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = userEmailLookup("user@example.com", testUsers);
    const expectedUserID = testUsers["userRandomID"];
    assert.equal(user, expectedUserID);
  });
  it('should return null if no valid user with that email exists', function() {
    const user = userEmailLookup("banana@example.com", testUsers);
    const expectedUserID = null;
    assert.equal(user, expectedUserID);
  });
});

describe('generateRandomString', function() {
  it('Should generate a random 6 character lowercase-alphanumeric', function() {
    const id = generateRandomString().length;
    const expectedid = 6;
    assert.equal(id, expectedid);
  });
  it('should not generate the same numeric twice', function() {
    const id1 = generateRandomString();
    const id2 = generateRandomString();
    assert.notEqual(id1, id2);
  });
});

describe('urlsForUser', function() {
  it("Should return a new database that contains the url objects that a user owns", function() {
    const actual = urlsForUser("aJ48lW", urlDatabase);
    const expected = {"b2xVn2": urlDatabase["b2xVn2"]};
    assert.deepEqual(actual, expected);
  });
  it("Should return an empty object if no url objects belong to that userID", function() {
    const actual = urlsForUser("XXYYXX", urlDatabase);
    const expected = {};
    assert.deepEqual(actual, expected);
  });
});

