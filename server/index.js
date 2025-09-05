// server/index.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

// middleware
app.use(cors());
app.use(express.json()); // parse JSON request bodies

// test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
