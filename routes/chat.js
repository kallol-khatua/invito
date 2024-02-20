const express = require("express");
const User = require("../models/user");
const { isLoggedIn } = require("../utils/middlewares");
const Chat = require("../models/chat");
const router = express.Router();

router.get("/dashboard", isLoggedIn, async(req, res, next) => {
    // send user except the xurrent user
    // res.cookie('user', JSON.stringify(req.user));
    let users = await User.find({_id: {$nin: [req.user._id]}});
    res.render("chats/dashboard.ejs", {users});
});

router.post("/saveChat",isLoggedIn, async(req, res, next) => {
    try{
        let newChat = new Chat({
            receiver_id: req.body.receiver_id,
            sender_id: req.body.sender_id,
            message: req.body.message
        });
        await newChat.save();
        res.status(200).send({success: true, message: "chat saved", data: newChat});
    }catch(error) {
        res.status(400).send({success: false, message: error.message});
    }
})

module.exports = router;