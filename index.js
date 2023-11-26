const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const CORS = require("cors");
require("dotenv").config();
app.use(CORS());
app.use(express.json());

const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j9yy4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const stripe = require("stripe")(process.env.STRIPE_KEY);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();

    const database = client.db("watch_store");
    const productCollection = database.collection("products");
    const orderCollection = database.collection("order");
    const reviewCollection = database.collection("review");
    const usersCollection = database.collection("user");

    // product api //
    // get all services
    app.get("/products", async (req, res) => {
      const cursor = productCollection.find({});
      const service = await cursor.toArray();
      res.send(service);
    });

    // GET Single Service
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await productCollection.findOne(query);
      res.json(service);
    });

    // POST API
    app.post("/products", async (req, res) => {
      const service = req.body;
      const result = await productCollection.insertOne(service);
      res.json(result);
    });

    // DELETE API for a product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.json(result);
    });

    // order api //
    // get API for all order
    app.get("/order", async (req, res) => {
      const cursor = orderCollection.find({});
      const service = await cursor.toArray();
      res.send(service);
    });

    // GET Single order
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.json(result);
    });

    // get API for order by email
    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const cursor = orderCollection.find({ email: email });
      const service = await cursor.toArray();
      res.send(service);
    });

    // POST API for order added
    app.post("/order", async (req, res) => {
      const booked = req.body;
      const result = await orderCollection.insertOne(booked);
      res.json(result);
    });

    // DELETE API for a booking
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.json(result);
    });

    // update order
    app.put("/order/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: payment,
        },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // review api //
    // get API for review
    app.get("/review", async (req, res) => {
      const result = reviewCollection.find({});
      const service = await result.toArray();
      res.send(service);
    });

    // POST API for review
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.json(result);
    });

    // post users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    // add into database after google singin
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // check admin
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // update admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;

      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const paymentInfo = req.body;
      const amount = paymentInfo.price;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    });
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running watch-commerce Server");
});

app.listen(port, () => {
  console.log("listing from port", port);
});
