// Smart Attendance System Logic

// --- Global Data & Init ---
const studentsData = [
    { roll: '101', name: 'Alice Smith' },
    { roll: '102', name: 'Bob Johnson' },
    { roll: '103', name: 'Charlie Brown' },
    { roll: '104', name: 'Diana Prince' },
    { roll: '105', name: 'Evan Davis' },
    { roll: '106', name: 'Fiona Garcia' },
    { roll: '107', name: 'George Miller' },
    { roll: '108', name: 'Hannah Wilson' },
    { roll: '109', name: 'Ian Moore' },
    { roll: '110', name: 'Jane Taylor' }
];

const isLoginPage = document.getElementById('loginForm') !== null;

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if(btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

initTheme();

const themeBtn = document.getElementById('themeToggleBtn');
if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        let currentTheme = document.documentElement.getAttribute('data-theme');
        let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    // Use fallback to avoid invalid date on some browsers
    return date.toLocaleDateString(undefined, options) !== 'Invalid Date' ? date.toLocaleDateString(undefined, options) : dateString;
}

// --- Login Logic ---
if (isLoginPage) {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'dashboard.html';
    }

    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        const errorMsg = document.getElementById('loginError');

        if (user === 'admin' && pass === 'admin123') {
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.style.display = 'block';
        }
    });
}

// --- Dashboard Logic ---
if (!isLoginPage) {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
    }

    const today = getTodayString();
    
    // Set Current Date
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (dateDisplay) dateDisplay.textContent = `Date: ${formatDateDisplay(today)}`;

    // Navigation
    const navBtns = document.querySelectorAll('.nav-btn[data-target]');
    const sections = document.querySelectorAll('.content-section');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-target')).classList.add('active');
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    const openMenuBtn = document.getElementById('openMenuBtn');
    if(openMenuBtn) openMenuBtn.addEventListener('click', () => document.getElementById('sidebar').classList.add('open'));
    
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    if(closeMenuBtn) closeMenuBtn.addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    });

    // --- Attendance Functions ---
    function getAttendanceData() {
        return JSON.parse(localStorage.getItem('attendance_data')) || {};
    }

    function saveAttendanceData(data) {
        localStorage.setItem('attendance_data', JSON.stringify(data));
    }

    function getTodayAttendance() {
        const data = getAttendanceData();
        if (!data[today]) { data[today] = {}; saveAttendanceData(data); }
        return data[today];
    }

    window.markAttendance = function(roll, status) {
        const data = getAttendanceData();
        if (!data[today]) data[today] = {};
        data[today][roll] = status;
        saveAttendanceData(data);
        renderAttendanceList();
        updateDashboardMetrics();
    };

    function renderAttendanceList(filterText = '') {
        const tbody = document.getElementById('studentList');
        if (!tbody) return;
        tbody.innerHTML = '';
        const todayAttendance = getTodayAttendance();

        const filteredStudents = studentsData.filter(s => 
            s.name.toLowerCase().includes(filterText.toLowerCase()) || 
            s.roll.includes(filterText)
        );

        filteredStudents.forEach(student => {
            const status = todayAttendance[student.roll];
            const tr = document.createElement('tr');
            
            let statusText = '-';
            let statusClass = '';
            if (status === 'present') { statusText = 'Present'; statusClass = 'text-success'; }
            else if (status === 'absent') { statusText = 'Absent'; statusClass = 'text-danger'; }

            tr.innerHTML = `
                <td>${student.roll}</td>
                <td>${student.name}</td>
                <td class="${statusClass}">${statusText}</td>
                <td class="action-buttons">
                    <button class="btn btn-success" onclick="markAttendance('${student.roll}', 'present')" ${status === 'present' ? 'disabled' : ''}>Present</button>
                    <button class="btn btn-danger" onclick="markAttendance('${student.roll}', 'absent')" ${status === 'absent' ? 'disabled' : ''}>Absent</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    const searchInput = document.getElementById('searchInput');
    if(searchInput) searchInput.addEventListener('input', (e) => renderAttendanceList(e.target.value));

    const markAllBtn = document.getElementById('markAllBtn');
    if(markAllBtn) markAllBtn.addEventListener('click', () => {
        const data = getAttendanceData();
        if (!data[today]) data[today] = {};
        studentsData.forEach(s => {
            if(!data[today][s.roll]) data[today][s.roll] = 'present';
        });
        saveAttendanceData(data);
        renderAttendanceList();
        updateDashboardMetrics();
    });

    const resetBtn = document.getElementById('resetBtn');
    if(resetBtn) resetBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to reset attendance for today?')) {
            const data = getAttendanceData();
            data[today] = {};
            saveAttendanceData(data);
            renderAttendanceList();
            updateDashboardMetrics();
        }
    });

    function updateDashboardMetrics() {
        const todayAttendance = getTodayAttendance();
        let presentCount = 0;
        let absentCount = 0;

        Object.values(todayAttendance).forEach(status => {
            if (status === 'present') presentCount++;
            else if (status === 'absent') absentCount++;
        });

        const dTotal = document.getElementById('dashTotal');
        const dPres = document.getElementById('dashPresent');
        const dAbs = document.getElementById('dashAbsent');

        if(dTotal) dTotal.textContent = studentsData.length;
        if(dPres) dPres.textContent = presentCount;
        if(dAbs) dAbs.textContent = absentCount;
    }

    // --- Records Logic ---
    const recordDateInput = document.getElementById('recordDate');
    if(recordDateInput) {
        recordDateInput.max = today;
        recordDateInput.value = today;

        function renderRecords(date) {
            const data = getAttendanceData();
            const recordList = document.getElementById('recordList');
            const summaryDiv = document.getElementById('recordSummary');
            const tableDiv = document.getElementById('recordTableContainer');
            const noRecordMsg = document.getElementById('noRecordMsg');

            if (data[date] && Object.keys(data[date]).length > 0) {
                const dailyData = data[date];
                let pres = 0, abs = 0;
                recordList.innerHTML = '';

                studentsData.forEach(student => {
                    const status = dailyData[student.roll];
                    if(status) {
                        const tr = document.createElement('tr');
                        let statusText = status === 'present' ? 'Present' : 'Absent';
                        let statusClass = status === 'present' ? 'text-success' : 'text-danger';
                        
                        if(status === 'present') pres++;
                        else abs++;

                        tr.innerHTML = `
                            <td>${student.roll}</td>
                            <td>${student.name}</td>
                            <td class="${statusClass}">${statusText}</td>
                        `;
                        recordList.appendChild(tr);
                    }
                });

                document.getElementById('recPresent').textContent = pres;
                document.getElementById('recAbsent').textContent = abs;

                summaryDiv.style.display = 'flex';
                tableDiv.style.display = 'block';
                noRecordMsg.style.display = 'none';
            } else {
                summaryDiv.style.display = 'none';
                tableDiv.style.display = 'none';
                noRecordMsg.style.display = 'block';
            }
        }

        recordDateInput.addEventListener('change', (e) => renderRecords(e.target.value));

        const recordsNavBtn = document.querySelector('.nav-btn[data-target="records-section"]');
        if(recordsNavBtn) recordsNavBtn.addEventListener('click', () => renderRecords(recordDateInput.value));
    }

    renderAttendanceList();
    updateDashboardMetrics();
}
