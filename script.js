/**
 * EduTrack Pro - Academic Attendance System
 * Logic & Data Management
 */

// --- Initial Data ---
const DEFAULT_STUDENTS = [
    { roll: '101', name: 'Aarav Sharma' },
    { roll: '102', name: 'Ishani Patel' },
    { roll: '103', name: 'Vihaan Gupta' },
    { roll: '104', name: 'Myra Singh' },
    { roll: '105', name: 'Arjun Verma' },
    { roll: '106', name: 'Ananya Reddy' },
    { roll: '107', name: 'Sai Kumar' },
    { roll: '108', name: 'Diya Iyer' },
    { roll: '109', name: 'Aditi Kulkarni' },
    { roll: '110', name: 'Rohan Das' }
];

// --- Core State Management ---
const state = {
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    currentUser: localStorage.getItem('currentUser') || null,
    users: JSON.parse(localStorage.getItem('users')) || [{ username: 'admin', password: 'admin123' }],
    theme: localStorage.getItem('theme') || 'light',
    students: [],
    attendance: {},
    activities: [],
    settings: { instName: 'EduTrack Institute' },
    currentSection: 'dashboard-section',
    calendarDate: new Date()
};

// --- Initialization ---
function init() {
    applyTheme();
    
    if (state.currentUser) {
        loadUserData(state.currentUser);
    }
    
    setupAuthGuard();
    
    if (window.location.pathname.includes('dashboard.html')) {
        setupDashboard();
    } else {
        setupLogin();
        setupSignup();
    }
}

function loadUserData(username) {
    state.students = JSON.parse(localStorage.getItem(`u_${username}_students`)) || DEFAULT_STUDENTS;
    state.attendance = JSON.parse(localStorage.getItem(`u_${username}_attendance`)) || {};
    state.activities = JSON.parse(localStorage.getItem(`u_${username}_activities`)) || [];
    state.settings = JSON.parse(localStorage.getItem(`u_${username}_settings`)) || { instName: 'EduTrack Institute' };
}

// --- Theme Management ---
function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const btns = document.querySelectorAll('#themeToggleBtn');
    btns.forEach(btn => {
        const icon = state.theme === 'dark' ? 'sun' : 'moon';
        btn.innerHTML = `<i data-lucide="${icon}"></i>`;
    });
    if (window.lucide) lucide.createIcons();
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.theme);
    applyTheme();
}

// --- Auth Guard ---
function setupAuthGuard() {
    const isDashboard = window.location.pathname.includes('dashboard.html');
    const isLogin = window.location.pathname.includes('login.html');
    const isSignup = window.location.pathname.includes('signup.html');
    const isHome = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');

    if (isDashboard && !state.isLoggedIn) {
        window.location.href = 'login.html';
    } else if ((isLogin || isSignup) && state.isLoggedIn) {
        window.location.href = 'dashboard.html';
    }
}

// --- Login Logic ---
function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value.trim().toLowerCase();
        const pass = document.getElementById('password').value;
        const errorMsg = document.getElementById('loginError');

        const foundUser = state.users.find(u => u.username === user && u.password === pass);

        if (foundUser) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', user);
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.style.display = 'block';
            errorMsg.innerHTML = '<i data-lucide="alert-circle" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i> Invalid username or password';
            if (window.lucide) lucide.createIcons();
        }
    });

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.onclick = toggleTheme;
}

// --- Signup Logic ---
function setupSignup() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value.trim().toLowerCase();
        const pass = document.getElementById('password').value;
        const confirmPass = document.getElementById('confirmPassword').value;
        const errorMsg = document.getElementById('signupError');

        if (pass !== confirmPass) {
            errorMsg.style.display = 'block';
            errorMsg.textContent = 'Passwords do not match';
            return;
        }

        if (state.users.some(u => u.username === user)) {
            errorMsg.style.display = 'block';
            errorMsg.textContent = 'Username already exists';
            return;
        }

        const newUser = { username: user, password: pass };
        state.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(state.users));

        // Auto-login after signup
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', user);
        window.location.href = 'dashboard.html';
    });
}

