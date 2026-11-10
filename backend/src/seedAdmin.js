require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const email = process.env.ADMIN_EMAIL.toLowerCase().trim();

        const password = await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            10
        );

        await User.findOneAndUpdate(
            { email },
            {
                username: process.env.ADMIN_NAME,
                email,
                rollNumber: "ADMIN",
                password,
                role: "admin",
                casualLeave: 0,
                medicalLeave: 0
            },
            {
                upsert: true,
                new: true
            }
        );

        console.log("Admin account created successfully");
        console.log("Email:", email);

    } catch (error) {
        console.log("Admin creation failed:", error.message);
        process.exitCode = 1;

    } finally {
        if (mongoose.connection.readyState) {
            await mongoose.disconnect();
        }
    }
}

createAdmin();