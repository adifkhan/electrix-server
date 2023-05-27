const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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

// this function will verify JWT for clients requests //
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
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
        { expiresIn: "1d" }
      );
      res.send({ result, token });
    });

    // update user info //
    app.put("/user", async (req, res) => {
      const user = req.body;
      const email = user.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // get single user information by query //
    app.get("/user", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    // get all users information //
    app.get("/allusers", async (req, res) => {
      const query = {};
      const allUsers = await userCollection.find(query).toArray();
      res.send(allUsers);
    });

    // get the all product-categories //
    app.get("/categories", async (req, res) => {
      const query = {};
      const cursor = categoryCollection.find(query);
      const categories = await cursor.toArray();
      res.send(categories);
    });

    // add or put a new product //
    app.put("/product", verifyJWT, async (req, res) => {
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

    // get products of single seller/user //
    app.get("/myproducts", verifyJWT, async (req, res) => {
      const sellerId = req.query.sellerId;
      const query = { sellerId: sellerId };
      const result = productCollection.find(query);
      const products = await result.toArray();
      res.send(products);
    });

    /*  //delete single product //
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(filter);
      res.send(result);
    }); */

    // post carts in database  //
    app.post("/addtocart", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const cursor = cartCollection.find(filter);
      const myCart = await cursor.toArray();
      const cartProduct = req.body;
      const inCart = myCart.find(
        (item) => item.productId === cartProduct.productId
      );
      if (inCart) {
        const result = await cartCollection.replaceOne(
          { _id: inCart._id },
          cartProduct
        );
        res.send(result);
      } else {
        const result = await cartCollection.insertOne(cartProduct);
        res.send(result);
      }
    });

    // get carts product by email //
    app.get("/mycart", verifyJWT, async (req, res) => {
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
