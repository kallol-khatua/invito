const express = require("express");
const User = require("../models/user");
const { isLoggedIn } = require("../utils/middlewares");
const Chat = require("../models/chat");
const Group = require("../models/group");
const Member = require("../models/member");
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

// render group page with user created groups 
router.get("/groups", isLoggedIn, async(req, res, next) => {
    let groups = await Group.find({creator: req.user._id});
    res.render("chats/groups.ejs", {groups});
});

// create new group and save details to database
router.post("/groups", isLoggedIn, async(req, res, next) => {
    let newGroup = new Group({
        creator: req.user,
        name: req.body.name
    });
    await newGroup.save();
    res.redirect('/chats/groups')
});

// find member and send data to frontend
router.post("/members", isLoggedIn, async(req, res, next) => {
    try{
        // group id came form the frontend at the time of ajax request 
        // console.log(req.body);
        let users = await User.find({_id: {$nin: [req.user._id]}});
        // console.log(users);
        res.status(200).send({success: true, users});
    }catch(err) {
        res.status(400).send({success: false, message: err.message});
    }   
});

// add members for a group
router.post("/addMembers", isLoggedIn, async(req, res, next) => {
    try{
        await Member.deleteMany({group_id: req.body.group_id})
        let data = [];
        for (member of req.body.addMemberId) {
            data.push({
                group_id: req.body.group_id,
                member_id: member
            })
        }
        await Member.insertMany(data);
        res.status(200).send({success: true, message: "Members updated"});
    }catch(err) {
        res.status(400).send({success: false, message: err.message});
    }   
});

module.exports = router;