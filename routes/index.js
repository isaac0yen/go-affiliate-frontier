const express = require('express');
const router = express.Router();
const DB = require('../helpers/sqlite');
const db = new DB('database');
const Validate = require('../helpers/Validate');
const Mail = require('../helpers/Mail');
let status

/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect('/home');
});

router.get('/home', (req, res) => {
  res.render('home');
});

router.get('/register', (req, res) => {
  res.render('register', { message: status });
})

router.post('/add-New', async (req, res) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const phone = req.body.phone;

  try {
    if (!Validate.string(firstName)) {
      status = false;
      throw new Error('Invalid first name');
    }
    if (!Validate.string(lastName)) {
      status = false;
      throw new Error('Invalid last name');
    }
    if (!Validate.email(email)) {
      status = false;
      throw new Error('Invalid email');
    }
    if (!Validate.phone(phone)) {
      status = false;
      throw new Error('Invalid phone number');
    }
  } catch (error) {
    console.log(error);
    return res.redirect('/register');
  }

  let isInserted;
  try {

    const registered = await db.findOne('user', { email });

    if (!registered) {
      isInserted = await db.insertOne('user', { firstName, lastName, email, phone });
    } else {
      console.log('Inserted already registered', registered);
      status = 'Registered';
    }

  } catch (err) {
    console.log(err);
    status = false;
    return res.redirect('/register');
  }

  if (isInserted > 0) {
    status = true;
    return res.redirect('/register');
  } else {
    return res.redirect('/register');
  }
});

setInterval(() => {
  status = undefined;
}, 5000)

module.exports = router;