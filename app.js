const express = require("express");
const cors = require("cors");
const app = express();
const User = require("./model/user.model");
const bcrypt = require('bcrypt');
require("./config/passport");
const saltRounds = 10;
const passport = require("passport");
const session = require("express-session");
const MongoStore = require('connect-mongo');
require("dotenv").config();
//EJS Setup
app.set("view engine", "ejs");
//Cors Setup
app.use(cors());
//Express Body Parser Setup
app.use(express.urlencoded({extended : true}));
app.use(express.json());

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl : process.env.MONGO_URL,
    collectionName : "sessions"
  })
//   cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());


//Home Route
app.get("/", (req, res) =>{
    res.render("index");
});

//Register : get
app.get("/register", (req, res) =>{
    res.render("register");
});
//Register : post
app.post("/register", async (req, res) =>{
    try {
        const user = await User.findOne({username : req.body.username});
        if(user) return  res.status(400).send("user is allready exist");

        bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
            const newUser = new User({
                username : req.body.username,
                password : hash
            });
            await newUser.save()
            res.redirect("/login");
        });

       
    } catch (error) {
        rres.status(500).send(error.message)
    }
});
const checkLoggedin = (req, res, next) => {
    if(req.isAuthenticated()){
        return res.redirect("/profile");
    }
    next();
}
//Login : get
app.get("/login", checkLoggedin, (req, res) =>{
    res.render("login");
});
//Login : post
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login', successRedirect: "/profile" }),
  );

  const checkAuthenticated = (req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login")
}
//Profile protected route
app.get("/profile", checkAuthenticated, (req, res) =>{
    res.render("profile")
});
//Logout route
app.get("/logout", (req, res) =>{
    try {
        req.logout((err) =>{
            if(err){
                return next(err);
            }
            res.redirect("/")
        })
    } catch (error) {
        res.status(500).send(error.message)
    }
});
//404 Is Not Found
app.use((req, res, next) => {
    res.status(404).json({
        message : "404 is not found"
    });
});
//Server Error
app.use((err, req, res, next) => {
    res.status(500).json({
        message : "Something broke"
    });
});

module.exports = app;