const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const generateRandomCode = require('./CodeGenerate');
const DB = require('../helpers/sqlite');
const db = new DB('database');
const Replacer = require('./Replacer.js');
const fs = require('fs');
const AI = require('./AI.js')
const HTML = require('../helpers/HTML.js');
dotenv.config();

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

const Mail = {
  LoginMail: async (email) => {
    const code = await generateRandomCode();
    const templatePath = path.join(__dirname, '../templates/code.html');
    const template = fs.readFileSync(templatePath, 'utf8');

    try {
      const admin = await db.findOne('admin', { email });
      if (admin) {
        await db.insertOne('login_codes', { email, code });

        const Mail = Replacer(template, { code });

        let mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: 'LOGIN CODE',
          html: Mail,
        };

        await transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            console.error(error);
          }
        });
      } else {
        throw new Error('ACCESS_DENIED');
      }
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },
  MailAll: async (details) => {

    let done

    try {
      const { title, image, content } = details;
      const users = db.findMany('user', {})


      const templatePath = path.join(__dirname, '../templates/mail.html');

      let template = fs.readFileSync(templatePath, 'utf8');
      template = Replacer(template, { content })

      let result = await AI(`
    Hey AI, let's level up your skills! I want you to become a top-notch UI/UX designer, mastering HTML and CSS. Get deep into modern design principles, think responsiveness, and keep accessibility in mind. Your goal is to craft interfaces that are not just good-looking but user-friendly for e-mails.

    Follow the following instructions to in detail.

    1. You would be given a template for a mail. your job is to take the current design and change the embeded styling inside.
    2. Note that the layout is not be changed. you are to only change the color and the font.
    4. make the image medium sized and should not be large.
    4. The values of the contents should be parsed and formatted accordingly. use lists when needed and emphasize on words when needed. use your genius in UIUX to achieve this goal.
    3. whatever font and color you should be professional but still abstract and beautiful.

    RESPOND ONLY WITH THE MODIFIED HTML CODE.


    The HTML code is below.

    ${template}

    `)

      result = '<!DOCTYPE html> \n <html> ' + HTML(result) + '</html>'

      users.forEach(async user => {
        let mail = await Replacer(result, { title, name: user.firstName, surname: user.lastName, link: 'https://facebook.com' })

        fs.writeFileSync('./index.html', mail)

        let mailOptions = {
          from: process.env.EMAIL,
          to: user.email,
          subject: title,
          html: mail,
          attachments: [
            {
              filename: 'image.jpg',
              path: image,
              cid: 'image',
              contentDisposition: 'inline',
            }
          ]
        };

        await transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            console.error(error);
          }
        });

      })

      done = true;

    } catch (error) {
      console.error(error);
    }

    if (done) {
      return true;
    }

  }
};

module.exports = Mail;