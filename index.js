const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const cors = require("cors");

const PORT = 4000;

const mongourl = "mongodb://127.0.0.1:27017";

// bcrypt
const bcrypt = require("bcrypt");

// jwt token
const jwt = require("jsonwebtoken");
const private_key = "key";

app.use(express.json());
app.use(cors());

// Database Name
const dbName = "ecommerce";

// Collection Name
const collectionName = "productdetails";
const collectionName2 = "signupdata";
const collectionName3 = "userdatas";

const mongodbconnction = async () => {
  try {
    const client = await MongoClient.connect(mongourl);
    console.log("Connected to the MongoDB server");

    // Select the database
    const db = client.db(dbName);

    // Select the collection
    const collection = db.collection(collectionName);

    // Select the collection2
    const signupdata = db.collection(collectionName2);

    // Select the collection3
    const userdatas = db.collection(collectionName3);

    // user name from token
    const tokenToUserName = async (req, res, next) => {
      const token = req.headers.authorization;
      if (token) {
        const { username } = await jwt.verify(token, private_key);

        req.username = username;
        next();
      }
    };

    // log in
    app.post("/sendtaskdetails", async (req, res) => {
      const { username, password } = req.body;

      if (username && password) {
        const userdata = await signupdata.findOne({ username });

        if (userdata) {
          const paswrodmatch = await bcrypt.compare(
            password,
            userdata.password
          );

          if (paswrodmatch) {
            const payload = {
              username,
            };
            const token = await jwt.sign(payload, private_key);
            res.json({ status: "success", token });
          } else {
            res.json({ status: "fail", err: "Password does not match" });
          }
        } else {
          res.json({ status: "fail", err: "No user found. Create an account" });
        }
      } else {
        res.json({ status: "fail", err: "No user found" });
      }
    });

    // sign up
    app.post("/signupdata", async (req, res) => {
      const { username, password } = req.body;

      console.log(req.body);

      const usernameavailability = await signupdata.findOne({ username });

      if (usernameavailability) {
        res.json({ status: "fail", err: "Username already exist" });
      } else {
        const hashedpassword = await bcrypt.hash(password, 10);
        signupdata.insertOne({ username, password: hashedpassword });

        userdatas.insertOne({ username, cartitems: [] });

        res.json({ status: "success" });
      }
    });

    // sending all product details to product page
    app.get("/product", async (req, res) => {
      const data = await collection.find({}).toArray();
      const offer = await collection.find({}).limit(3).toArray();

      res.json({ alldata: data, offer });
    });

    // sending single product data for add cart page
    app.get("/singleproductdetails/:_id", async (req, res) => {
      const { _id } = req.params;
      const data = await collection.findOne({ _id: Number(_id) });
      res.json(data);
    });

    // add to cart
    app.put("/addtocart", tokenToUserName, async (req, res) => {
      const body = req.body;

      const username = req.username;

      const data = await userdatas.findOne({
        username,
        cartitems: body,
      });

      if (!data) {
        userdatas.updateOne({ username }, { $push: { cartitems: body } });
      }

      res.json({ status: "success" });
    });

    // sending cart data for cart page
    app.get("/cartdata", tokenToUserName, async (req, res) => {
      const username = req.username;
      const data = await userdatas.findOne({
        username,
      });
      res.json(data.cartitems);
    });

    // remove a item from cart
    app.delete("/removefromcart/:_id", tokenToUserName, (req, res) => {
      const username = req.username;
      const _id = Number(req.params._id);

      console.log(_id);

      userdatas.updateOne({ username }, { $pull: { cartitems: { _id } } });

      res.json({ status: "success" });
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
