require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const leaveRoutes = require("./routes/leave.routes");

const app = express();
// Request logger - keep this BEFORE CORS
app.use((req, res, next) => {
    console.log("REQUEST RECEIVED:", req.method, req.url);
    console.log("REQUEST ORIGIN:", req.headers.origin);
    next();
});

app.use(cors({
    origin: [
        process.env.CLIENT_URL,
        "http://localhost:5173"
    ],
    credentials: true
}));

app.use(express.json());

app.use(cors({
    origin: [
        process.env.CLIENT_URL,
        "http://localhost:5173"
    ],
    credentials: true
}));

app.use(express.json());
// Temporary API request logger
app.use((req, res, next) => {
    console.log("REQUEST RECEIVED:", req.method, req.url);
    console.log("REQUEST ORIGIN:", req.headers.origin);

    next();
});

app.get("/", (req, res) => {
    res.send("Leave Management System API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");

        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    })
    .catch(error => {
        console.log("MongoDB connection failed:", error.message);
    });
