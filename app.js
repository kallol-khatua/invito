if(process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const bodyParser = require('body-parser');
const session = require("express-session");
// const MongoStore = require('connect-mongo'); //to store session on mongodb atlas
const flash = require("connect-flash"); // for flash messaeg
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const ExpressError = require('./utils/ExpressError');

const userRouter = require("./routes/user");
const postRouter = require("./routes/post");
const Post = require('./models/post');
const { isLoggedIn, isVerified } = require('./utils/middlewares');
const Notification = require('./models/notification');

async function main() {
    await mongoose.connect(process.env.MONGO_URL);
}

main()
    .then(() => {
        console.log("connected to database");
    })
    .catch((err) => {
        console.log(err);
    });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// app.use(express.urlencoded({extended: true}));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
    
const sessionOPtions = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

app.use(session(sessionOPtions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.get("/", isLoggedIn, isVerified, async (req, res, next) => {
    let posts = (await Post.find().populate("creater").populate("interested_user")).reverse();

    res.render("./posts/index.ejs", {posts});
});

// // two handle interest request and also prevent the page to get refreshed
// app.post('/like', async(req, res) => {
//     // Handle the like logic here, for example, update a database
//     const { postId } = req.body;
//     console.log(postId);
//     let post = await Post.findById(postId);
//     console.log(post)
//     // Perform database update or other actions here

//     // Send a response to the client
//     res.json({ success: true, message: 'Like added successfully' });
// });

app.use("/users", userRouter);
app.use("/posts", postRouter);

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
    let {statusCode = 500, message = "Something went wrong"} = err;
    res.status(statusCode).render("posts/error.ejs", {message});
});

app.listen(8080, () => {
    console.log(`listening to port 8080`);
});