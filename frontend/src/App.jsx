import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";

import {
    CalendarDays,
    ClipboardList,
    LogOut,
    LayoutDashboard,
    RefreshCw,
    Send,
    ShieldCheck,
    Stethoscope,
    UserRound,
    Check,
    X,
    Clock3,
    LockKeyhole,
    Mail,
    Hash,
    Sparkles,
    MessageSquareText
} from "lucide-react";

const API = "https://leave-management-system-kjch.onrender.com/api";

const client = axios.create({
    baseURL: API
});

const authHeader = token => ({
    headers: {
        Authorization: `Bearer ${token}`
    }
});

export default function App() {

    const [token, setToken] = useState(
        localStorage.getItem("leaveToken") || ""
    );

    const [user, setUser] = useState(
        JSON.parse(
            localStorage.getItem("leaveUser") || "null"
        )
    );

    const [page, setPage] = useState("login");

    const [leaves, setLeaves] = useState([]);

    const [busy, setBusy] = useState(false);

    const [notice, setNotice] = useState("");

    const [reviewNotes, setReviewNotes] = useState({});

    const [auth, setAuth] = useState({
        username: "",
        email: "",
        rollNumber: "",
        password: "",
        initialCasualLeave: 1,
        initialMedicalLeave: 2
    });

    const [form, setForm] = useState({
        leaveType: "Casual",
        days: 1,
        reason: ""
    });

    const message = text => {
        setNotice(text);

        setTimeout(() => {
            setNotice("");
        }, 3500);
    };

    // Save login details
    const saveSession = data => {

        localStorage.setItem(
            "leaveToken",
            data.token
        );

        localStorage.setItem(
            "leaveUser",
            JSON.stringify(data.user)
        );

        setToken(data.token);
        setUser(data.user);
    };

    // Logout
    const logout = () => {

        localStorage.removeItem("leaveToken");
        localStorage.removeItem("leaveUser");

        setToken("");
        setUser(null);
        setLeaves([]);
        setPage("login");
    };

    // Refresh user details
    const refreshUser = async () => {

        const { data } = await client.get(
            "/auth/me",
            authHeader(token)
        );

        setUser(data.user);

        localStorage.setItem(
            "leaveUser",
            JSON.stringify(data.user)
        );
    };

    // Load leave requests
    const loadLeaves = async () => {

        const url = user.role === "admin"
            ? "/leaves/admin/all"
            : "/leaves/mine";

        const { data } = await client.get(
            url,
            authHeader(token)
        );

        setLeaves(data.leaves);
    };

    useEffect(() => {

        if (!token || !user) return;

        const load = async () => {

            try {
                await refreshUser();
                await loadLeaves();

            } catch (error) {
                logout();
            }
        };

        load();

    }, []);

    // Register and Login
    const submitAuth = async e => {

        e.preventDefault();

        setBusy(true);

        try {

            const endpoint = page === "register"
                ? "/auth/register"
                : "/auth/login";

            const payload = page === "register"
                ? auth
                : {
                    email: auth.email,
                    password: auth.password
                };

            const { data } = await client.post(
                endpoint,
                payload
            );

            saveSession(data);

            const url = data.user.role === "admin"
                ? "/leaves/admin/all"
                : "/leaves/mine";

            const result = await client.get(
                url,
                authHeader(data.token)
            );

            setLeaves(result.data.leaves);

            message("Login successful!");

        } catch (error) {

            message(
                error.response?.data?.message ||
                "Something went wrong"
            );

        } finally {
            setBusy(false);
        }
    };

    // Employee applies leave
    const applyLeave = async e => {

        e.preventDefault();

        setBusy(true);

        try {

            const { data } = await client.post(
                "/leaves",
                form,
                authHeader(token)
            );

            message(data.message);

            setForm({
                leaveType: "Casual",
                days: 1,
                reason: ""
            });

            await refreshUser();
            await loadLeaves();

        } catch (error) {

            message(
                error.response?.data?.message ||
                "Leave application failed"
            );

        } finally {
            setBusy(false);
        }
    };

    // Admin approves or rejects
    const reviewLeave = async (id, status) => {

        const reviewReason = (
            reviewNotes[id] || ""
        ).trim();

        if (reviewReason.length < 3) {
            message(
                "Please enter admin review reason"
            );
            return;
        }

        setBusy(true);

        try {

            const { data } = await client.patch(
                `/leaves/admin/${id}/review`,
                {
                    status,
                    reviewReason
                },
                authHeader(token)
            );

            message(data.message);

            setReviewNotes(current => ({
                ...current,
                [id]: ""
            }));

            await loadLeaves();

        } catch (error) {

            message(
                error.response?.data?.message ||
                "Review failed"
            );

        } finally {
            setBusy(false);
        }
    };

    // Refresh employee balance
    const refreshBalance = async () => {

        try {

            await refreshUser();

            message("Balance refreshed successfully");

        } catch {
            message("Unable to refresh balance");
        }
    };

    const date = value =>
        new Date(value).toLocaleDateString("en-IN");

    // LOGIN AND REGISTER
    if (!token || !user) {

        return (
            <div className="auth-page">

                <div className="auth-shell">

                    <aside className="auth-art">

                        <div className="brand-mark">
                            <CalendarDays />
                        </div>

                        <div className="calendar-illustration">
                            <CalendarDays size={80} />
                        </div>

                        <p className="eyebrow">
                            WORK • LIFE • BALANCE
                        </p>

                        <h1>
                            Leave Management
                            <br />
                            System
                        </h1>

                        <p className="art-copy">
                            Manage your leave requests
                            easily and professionally.
                        </p>

                    </aside>

                    <main className="auth-card">

                        <div className="form-icon">
                            <UserRound />
                        </div>

                        <p className="eyebrow center">
                            WELCOME TO LEAVEFLOW
                        </p>

                        <h2>
                            {page === "register"
                                ? "Create Account"
                                : "Welcome Back"}
                        </h2>

                        <p className="subheading">
                            {page === "register"
                                ? "Register your employee account"
                                : "Login to your account"}
                        </p>

                        <form
                            className="auth-form"
                            onSubmit={submitAuth}
                        >

                            {page === "register" && (
                                <>
                                    <label>Username</label>

                                    <div className="input-wrap">
                                        <UserRound />

                                        <input
                                            required
                                            placeholder="Enter username"
                                            value={auth.username}
                                            onChange={e =>
                                                setAuth({
                                                    ...auth,
                                                    username: e.target.value
                                                })
                                            }
                                        />
                                    </div>

                                    <label>Roll Number</label>

                                    <div className="input-wrap">
                                        <Hash />

                                        <input
                                            required
                                            placeholder="Enter roll number"
                                            value={auth.rollNumber}
                                            onChange={e =>
                                                setAuth({
                                                    ...auth,
                                                    rollNumber: e.target.value
                                                })
                                            }
                                        />
                                    </div>
                                </>
                            )}

                            <label>Email Address</label>

                            <div className="input-wrap">
                                <Mail />

                                <input
                                    type="email"
                                    required
                                    placeholder="Enter email"
                                    value={auth.email}
                                    onChange={e =>
                                        setAuth({
                                            ...auth,
                                            email: e.target.value
                                        })
                                    }
                                />
                            </div>

                            <label>Password</label>

                            <div className="input-wrap">
                                <LockKeyhole />

                                <input
                                    type="password"
                                    required
                                    minLength="6"
                                    placeholder="Enter password"
                                    value={auth.password}
                                    onChange={e =>
                                        setAuth({
                                            ...auth,
                                            password: e.target.value
                                        })
                                    }
                                />
                            </div>

                            {page === "register" && (
                                <div className="balance-inputs">

                                    <label>
                                        Initial Casual Leave

                                        <input
                                            type="number"
                                            min="0"
                                            value={auth.initialCasualLeave}
                                            onChange={e =>
                                                setAuth({
                                                    ...auth,
                                                    initialCasualLeave:
                                                        e.target.value
                                                })
                                            }
                                        />
                                    </label>

                                    <label>
                                        Initial Medical Leave

                                        <input
                                            type="number"
                                            min="0"
                                            value={auth.initialMedicalLeave}
                                            onChange={e =>
                                                setAuth({
                                                    ...auth,
                                                    initialMedicalLeave:
                                                        e.target.value
                                                })
                                            }
                                        />
                                    </label>

                                </div>
                            )}

                            <button
                                className="primary-btn"
                                disabled={busy}
                            >
                                {busy
                                    ? "Please wait..."
                                    : page === "register"
                                        ? "Register"
                                        : "Login"}

                                <Send size={17} />
                            </button>

                        </form>

                        <p className="switch-auth">

                            {page === "register"
                                ? "Already have an account?"
                                : "New employee?"}

                            <button
                                onClick={() =>
                                    setPage(
                                        page === "register"
                                            ? "login"
                                            : "register"
                                    )
                                }
                            >
                                {page === "register"
                                    ? "Login"
                                    : "Create Account"}
                            </button>

                        </p>

                        <div className="admin-hint">
                            <ShieldCheck size={18} />

                            <span>
                                Admin login uses the credentials
                                configured in backend/.env.
                            </span>
                        </div>

                    </main>

                </div>

                {notice && (
                    <div className="toast">
                        {notice}
                    </div>
                )}

            </div>
        );
    }

    // MAIN DASHBOARD
    return (

        <div className="app-layout">

            <aside className="sidebar">

                <div className="side-brand">
                    <span>
                        <CalendarDays />
                    </span>

                    <b>LeaveFlow</b>
                </div>

                <p className="side-label">
                    WORKSPACE
                </p>

                <button className="nav-item active">
                    <LayoutDashboard size={18} />
                    Dashboard
                </button>

                {user.role === "employee" && (
                    <button
                        className="nav-item"
                        onClick={() =>
                            document
                                .getElementById("apply-card")
                                ?.scrollIntoView({
                                    behavior: "smooth"
                                })
                        }
                    >
                        <ClipboardList size={18} />
                        Apply Leave
                    </button>
                )}

                <div className="side-spacer"></div>

                <div className="sidebar-user">

                    <div className="avatar">
                        {user.username[0].toUpperCase()}
                    </div>

                    <div>
                        <b>{user.username}</b>

                        <small>
                            {user.role === "admin"
                                ? "Administrator"
                                : `Roll No: ${user.rollNumber}`}
                        </small>
                    </div>

                </div>

                <button
                    className="nav-item logout"
                    onClick={logout}
                >
                    <LogOut size={18} />
                    Logout
                </button>

            </aside>

            <main className="main-content">

                <header className="topbar">

                    <div>
                        <span className="eyebrow">
                            YOUR WORKSPACE
                        </span>

                        <h2>
                            {user.role === "admin"
                                ? "Admin Dashboard"
                                : "Employee Dashboard"}
                        </h2>
                    </div>

                    <div className="top-user">
                        <UserRound size={20} />

                        {user.username}

                        <span className="role-pill">
                            {user.role}
                        </span>
                    </div>

                </header>

                <section className="welcome-row">

                    <div>
                        <p className="eyebrow">
                            LEAVE MANAGEMENT SYSTEM
                        </p>

                        <h1>
                            Hello, {user.username} ✦
                        </h1>

                        <p className="muted">
                            {user.role === "admin"
                                ? "Manage employee leave requests."
                                : "Manage your leave applications easily."}
                        </p>
                    </div>

                    <div className="welcome-icon">
                        <Sparkles />
                    </div>

                </section>

                {/* EMPLOYEE DASHBOARD */}

                {user.role === "employee" ? (

                    <>

                        <div className="section-heading">

                            <div>
                                <h3>Your Leave Balance</h3>
                                <p className="muted">
                                    Available leave days
                                </p>
                            </div>

                            <button
                                className="outline-btn"
                                onClick={refreshBalance}
                            >
                                <RefreshCw size={16} />
                                Refresh Balance
                            </button>

                        </div>

                        <div className="balance-grid">

                            <div className="balance-card casual">

                                <CalendarDays size={30} />

                                <p>Casual Leave</p>

                                <h2>
                                    {user.casualLeave}
                                    <small> Days Left</small>
                                </h2>

                            </div>

                            <div className="balance-card medical">

                                <Stethoscope size={30} />

                                <p>Medical Leave</p>

                                <h2>
                                    {user.medicalLeave}
                                    <small> Days Left</small>
                                </h2>

                            </div>

                        </div>

                        <section
                            className="panel"
                            id="apply-card"
                        >

                            <h3>Apply for Leave</h3>

                            <form
                                className="leave-form"
                                onSubmit={applyLeave}
                            >

                                <label>Leave Type</label>

                                <select
                                    value={form.leaveType}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            leaveType: e.target.value
                                        })
                                    }
                                >
                                    <option value="Casual">
                                        Casual Leave
                                    </option>

                                    <option value="Medical">
                                        Medical Leave
                                    </option>

                                </select>

                                <label>Number of Days</label>

                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={form.days}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            days: e.target.value
                                        })
                                    }
                                />

                                <label>Reason</label>

                                <textarea
                                    rows="3"
                                    placeholder="Enter your reason"
                                    value={form.reason}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            reason: e.target.value
                                        })
                                    }
                                />

                                <button
                                    className="primary-btn"
                                    disabled={busy}
                                >
                                    Apply Leave
                                    <Send size={16} />
                                </button>

                            </form>

                        </section>

                        {/* EMPLOYEE LEAVE HISTORY */}

                        <section className="panel history-panel">

                            <h3>My Leave Requests</h3>

                            <div className="table-wrap">

                                <table>

                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Days</th>
                                            <th>Status</th>
                                            <th>Admin Reason</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {leaves.map(leave => (

                                            <tr key={leave._id}>

                                                <td>{leave.leaveType}</td>

                                                <td>{leave.days}</td>

                                                <td>
                                                    <span className={`status ${leave.status.toLowerCase()}`}>
                                                        {leave.status}
                                                    </span>
                                                </td>

                                                <td>
                                                    {leave.reviewReason ||
                                                        "Waiting for admin"}
                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                                {leaves.length === 0 && (
                                    <p className="empty-state">
                                        No leave applications yet.
                                    </p>
                                )}

                            </div>

                        </section>

                    </>

                ) : (

                    /* ADMIN DASHBOARD */

                    <section className="panel admin-panel">

                        <div className="section-heading">

                            <div>
                                <h3>Employee Leave Requests</h3>

                                <p className="muted">
                                    Review and manage leave applications
                                </p>
                            </div>

                            <button
                                className="outline-btn"
                                onClick={loadLeaves}
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </button>

                        </div>

                        <div className="stats-row">

                            <div className="mini-stat">
                                <Clock3 />

                                <div>
                                    <b>
                                        {leaves.filter(
                                            l => l.status === "Pending"
                                        ).length}
                                    </b>

                                    <small>Pending</small>
                                </div>
                            </div>

                            <div className="mini-stat">
                                <Check />

                                <div>
                                    <b>
                                        {leaves.filter(
                                            l => l.status === "Approved"
                                        ).length}
                                    </b>

                                    <small>Approved</small>
                                </div>
                            </div>

                            <div className="mini-stat">
                                <X />

                                <div>
                                    <b>
                                        {leaves.filter(
                                            l => l.status === "Rejected"
                                        ).length}
                                    </b>

                                    <small>Rejected</small>
                                </div>
                            </div>

                        </div>

                        <div className="table-wrap">

                            <table>

                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Leave Details</th>
                                        <th>Employee Reason</th>
                                        <th>Admin Decision</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {leaves.map(leave => (

                                        <tr key={leave._id}>

                                            <td>
                                                <b>
                                                    {leave.employee?.username}
                                                </b>

                                                <small>
                                                    {leave.employee?.rollNumber}
                                                </small>

                                                <small>
                                                    {leave.employee?.email}
                                                </small>
                                            </td>

                                            <td>
                                                {leave.leaveType}

                                                <br />

                                                {leave.days} Day(s)
                                            </td>

                                            <td>
                                                {leave.reason || "No reason"}
                                            </td>

                                            <td>

                                                {leave.status === "Pending" ? (

                                                    <div className="review-box">

                                                        <label>
                                                            Admin Review Reason
                                                        </label>

                                                        <textarea
                                                            rows="2"
                                                            placeholder="Enter approval or rejection reason"
                                                            value={
                                                                reviewNotes[leave._id] || ""
                                                            }
                                                            onChange={e =>
                                                                setReviewNotes({
                                                                    ...reviewNotes,
                                                                    [leave._id]:
                                                                        e.target.value
                                                                })
                                                            }
                                                        />

                                                        <div className="action-buttons">

                                                            <button
                                                                className="approve-btn"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    reviewLeave(
                                                                        leave._id,
                                                                        "Approved"
                                                                    )
                                                                }
                                                            >
                                                                <Check size={15} />
                                                                Approve
                                                            </button>

                                                            <button
                                                                className="reject-btn"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    reviewLeave(
                                                                        leave._id,
                                                                        "Rejected"
                                                                    )
                                                                }
                                                            >
                                                                <X size={15} />
                                                                Reject
                                                            </button>

                                                        </div>

                                                    </div>

                                                ) : (

                                                    <div>

                                                        <span className={`status ${leave.status.toLowerCase()}`}>
                                                            {leave.status}
                                                        </span>

                                                        <p className="review-note">
                                                            <b>Admin Reason:</b>
                                                            {" "}
                                                            {leave.reviewReason}
                                                        </p>

                                                        <small>
                                                            {leave.reviewedAt
                                                                ? date(leave.reviewedAt)
                                                                : ""}
                                                        </small>

                                                    </div>

                                                )}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                            {leaves.length === 0 && (
                                <p className="empty-state">
                                    No leave requests available.
                                </p>
                            )}

                        </div>

                    </section>

                )}

                <footer className="footer">
                    LeaveFlow · Leave Management System
                </footer>

            </main>

            {notice && (
                <div className="toast">
                    {notice}
                </div>
            )}

        </div>
    );
}
