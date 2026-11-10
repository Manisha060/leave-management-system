const express = require("express");

const Leave = require("../models/Leave");
const User = require("../models/User");

const {
    protect,
    adminOnly
} = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Employee: Apply Leave
router.post("/", async (req, res) => {
    try {
        const { leaveType, days, reason } = req.body;

        const count = Number(days);

        if (
            !["Casual", "Medical"].includes(leaveType) ||
            !Number.isInteger(count) ||
            count < 1
        ) {
            return res.status(400).json({
                message: "Invalid leave details"
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