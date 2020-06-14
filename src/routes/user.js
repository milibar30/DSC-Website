const express = require("express");
const router = express.Router();
const User = require("../models/user");
const authorization = require("../middleware/auth");
const multer = require("multer");
const uuid = require("uuid");
const fs = require("fs");
const path = require("path");
const async = require("async");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require('cookie-parser');
const { check, validationResult } = require('express-validator');
const flash = require('connect-flash');
const session = require("express-session");
const nodemailer = require('nodemailer');
const cryptoRandomString = require('crypto-random-string');


//setting up methods
router.use(bodyParser.json());
router.use(cookieParser('secret_passcode'));
router.use(bodyParser.urlencoded({extended:true}));
router.use(session({
    secret: "secret_passcode",
    cookie: {
      maxAge: 4000000
    },
    resave: false,
    saveUninitialized: false
  }));
router.use(flash());


router.use((req, res, next) => {
    res.locals.flashMessages = req.flash();
    next();
});


//nodemailer methods

var transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    port:465,
    secure:true,
    auth: {
      user: process.env.NODEMAILER_EMAIL,           //email id
      pass: process.env.NODEMAILER_PASSWORD       //my gmail password
    }
});


var rand,mailOptions,host,link;
/*------------------SMTP Over-----------------------------*/

/*------------------Routing Started ------------------------*/

router.get('/verify/:id',function(req,res){
// console.log(req.protocol+":/"+req.get('host'));

    if((req.protocol+"://"+req.get('host'))==("http://"+host))
    {
        console.log("Domain is matched. Information is from Authentic email");

        User.findById(req.params.id,function(err,user){
            if(err)
                console.log(err);
            else
            {
                date2 = new Date();
                date1 = user.created_at;
                var timeDiff = Math.abs(date2.getTime() - date1.getTime());
                var diffhrs = Math.ceil(timeDiff / (1000 * 60));
                console.log(diffhrs);

                if(diffhrs <= 3)
                {
                    User.findByIdAndUpdate(user._id,{active:true},function(err,user){
                        if(err)
                            console.log(err);
                        else
                        {
                            console.log("email is verified");
                            // res.end("<h1>Email "+mailOptions.to+" is been Successfully verified");
                            res.render("verify");
                        }
                          
                    });

                }
                else
                {
                    User.findByIdAndUpdate(user._id,{created_at: new Date()},function(err,user){
                        if(err)
                            console.log(err);   
                    });
                    console.log("Link has expired try logging in to get a new link");
                    // res.end("<h1>Link has expired try logging in to get a new link</h1>");
                    res.render("notverified");
                }
            }
        });
    }
    else
    {
        res.end("<h1>Request is from unknown source");
    }
});

router.get('/verify/forgotpassword/:id',function(req,res){
    // console.log(req.protocol+":/"+req.get('host'));
    
        if((req.protocol+"://"+req.get('host'))==("http://"+host))
        {
            console.log("Domain is matched. Information is from Authentic email");
    
            User.findById(req.params.id,function(err,user){
                if(err)
                    console.log(err);
                else
                {
                    if(user.active)
                        res.render("changepassword",{user:user});
                    else
                    {
                        User.findByIdAndUpdate(user._id,{active:true},function(err,user){
                            if(err)
                                console.log(err);
                            else
                            {
                                console.log("email is verified");
                                res.render("changepassword",{user:user});
                            }
                              
                        });
                    }
                        
                }
            });
        }
        else
        {
            res.end("<h1>Request is from unknown source");
        }
    });
//==============================
  
router.post("/changepassword/:id",function(req,res){
    bcrypt.hash(req.body.password, 10).then((hash) => {
        User.findByIdAndUpdate(req.params.id,{password:hash},function(err,user)
        {
            if(err)
                console.log(err);
            else
            {
                req.flash("success", "Your password has been reset try logging in");
                res.redirect("/dsc/");
            }
        });
    });
});

