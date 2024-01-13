var express = require('express');
var router = express.Router();
const Mail = require('../helpers/Mail')
const DB = require('../helpers/sqlite');
const db = new DB('database');
const Validate = require('../helpers/Validate');
const token = require('../helpers/token');
const { DateTime } = require('luxon');

let sent

const isLoggedIn = async (req) => {
  try {
    // Parse the cookies from the request headers
    const cookies = req.headers.cookie.split('; ').reduce((prev, current) => {
      const [name, value] = current.split('=');
      prev[name] = value;
      return prev;
    }, {});

    const token = cookies['token'];
    const isValid = await db.findOne('token', { token });

    if (isValid) {
      let validDate = DateTime.fromISO(isValid.valid);
      let now = DateTime.now();

      if (now < validDate.plus({ days: 1 })) {
        return true;
      } else {
        await db.deleteOne('token', { token });
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}



/* GET users listing. */
router.get('/', function (req, res, next) {
  // Logic for checking if the user is logged in or not.
  res.redirect('./Dashboard');
});

router.get('/login', (req, res) => {
  res.render('./admin/login', { sent })
});

router.post('/process-login', async (req, res) => {
  const email = req.body.email

  try {

    if (!Validate.email(email)) {
      throw new Error('Invalid email');
    }

    const MailSent = await Mail.LoginMail(email);

    if (MailSent) {
      sent = true;
      res.redirect('./login');
    } else {
      sent = 'denied'
      res.redirect('./login');
    }

  } catch (error) {

  }

});

router.post('/login-user', async (req, res) => {

  const email = req.body.email;
  const code = req.body.code;

  try {
    const codes = await db.findMany('login_codes', { email })

    const Last_Occur = codes[codes.length - 1];

    if (Last_Occur.code === code) {
      await db.deleteMany('login_codes', { email });

      const Login_Token = await token();

      let now = DateTime.now();

      await db.insertOne('token', { token: Login_Token, valid: now.plus({ day: 1 }).toISOTime() });

      // Set the cookie named 'token' with the value of Login_Token
      res.cookie('token', Login_Token, { maxAge: 1440000000, httpOnly: true });

      res.redirect('./Dashboard');
    } else {
      sent = 'Code_error'
      res.redirect('./login');
    }


  } catch (error) {
    console.log(error)
  }
});



router.get('/Dashboard', async (req, res) => {
  try {
    if (await isLoggedIn(req)) {
      const prospects = db.findMany('user', {})
      if (prospects) {
        res.render('./admin/backoffice', { prospects })
      }
    } else {
      res.redirect('./login');
    }
  } catch (error) {
    console.log(error);
    res.redirect('./login');
  }
});

router.get('/post-mail', async (req, res) => {
  try {
    if (await isLoggedIn(req)) {
      const prospects = db.findMany('user', {})
      if (prospects) {
        res.render('./admin/postmail')
      }
    } else {
      res.redirect('./login');
    }
  } catch (error) {
    console.log(error);
    res.redirect('./login');
  }
});

router.post('/mail', async (req, res) => {
  const { title, image, content } = req.body;
  console.log(title, image, content);
  console.log(JSON.stringify(req.body, null, 2));

  const done = await Mail.MailAll({title, image, content});

  if (done) {
    res.redirect('./Dashboard');
  }

});

setInterval(() => {
  sent = undefined;
}, 5000)

module.exports = router;