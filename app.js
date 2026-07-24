// ===== FIREBASE КОНФИГУРАЦИЯ =====
const firebaseConfig = {
    apiKey: "AIzaSyA2RxdMUGwhXBe-rpZjQQfDYG1T9UMmaV0",
    authDomain: "aculs-a5fe1.firebaseapp.com",
    databaseURL: "https://aculs-a5fe1-default-rtdb.firebaseio.com",
    projectId: "aculs-a5fe1",
    storageBucket: "aculs-a5fe1.firebasestorage.app",
    messagingSenderId: "176811002068",
    appId: "1:176811002068:web:ccb65f61e370b809c5d341",
    measurementId: "G-SL4YS8CEKE"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

auth.signInAnonymously()
    .then(() => console.log('✅ Анонимная авторизация успешна'))
    .catch(error => {
        console.error('Ошибка анонимной авторизации:', error);
        alert('Ошибка подключения к Firebase. Проверьте интернет и настройки.');
    });

const employeesRef = database.ref('employees');
const usersRef = database.ref('users');

// ===== НАСТРОЙКА ШРИФТОВ ДЛЯ PDFMAKE (поддержка кириллицы) =====
if (typeof pdfMake !== 'undefined') {
    pdfMake.fonts = {
        Roboto: {
            normal: 'Roboto-Regular.ttf',
            bold: 'Roboto-Medium.ttf',
            italics: 'Roboto-Italic.ttf',
            bolditalics: 'Roboto-MediumItalic.ttf'
        }
    };
}

// ===== ТАКТИЧЕСКИЙ ЗВУКОВОЙ СИНТЕЗАТОР (Web Audio API) =====
let soundEnabled = localStorage.getItem('asuls_sound') !== 'false';

function playSound(type) {
    if (!soundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (type === 'hover') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, ctx.currentTime);
            gain.gain.setValueAtTime(0.004, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } else if (type === 'click') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.015, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } else if (type === 'access_granted') {
            const now = ctx.currentTime;
            [600, 800, 1100].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = now + idx * 0.08;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.03, start);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.15);
            });
        } else if (type === 'error') {
            const now = ctx.currentTime;
            [220, 220].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = now + idx * 0.15;
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.05, start);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.25);
            });
        }
    } catch (e) {
        console.log('Audio Context block');
    }
}

// Глобальная делегация тактильных звуков
document.addEventListener('mouseover', function(e) {
    const target = e.target.closest('button, .btn-icon, .btn, .photo-thumb, select, input[type="checkbox"], input[type="file"]');
    if (target && !target.disabled) {
        playSound('hover');
    }
});

document.addEventListener('click', function(e) {
    const target = e.target.closest('button, .btn-icon, .btn, .photo-thumb, select, input[type="checkbox"], input[type="file"]');
    if (target && !target.disabled) {
        playSound('click');
    }
});

