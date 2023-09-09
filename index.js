import express from "express"
import path from "path"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
// import { name } from "ejs"

const app = express()

app.use(express.static(path.join(path.resolve(),"public")))
app.use(express.urlencoded({extended:true}));
app.use(cookieParser())

const PORT = 5000;

app.set("view engine" , "ejs");
const connectToDB = async()=>{
    try{
    await mongoose.connect("mongodb://127.0.0.1:27017" , {
        dbName : "backend",
    })
    console.log("Database connected")
}
catch(e){
    console.error(e);
}
}

connectToDB();



const userSchema = new mongoose.Schema({
    name : String,
    email : String,
    password : String,
})

const User = mongoose.model("User" , userSchema)


const isAuthenticated = async (req,res,next)=>{
    const {token} = req.cookies;

    if(token){

        const decoded = jwt.verify(token , "afihvdnbisbndibns" )

        
        req.user = await User.findById(decoded._id)

        next()
    }
    else{
        res.redirect("/login")
    }
}

app.get("/" , isAuthenticated , (req,res)=>{
    console.log(req.user);
    res.render("logout.ejs" , {name : req.user.name})
   
})

app.get("/register" , (req,res)=>{
    
    res.render("register.ejs")
   
})





app.post("/register" , async (req,res)=>{

const {name , email , password} =   req.body

let user = await User.findOne({email})
if(user){
    return res.redirect("/login");
}

const hashedPassword = await bcrypt.hash(password , 10);
user = await User.create({
    name,
     email,
     password : hashedPassword,
})

const token = jwt.sign({_id : user._id} , "afihvdnbisbndibns" )


    res.cookie("token" ,token, {
        httpOnly:true,expires: new Date(Date.now() + 60*1000 )
    })
    res.redirect("/")
})


app.post("/login" , async (req,res)=>{

    const {email , password} = req.body;
    let user = await User.findOne({email})

    if(!user)return res.redirect("/register")

    const isMatch = await bcrypt.compare(password , user.password)

    if(!isMatch) return res.render("login" , {email , message : "Incorrect Password , try again"})

    const token = jwt.sign({_id : user._id} , "afihvdnbisbndibns" )


    res.cookie("token" ,token, {
        httpOnly:true,expires: new Date(Date.now() + 10*1000 )
    })
    res.redirect("/")
})
app.get("/logout" , (req,res)=>{
    res.cookie("token" , null , {
        httpOnly:true,
        expires: new Date(Date.now()  ),
    })
    res.redirect("/")
})

app.get("/login" , (req,res)=>{
    res.render("login.ejs")
})


app.listen(PORT , (req,res)=>{
    console.log("Server is working")
})
