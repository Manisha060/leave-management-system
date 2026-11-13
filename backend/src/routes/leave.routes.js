
const express = require("express");

const Leave = require("../models/Leave");
const User = require("../models/User");

const {
    protect,
    adminOnly
} = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Get current date in India (YYYY-MM-DD)
const getTodayIndia = () => {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
};

// Validate YYYY-MM-DD and ensure it is a real calendar date
const isValidDate = value => {
    if (typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

// Calculate inclusive leave days
const calculateDays = (fromDate, toDate) => {
    const start = new Date(`${fromDate}T00:00:00Z`);
    const end = new Date(`${toDate}T00:00:00Z`);

    return Math.floor((end - start) / 86400000) + 1;
};

// Employee: Apply Leave
router.post("/", async (req, res) => {
    try {
        const {
            leaveType,
            fromDate,
            toDate,
            reason
        } = req.body;

        if (!["Casual", "Medical"].includes(leaveType)) {
            return res.status(400).json({
                message: "Invalid leave type"
            });
        }

        if (!isValidDate(fromDate) || !isValidDate(toDate)) {
            return res.status(400).json({
                message: "Please enter valid leave dates"
            });
        }

        const today = getTodayIndia();

        if (fromDate < today || toDate < today) {
            return res.status(400).json({
                message: "Past dates are not allowed. Please select today or a future date."
            });
        }

        if (toDate < fromDate) {
            return res.status(400).json({
                message: "To Date cannot be earlier than From Date"
            });
        }

        const count = calculateDays(fromDate, toDate);

        if (!Number.isInteger(count) || count < 1) {
            return res.status(400).json({
                message: "Invalid leave date range"
            });
        }

        const balance = leaveType === "Casual"
            ? req.user.casualLeave
            : req.user.medicalLeave;

        const pending = await Leave.aggregate([
            {
                $match: {
                    employee: req.user._id,
                    leaveType,
                    status: "Pending"
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$days" }
                }
            }
        ]);

        const pendingDays = pending[0]?.total || 0;

        if (count + pendingDays > balance) {
            return res.status(400).json({
                message: "Insufficient leave balance"
            });
        }

        const leave = await Leave.create({
            employee: req.user._id,
            leaveType,
            fromDate,
            toDate,
            days: count,
            reason: String(reason || "").trim(),
            status: "Pending"
        });

        res.status(201).json({
            message: "Leave applied successfully",
            leave
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Leave application failed"
        });
    }
});

// Employee: View own leave requests
router.get("/mine", async (req, res) => {
    try {
        const leaves = await Leave.find({
            employee: req.user._id
        }).sort({ createdAt: -1 });

        res.json({ leaves });

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch leaves"
        });
    }
});

// Admin: View all leave requests
router.get("/admin/all", adminOnly, async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate("employee", "username email rollNumber")
            .populate("reviewedBy", "username email")
            .sort({ createdAt: -1 });

        res.json({ leaves });

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch leave requests"
        });
    }
});

// Admin: Approve or Reject with reason
router.patch("/admin/:id/review", adminOnly, async (req, res) => {
    try {
        const { status, reviewReason } = req.body;

        const note = String(reviewReason || "").trim();

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        if (note.length < 3) {
            return res.status(400).json({
                message: "Admin review reason is required"
            });
        }

        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                message: "Leave request not found"
            });
        }

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message: "Request already reviewed"
            });
        }

        // Deduct balance only if approved
        if (status === "Approved") {

            const balanceField = leave.leaveType === "Casual"
                ? "casualLeave"
                : "medicalLeave";

            const updatedUser = await User.findOneAndUpdate(
                {
                    _id: leave.employee,
                    [balanceField]: { $gte: leave.days }
                },
                {
                    $inc: {
                        [balanceField]: -leave.days
                    }
                },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(400).json({
                    message: "Insufficient leave balance. Cannot approve."
                });
            }
        }

        leave.status = status;
        leave.reviewReason = note;
        leave.reviewedBy = req.user._id;
        leave.reviewedAt = new Date();

        await leave.save();

        await leave.populate(
            "employee",
            "username email rollNumber"
        );

        res.json({
            message: `Leave ${status} successfully`,
            leave
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Unable to review leave"
        });
    }
});

module.exports = router;
