import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();

app.use(express.static(path.join(__dirname, "/build")));
app.use(bodyParser.json());

const useDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://127.0.0.1:27017", {
      useNewUrlParser: true,
    });
    const db = client.db("blog");

    await operations(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error on connecting to database", error });
    console.log(error);
  }
};

app.get("/api/articles/:name", async (req, res) => {
  useDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(articleInfo);
  }, res);
});

app.post("/api/articles/:name/upvote", async (req, res) => {
  useDB(async (db) => {
    const { name } = req.params;

    const data = await db.collection("articles").findOne({ name: name });
    await db.collection("articles").updateOne(
      { name: name },
      {
        $set: {
          upvotes: data.upvotes + 1,
        },
      }
    );
    const updatedData = await db.collection("articles").findOne({ name: name });

    res.status(200).json(updatedData);
  }, res);
});

app.post("/api/articles/:name/add-comment", (req, res) => {
  useDB(async (db) => {
    const { user, text } = req.body;
    const { name } = req.params;

    const data = await db.collection("articles").findOne({ name: name });
    data.comments.push({
      user: user,
      text: text,
    });
    await db.collection("articles").updateOne(
      { name: name },
      {
        $set: {
          comments: data.comments,
        },
      }
    );
    const updatedData = await db.collection("articles").findOne({ name: name });

    res.status(200).json(updatedData);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(5000, () => console.log("Server is listening on port 5000"));