// ===== ЖУРНАЛ СИСТЕМНОЙ АКТИВНОСТИ =====
function addLogEntry(message) {
    const box = document.getElementById('activityLogBox');
    if (!box) return;
    const time = new Date().toLocaleTimeString();
    const user = currentUser ? currentUser.fullName : 'СИСТЕМА';
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span><span class="log-op">[${user}]:</span> ${message}`;
    box.appendChild(entry);
    box.scrollTop = box.scrollHeight;
    
    playSound('hover');
}

// ===== ИНТЕРАКТИВНЫЙ БУТ-ЭКРАН ДЕШИФРОВАНИЯ =====
function runDecryptionBoot(onComplete) {
    const decryptingScreen = document.getElementById('decryptingScreen');
    const terminalLog = document.getElementById('terminalLog');
    const progressFill = document.getElementById('cyberProgressFill');
    const percentDisplay = document.getElementById('cyberPercent');
    
    if (!decryptingScreen || !terminalLog) {
        onComplete();
        return;
    }
    
    decryptingScreen.style.display = 'flex';
    terminalLog.innerHTML = '';
    progressFill.style.width = '0%';
    percentDisplay.textContent = '0%';
    
    const logs = [
        '[Инициализация тактического подключения к АСУЛС УФСБ...]',
        '[Подключение к серверу удаленной базы данных: УСПЕШНО]',
        '[Проверка протокола шифрования: TLS 1.3 ЗАЩИЩЕНО]',
        '[Чтение цифровой подписи оператора: АВТОРИЗОВАНО]',
        '[Загрузка файлов шифрованных ключей в кэш...]',
        '[Расшифровка записей личного состава: ВЫПОЛНЕНО]',
        '[Контроль целостности структуры данных: 100% OK]',
        '[Авторизация завершена. Добро пожаловать в систему, Оперативник.]'
    ];
    
    let step = 0;
    const totalSteps = logs.length;
    
    function nextStep() {
        if (step < totalSteps) {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            line.textContent = logs[step];
            terminalLog.appendChild(line);
            terminalLog.scrollTop = terminalLog.scrollHeight;
            
            playSound('hover');
            
            step++;
            const percent = Math.round((step / totalSteps) * 100);
            progressFill.style.width = `${percent}%`;
            percentDisplay.textContent = `${percent}%`;
            
            setTimeout(nextStep, 220);
        } else {
            playSound('access_granted');
            setTimeout(() => {
                decryptingScreen.style.display = 'none';
                onComplete();
            }, 300);
        }
    }
    
    nextStep();
}

// ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (синхронизация в Firebase) =====
const MASTER_KEY = 'asuls_master_password';
const DEFAULT_MASTER = '123456';

function getMasterPassword() {
    let stored = localStorage.getItem(MASTER_KEY);
    if (!stored) {
        localStorage.setItem(MASTER_KEY, btoa(DEFAULT_MASTER));
        return DEFAULT_MASTER;
    }
    return atob(stored);
}

function setMasterPassword(newMaster) {
    localStorage.setItem(MASTER_KEY, btoa(newMaster));
}

let usersCache = [];

function loadUsers(callback) {
    usersRef.on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
            usersCache = Array.isArray(data) ? data : Object.values(data);
        } else {
            const defaultUser = { fullName: 'Администратор', password: 'admin', role: 'admin' };
            usersCache = [defaultUser];
            saveUsers();
        }
        if (callback) callback();
    });
}

function saveUsers() {
    usersRef.set(usersCache).catch(err => console.error('Ошибка сохранения пользователей:', err));
}

function getUsers() {
    return usersCache;
}

function authenticate(fullName, password, masterPassword) {
    if (masterPassword !== getMasterPassword()) {
        return { success: false, message: 'Неверный мастер-пароль' };
    }
    const user = usersCache.find(u => u.fullName === fullName && u.password === password);
    if (!user) {
        return { success: false, message: 'Неверное ФИО или пароль' };
    }
    return { success: true, user: user };
}

function registerUser(fullName, password, masterPassword) {
    if (masterPassword !== getMasterPassword()) {
        return { success: false, message: 'Неверный мастер-пароль' };
    }
    if (usersCache.find(u => u.fullName === fullName)) {
        return { success: false, message: 'Пользователь с таким ФИО уже существует' };
    }
    if (password.length < 4) {
        return { success: false, message: 'Пароль должен быть не менее 4 символов' };
    }
    usersCache.push({ fullName, password, role: 'user' });
    saveUsers();
    addLogEntry(`Зарегистрирован новый пользователь системы: ${fullName}`);
    return { success: true };
}

// ===== СОСТОЯНИЕ =====
let currentUser = null;
let isAdmin = false;
let employees = [];
let filteredEmployees = [];
let editingRowId = null; // id строки, которая сейчас редактируется

// ===== ЗАГРУЗКА ДАННЫХ ИЗ FIREBASE =====
function loadData() {
    employeesRef.on('value', snapshot => {
        const data = snapshot.val();
        const prevCount = employees.length;
        if (data) {
            employees = Object.values(data);
            employees = employees.map((emp, index) => {
                if (!emp.id) emp.id = Object.keys(data)[index];
                return emp;
            });
        } else {
            employees = [];
        }
        filteredEmployees = [...employees];
        applyFilters();
        populateFilterOptions();
        if (isAdmin) {
            const personalNumber = document.getElementById('personalNumber');
            if (personalNumber) personalNumber.value = generatePersonalNumber();
        }
        
        if (prevCount === 0 && employees.length > 0) {
            addLogEntry(`База данных успешно подключена. Загружено записей личного состава: ${employees.length}`);
        }
    });
}

function saveData() {
    const data = {};
    employees.forEach(emp => {
        data[emp.id] = emp;
    });
    employeesRef.set(data).then(() => {
        // Успешно сохранено
    }).catch(error => {
        alert('Ошибка сохранения: ' + error.message);
    });
}

// ===== ГЕНЕРАЦИЯ ЛИЧНОГО НОМЕРА =====
function generatePersonalNumber() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const existing = employees.filter(e => e.personalNumber && e.personalNumber.startsWith(year));
    const maxNum = existing.reduce((max, e) => {
        const num = parseInt(e.personalNumber.slice(2), 10);
        return num > max ? num : max;
    }, 0);
    return year + String(maxNum + 1).padStart(4, '0');
}

// ===== ВАЛИДАЦИЯ =====
function validateField(input) {
    const id = input.id;
    const value = input.value.trim();
    const msg = input.nextElementSibling;
    let valid = true;
    let errorText = '';
    if (id === 'lastName' || id === 'firstName') {
        if (!value) {
            valid = false;
            errorText = 'Поле обязательно';
        } else if (!/^[а-яА-Яa-zA-Z\s\-]+$/.test(value)) {
            valid = false;
            errorText = 'Только буквы, пробелы и дефис';
        }
    } else if (id === 'personalNumber' && value) {
        if (!/^\d+$/.test(value)) {
            valid = false;
            errorText = 'Только цифры';
        }
    }
    input.classList.remove('error', 'success');
    if (!valid) {
        input.classList.add('error');
        if (msg) msg.textContent = errorText;
    } else {
        if (value) input.classList.add('success');
        if (msg) msg.textContent = '';
    }
    return valid;
}

// ===== ФИЛЬТРАЦИЯ С УЧЕТОМ ПОЗЫВНОГО =====
function applyFilters() {
    const filterDepartment = document.getElementById('filterDepartment');
    const filterRank = document.getElementById('filterRank');
    const filterStatus = document.getElementById('filterStatus');
    const searchField = document.getElementById('searchField');
    const searchInput = document.getElementById('searchInput');
    if (!filterDepartment || !filterRank || !filterStatus || !searchField || !searchInput) return;

    const dept = filterDepartment.value;
    const rank = filterRank.value;
    const status = filterStatus.value;
    const field = searchField.value;
    const text = searchInput.value.toLowerCase().trim();

    filteredEmployees = employees.filter(emp => {
        let match = true;
        if (dept && emp.department !== dept) match = false;
        if (rank && emp.rank !== rank) match = false;
        if (status && emp.status !== status) match = false;
        if (text) {
            const callsignNormalized = emp.callsign ? emp.callsign.replace(/[«»"']/g, '') : '';
            const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''} ${emp.callsign || ''} ${callsignNormalized}`.toLowerCase();
            let fieldMatch = false;
            if (field === 'all') {
                fieldMatch = fio.includes(text) ||
                             (emp.department || '').toLowerCase().includes(text) ||
                             (emp.rank || '').toLowerCase().includes(text) ||
                             (emp.position || '').toLowerCase().includes(text) ||
                             (emp.status || '').toLowerCase().includes(text) ||
                             (emp.personalNumber || '').toLowerCase().includes(text);
            } else if (field === 'fio') {
                fieldMatch = fio.includes(text);
            } else if (field === 'department') {
                fieldMatch = (emp.department || '').toLowerCase().includes(text);
            } else if (field === 'rank') {
                fieldMatch = (emp.rank || '').toLowerCase().includes(text);
            } else if (field === 'position') {
                fieldMatch = (emp.position || '').toLowerCase().includes(text);
            } else if (field === 'status') {
                fieldMatch = (emp.status || '').toLowerCase().includes(text);
            } else if (field === 'personalNumber') {
                fieldMatch = (emp.personalNumber || '').toLowerCase().includes(text);
            }
            if (!fieldMatch) match = false;
        }
        return match;
    });
    renderTable(filteredEmployees);
    updateStats(filteredEmployees);
}

// ===== ОБНОВЛЕНИЕ СПИСКОВ =====
function populateFilterOptions() {
    const deptSet = new Set();
    const rankSet = new Set();
    const statusSet = new Set();
    employees.forEach(emp => {
        if (emp.department) deptSet.add(emp.department);
        if (emp.rank) rankSet.add(emp.rank);
        if (emp.status) statusSet.add(emp.status);
    });
    populateSelect('filterDepartment', deptSet);
    populateSelect('filterRank', rankSet);
    populateSelect('filterStatus', statusSet);
    populateDatalist('deptList', deptSet);
    populateDatalist('rankList', rankSet);
    const posSet = new Set();
    employees.forEach(emp => { if (emp.position) posSet.add(emp.position); });
    populateDatalist('positionList', posSet);
}

function populateSelect(id, values) {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">Все</option>';
    values.forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
    });
    select.value = currentValue;
}

// Заполнение дата-списков автодополнения
function populateDatalist(id, values) {
    const datalist = document.getElementById(id);
    if (!datalist) return;
    datalist.innerHTML = '';
    values.forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        datalist.appendChild(opt);
    });
}

// ===== СТАТИСТИКА =====
function updateStats(list) {
    const total = document.getElementById('totalCount');
    const active = document.getElementById('activeCount');
    const inactive = document.getElementById('inactiveCount');
    const fired = document.getElementById('firedCount');
    if (total) total.textContent = list.length;

    const statusCount = {};
    list.forEach(emp => {
        let s = (emp.status || 'Не указано').trim();
        const key = s.toLowerCase();
        if (!statusCount[key]) {
            statusCount[key] = { count: 0, display: s };
        }
        statusCount[key].count++;
    });
    const activeCount = statusCount['действует']?.count || 0;
    const vacationCount = statusCount['отпуск']?.count || 0;
    const missionCount = statusCount['командировка']?.count || 0;
    const firedCount = statusCount['уволен']?.count || 0;
    if (active) active.textContent = activeCount;
    if (inactive) inactive.textContent = vacationCount + missionCount;
    if (fired) fired.textContent = firedCount;

    const deptCount = {};
    list.forEach(emp => {
        let d = (emp.department || 'Не указано').trim();
        deptCount[d] = (deptCount[d] || 0) + 1;
    });
    renderStatsCards('deptCards', deptCount);

    const rankCount = {};
    list.forEach(emp => {
        let r = (emp.rank || 'Не указано').trim();
        rankCount[r] = (rankCount[r] || 0) + 1;
    });
    renderStatsCards('rankCards', rankCount);

    const statusDisplay = {};
    Object.keys(statusCount).forEach(key => {
        statusDisplay[statusCount[key].display] = statusCount[key].count;
    });
    renderStatsCards('statusCards', statusDisplay);
}

