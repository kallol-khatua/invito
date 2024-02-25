const express = require("express");
const User = require("../models/user");
const { isLoggedIn } = require("../utils/middlewares");
const Chat = require("../models/chat");
const Group = require("../models/group");
const Member = require("../models/member");
const mongoose = require("mongoose");
const ExpressError = require("../utils/ExpressError");
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
        // console.log(req.body); .find({_id: {$nin: [req.user._id]}});
        // console.log(req.body.groupId)
        
        let users = await User.aggregate([
            {
                $lookup: {
                    from: "Member",
                    localField: "_id",
                    foreignField: "member_id",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {$eq: ["$group_id", req.body.groupId]}
                                    ]
                                }
                            }
                        }
                    ],
                    as: "member"
                }
            },
            {
                $match: {
                    "_id": {
                        $nin: [req.user._id]
                    }
                }
            }
        ]);

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

// when click on the group share link deciding how can join the group
router.get("/share-group/:id", isLoggedIn, async(req, res, next) => {
    try{
        let {id} = req.params;
        let group = await Group.findById(id).populate("creator");

        // if group not found or group does not exist then show page not found page
        if(!group){
            return next(new ExpressError(404, "Page not found"));
        }

        // creator of group will not be able to join the group
        if(String(group.creator._id) == String(req.user._id)){
            return res.render("./chats/shareGroup.ejs", {group: group, message: "Creator"})
        } 
        
        // if already member then will not be able to join the group
        let member = await Member.find({group_id: id, member_id: req.user._id});
        // console.log(member);
        if(member.length > 0) {
            return res.render("./chats/shareGroup.ejs", {group: group, message: "Member"})
        }
        
        return res.render("./chats/shareGroup.ejs", {group: group, message: "join"})
    }catch(err){
        // console.log("catch")
        return next(new ExpressError(404, "Page not found"));
    }
});

// add member from share join link
router.post("/join-group", async(req, res, next) => {
    try{
        let member = await Member.find({group_id: req.body.groupId, member_id: req.user._id});
        if(member.length > 0) {
            return res.status(200).send({success: false, message: "already member"});
        }
        let newMember = new Member({group_id: req.body.groupId, member_id: req.user._id});
        await newMember.save();
        return res.status(200).send({success: true, message: "become a member"});
    }catch(err) {
        return res.status(200).send({success: false, message: "error"});
    }
})

// render group dashboard
router.get("/group-dashboard", isLoggedIn, async(req, res, next) => {
    let createdGroup = await Group.find({creator: req.user._id});
    let joinedGroup = await Member.find({member_id: req.user._id}).populate("group_id");
    res.render("chats/group-dashboard.ejs", {createdGroup: createdGroup, joinedGroup: joinedGroup});
});

module.exports = router;