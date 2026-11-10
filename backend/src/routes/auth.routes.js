const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// Employee Registration
router.post("/register", async (req, res) => {
    try {
        const {
            username,
            email,
            rollNumber,
            password,
            initialCasualLeave = 1,
            initialMedicalLeave = 2
        } = req.body;

        if (!username || !email || !rollNumber || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters"
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const casual = Number(initialCasualLeave);
        const medical = Number(initialMedicalLeave);

        if (
            !Number.isInteger(casual) || casual < 0 ||
            !Number.isInteger(medical) || medical < 0
        ) {
            return res.status(400).json({
                message: "Invalid leave balance"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email: email.toLowerCase().trim(),
            rollNumber,
            password: hashedPassword,
            casualLeave: casual,
            medicalLeave: medical,
            role: "employee"
        });

        const token = generateToken(user._id);

        res.status(201).json({
            message: "Registration successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                rollNumber: user.rollNumber,
                role: user.role,
                casualLeave: user.casualLeave,
                medicalLeave: user.medicalLeave
            }
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Registration failed"
        });
    }
});

// Login for Employee and Admin
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            email: String(email || "").toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(
            password || "",
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id);

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                rollNumber: user.rollNumber,
                role: user.role,
                casualLeave: user.casualLeave,
                medicalLeave: user.medicalLeave
            }
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Login failed"
        });
    }
});

// Get logged-in user details
router.get("/me", protect, (req, res) => {
    const user = req.user;

    res.json({
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            rollNumber: user.rollNumber,
            role: user.role,
            casualLeave: user.casualLeave,
            medicalLeave: user.medicalLeave
        }
    });
});

module.exports = router;