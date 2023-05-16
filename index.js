const express = require("express");
const cors = require("cors");
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
    const categoryCollection = client
      .db("electriX")
      .collection("productCategories");
    const productCollection = client.db("electriX").collection("products");

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
      console.log(category);
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