// Рендеринг аналитических микро-диаграмм с анимацией роста полосы
function renderStatsCards(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const totalVal = Object.values(data).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([label, value]) => {
        const pct = totalVal > 0 ? Math.round((value / totalVal) * 100) : 0;
        const card = document.createElement('div');
        card.className = 'stat-card-item';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <span class="stat-card-label" title="${label}">${label}</span>
                <span class="stat-card-value">${value}</span>
            </div>
            <div class="mini-chart-track">
                <div class="mini-chart-fill" style="width: 0%;"></div>
            </div>
            <span style="font-size:0.7rem; color:#4a5568; align-self:flex-end; margin-top:-2px;">${pct}%</span>
        `;
        container.appendChild(card);
        
        // Анимация плавного роста
        setTimeout(() => {
            const fill = card.querySelector('.mini-chart-fill');
            if (fill) fill.style.width = `${pct}%`;
        }, 50);
    });
}

// ===== ОТРИСОВКА ТАБЛИЦЫ С ИНТЕРВАЛЬНОЙ АНИМАЦИЕЙ CASCADE И FIX-Wrapper =====
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const listToRender = data || filteredEmployees;
    
    listToRender.forEach((emp, index) => {
        // Форматирование позывного с красивыми кавычками «»
        const callsignStr = emp.callsign ? ` «${emp.callsign.replace(/[«»"']/g, '')}»` : '';
        const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}${callsignStr}`.trim();
        
        const tr = document.createElement('tr');
        const hasPhoto = emp.photo && emp.photo.length > 100;
        let statusClass = '';
        if (emp.status === 'действует') statusClass = 'active';
        else if (emp.status === 'отпуск') statusClass = 'vacation';
        else if (emp.status === 'командировка') statusClass = 'mission';
        else if (emp.status === 'уволен') statusClass = 'fired';

        // Добавляем эффект каскадного появления строк
        tr.style.animationDelay = `${index * 0.025}s`;
        tr.classList.add('table-row-animate');

        // Если строка редактируется – показываем поля ввода (включая Позывной)
        if (editingRowId === emp.id) {
            tr.className = 'edit-row';
            tr.innerHTML = `
                <td></td>
                <td>
                    ${hasPhoto ? `<img src="${emp.photo}" alt="фото" style="width:40px; height:40px; border-radius:50%; object-fit:cover;" class="photo-thumb" />` : '<span style="color:#aaa;">—</span>'}
                </td>
                <td>
                    <input type="text" id="edit-lastName-${emp.id}" value="${emp.lastName || ''}" placeholder="Фамилия" />
                    <input type="text" id="edit-firstName-${emp.id}" value="${emp.firstName || ''}" placeholder="Имя" />
                    <input type="text" id="edit-patronymic-${emp.id}" value="${emp.patronymic || ''}" placeholder="Отчество" />
                    <input type="text" id="edit-callsign-${emp.id}" value="${emp.callsign || ''}" placeholder="Позывной" style="margin-top:4px; border-color:#9f7aea;" />
                </td>
                <td><input type="text" id="edit-department-${emp.id}" value="${emp.department || ''}" placeholder="Подразделение" /></td>
                <td><input type="text" id="edit-rank-${emp.id}" value="${emp.rank || ''}" placeholder="Звание" /></td>
                <td><input type="text" id="edit-position-${emp.id}" value="${emp.position || ''}" placeholder="Должность" /></td>
                <td>
                    <select id="edit-status-${emp.id}">
                        <option value="действует" ${emp.status === 'действует' ? 'selected' : ''}>Действует</option>
                        <option value="отпуск" ${emp.status === 'отпуск' ? 'selected' : ''}>Отпуск</option>
                        <option value="командировка" ${emp.status === 'командировка' ? 'selected' : ''}>Командировка</option>
                        <option value="уволен" ${emp.status === 'уволен' ? 'selected' : ''}>Уволен</option>
                    </select>
                </td>
                <td>
                    <div class="actions-wrapper">
                        <button class="btn-icon save" data-id="${emp.id}" title="Сохранить (Ctrl+S)"><i class="fas fa-check"></i></button>
                        <button class="btn-icon cancel" data-id="${emp.id}" title="Отменить (Esc)"><i class="fas fa-times"></i></button>
                    </div>
                </td>
            `;
        } else {
            // Обычный вид с чекбоксом в начале
            tr.innerHTML = `
                <td style="text-align: center; vertical-align: middle;">
                    <input type="checkbox" class="employee-select" data-id="${emp.id}" />
                </td>
                <td>
                    ${hasPhoto ? `<img src="${emp.photo}" alt="фото" style="width:40px; height:40px; border-radius:50%; object-fit:cover; cursor:pointer;" class="photo-thumb" data-id="${emp.id}" />` : '<span style="color:#aaa;">—</span>'}
                </td>
                <td>${fio}</td>
                <td>${emp.department || ''}</td>
                <td>${emp.rank || ''}</td>
                <td>${emp.position || ''}</td>
                <td>
                    <span class="status-badge">
                        <span class="status-dot ${statusClass}"></span>
                        <span class="status-text">${emp.status || '—'}</span>
                    </span>
                </td>
                <td>
                    <div class="actions-wrapper">
                        <button class="btn-icon edit" data-id="${emp.id}" ${!isAdmin ? 'disabled' : ''} title="Редактировать"><i class="fas fa-pencil-alt"></i></button>
                        <button class="btn-icon copy" data-id="${emp.id}" ${!isAdmin ? 'disabled' : ''} title="Копировать"><i class="fas fa-copy"></i></button>
                        <button class="btn-icon delete" data-id="${emp.id}" ${!isAdmin ? 'disabled' : ''} title="Удалить"><i class="fas fa-trash-alt"></i></button>
                        <button class="btn-icon print" data-id="${emp.id}" title="Скачать личное дело (PDF)"><i class="fas fa-print"></i></button>
                        <button class="btn-icon report" data-id="${emp.id}" title="Скачать отчёт (PDF)"><i class="fas fa-file-alt"></i></button>
                    </div>
                </td>
            `;
        }
        tbody.appendChild(tr);
    });

    // Сбрасываем главный чекбокс при перерисовке
    const selectAllCheck = document.getElementById('selectAllCheck');
    if (selectAllCheck) selectAllCheck.checked = false;
    updateSelectedCount();

    // Обработчик для клика на чекбокс сотрудника
    document.querySelectorAll('.employee-select').forEach(cb => {
        cb.addEventListener('change', function() {
            updateSelectedCount();
            
            if (!this.checked && selectAllCheck) {
                selectAllCheck.checked = false;
            }
            
            if (selectAllCheck) {
                const totalVisible = document.querySelectorAll('.employee-select').length;
                const totalChecked = document.querySelectorAll('.employee-select:checked').length;
                selectAllCheck.checked = (totalVisible === totalChecked && totalVisible > 0);
            }
        });
    });

    // Обработчики для inline-редактирования
    document.querySelectorAll('.btn-icon.save').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            saveInlineEdit(id);
        });
    });
    document.querySelectorAll('.btn-icon.cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            cancelInlineEdit(id);
        });
    });

    // Добавляем сохранение по Enter, Escape и Ctrl+S на полях inline-редактирования
    if (editingRowId) {
        const rowInputs = document.querySelectorAll(`.edit-row input, .edit-row select`);
        rowInputs.forEach(input => {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveInlineEdit(editingRowId);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelInlineEdit(editingRowId);
                } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    saveInlineEdit(editingRowId);
                }
            });
        });
    }

    // Обработчики для обычных кнопок (если не редактируется)
    if (!editingRowId) {
        document.querySelectorAll('.btn-icon.edit').forEach(btn => {
            btn.addEventListener('click', function(e) {
                if (!isAdmin) return;
                const id = this.dataset.id;
                startInlineEdit(id);
            });
        });
        document.querySelectorAll('.btn-icon.delete').forEach(btn => {
            btn.addEventListener('click', function(e) {
                if (!isAdmin) return;
                const id = this.dataset.id;
                const targetEmp = employees.find(e => e.id === id);
                if (targetEmp && confirm(`Удалить сотрудника ${targetEmp.lastName}?`)) {
                    employees = employees.filter(emp => emp.id !== id);
                    saveData();
                    addLogEntry(`Удален профиль сотрудника: ${targetEmp.lastName} ${targetEmp.firstName}`);
                }
            });
        });
        document.querySelectorAll('.btn-icon.copy').forEach(btn => {
            btn.addEventListener('click', function(e) {
                if (!isAdmin) return;
                const id = this.dataset.id;
                const emp = employees.find(e => e.id === id);
                if (emp) copyEmployee(emp);
            });
        });
        document.querySelectorAll('.btn-icon.print').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const id = this.dataset.id;
                const emp = employees.find(e => e.id === id);
                if (emp) printEmployeeCard(emp);
            });
        });
        document.querySelectorAll('.btn-icon.report').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const id = this.dataset.id;
                const emp = employees.find(e => e.id === id);
                if (emp) generateReport(emp);
            });
        });
        document.querySelectorAll('.photo-thumb').forEach(img => {
            img.addEventListener('click', function() {
                const id = this.dataset.id;
                const emp = employees.find(e => e.id === id);
                if (emp && emp.photo) showPhotoModal(emp.photo, `${emp.lastName} ${emp.firstName}`);
            });
        });
    }
}

// ===== INLINE-РЕДАКТИРОВАНИЕ =====
function startInlineEdit(id) {
    if (editingRowId) {
        cancelInlineEdit(editingRowId);
    }
    editingRowId = id;
    renderTable(filteredEmployees);
}

function cancelInlineEdit(id) {
    editingRowId = null;
    renderTable(filteredEmployees);
}

function saveInlineEdit(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    const lastName = document.getElementById(`edit-lastName-${id}`)?.value.trim() || '';
    const firstName = document.getElementById(`edit-firstName-${id}`)?.value.trim() || '';
    const patronymic = document.getElementById(`edit-patronymic-${id}`)?.value.trim() || '';
    const callsign = document.getElementById(`edit-callsign-${id}`)?.value.trim() || '';
    const department = document.getElementById(`edit-department-${id}`)?.value.trim() || '';
    const rank = document.getElementById(`edit-rank-${id}`)?.value.trim() || '';
    const position = document.getElementById(`edit-position-${id}`)?.value.trim() || '';
    const status = document.getElementById(`edit-status-${id}`)?.value || 'действует';

    if (!lastName || !firstName) {
        alert('Фамилия и имя обязательны');
        return;
    }

    emp.lastName = lastName;
    emp.firstName = firstName;
    emp.patronymic = patronymic;
    emp.callsign = callsign;
    emp.department = department;
    emp.rank = rank;
    emp.position = position;
    emp.status = status;

    saveData();
    editingRowId = null;
    renderTable(filteredEmployees);
    updateStats(filteredEmployees);
    populateFilterOptions();
    addLogEntry(`Изменены данные сотрудника: ${lastName} ${firstName} (ID: ${id})`);
}

function copyEmployee(emp) {
    const newEmp = JSON.parse(JSON.stringify(emp));
    newEmp.id = Date.now().toString();
    newEmp.lastName = emp.lastName + ' (копия)';
    newEmp.personalNumber = generatePersonalNumber();
    employees.push(newEmp);
    saveData();
    renderTable(filteredEmployees);
    addLogEntry(`Создан клон личного профиля сотрудника: ${emp.lastName} -> копия ID: ${newEmp.id}`);
}

// ===== ОБНОВЛЕНИЕ СЧЕТЧИКА ВЫБРАННЫХ =====
function updateSelectedCount() {
    const checkedBoxes = document.querySelectorAll('.employee-select:checked');
    const selectedCountSpan = document.getElementById('selectedCount');
    if (selectedCountSpan) {
        selectedCountSpan.textContent = `Выбрано: ${checkedBoxes.length}`;
    }
}

// ===== ОБРАБОТКА ФОРМЫ ДОБАВЛЕНИЯ =====
const employeeForm = document.getElementById('employeeForm');
if (employeeForm) {
    employeeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!isAdmin) return;

        const lastName = document.getElementById('lastName');
        const firstName = document.getElementById('firstName');
        let valid = true;
        if (lastName) valid = validateField(lastName) && valid;
        if (firstName) valid = validateField(firstName) && valid;
        if (!valid) {
            alert('Пожалуйста, исправьте ошибки в форме');
            return;
        }

        let photoData = '';
        const previewImg = document.getElementById('photoPreviewImg');
        if (previewImg && previewImg.src && previewImg.src.startsWith('data:')) {
            photoData = previewImg.src;
        }

        let personalNumber = document.getElementById('personalNumber')?.value.trim() || '';
        if (!personalNumber) personalNumber = generatePersonalNumber();

        const newEmp = {
            id: Date.now().toString(),
            lastName: lastName.value.trim(),
            firstName: firstName.value.trim(),
            patronymic: document.getElementById('patronymic').value.trim(),
            callsign: document.getElementById('callsign').value.trim(),
            birthDate: document.getElementById('birthDate').value,
            gender: document.getElementById('gender').value,
            department: document.getElementById('department').value.trim(),
            rank: document.getElementById('rank').value.trim(),
            position: document.getElementById('position').value.trim(),
            personalNumber: personalNumber,
            hireDate: document.getElementById('hireDate').value,
            status: document.getElementById('status').value,
            photo: photoData
        };

        employees.push(newEmp);
        saveData();
        resetForm();
        renderTable(filteredEmployees);
        populateFilterOptions();
        updateStats(filteredEmployees);
        
        addLogEntry(`В базу добавлен новый сотрудник: ${newEmp.lastName} ${newEmp.firstName} (Л/Н: ${newEmp.personalNumber})`);
    });
}

function resetForm() {
    const form = document.getElementById('employeeForm');
    if (form) form.reset();
    
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) photoPreview.style.display = 'none';
    
    const photoPreviewImg = document.getElementById('photoPreviewImg');
    if (photoPreviewImg) photoPreviewImg.src = '#';
    
    const photoInput = document.getElementById('photo');
    if (photoInput) photoInput.value = '';
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = 'Добавить сотрудника';
    
    const submitBtn = document.querySelector('#employeeForm button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Добавить';
    
    document.querySelectorAll('.form-group input').forEach(inp => inp.classList.remove('error', 'success'));
    
    const personalNumberInput = document.getElementById('personalNumber');
    if (personalNumberInput) personalNumberInput.value = generatePersonalNumber();
}

// ===== ГРУППОВЫЕ ДЕЙСТВИЯ (только для выбранных чекбоксами) =====
const groupApplyBtn = document.getElementById('groupActionApplyBtn');
if (groupApplyBtn) {
    groupApplyBtn.addEventListener('click', function() {
        const action = document.getElementById('groupActionSelect')?.value;
        if (!action) { 
            alert('Выберите групповое действие'); 
            return; 
        }
        
        const checkedBoxes = document.querySelectorAll('.employee-select:checked');
        if (checkedBoxes.length === 0) {
            alert('Выберите хотя бы одного сотрудника в таблице (отметьте галочкой)');
            return;
        }

        const value = prompt('Введите новое значение для выбранных сотрудников:');
        if (value === null) return;
        
        const selectedIds = Array.from(checkedBoxes).map(cb => cb.dataset.id);
        let changed = 0;
        
        employees.forEach(emp => {
            if (selectedIds.includes(emp.id)) {
                if (action === 'status') { 
                    emp.status = value; 
                    changed++; 
                } else if (action === 'department') { 
                    emp.department = value; 
                    changed++; 
                }
            }
        });
        
        if (changed > 0) {
            saveData();
            renderTable(filteredEmployees);
            updateStats(filteredEmployees);
            populateFilterOptions();
            
            const selectAllCheck = document.getElementById('selectAllCheck');
            if (selectAllCheck) selectAllCheck.checked = false;
            
            addLogEntry(`Применено групповое действие [${action} -> ${value}] для ${changed} сотрудников.`);
        }
    });
}

// ===== ПОКАЗ ФОТО =====
function showPhotoModal(src, name) {
    const modal = document.createElement('div');
    modal.className = 'modal photo-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px; text-align:center;">
            <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
            <h4 style="margin-bottom:16px;">${name}</h4>
            <img src="${src}" alt="Фото" style="max-width:100%; max-height:70vh; border-radius:8px; border:2px solid #d4af37;" />
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
}

// ===== PDF ОТЧЁТЫ (с поддержкой кириллицы, фото и позывного сотрудника) =====
function generateReport(emp) {
    try {
        const callsignStr = emp.callsign ? ` «${emp.callsign}»` : '';
        const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}${callsignStr}`.trim();
        const bodyContent = [
            { text: `ФИО: ${fio}`, fontSize: 13, bold: true, margin: [0, 2] },
            { text: `Позывной: ${emp.callsign || '—'}`, fontSize: 11, color: '#cfa134', margin: [0, 2], bold: true },
            { text: `Личный номер: ${emp.personalNumber || '—'}`, fontSize: 11, margin: [0, 2] },
            { text: `Дата рождения: ${emp.birthDate || '—'}`, margin: [0, 2] },
            { text: `Пол: ${emp.gender || '—'}`, margin: [0, 2] },
            { text: `Подразделение: ${emp.department || '—'}`, margin: [0, 2] },
            { text: `Звание: ${emp.rank || '—'}`, margin: [0, 2] },
            { text: `Должность: ${emp.position || '—'}`, margin: [0, 2] },
            { text: `Дата принятия: ${emp.hireDate || '—'}`, margin: [0, 2] },
            { text: `Статус: ${emp.status || '—'}`, margin: [0, 2], bold: true }
        ];

        const reportContent = [
            { text: 'ОТЧЁТ О СОТРУДНИКЕ', style: 'header', alignment: 'center' },
            { text: '\n\n' }
        ];

        if (emp.photo && emp.photo.startsWith('data:image')) {
            reportContent.push({
                columns: [
                    {
                        image: emp.photo,
                        width: 120,
                        alignment: 'center'
                    },
                    {
                        stack: bodyContent,
                        margin: [20, 0, 0, 0]
                    }
                ]
            });
        } else {
            reportContent.push({ stack: bodyContent });
        }

        reportContent.push({ text: '\n\n\n' });
        reportContent.push({ text: `Сформировано в АСУЛС УФСБ ${new Date().toLocaleDateString()}`, alignment: 'center', fontSize: 10, color: '#7a8a9e' });

        const docDefinition = {
            content: reportContent,
            styles: { header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] } },
            defaultStyle: { font: 'Roboto', fontSize: 12 }
        };
        pdfMake.createPdf(docDefinition).download(`Отчёт_${emp.lastName}_${emp.firstName}.pdf`);
        addLogEntry(`Сгенерирован и скачан персональный Отчёт о сотруднике: ${emp.lastName} ${emp.firstName}`);
    } catch(e) {
        alert('Ошибка генерации PDF: ' + e.message);
    }
}