// --- Dashboard Logic ---
function setupDashboard() {
    // Basic UI Setup
    updateDateDisplay();
    setupNavigation();
    setupMobileMenu();
    
    // Display Username & Initials
    const userDisplay = document.getElementById('userNameDisplay');
    const initialsDisplay = document.getElementById('userInitials');
    if (userDisplay) userDisplay.textContent = state.currentUser;
    if (initialsDisplay && state.currentUser) {
        const name = state.currentUser;
        const parts = name.split(/[\s_-]+/);
        let initials = '';
        if (parts.length > 1) {
            initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        } else {
            initials = name.slice(0, 2).toUpperCase();
        }
        initialsDisplay.textContent = initials;
    }
    
    // Core Actions
    setupAttendanceActions();
    setupStudentManagement();
    setupRecords();
    setupCalendar();
    setupSettings();
    
    // Initial Render
    applySettings();
    renderDashboardMetrics();
    renderAttendanceList();
    renderManagementList();
    renderCalendar();
    renderRecentActivity();

    // Global Events
    document.getElementById('themeToggleBtn').onclick = toggleTheme;
    document.getElementById('logoutBtn').onclick = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    };
    
    document.getElementById('exportBtn').onclick = exportToCSV;
}

function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString(undefined, options);
    document.getElementById('currentDateDisplay').textContent = dateStr;
}

function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn[data-target]');
    const sections = document.querySelectorAll('.content-section');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
            
            // Re-render specific section content if needed
            if(target === 'records-section') renderRecords(document.getElementById('recordDate').value);
            
            // Close mobile menu
            document.getElementById('sidebar').classList.remove('open');
            if (window.lucide) lucide.createIcons();
        });
    });
}

function setupMobileMenu() {
    const openBtn = document.getElementById('openMenuBtn');
    if(openBtn) openBtn.onclick = () => document.getElementById('sidebar').classList.add('open');
}

// --- Attendance Logic ---
function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function setupAttendanceActions() {
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => renderAttendanceList(e.target.value));
    }

    document.getElementById('markAllBtn').onclick = () => {
        const today = getTodayKey();
        if(!state.attendance[today]) state.attendance[today] = {};
        
        state.students.forEach(s => {
            if(!state.attendance[today][s.roll]) {
                state.attendance[today][s.roll] = 'present';
            }
        });
        
        saveAttendance();
        renderAttendanceList();
        renderDashboardMetrics();
    };

    document.getElementById('resetBtn').onclick = () => {
        if(confirm('Clear all attendance logs for today?')) {
            const today = getTodayKey();
            delete state.attendance[today];
            saveAttendance();
            logActivity(`Cleared attendance logs for today`, 'warning');
            renderAttendanceList();
            renderDashboardMetrics();
        }
    };
}

window.markAttendance = function(roll, status) {
    const today = getTodayKey();
    if (!state.attendance[today]) state.attendance[today] = {};
    
    state.attendance[today][roll] = status;
    saveAttendance();
    logActivity(`Marked roll #${roll} as ${status}`);
    showToast(`Attendance updated for #${roll}`);
    renderAttendanceList();
    renderDashboardMetrics();
};

