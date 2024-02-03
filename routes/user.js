const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controllers/user");
const Post = require("../models/post");
const Notification = require("../models/notification");
const User = require("../models/user");
const { isLoggedIn } = require("../utils/middlewares");
const multer  = require('multer');
const {storage} = require("../cloudconfig.js");
const upload = multer({ storage });

router.route("/signup")
    .get(userController.renderSignupForm)
    .post(userController.signup);


router.route("/login")
    .get(userController.renderLoginForm)
    .post(passport.authenticate('local', { failureRedirect: '/users/login', failureFlash: true }) , userController.login);

router.get("/logout", userController.logout);

router.get("/verify-email",isLoggedIn, userController.renderVerifyEmailForm);
router.post("/verify-email", isLoggedIn, userController.verifyEmail);

// render the profile edit page
router.get("/edit", isLoggedIn, (req, res, next) => {
    res.render("users/editprofile.ejs", {user: req.user});
});

// edit user info page
router.post("/edit", isLoggedIn, async(req, res, next) => {
    try {
        let {username, bio} = req.body;
        await User.findOneAndUpdate({_id: req.user._id}, {username: username, bio: bio});
        let user = await User.findById(req.user._id);

        req.login(user, (err) => {
            if(err) {
                return next(err);
            }
            res.redirect(`./${user._id}/profile`);
        })
    } catch(err) {
        return next(err);
    }
});

// user profile page
router.get("/:id/profile", isLoggedIn, async(req, res, next) => {
    let {id} = req.params;
    let posts = await Post.find({creater: id});
    let user = await User.findOne({_id: id});
    res.render("users/userPage.ejs", {user, posts});
});

// notification page
router.get("/notification", isLoggedIn, async(req, res, next) => {
    let notifications = (await Notification.find({to: req.user._id}).populate("from").populate("to").populate("post")).reverse();
    res.render("users/notification.ejs", {notifications});
});


module.exports = router;