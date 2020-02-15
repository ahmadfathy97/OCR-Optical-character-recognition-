const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const {TesseractWorker} = require('tesseract.js');
const worker = new TesseractWorker();
const port = process.env.PORT;
const app = express();
global.random = Math.random().toString().slice(2,10);
function filter(file, cb) {
  let exts = ['png', 'jpg', 'jpeg'];
  let containeExts = exts.includes(file.mimetype.split('/')[1].toLowerCase()); //return true or false
  let allowdMimeType = file.mimetype.startsWith("image/"); //return true or false
  if(containeExts && allowdMimeType){
    return cb(null ,true)
  }
  else{
    cb('Error: File type not allowed!', false)
  }
}
let storage = multer.diskStorage({
  destination : (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, global.random + file.originalname);
  }
});
let upload = multer({
  storage: storage,
  limits: {fileSize: 1024 * 1024 * 10},
  fileFilter: function(req, file, cb) {
    filter(file, cb);
  }
}).single('image');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req,res)=>{
  res.render('index', {text: '', err:''});
});

app.post('/', (req, res)=>{
  upload(req, res, err=>{
    if (err) console.log(err);
    if(req.file){
      fs.readFile(__dirname + '/uploads/'+ global.random + req.file.originalname, (err, data)=>{
        if (err) console.log(err);
        global.random = Math.random().toString().slice(2,10);
        worker.recognize(data, "ara"/*, {tessjs_create_pdf: "1"}*/)
          .progress( progess =>{
            console.log(progess);
          })
          .then(result=>{
            res.render('index', {text: result.text, err:''});
            // const file = __dirname + '/tesseract.js-ocr-result.pdf';
            // res.download(file);
          })
          .finally(()=> worker.terminate());
      });
    } else {
      res.render('index', {text: '', err: 'you must upload a (jpg or png) picture'})
    }
  });
});





app.listen(port, ()=>{
  console.log(`app runs at port: ${port}`);
});