function renderAttendanceList(filter = '') {
    const tbody = document.getElementById('studentList');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const today = getTodayKey();
    const todayData = state.attendance[today] || {};

    const filtered = state.students.filter(s => 
        s.name.toLowerCase().includes(filter.toLowerCase()) || 
        s.roll.includes(filter)
    );

    filtered.forEach(student => {
        const status = todayData[student.roll];
        const tr = document.createElement('tr');
        
        let statusBadge = '<span class="badge badge-neutral">Not Marked</span>';
        if (status === 'present') statusBadge = '<span class="badge badge-success">Present</span>';
        else if (status === 'absent') statusBadge = '<span class="badge badge-danger">Absent</span>';

        tr.innerHTML = `
            <td>#${student.roll}</td>
            <td style="font-weight: 500;">${student.name}</td>
            <td>${statusBadge}</td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn btn-outline btn-icon" title="Mark Present" onclick="markAttendance('${student.roll}', 'present')" ${status === 'present' ? 'style="background: var(--success); color: white; border-color: var(--success);"' : ''}>
                        <i data-lucide="check"></i>
                    </button>
                    <button class="btn btn-outline btn-icon" title="Mark Absent" onclick="markAttendance('${student.roll}', 'absent')" ${status === 'absent' ? 'style="background: var(--danger); color: white; border-color: var(--danger);"' : ''}>
                        <i data-lucide="x"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if (window.lucide) lucide.createIcons();
}

// --- Student Management ---
function setupStudentManagement() {
    const form = document.getElementById('addStudentForm');
    if (!form) return;

    form.onsubmit = (e) => {
        e.preventDefault();
        const roll = document.getElementById('newRoll').value;
        const name = document.getElementById('newName').value;

        if (state.students.some(s => s.roll === roll)) {
            alert('A student with this roll number already exists!');
            return;
        }

        state.students.push({ roll, name });
        saveStudents();
        logActivity(`Added new student: ${name} (#${roll})`);
        renderManagementList();
        renderAttendanceList();
        renderDashboardMetrics();
        
        form.reset();
        document.getElementById('addStudentModal').style.display = 'none';
    };
}

window.deleteStudent = function(roll) {
    if (confirm('Are you sure? This will not delete past attendance records.')) {
        const student = state.students.find(s => s.roll === roll);
        state.students = state.students.filter(s => s.roll !== roll);
        saveStudents();
        logActivity(`Removed student: ${student ? student.name : roll}`, 'warning');
        renderManagementList();
        renderAttendanceList();
        renderDashboardMetrics();
    }
};

function renderManagementList() {
    const tbody = document.getElementById('manageStudentsList');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    state.students.forEach(student => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${student.roll}</td>
            <td style="font-weight: 500;">${student.name}</td>
            <td style="text-align: right;">
                <button class="btn btn-outline btn-icon" style="color: var(--danger);" onclick="deleteStudent('${student.roll}')">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

// --- Records & Metrics ---
function renderDashboardMetrics() {
    const today = getTodayKey();
    const todayData = state.attendance[today] || {};
    
    let presentCount = 0;
    let absentCount = 0;
    
    Object.values(todayData).forEach(status => {
        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
    });

    const total = state.students.length;
    const percent = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    document.getElementById('dashTotal').textContent = total;
    document.getElementById('dashPresent').textContent = presentCount;
    document.getElementById('dashAbsent').textContent = absentCount;
    document.getElementById('dashPercent').textContent = `${percent}%`;
}

function setupRecords() {
    const recordDate = document.getElementById('recordDate');
    if(!recordDate) return;

    const today = getTodayKey();
    recordDate.value = today;
    recordDate.max = today;

    recordDate.onchange = (e) => renderRecords(e.target.value);
}

function renderRecords(date) {
    const tbody = document.getElementById('recordList');
    const summary = document.getElementById('recordSummary');
    const container = document.getElementById('recordTableContainer');
    const noMsg = document.getElementById('noRecordMsg');
    
    if(!tbody) return;

    const recordData = state.attendance[date];

    if (recordData && Object.keys(recordData).length > 0) {
        tbody.innerHTML = '';
        let p = 0, a = 0;

        state.students.forEach(s => {
            const status = recordData[s.roll];
            if(!status) return;

            if(status === 'present') p++; else a++;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${s.roll}</td>
                <td>${s.name}</td>
                <td><span class="badge ${status === 'present' ? 'badge-success' : 'badge-danger'}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('recPresent').textContent = p;
        document.getElementById('recAbsent').textContent = a;
        
        summary.style.display = 'flex';
        container.style.display = 'block';
        noMsg.style.display = 'none';
    } else {
        summary.style.display = 'none';
        container.style.display = 'none';
        noMsg.style.display = 'block';
    }
}

// --- Helpers ---
function saveStudents() {
    if (!state.currentUser) return;
    localStorage.setItem(`u_${state.currentUser}_students`, JSON.stringify(state.students));
}

function saveAttendance() {
    if (!state.currentUser) return;
    localStorage.setItem(`u_${state.currentUser}_attendance`, JSON.stringify(state.attendance));
}

function logActivity(message, type = 'info') {
    if (!state.currentUser) return;
    const activity = {
        message,
        type,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
    };
    state.activities.unshift(activity);
    if (state.activities.length > 10) state.activities.pop();
    localStorage.setItem(`u_${state.currentUser}_activities`, JSON.stringify(state.activities));
    renderRecentActivity();
}

function renderRecentActivity() {
    const list = document.getElementById('recentActivityList');
    if (!list) return;

    if (state.activities.length === 0) {
        list.innerHTML = '<p class="text-muted" style="text-align: center; padding: 1rem;">No recent activities logged.</p>';
        return;
    }

    list.innerHTML = state.activities.map(act => `
        <div style="display: flex; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border); font-size: 0.875rem;">
            <div style="color: var(--text-muted); min-width: 60px;">${act.time}</div>
            <div style="flex: 1; color: var(--text-main); font-weight: 500;">${act.message}</div>
        </div>
    `).join('');
}

function exportToCSV() {
    const date = document.getElementById('recordDate').value;
    const records = state.attendance[date];
    
    if(!records || Object.keys(records).length === 0) {
        alert('No data to export for this date');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Roll Number,Name,Status\n";
    state.students.forEach(s => {
        const status = records[s.roll] || 'N/A';
        csvContent += `${s.roll},${s.name},${status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Calendar Logic ---
function setupCalendar() {
    const prev = document.getElementById('prevMonth');
    const next = document.getElementById('nextMonth');
    
    if(prev) prev.onclick = () => {
        state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
        renderCalendar();
    };
    
    if(next) next.onclick = () => {
        state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
        renderCalendar();
    };
}

function renderCalendar() {
    const monthYear = document.getElementById('calendarMonth');
    const daysContainer = document.getElementById('calendarDays');
    if(!daysContainer || !monthYear) return;

    const date = state.calendarDate;
    const year = date.getFullYear();
    const month = date.getMonth();

    monthYear.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    daysContainer.innerHTML = '';

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day empty';
        daysContainer.appendChild(div);
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let day = 1; day <= daysInMonth; day++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.textContent = day;

        const currentStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (currentStr === todayStr) div.classList.add('today');
        if (state.attendance[currentStr]) div.classList.add('has-data');

        div.onclick = () => {
            // Navigate to records for this date
            const recordDateInput = document.getElementById('recordDate');
            if(recordDateInput) {
                recordDateInput.value = currentStr;
                renderRecords(currentStr);
                
                // Show records section
                const recordBtn = document.querySelector('.nav-btn[data-target="records-section"]');
                if(recordBtn) recordBtn.click();
            }
        };

        daysContainer.appendChild(div);
    }
}

// --- Settings & Utils ---
function setupSettings() {
    const form = document.getElementById('settingsForm');
    if(form) {
        document.getElementById('instName').value = state.settings.instName;
        form.onsubmit = (e) => {
            e.preventDefault();
            state.settings.instName = document.getElementById('instName').value;
            if (state.currentUser) {
                localStorage.setItem(`u_${state.currentUser}_settings`, JSON.stringify(state.settings));
            }
            applySettings();
            showToast('Settings saved successfully');
            logActivity('Updated Institute settings');
        };
    }

    const resetBtn = document.getElementById('factoryReset');
    if(resetBtn) {
        resetBtn.onclick = () => {
            if(confirm('CRITICAL: This will delete EVERYTHING. Students, logs, settings. Are you absolutely sure?')) {
                localStorage.clear();
                location.reload();
            }
        };
    }
}

function applySettings() {
    const titles = document.querySelectorAll('.sidebar-header h2, .login-header p');
    titles.forEach(t => {
        if(t.tagName === 'H2') t.textContent = state.settings.instName;
        else t.textContent = `Management Portal - ${state.settings.instName}`;
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if(!toast) return;

    toastMsg.textContent = msg;
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Start the app
init();
