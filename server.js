const express = require('express');
const multer = require("multer");
const bodyParser = require("body-parser");

const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const fs = require('fs');

const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({extended:true}));

const uri = process.env.DB_PATH;
let client = new MongoClient(uri, { useNewUrlParser: true });

var storage = multer.diskStorage({
    destination:function(req, file, cb){
        cb(null, 'uploads')
    },
    filename:function(req,file,cb){
        cb(null, file.fieldname + '-' +  Date.now() + path.extname(file.originalname))
    }
})


var upload = multer({
    storage:storage
})

//configure the home route
app.get('/',(req, res)=>{
    res.sendFile(__dirname+"/index.html");
})


//configure the single file routes

app.post('/uploadfile', upload.single('myFile'), (req, res, next)=>{
    const file = req.file;
    if(!file){
        const error = new Error("Please Upload a file");
        error.httpStatusCode = 400;
        return next(error);
    }
    res.send(file);
})

app.post('/uplloadMultiple', upload.array('myFiles', 12),(req,res,next)=>{
    const files = req.files;
    if(!files){
        const error = new Error("Please Choose files!");
        error.httpStatusCode = 400;
        return next(error);
    }

    //no error
    res.send(files);
})

//Configure the image upload to the database
app.post('/uploadPhoto', upload.single('myImage'),(req,res)=>{
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');

    //Define a JSOn Object for the image

    var finalImg ={
        contentType: req.file.mimetype,
        path:req.file.path,
        image:new Buffer(encode_image, 'base64')
    }

    //Insert the image to the database
    client = new MongoClient(uri, { useNewUrlParser: true });
    
    client.connect(err => {
        const collection = client.db("FileUploads").collection("File");
        collection.insertOne(finalImg, (err, result) =>{
            if(err){
                return console.log(err)
            };
            console.log("Saved to the database");
            res.contentType(finalImg.contentType);
            res.send(finalImg.image)
        });
        
        client.close();
    });
})




const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(`Server is starting from PORT ${PORT}`);
})