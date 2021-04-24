const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require ("multer");
const GridFsStorage = require ("multer-gridfs-storage");
const Grid = require('gridfs-stream');
const path = require("path");
const food = require('./food');


Grid.mongo = mongoose.mongo;

//app config
const app = express();
const port =  5000;
const mongoURI = "mongodb+srv://Admin:12345@cluster0.daocp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";


//middleware
app.use(cors());
app.use(express.json());


//db config
const conn = mongoose.createConnection(mongoURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});


mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
});

mongoose.connection.once("open", () => {
    console.log("DB connect");
});

let gfs

conn.once("open", () => {
    console.log("DB connect");
    gfs = Grid(conn.db, mongoose.mongo)
    gfs.collection("images")

})

const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            {
                const filename = 'image-' + Date.now() + path.extname(file.originalname);

                const fileInfo = {
                    filename: filename,
                    bucketName: "images"
                }
                resolve(fileInfo)
            }
        })
    }
})

const upload = multer({ storage })

//api routes

app.get("/", (req, res) => res.status(200).send("Food Server Running"));

app.post("/upload/image", upload.single("file"), (req, res) => {
    res.status(201).send(req.file)
})

app.get("/retrive/image/single", (req, res) => {
    gfs.files.findOne({ filename: req.query.name }, (err, file) => {
        if (err) {
            res.status(500).send(err)
        } else {
            if (!file || file.length === 0) {
                res.status(404).json({ err: "file not found" })
            } else {
                const readstream = gfs.createReadStream(file.filename);
                readstream.pipe(res);
            }
        }
    })
})

app.post("/add/food", (req, res) => {
    const dbfood = req.body

    console.log(dbfood)

    food.create(dbfood, (err, file) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).json({
                message: "Food is added",
                dbfood
            })
        }

    })
})

app.get("/retrive/foods", (req, res) => {
    food.find()
        .exec()
        .then(response => {
            res.status(200).json(response)
            console.log(response)
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err });
        })

})

app.patch("/edit/food",async(req, res) => {
    const foodID = req.query.id
    const details = req.body

    try {
        await food.updateOne({ _id: foodID }, details)
            .then(food => {
                res.status(200).json({
                    message: "Sucessfully Updated",
                    food
                })
            })

    }
    catch (err) {
        console.log(err.message);
        res.status(500).send("Error in Saving");
    }
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});