function printEmployeeCard(emp) {
    try {
        const callsignStr = emp.callsign ? ` «${emp.callsign}»` : '';
        const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}${callsignStr}`.trim();
        const bodyContent = [
            { text: `ФИО: ${fio}`, fontSize: 13, bold: true, margin: [0, 2] },
            { text: `Позывной: ${emp.callsign || '—'}`, fontSize: 11, color: '#cfa134', margin: [0, 2], bold: true },
            { text: `Личный номер: ${emp.personalNumber || '—'}`, fontSize: 11, margin: [0, 2] },
            { text: `Дата рождения: ${emp.birthDate || '—'}`, margin: [0, 2] },
            { text: `Пол: ${emp.gender || '—'}`, margin: [0, 2] },
            { text: `Подразделение: ${emp.department || '—'}`, margin: [0, 2] },
            { text: `Звание: ${emp.rank || '—'}`, margin: [0, 2] },
            { text: `Должность: ${emp.position || '—'}`, margin: [0, 2] },
            { text: `Дата принятия: ${emp.hireDate || '—'}`, margin: [0, 2] },
            { text: `Статус: ${emp.status || '—'}`, margin: [0, 2], bold: true }
        ];

        const cardContent = [
            { text: 'ЛИЧНОЕ ДЕЛО СОТРУДНИКА', style: 'header', alignment: 'center' },
            { text: '\n\n' }
        ];

        if (emp.photo && emp.photo.startsWith('data:image')) {
            cardContent.push({
                columns: [
                    {
                        image: emp.photo,
                        width: 120,
                        alignment: 'center'
                    },
                    {
                        stack: bodyContent,
                        margin: [20, 0, 0, 0]
                    }
                ]
            });
        } else {
            cardContent.push({ stack: bodyContent });
        }

        cardContent.push({ text: '\n\n\n' });
        cardContent.push({ text: `Сформировано в АСУЛС УФСБ ${new Date().toLocaleDateString()}`, alignment: 'center', fontSize: 10, color: '#7a8a9e' });

        const docDefinition = {
            content: cardContent,
            styles: { header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] } },
            defaultStyle: { font: 'Roboto', fontSize: 12 }
        };
        pdfMake.createPdf(docDefinition).download(`Личное_дело_${emp.lastName}_${emp.firstName}.pdf`);
        addLogEntry(`Сформировано и выгружено Личное дело сотрудника: ${emp.lastName} ${emp.firstName}`);
    } catch(e) {
        alert('Ошибка генерации PDF: ' + e.message);
    }
}

function generateSummaryReport() {
    if (!filteredEmployees || filteredEmployees.length === 0) {
        alert('Нет данных для отчёта');
        return;
    }
    try {
        const tableBody = [
            ['№', 'ФИО', 'Подразделение', 'Звание', 'Должность', 'Статус']
        ];
        filteredEmployees.forEach((emp, idx) => {
            const callsignStr = emp.callsign ? ` «${emp.callsign.replace(/[«»"']/g, '')}»` : '';
            tableBody.push([
                (idx+1).toString(),
                `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}${callsignStr}`.trim(),
                emp.department || '',
                emp.rank || '',
                emp.position || '',
                emp.status || ''
            ]);
        });
        const docDefinition = {
            content: [
                { text: 'СВОДНЫЙ ОТЧЁТ ПО ЛИЧНОМУ СОСТАВУ', style: 'header', alignment: 'center' },
                { text: '\n' },
                {
                    table: {
                        headerRows: 1,
                        widths: [20, '*', 'auto', 'auto', 'auto', 'auto'],
                        body: tableBody
                    },
                    style: 'table'
                },
                { text: '\n' },
                { text: `Всего: ${filteredEmployees.length} сотрудников`, fontSize: 10 },
                { text: `Сформировано в АСУЛС УФСБ ${new Date().toLocaleDateString()}`, alignment: 'center', fontSize: 10, color: '#7a8a9e' }
            ],
            styles: {
                header: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
                table: { margin: [0, 5, 0, 5] }
            },
            defaultStyle: { font: 'Roboto', fontSize: 10 }
        };
        pdfMake.createPdf(docDefinition).download('Сводный_отчёт.pdf');
        addLogEntry(`Скачан Сводный отчёт по личному составу в PDF (Строк: ${filteredEmployees.length})`);
    } catch(e) {
        alert('Ошибка генерации PDF: ' + e.message);
    }
}

