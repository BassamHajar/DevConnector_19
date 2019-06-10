const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator/check');
const jwt = require('jsonwebtoken');
const config = require('config');

// communicate with db by requring models/user
const User = require('../../models/User');

// @route  POST api/users
// @desc   register user
// @access public

router.post(
  '/',
  [
    check('name', 'Name is rquired')
      .not()
      .isEmpty(),
    check('email', 'Email is required').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // check if user exists
      let user = await User.findOne({ email }); // await a promise

      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      // get users gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      }); // we have to save it to database by calling user.save() but first we have to hash the password

      // encrypt password
      const salt = await bcrypt.genSalt(10); // return a promise - 10 recommended in the docs, so read for more info.
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 360000 }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error!');
    }
  }
);

module.exports = router;
