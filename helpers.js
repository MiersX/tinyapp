const userEmailLookup = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
};

const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 8);
};

const urlsForUser = (id, database) => {
  const ownedURLS = {};

  for (const obj in database) {
    if (database[obj].userID === id) {
      ownedURLS[obj] = {
        longURL: database[obj].longURL,
        userID: id,
      };
    }
  }
  return ownedURLS;
};

module.exports = {
  userEmailLookup,
  generateRandomString,
  urlsForUser,
};