// ===== ЭКСПОРТ / ИМПОРТ EXCEL =====
function exportToExcel() {
    try {
        if (typeof XLSX === 'undefined') {
            alert('Библиотека XLSX не загружена.');
            return;
        }
        const data = filteredEmployees.map(emp => ({
            'Фамилия': emp.lastName,
            'Имя': emp.firstName,
            'Отчество': emp.patronymic || '',
            'Позывной': emp.callsign || '',
            'Дата рождения': emp.birthDate || '',
            'Пол': emp.gender || '',
            'Подразделение': emp.department || '',
            'Звание': emp.rank || '',
            'Должность': emp.position || '',
            'Личный номер': emp.personalNumber || '',
            'Дата принятия': emp.hireDate || '',
            'Статус': emp.status || ''
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники');
        XLSX.writeFile(wb, 'АСУЛС_список.xlsx');
        addLogEntry(`Данные успешно выгружены в Excel (Всего записей: ${filteredEmployees.length})`);
    } catch(e) {
        alert('Ошибка экспорта: ' + e.message);
    }
}

function importFromExcel(file) {
    try {
        if (typeof XLSX === 'undefined') {
            alert('Библиотека XLSX не загружена.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet);
                const imported = rows.map(row => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
                    lastName: (row['Фамилия'] || '').toString().trim(),
                    firstName: (row['Имя'] || '').toString().trim(),
                    patronymic: (row['Отчество'] || '').toString().trim(),
                    callsign: (row['Позывной'] || '').toString().trim(),
                    birthDate: parseExcelDate(row['Дата рождения']),
                    gender: (row['Пол'] || '').toString().trim(),
                    department: (row['Подразделение'] || '').toString().trim(),
                    rank: (row['Звание'] || '').toString().trim(),
                    position: (row['Должность'] || '').toString().trim(),
                    personalNumber: (row['Личный номер'] || '').toString().trim(),
                    hireDate: parseExcelDate(row['Дата принятия']),
                    status: (row['Статус'] || '').toString().trim()
                }));
                if (imported.length > 0) {
                    if (confirm(`Найдено ${imported.length} записей. Заменить все текущие данные?`)) {
                        employees = imported;
                        saveData();
                        alert('Импорт выполнен успешно!');
                        addLogEntry(`Импорт данных из Excel успешно завершен. Записано сотрудников: ${imported.length}`);
                    }
                } else {
                    alert('Файл не содержит данных.');
                }
            } catch(err) {
                alert('Ошибка при чтении файла: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    } catch(e) {
        alert('Ошибка импорта: ' + e.message);
    }
}

// ===== ИНТЕРАКТИВНЫЙ ФОН НА CANVAS =====
function initLoginBackground() {
    const canvas = document.getElementById('loginMatrixCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    
    const particles = [];
    const count = 50;
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5,
            speedX: Math.random() * 0.16 - 0.08,
            speedY: Math.random() * 0.16 - 0.08,
            alpha: Math.random() * 0.6 + 0.1
        });
    }
    
    let mouse = { x: null, y: null, radius: 150 };
    window.addEventListener('mousemove', function(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', function() {
        mouse.x = null;
        mouse.y = null;
    });
    
    function animate() {
        ctx.fillStyle = '#05070c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p, idx) => {
            if (mouse.x !== null && mouse.y !== null) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.hypot(dx, dy);
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    p.x += (dx / dist) * force * 0.5;
                    p.y += (dy / dist) * force * 0.5;
                }
            }
            
            p.x += p.speedX;
            p.y += p.speedY;
            
            if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(207, 161, 52, ${p.alpha})`;
            ctx.fill();
            
            for (let j = idx + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < 110) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(207, 161, 52, ${0.08 * (1 - dist / 110)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });
        
        animationFrameId = requestAnimationFrame(animate);
    }
    animate();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    initLoginBackground();

    const loginScreen = document.getElementById('loginScreen');
    const appContent = document.getElementById('appContent');
    const loginForm = document.getElementById('loginForm');
    const loginFullName = document.getElementById('loginFullName');
    const loginPassword = document.getElementById('loginPassword');
    const loginMasterPassword = document.getElementById('loginMasterPassword');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const userDisplay = document.getElementById('userDisplay');
    const manageUsersBtn = document.getElementById('manageUsersBtn');
    const showEmployeesBtn = document.getElementById('showEmployeesBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const importExcelBtn = document.getElementById('importExcelBtn');
    const importJsonBtn = document.getElementById('importJsonBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const importExcelInput = document.getElementById('importExcelInput');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const importJsonInput = document.getElementById('importJsonInput');
    const summaryReportBtn = document.getElementById('summaryReportBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const modalClose = document.getElementById('modalClose');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const oldPassword = document.getElementById('oldPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const changePasswordError = document.getElementById('changePasswordError');
    const searchInput = document.getElementById('searchInput');
    const searchField = document.getElementById('searchField');
    const filterDepartment = document.getElementById('filterDepartment');
    const filterRank = document.getElementById('filterRank');
    const filterStatus = document.getElementById('filterStatus');
    const employeesSection = document.getElementById('employeesSection');
    const usersSection = document.getElementById('usersSection');
    const usersTableBody = document.getElementById('usersTableBody');

    const addUserForm = document.getElementById('addUserForm');
    const newUserFullName = document.getElementById('newUserFullName');
    const newUserPassword = document.getElementById('newUserPassword');
    const newUserRole = document.getElementById('newUserRole');
    const addUserError = document.getElementById('addUserError');

    const registerBtn = document.getElementById('registerBtn');
    const registerModal = document.getElementById('registerModal');
    const registerClose = document.getElementById('registerClose');
    const registerForm = document.getElementById('registerForm');
    const regFullName = document.getElementById('regFullName');
    const regPassword = document.getElementById('regPassword');
    const regMasterPassword = document.getElementById('regMasterPassword');
    const registerError = document.getElementById('registerError');

    const quickModeCheck = document.getElementById('quickModeCheck');
    const extendedFields = document.querySelector('.extended-fields');

    // Настройка превью и удаления фото
    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photoPreview');
    const photoPreviewImg = document.getElementById('photoPreviewImg');
    const removePhotoBtn = document.getElementById('removePhotoBtn');

    if (photoInput) {
        photoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (photoPreviewImg) photoPreviewImg.src = e.target.result;
                    if (photoPreview) photoPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', function() {
            if (photoInput) photoInput.value = '';
            if (photoPreviewImg) photoPreviewImg.src = '#';
            if (photoPreview) photoPreview.style.display = 'none';
        });
    }

    // Скрыть/показать дополнительные поля в зависимости от чекбокса "Быстрая форма"
    function toggleExtendedFields() {
        if (!quickModeCheck || !extendedFields) return;
        if (quickModeCheck.checked) {
            extendedFields.style.display = 'none';
        } else {
            extendedFields.style.display = 'block';
        }
    }

    if (quickModeCheck) {
        toggleExtendedFields();
        quickModeCheck.addEventListener('change', toggleExtendedFields);
    }

    // Настройка кнопки переключения звуков
    const toggleSoundBtn = document.getElementById('toggleSoundBtn');
    if (toggleSoundBtn) {
        updateSoundButtonIcon();
        
        toggleSoundBtn.addEventListener('click', function() {
            soundEnabled = !soundEnabled;
            localStorage.setItem('asuls_sound', soundEnabled);
            updateSoundButtonIcon();
        });
    }

    function updateSoundButtonIcon() {
        if (!toggleSoundBtn) return;
        if (soundEnabled) {
            toggleSoundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            toggleSoundBtn.classList.remove('btn--danger');
            toggleSoundBtn.classList.add('btn--secondary');
            toggleSoundBtn.title = "Звук терминала (Вкл)";
        } else {
            toggleSoundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            toggleSoundBtn.classList.remove('btn--secondary');
            toggleSoundBtn.classList.add('btn--danger');
            toggleSoundBtn.title = "Звук терминала (Выкл)";
        }
    }

    // Кнопка очистки логов активности
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', function() {
            const box = document.getElementById('activityLogBox');
            if (box) {
                box.innerHTML = '<div class="terminal-line log-entry">[ЛОГ ОЧИЩЕН ОПЕРАТОРОМ. МОНИТОРИНГ ПРОДОЛЖАЕТСЯ]</div>';
                playSound('click');
            }
        });
    }

    // Загружаем пользователей из Firebase
    loadUsers(() => {
        loginScreen.style.display = 'flex';
        appContent.style.display = 'none';
    });

    function login(fullName, password, masterPassword) {
        const result = authenticate(fullName, password, masterPassword);
        if (result.success) {
            runDecryptionBoot(() => {
                currentUser = result.user;
                isAdmin = currentUser.role === 'admin';
                loginScreen.style.display = 'none';
                appContent.style.display = 'block';
                userDisplay.textContent = currentUser.fullName + (isAdmin ? ' (админ)' : '');

                const formCard = document.getElementById('formCard');
                if (formCard) formCard.style.display = isAdmin ? 'block' : 'none';
                if (manageUsersBtn) manageUsersBtn.style.display = isAdmin ? 'inline-flex' : 'none';
                if (showEmployeesBtn) showEmployeesBtn.style.display = 'none';
                if (deleteAllBtn) deleteAllBtn.style.display = isAdmin ? 'inline-flex' : 'none';
                if (importExcelBtn) importExcelBtn.style.display = isAdmin ? 'inline-flex' : 'none';
                if (importJsonBtn) importJsonBtn.style.display = isAdmin ? 'inline-flex' : 'none';

                employeesSection.style.display = 'block';
                usersSection.style.display = 'none';

                loadData();
                loginError.style.display = 'none';
                loginFullName.value = '';
                loginPassword.value = '';
                loginMasterPassword.value = '';
                
                setTimeout(() => {
                    addLogEntry(`Успешная тактическая авторизация. Сессия инициализирована для: ${currentUser.fullName} (${currentUser.role})`);
                }, 500);
            });
        } else {
            playSound('error');
            loginError.textContent = result.message;
            loginError.style.display = 'block';
            loginPassword.value = '';
            loginMasterPassword.value = '';
            loginFullName.focus();
        }
    }

    function logout() {
        if (currentUser) {
            addLogEntry(`Пользователь ${currentUser.fullName} совершил выход из системы.`);
        }
        currentUser = null;
        isAdmin = false;
        appContent.style.display = 'none';
        loginScreen.style.display = 'flex';
        loginFullName.value = '';
        loginPassword.value = '';
        loginMasterPassword.value = '';
        loginError.style.display = 'none';
        employeesRef.off();
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        login(loginFullName.value, loginPassword.value, loginMasterPassword.value);
    });
    logoutBtn.addEventListener('click', logout);

    // === РЕГИСТРАЦИЯ ===
    registerBtn.addEventListener('click', function() {
        registerModal.style.display = 'flex';
        regFullName.value = '';
        regPassword.value = '';
        regMasterPassword.value = '';
        registerError.style.display = 'none';
    });
    registerClose.addEventListener('click', function() {
        registerModal.style.display = 'none';
    });
    window.addEventListener('click', function(e) {
        if (e.target === registerModal) registerModal.style.display = 'none';
    });
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const fullName = regFullName.value.trim();
        const password = regPassword.value.trim();
        const masterPassword = regMasterPassword.value.trim();
        registerError.style.display = 'none';
        if (!fullName || !password || !masterPassword) {
            registerError.textContent = 'Заполните все поля';
            registerError.style.display = 'block';
            return;
        }
        const result = registerUser(fullName, password, masterPassword);
        if (result.success) {
            alert('Регистрация успешна! Теперь войдите в систему.');
            registerModal.style.display = 'none';
            login(fullName, password, masterPassword);
        } else {
            registerError.textContent = result.message;
            registerError.style.display = 'block';
        }
    });

    // === ПЕРЕКЛЮЧЕНИЕ МЕЖДУ РАЗДЕЛАМИ ===
    manageUsersBtn.addEventListener('click', function() {
        if (!isAdmin) return;
        employeesSection.style.display = 'none';
        usersSection.style.display = 'block';
        showEmployeesBtn.style.display = 'inline-flex';
        renderUserTable();
        addLogEntry("Переход в раздел: Администрирование учетных записей.");
    });
    showEmployeesBtn.addEventListener('click', function() {
        employeesSection.style.display = 'block';
        usersSection.style.display = 'none';
        showEmployeesBtn.style.display = 'none';
        addLogEntry("Возврат в раздел: База личного состава.");
    });

    function renderUserTable() {
        const users = getUsers();
        usersTableBody.innerHTML = '';
        users.forEach((u, index) => {
            const tr = document.createElement('tr');
            const isSelf = u.fullName === currentUser.fullName;
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${u.fullName}</td>
                <td><span class="role-badge ${u.role}">${u.role === 'admin' ? 'Администратор' : 'Пользователь'}</span></td>
                <td>
                    <div class="actions-wrapper">
                        ${!isSelf ? `
                            <button class="btn-icon role" data-name="${u.fullName}" data-action="toggle-role" title="Сменить роль"><i class="fas fa-exchange-alt"></i></button>
                            <button class="btn-icon delete" data-name="${u.fullName}" data-action="delete-user" title="Удалить"><i class="fas fa-trash-alt"></i></button>
                        ` : `
                            <span style="color:#7a8a9e; font-size:0.85rem;">(это вы)</span>
                        `}
                    </div>
                </td>
            `;
            usersTableBody.appendChild(tr);
        });
        document.querySelectorAll('#usersTableBody .btn-icon').forEach(btn => {
            btn.addEventListener('click', function() {
                const name = this.dataset.name;
                const action = this.dataset.action;
                if (action === 'delete-user') {
                    if (confirm(`Удалить пользователя ${name}?`)) {
                        usersCache = usersCache.filter(u => u.fullName !== name);
                        saveUsers();
                        renderUserTable();
                        addLogEntry(`Удалена системная учетная запись: ${name}`);
                    }
                } else if (action === 'toggle-role') {
                    const user = usersCache.find(u => u.fullName === name);
                    if (user) {
                        user.role = user.role === 'admin' ? 'user' : 'admin';
                        saveUsers();
                        renderUserTable();
                        addLogEntry(`Изменены полномочия пользователя ${name} -> ${user.role.toUpperCase()}`);
                    }
                }
            });
        });
    }

    addUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const fullName = newUserFullName.value.trim();
        const password = newUserPassword.value.trim();
        const role = newUserRole.value;
        addUserError.style.display = 'none';
        if (!fullName || !password) {
            addUserError.textContent = 'Заполните все поля';
            addUserError.style.display = 'block';
            return;
        }
        if (usersCache.find(u => u.fullName === fullName)) {
            addUserError.textContent = 'Пользователь с таким ФИО уже существует';
            addUserError.style.display = 'block';
            return;
        }
        usersCache.push({ fullName, password, role });
        saveUsers();
        renderUserTable();
        newUserFullName.value = '';
        newUserPassword.value = '';
        alert('Пользователь добавлен');
        addLogEntry(`Администратор зарегистрировал нового оператора: ${fullName} (роль: ${role})`);
    });

    // === ГЛАВНЫЙ ЧЕКБОКС "ВЫБРАТЬ ВСЕХ" ===
    const selectAllCheck = document.getElementById('selectAllCheck');
    if (selectAllCheck) {
        selectAllCheck.addEventListener('change', function() {
            const isChecked = this.checked;
            document.querySelectorAll('.employee-select').forEach(cb => {
                cb.checked = isChecked;
            });
            updateSelectedCount();
        });
    }

    // === ФИЛЬТРЫ ===
    const filterEls = [filterDepartment, filterRank, filterStatus, searchField, searchInput];
    filterEls.forEach(el => {
        if (el) {
            el.addEventListener('change', applyFilters);
            el.addEventListener('input', applyFilters);
        }
    });
    clearFiltersBtn.addEventListener('click', function() {
        filterDepartment.value = '';
        filterRank.value = '';
        filterStatus.value = '';
        searchField.value = 'all';
        searchInput.value = '';
        applyFilters();
        addLogEntry("Сброшены все активные поисковые фильтры.");
    });

    // === ЭКСПОРТ/ИМПОРТ ===
    exportExcelBtn.addEventListener('click', exportToExcel);
    importExcelBtn.addEventListener('click', () => importExcelInput.click());
    importExcelInput.addEventListener('change', function(e) {
        if (this.files.length) {
            importFromExcel(this.files[0]);
            this.value = '';
        }
    });
    exportJsonBtn.addEventListener('click', function() {
        const blob = new Blob([JSON.stringify(employees, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'asuls_data.json';
        link.click();
        addLogEntry("Создана и скачана резервная копия всей базы данных в формате JSON.");
    });
    importJsonBtn.addEventListener('click', () => importJsonInput.click());
    importJsonInput.addEventListener('change', function(e) {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const imported = JSON.parse(ev.target.result);
                if (Array.isArray(imported)) {
                    if (confirm(`Найдено ${imported.length} записей. Заменить все текущие данные?`)) {
                        employees = imported;
                        saveData();
                        alert('Импорт выполнен успешно');
                        addLogEntry(`Восстановление базы данных завершено. Из JSON импортировано сотрудников: ${imported.length}`);
                    }
                }
            } catch (err) {
                alert('Ошибка импорта: неверный формат JSON');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });
    summaryReportBtn.addEventListener('click', generateSummaryReport);

    // === УДАЛЕНИЕ ВСЕХ ===
    deleteAllBtn.addEventListener('click', function() {
        if (employees.length === 0) {
            alert('База уже пуста.');
            return;
        }
        if (!confirm('⚠️ ВНИМАНИЕ! Удалить всех сотрудников?')) return;
        const code = prompt('Для подтверждения введите слово "УДАЛИТЬ" (заглавными буквами):');
        if (code !== 'УДАЛИТЬ') {
            alert('Удаление отменено.');
            return;
        }
        if (!confirm('Последний шанс! Точно удалить всех?')) return;
        employees = [];
        saveData();
        filteredEmployees = [];
        applyFilters();
        alert('Все сотрудники удалены.');
        addLogEntry("⚠️ ВНИМАНИЕ! База данных личного состава была полностью очищена администратором!");
    });

    // === СМЕНА ПАРОЛЯ ===
    changePasswordBtn.addEventListener('click', function() {
        changePasswordModal.style.display = 'flex';
        oldPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
        changePasswordError.style.display = 'none';
    });
    modalClose.addEventListener('click', () => changePasswordModal.style.display = 'none');
    window.addEventListener('click', function(e) {
        if (e.target === changePasswordModal) changePasswordModal.style.display = 'none';
    });
    changePasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const oldPwd = oldPassword.value;
        const newPwd = newPassword.value;
        const confirmPwd = confirmPassword.value;
        changePasswordError.style.display = 'none';
        if (newPwd !== confirmPwd) {
            changePasswordError.textContent = 'Новый пароль и подтверждение не совпадают.';
            changePasswordError.style.display = 'block';
            return;
        }
        if (oldPwd !== currentUser.password) {
            changePasswordError.textContent = 'Неверный старый пароль.';
            changePasswordError.style.display = 'block';
            return;
        }
        if (newPwd.length < 4) {
            changePasswordError.textContent = 'Пароль должен быть не менее 4 символов.';
            changePasswordError.style.display = 'block';
            return;
        }
        const user = usersCache.find(u => u.fullName === currentUser.fullName);
        if (user) {
            user.password = newPwd;
            saveUsers();
            currentUser.password = newPwd;
            alert('Пароль успешно изменён!');
            changePasswordModal.style.display = 'none';
            addLogEntry(`Пользователь ${currentUser.fullName} сменил личный пароль.`);
        } else {
            changePasswordError.textContent = 'Ошибка сохранения.';
            changePasswordError.style.display = 'block';
        }
    });
});
