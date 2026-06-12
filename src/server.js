const express = require("express");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const { authenticateUser } = require("./middleware/authMiddleware");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(authenticateUser);
app.use("/", authRoutes);
app.use("/", medicineRoutes);
app.use("/", purchaseRoutes);

app.use((req, res) => {
  res.status(404).send("Page not found");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Pharmacy system running at http://localhost:${PORT}`);
});
