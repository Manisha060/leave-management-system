const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const [form, setForm] = useState({
    leaveType: "Casual",
    fromDate: getToday(),
    toDate: getToday(),
    days: 1,
    reason: ""
});

const calculateLeaveDays = (fromDate, toDate) => {
    if (!fromDate || !toDate || toDate < fromDate) return 0;

    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);

    return Math.floor((end - start) / 86400000) + 1;
};
