const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const cors = require("cors");

const PORT = 4000;

const mongourl = "mongodb://127.0.0.1:27017";

app.use(express.json());
app.use(cors());

// Database Name
const dbName = "ecommerce";

// Collection Name
const collectionName = "productdetails";

const mongodbconnction = async () => {
  try {
    const client = await MongoClient.connect(mongourl);
    console.log("Connected to the MongoDB server");

    // Select the database
    const db = client.db(dbName);

    // Select the collection
    const collection = db.collection(collectionName);

    app.get("/product", async (req, res) => {
      const data = await collection.find({}).toArray();
      const offer = await collection.find({}).limit(3).toArray();

      res.json({ alldata: data, offer });
    });

    app.get("/singleproductdetails/:_id", async (req, res) => {
      const { _id } = req.params;
      const data = await collection.findOne({ _id: Number(_id) });
      res.json(data);
    });

    app.listen(PORT, () => {
      console.log(`port is listening http://localhost:${PORT}`);
    });

    // client.close();
    // console.log("Connection closed");
  } catch (err) {
    console.log(err);
  }
};

mongodbconnction();