//Config Modules

const { checkProfileImageType } = require("../config/checkType");

//Setup a test Router for user routes
router.get('/',(req,res)=>{
    res.json({message:'User routes connected'})
});


router.get("/newusermobile",(req,res)=>{
    res.render("newusermobile");
});


//get route for signup
router.get("/register",(req,res)=>{
    res.render("newuser");
})

//post route for signup
router.post("/register",
(req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).jsonp(errors.array());
    }
    else {
        bcrypt.hash(req.body.password, 10).then((hash) => {
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                password: hash
            });
            user.save().then((response) => {

                //nodemailer
                rand=cryptoRandomString({length: 100, type: 'url-safe'});
                host=req.get('host');
                link="http://"+req.get('host')+"/dsc/user/verify/"+user._id+"?tkn="+rand;
                mailOptions={ 
                    from: process.env.NODEMAILER_EMAIL,
                    to: user.email,
                    subject : "Please confirm your Email account",
                    html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
                }
                // console.log(mailOptions);
                transporter.sendMail(mailOptions, function(error, response){
                 if(error){
                        console.log(error);
                    res.end("error");
                 }else{
                        console.log("Message sent: " + response.message);
                     }
                });
            //nodemailer ends
                res.locals.flashMessages = req.flash("success", user.name + " Email has been sent to you for verification");
                res.redirect("/dsc/");
            }).catch(error => {
                // res.status(500).json({
                //     error: error
                // });
                // console.log(error);
                res.locals.flashMessages = req.flash("error", "Email already in use try logging in");
                res.redirect("/dsc/");
            });
        });
    }
});

//get route for login
router.get("/login",function(req,res){
    res.render("newuser");
});

//post route for login
router.post("/login", (req, res, next) => {
    let getUser;
    User.findOne({
        email: req.body.email
    }).then(user => {
        if (!user) {
            req.flash("error","User not found try creating a new account");
            res.redirect("/dsc/");
        }
        getUser = user;
        return bcrypt.compare(req.body.password, user.password);
    }).then(response => {
        if (!response) {
            req.flash("error","You have entered wrong password");
            res.redirect("/dsc/");
        }
        if(getUser.active)
        {
            var token = jwt.sign({
                name: getUser.name,
                email: getUser.email,
                userId: getUser._id
            },process.env.JWT_SECRET, {
                expiresIn: "1d"
            });
            res.cookie( 'authorization', token,{ maxAge: 24*60*60*1000, httpOnly: false });
        }
        if(getUser.active)
        {
            req.flash("success",getUser.name + " you are logged in");
            res.redirect("/dsc/");
        }
        else
        {
            rand=cryptoRandomString({length: 100, type: 'url-safe'});
                host=req.get('host');
                link="http://"+req.get('host')+"/dsc/user/verify/"+getUser._id+"?tkn="+rand;
                mailOptions={ 
                    from: process.env.NODEMAILER_EMAIL,
                    to: getUser.email,
                    subject : "Please confirm your Email account",
                    html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
                }
                // console.log(mailOptions);
                transporter.sendMail(mailOptions, function(error, response){
                 if(error){
                        console.log(error);
                    res.end("error");
                 }else{
                        console.log("Message sent: " + response.message);
                     }
                });
            req.flash("error",getUser.name + " your email is not verified we have sent you an email");
            res.redirect("/dsc/");
        }
        
    }).catch(err => {
        req.flash("error",err);
        res.redirect("/dsc/");
    });
});

//checking for user
// router.get("/user",authorization,function(req,res){
//     res.send(req.user);
// });

//get route for logging out user
router.get("/logout",function(req,res){
    res.clearCookie('authorization');
    req.flash("success", "You are successfully logged out");
      res.redirect("/dsc/");
  });


//get route for forget password
router.get("/forgotpassword",function(req,res){
    res.render("forgotpassword");
});

