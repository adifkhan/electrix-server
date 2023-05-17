const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// electrixdb
// Cc9FLHOzBdUxRarH

const uri = `mongodb+srv://${process.env.electriXDB_USER}:${process.env.electriXDB_PASS}@cluster0.ew1mbi3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    client.connect;

    const userCollection = client.db("electriX").collection("users");
    const categoryCollection = client
      .db("electriX")
      .collection("productCategories");
    const productCollection = client.db("electriX").collection("products");
    const cartCollection = client.db("electriX").collection("carts");

    // PUT user  //
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = req.body;
      const options = { upsert: true };
      const updatedDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "3h" }
      );
      res.send({ result, token });
    });

    // get the all product-categories //
    app.get("/categories", async (req, res) => {
      const query = {};
      const cursor = categoryCollection.find(query);
      const categories = await cursor.toArray();
      res.send(categories);
    });

    // add or put a new product //
    app.put("/product", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    // get products according to selected category //
    app.get("/products", async (req, res) => {
      const category = req.query.category;
      if (category === "ALL-CATEGORY") {
        const query = {};
        const cursor = productCollection.find(query);
        const products = await cursor.toArray();
        res.send(products);
      } else {
        const query = { category: category };
        const cursor = productCollection.find(query);
        const products = await cursor.toArray();
        res.send(products);
      }
    });

    // post carts in database  //
    app.post("/add-to-cart", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const cart = req.body;
      const myCart = cartCollection.find(filter);
      const cursor = await myCart.toArray();
      const inCart = cursor.find((item) => item.productId === cart.productId);
      if (inCart) {
        inCart.quantity = inCart.quantity + 1;
        const result = await cartCollection.replaceOne(
          { _id: inCart._id },
          inCart
        );
        res.send(result);
      } else {
        const result = await cartCollection.insertOne(cart);
        res.send(result);
      }
    });

    // get carts product by email //
    app.get("/product-cart", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = cartCollection.find(filter);
      const cart = await result.toArray();
      res.send(cart);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from ElectriX!");
});

app.listen(port, () => {
  console.log("Listening to port", port);
});
