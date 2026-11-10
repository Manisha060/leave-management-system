# Leave Management System

A simple full-stack leave management application with employee registration/login, leave balance, leave applications, and an admin approval/rejection panel.

## Features
- Employee registration with initial Casual and Medical leave balances.
- Login with JWT authentication.
- Employee dashboard showing leave balances and request history.
- Apply for Casual or Medical leave. Requests start as `Pending`.
- Admin dashboard to approve or reject pending requests.
- Leave balance is deducted only after an admin approves a request. Rejected requests do not deduct balance.
- Responsive purple/blue professional UI.

## Requirements
- Node.js 18+
- MongoDB Community Server running locally, or a MongoDB Atlas connection string.

## 1. Start MongoDB
Make sure your local MongoDB service is running. Default connection is `mongodb://127.0.0.1:27017/leave_management`.

## 2. Start backend
Open a terminal:
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` and edit values if needed. Set a long, private `JWT_SECRET` and your admin credentials. Then:
```bash
npm run dev
```
Backend runs at `http://localhost:5000`.

## 3. Create admin account
Open another terminal after setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`:
```bash
cd backend
npm run seed:admin
```
Use those credentials on the Login page. The admin account is created/updated with the admin role. Do not share the admin password.

## 4. Start frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in terminal, usually `http://localhost:5173`.

If your backend URL changes, create `frontend/.env` with:
```env
VITE_API_URL=http://localhost:5000/api
```

## Demo flow
1. Register an employee account and set initial leave balances.
2. Apply for Casual or Medical leave. The request appears as Pending.
3. Logout and login using the seeded admin email/password.
4. Approve or reject the employee request from the Admin Dashboard.
5. Login again as the employee. Approved leave days are deducted; rejected requests do not change the balance.

## Notes
- Public registration always creates an employee account; users cannot self-register as admins.
- Pending requests reserve the corresponding balance for additional pending applications, but the balance is deducted only after approval.
- This is an educational starter project. Before production deployment, add stronger validation, rate limiting, audit logging, HTTPS, secure cookie/token handling, and robust concurrent approval transactions.
