
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({

    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    leaveType: {
        type: String,
        enum: ["Casual", "Medical"],
        required: true
    },

    fromDate: {
        type: String,
        default: null
    },

    toDate: {
        type: String,
        default: null
    },

    days: {
        type: Number,
        required: true
    },

    reason: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    },

    reviewReason: {
        type: String,
        default: ""
    },

    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    reviewedAt: {
        type: Date,
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("Leave", leaveSchema);