//post route for forgotpassword
router.post("/forgotpassword",function(req,res){
    let getUser;
    User.findOne({
        email: req.body.email
    }).then(user => {
        if (!user) {
            req.flash("error","User not found try creating a new account");
            res.redirect("/dsc/");
        }
        getUser = user;
        rand=cryptoRandomString({length: 100, type: 'url-safe'});
                host=req.get('host');
                link="http://"+req.get('host')+"/dsc/user/verify/forgotpassword/"+getUser._id+"?tkn="+rand;
                mailOptions={ 
                    from: process.env.NODEMAILER_EMAIL,
                    to: getUser.email,
                    subject : "Please confirm your Email account",
                    html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
                }
                // console.log(mailOptions);
                transporter.sendMail(mailOptions, function(error, response){
                 if(error){
                        console.log(error);
                    res.end("error");
                 }else{
                        console.log("Message sent: " + response.message);
                     }
                });
            req.flash("success",getUser.name + " we sent you an email to reset your password");
            res.redirect("/dsc/");  
        
    });
});

//Post Route to edit User Profile Details
router.post('/profile',async (req,res)=>{
    const id = "5ed7cfe27cd0ad0860e3604b";
    try{
        const user = await User.findByIdAndUpdate(id,req.body);
        if(!user)
            throw new Error("User not found"); 
        res.status(200).send("Updated Successfully");
    }
    catch(error){
        console.error(error);
        res.status(500).send(error);
    }
});

//Establish Storage for file upload
const storage = multer.diskStorage({
	destination: function(req,file,cb){
		const newDestination = __dirname+`/../../public/upload/profile/${req.params.id}`;
		console.log("New Destination: ", newDestination);
		var stat = null;
		try{
			stat = fs.statSync(newDestination);
		}
		catch(err){
			fs.mkdir(newDestination,{recursive:true},(err)=>{
				if(err)
					console.error('New Directory Error: ',err);
				else
					console.log('New Directory Success');
			})
		}
		if(stat && !stat.isDirectory())
			throw new Error('Directory Couldnt be created');
		cb(null,newDestination);
	},
	filename:function(req,file,cb){
		cb(null,file.fieldname + '-' + uuid.v4() + path.extname(file.originalname));
	}
});
//(Profile Image)

const uploadProfileImage = multer({
	storage:storage,
	limits:{fileSize:1000000},
	fileFilter:function(req,file,cb){
		checkProfileImageType(file,cb);
	}
}).single('profile-image');


//Post Route to update Profile Image
router.post('/profile/upload/:id',async (req,res)=>{
    const id = req.params.id;
    let errors = [];
    let avatar;
        User.findById({_id:id})
        .then(user=>{
            if(!user)
            {
                errors.push({msg:'No Records of user found at this moment'})
                res.send({message:'Error'});
            }
            uploadProfileImage(req,res,(err)=>{
                if(err){
                    errors.push({message:err});
                    console.log("Error1",err);
                    avatar = '';
                }
                else{
                    if(req.file == undefined){
                        errors.push({msg:'No Image Selected'});
                        console.log("err2",errors);
                        avatar = undefined;
                    }
                    else{
                        avatar = `/profile/${user._id}/${req.file.filename}`;
                        console.log("avatar",avatar);
                    }
                }
            if(avatar != undefined){
                user.profileImageLocation = `${avatar}`;
            }
            else{
                user.profileImageLocation = '/img/avatar.png'  //if no image is set then select this for user  
            }   
            user.save()
            .then(user => {
                console.log("avatar value",avatar);
                if(errors.length==0){
                    console.log(' Profile Updated!');
                    res.send({message:'Profile Image Updated'});
                }
                else{
                    console.log(' Profile not Updated!');
                    res.send({message:'Profile Image not Updated'});
                }

            })
            .catch(err =>{
                console.log("profile not updated");             
            })
            });
    })
    .catch(err => {
        console.log("error",err); 
    })
});

module.exports = router;