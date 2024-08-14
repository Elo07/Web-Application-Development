const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let User;

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection('mongodb+srv://okuonghaelarry:QpgtsTkDD1LAPmd8@cluster0.lvz98.mongodb.net/cluster0?retryWrites=true&w=majority&appName=Cluster0');

    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    // Check if passwords match
    if (userData.password !== userData.password2) {
      return reject("Passwords do not match");
    }

    // Hash the password
    bcrypt
      .hash(userData.password, 10)
      .then((hash) => {
        // Replace userData.password with the hashed password
        userData.password = hash;

        // Create a new User and save it
        let newUser = new User(userData);
        newUser
          .save()
          .then(() => resolve())
          .catch((err) => {
            if (err.code === 11000) {
              reject("User Name already taken");
            } else {
              reject(`There was an error creating the user: ${err}`);
            }
          });
      })
      .catch((err) => {
        reject("There was an error encrypting the password");
      });
  });
};

module.exports.checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    User.find({ userName: userData.userName })
      .then((users) => {
        if (users.length === 0) {
          return reject(`Unable to find user: ${userData.userName}`);
        }

        // Compare hashed password with the provided password
        bcrypt
          .compare(userData.password, users[0].password)
          .then((result) => {
            if (!result) {
              return reject(
                `Incorrect Password for user: ${userData.userName}`
              );
            }

            // Update loginHistory and resolve
            let user = users[0];
            user.loginHistory.push({
              dateTime: new Date().toString(),
              userAgent: userData.userAgent,
            });

            user
              .save()
              .then(() => resolve(user))
              .catch((err) =>
                reject(`There was an error verifying the user: ${err}`)
              );
          })
          .catch((err) =>
            reject(`There was an error comparing passwords: ${err}`)
          );
      })
      .catch((err) => reject(`Unable to find user: ${userData.userName}`));
  });
};