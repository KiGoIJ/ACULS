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
const usersRef = database.ref('users'); // новый узел для пользователей

// ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (Firebase) =====
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

// Получение списка пользователей из Firebase (асинхронно)
function getUsers() {
    return new Promise((resolve, reject) => {
        usersRef.once('value', snapshot => {
            const data = snapshot.val();
            if (data) {
                // Преобразуем объект в массив
                const users = Object.values(data);
                resolve(users);
            } else {
                // Если пользователей нет, создаём администратора по умолчанию
                const defaultUsers = [
                    { fullName: 'Администратор', password: 'admin', role: 'admin' }
                ];
                usersRef.set(defaultUsers).then(() => resolve(defaultUsers));
            }
        }, reject);
    });
}

// Сохранение списка пользователей в Firebase
function saveUsers(users) {
    return usersRef.set(users);
}

// Аутентификация
function authenticate(fullName, password, masterPassword) {
    return new Promise((resolve, reject) => {
        if (masterPassword !== getMasterPassword()) {
            return resolve({ success: false, message: 'Неверный мастер-пароль' });
        }
        getUsers().then(users => {
            const user = users.find(u => u.fullName === fullName && u.password === password);
            if (!user) {
                resolve({ success: false, message: 'Неверное ФИО или пароль' });
            } else {
                resolve({ success: true, user: user });
            }
        }).catch(err => {
            reject(err);
        });
    });
}

// Регистрация
function registerUser(fullName, password, masterPassword) {
    return new Promise((resolve, reject) => {
        if (masterPassword !== getMasterPassword()) {
            return resolve({ success: false, message: 'Неверный мастер-пароль' });
        }
        getUsers().then(users => {
            if (users.find(u => u.fullName === fullName)) {
                resolve({ success: false, message: 'Пользователь с таким ФИО уже существует' });
                return;
            }
            if (password.length < 4) {
                resolve({ success: false, message: 'Пароль должен быть не менее 4 символов' });
                return;
            }
            users.push({ fullName, password, role: 'user' });
            saveUsers(users).then(() => {
                resolve({ success: true });
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

// ===== СОСТОЯНИЕ =====
let currentUser = null;
let isAdmin = false;
let employees = [];
let editingId = null;
let filteredEmployees = [];
let usersList = []; // кеш пользователей для отображения

// ===== ЗАГРУЗКА ДАННЫХ ИЗ FIREBASE =====
function loadData() {
    employeesRef.on('value', snapshot => {
        const data = snapshot.val();
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
    });

    // Подписка на изменения пользователей (для реального времени)
    usersRef.on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
            usersList = Object.values(data);
        } else {
            usersList = [];
        }
        // Если раздел управления открыт, обновляем таблицу
        if (document.getElementById('usersSection').style.display !== 'none') {
            renderUserTable();
        }
    });
}

function saveData() {
    const data = {};
    employees.forEach(emp => {
        data[emp.id] = emp;
    });
    employeesRef.set(data).catch(error => {
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

// ===== ФИЛЬТРАЦИЯ =====
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
            const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.toLowerCase();
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
    updateSelectedCount();
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

function renderStatsCards(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([label, value]) => {
        const card = document.createElement('div');
        card.className = 'stat-card-item';
        card.innerHTML = `
            <span class="stat-card-label">${label}</span>
            <span class="stat-card-value">${value}</span>
        `;
        container.appendChild(card);
    });
}

// ===== ОТРИСОВКА ТАБЛИЦЫ СОТРУДНИКОВ =====
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    (data || filteredEmployees).forEach((emp) => {
        const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.trim();
        const tr = document.createElement('tr');
        const hasPhoto = emp.photo && emp.photo.length > 100;
        let statusClass = '';
        if (emp.status === 'действует') statusClass = 'active';
        else if (emp.status === 'отпуск') statusClass = 'vacation';
        else if (emp.status === 'командировка') statusClass = 'mission';
        else if (emp.status === 'уволен') statusClass = 'fired';

        tr.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" data-id="${emp.id}" ${!isAdmin ? 'disabled' : ''} /></td>
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
                <button class="btn-icon edit" data-id="${emp.id}" ${!isAdmin ? 'disabled' : ''}><i class="fas fa-pen"></i></button>
                <button class="btn-icon copy" data-id="${emp.id}" ${!isAdmin ? 'disabled' : ''}><i class="fas fa-copy" title="Копировать"></i></button>
                <button class="btn-icon delete" data-id="${emp.id}" ${!isAdmin ? 'disabled' : ''}><i class="fas fa-trash"></i></button>
                <button class="btn-icon print" data-id="${emp.id}"><i class="fas fa-print" title="Личное дело"></i></button>
                <button class="btn-icon report" data-id="${emp.id}"><i class="fas fa-file-alt" title="Отчёт"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (isAdmin) {
        document.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('Удалить сотрудника?')) {
                    employees = employees.filter(emp => emp.id !== id);
                    saveData();
                }
            });
        });
        document.querySelectorAll('.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const emp = employees.find(e => e.id === id);
                if (!emp) return;
                editingId = id;
                fillForm(emp);
                document.getElementById('formTitle').textContent = 'Редактировать сотрудника';
                const submitBtn = document.querySelector('#employeeForm button[type="submit"]');
                if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
        document.querySelectorAll('.copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const emp = employees.find(e => e.id === id);
                if (!emp) return;
                copyEmployee(emp);
            });
        });
        document.querySelectorAll('.row-checkbox').forEach(cb => {
            cb.addEventListener('change', updateSelectedCount);
        });
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', function() {
                document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = this.checked);
                updateSelectedCount();
            });
        }
    }

    document.querySelectorAll('.print').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const emp = employees.find(e => e.id === id);
            if (emp) printEmployeeCard(emp);
        });
    });
    document.querySelectorAll('.report').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
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

function updateSelectedCount() {
    const count = document.querySelectorAll('.row-checkbox:checked').length;
    document.getElementById('selectedCount').textContent = `Выбрано: ${count}`;
}

function copyEmployee(emp) {
    editingId = null;
    fillForm(emp);
    document.getElementById('lastName').value = '';
    document.getElementById('firstName').value = '';
    document.getElementById('patronymic').value = '';
    document.getElementById('formTitle').textContent = 'Копирование сотрудника';
    document.querySelector('#employeeForm button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Добавить';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fillForm(emp) {
    const fields = ['lastName', 'firstName', 'patronymic', 'birthDate', 'department', 'rank', 'position', 'personalNumber', 'hireDate'];
    fields.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.value = emp[f] || '';
    });
    document.getElementById('gender').value = emp.gender || 'мужской';
    document.getElementById('status').value = emp.status || 'действует';

    const photoInput = document.getElementById('photo');
    const preview = document.getElementById('photoPreview');
    const previewImg = document.getElementById('photoPreviewImg');
    if (emp.photo && emp.photo.length > 100) {
        previewImg.src = emp.photo;
        preview.style.display = 'block';
        photoInput.value = '';
    } else {
        preview.style.display = 'none';
        previewImg.src = '#';
    }
    document.querySelectorAll('.form-group input').forEach(inp => inp.classList.remove('error', 'success'));
}

function resetForm() {
    const form = document.getElementById('employeeForm');
    if (form) form.reset();
    editingId = null;
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoPreviewImg').src = '#';
    document.getElementById('photo').value = '';
    document.getElementById('formTitle').textContent = 'Добавить сотрудника';
    document.querySelector('#employeeForm button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Добавить';
    document.querySelectorAll('.form-group input').forEach(inp => inp.classList.remove('error', 'success'));
    document.getElementById('personalNumber').value = generatePersonalNumber();
}

document.addEventListener('input', function(e) {
    if (e.target.matches('#lastName, #firstName, #personalNumber')) {
        validateField(e.target);
    }
});

const departmentEl = document.getElementById('department');
if (departmentEl) {
    departmentEl.addEventListener('change', function() {
        const dept = this.value;
        if (!dept) return;
        const deptEmployees = employees.filter(e => e.department === dept);
        if (deptEmployees.length === 0) return;
        const rankCount = {};
        const posCount = {};
        deptEmployees.forEach(e => {
            if (e.rank) rankCount[e.rank] = (rankCount[e.rank] || 0) + 1;
            if (e.position) posCount[e.position] = (posCount[e.position] || 0) + 1;
        });
        let mostRank = Object.keys(rankCount).sort((a,b) => rankCount[b]-rankCount[a])[0] || '';
        let mostPos = Object.keys(posCount).sort((a,b) => posCount[b]-posCount[a])[0] || '';
        const rankField = document.getElementById('rank');
        if (rankField && !rankField.value) rankField.value = mostRank;
        const posField = document.getElementById('position');
        if (posField && !posField.value) posField.value = mostPos;
    });
}

document.getElementById('quickModeCheck').addEventListener('change', function() {
    document.querySelector('.extended-fields').style.display = this.checked ? 'none' : 'block';
});

document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'photo') {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                document.getElementById('photoPreviewImg').src = ev.target.result;
                document.getElementById('photoPreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }
});
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'removePhotoBtn') {
        document.getElementById('photo').value = '';
        document.getElementById('photoPreview').style.display = 'none';
        document.getElementById('photoPreviewImg').src = '#';
    }
});

// ===== ОБРАБОТКА ФОРМЫ СОТРУДНИКА =====
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
        } else {
            const emp = employees.find(e => e.id === editingId);
            if (emp && emp.photo) photoData = emp.photo;
        }

        let personalNumber = document.getElementById('personalNumber')?.value.trim() || '';
        if (!personalNumber) personalNumber = generatePersonalNumber();

        const newEmp = {
            id: editingId || Date.now().toString(),
            lastName: lastName.value.trim(),
            firstName: firstName.value.trim(),
            patronymic: document.getElementById('patronymic').value.trim(),
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

        if (editingId) {
            const index = employees.findIndex(e => e.id === editingId);
            if (index !== -1) employees[index] = newEmp;
        } else {
            employees.push(newEmp);
        }
        saveData();
        resetForm();
    });
}

// ===== ГРУППОВОЕ ДЕЙСТВИЕ =====
const groupApplyBtn = document.getElementById('groupActionApplyBtn');
if (groupApplyBtn) {
    groupApplyBtn.addEventListener('click', function() {
        const action = document.getElementById('groupActionSelect')?.value;
        const checked = document.querySelectorAll('.row-checkbox:checked');
        if (checked.length === 0) {
            alert('Выберите хотя бы одного сотрудника');
            return;
        }
        if (!action) {
            alert('Выберите действие');
            return;
        }
        const modal = document.getElementById('groupActionModal');
        const title = document.getElementById('groupActionTitle');
        const label = document.getElementById('groupActionLabel');
        const field = document.getElementById('groupActionValue');
        const error = document.getElementById('groupActionError');
        if (error) error.style.display = 'none';
        if (action === 'status') {
            title.innerHTML = '<i class="fas fa-edit"></i> Изменить статус';
            label.textContent = 'Новый статус';
            field.placeholder = 'действует, отпуск, командировка, уволен';
        } else if (action === 'department') {
            title.innerHTML = '<i class="fas fa-edit"></i> Изменить подразделение';
            label.textContent = 'Новое подразделение';
            field.placeholder = 'Введите название';
        }
        field.value = '';
        modal.style.display = 'flex';
        field.focus();
    });
}

const groupClose = document.getElementById('groupActionClose');
if (groupClose) {
    groupClose.addEventListener('click', function() {
        document.getElementById('groupActionModal').style.display = 'none';
    });
}
const groupForm = document.getElementById('groupActionForm');
if (groupForm) {
    groupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const action = document.getElementById('groupActionSelect')?.value;
        const value = document.getElementById('groupActionValue')?.value.trim();
        const error = document.getElementById('groupActionError');
        if (!value) {
            error.textContent = 'Введите значение';
            error.style.display = 'block';
            return;
        }
        const checked = document.querySelectorAll('.row-checkbox:checked');
        const ids = Array.from(checked).map(cb => cb.dataset.id);
        let changed = 0;
        employees.forEach(emp => {
            if (ids.includes(emp.id)) {
                if (action === 'status') { emp.status = value; changed++; }
                else if (action === 'department') { emp.department = value; changed++; }
            }
        });
        if (changed > 0) {
            saveData();
            document.getElementById('groupActionModal').style.display = 'none';
            document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
            updateSelectedCount();
            alert(`Изменено ${changed} сотрудников`);
        } else {
            error.textContent = 'Не удалось применить';
            error.style.display = 'block';
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

// ===== PDF =====
function generateReport(emp) {
    try {
        const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.trim();
        const docDefinition = {
            content: [
                { text: 'ОТЧЁТ О СОТРУДНИКЕ', style: 'header', alignment: 'center' },
                { text: '\n\n' },
                { text: `ФИО: ${fio}` },
                { text: `Дата рождения: ${emp.birthDate || '—'}` },
                { text: `Пол: ${emp.gender || '—'}` },
                { text: `Подразделение: ${emp.department || '—'}` },
                { text: `Звание: ${emp.rank || '—'}` },
                { text: `Должность: ${emp.position || '—'}` },
                { text: `Личный номер: ${emp.personalNumber || '—'}` },
                { text: `Дата принятия: ${emp.hireDate || '—'}` },
                { text: `Статус: ${emp.status || '—'}` },
                { text: '\n\n' },
                { text: `Сформировано в АСУЛС УФСБ ${new Date().toLocaleDateString()}`, alignment: 'center', fontSize: 10, color: '#7a8a9e' }
            ],
            styles: { header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] } },
            defaultStyle: { fontSize: 12 }
        };
        pdfMake.createPdf(docDefinition).download(`Отчёт_${emp.lastName}_${emp.firstName}.pdf`);
    } catch(e) {
        alert('Ошибка генерации PDF: ' + e.message);
    }
}

function printEmployeeCard(emp) {
    generateReport(emp);
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
            tableBody.push([
                (idx+1).toString(),
                `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.trim(),
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
                        widths: [20, 'auto', 'auto', 'auto', 'auto', 'auto'],
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
            defaultStyle: { fontSize: 10 }
        };
        pdfMake.createPdf(docDefinition).download('Сводный_отчёт.pdf');
    } catch(e) {
        alert('Ошибка генерации PDF: ' + e.message);
    }
}

// ===== ЭКСПОРТ/ИМПОРТ EXCEL =====
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
                    birthDate: row['Дата рождения'] ? new Date(row['Дата рождения']).toISOString().split('T')[0] : '',
                    gender: (row['Пол'] || '').toString().trim(),
                    department: (row['Подразделение'] || '').toString().trim(),
                    rank: (row['Звание'] || '').toString().trim(),
                    position: (row['Должность'] || '').toString().trim(),
                    personalNumber: (row['Личный номер'] || '').toString().trim(),
                    hireDate: row['Дата принятия'] ? new Date(row['Дата принятия']).toISOString().split('T')[0] : '',
                    status: (row['Статус'] || '').toString().trim()
                }));
                if (imported.length > 0) {
                    if (confirm(`Найдено ${imported.length} записей. Заменить все текущие данные?`)) {
                        employees = imported;
                        saveData();
                        alert('Импорт выполнен успешно!');
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

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
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

    // Элементы управления пользователями
    const addUserForm = document.getElementById('addUserForm');
    const newUserFullName = document.getElementById('newUserFullName');
    const newUserPassword = document.getElementById('newUserPassword');
    const newUserRole = document.getElementById('newUserRole');
    const addUserError = document.getElementById('addUserError');

    // Регистрация
    const registerBtn = document.getElementById('registerBtn');
    const registerModal = document.getElementById('registerModal');
    const registerClose = document.getElementById('registerClose');
    const registerForm = document.getElementById('registerForm');
    const regFullName = document.getElementById('regFullName');
    const regPassword = document.getElementById('regPassword');
    const regMasterPassword = document.getElementById('regMasterPassword');
    const registerError = document.getElementById('registerError');

    // === ФУНКЦИЯ ВХОДА (АСИНХРОННАЯ) ===
    async function login(fullName, password, masterPassword) {
        try {
            const result = await authenticate(fullName, password, masterPassword);
            if (result.success) {
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

                loadData(); // теперь внутри также подписка на users
                loginError.style.display = 'none';
                loginFullName.value = '';
                loginPassword.value = '';
                loginMasterPassword.value = '';
            } else {
                loginError.textContent = result.message;
                loginError.style.display = 'block';
                loginPassword.value = '';
                loginMasterPassword.value = '';
                loginFullName.focus();
            }
        } catch(err) {
            console.error('Ошибка входа:', err);
            loginError.textContent = 'Ошибка соединения. Попробуйте позже.';
            loginError.style.display = 'block';
        }
    }

    function logout() {
        currentUser = null;
        isAdmin = false;
        appContent.style.display = 'none';
        loginScreen.style.display = 'flex';
        loginFullName.value = '';
        loginPassword.value = '';
        loginMasterPassword.value = '';
        loginError.style.display = 'none';
        employeesRef.off();
        usersRef.off();
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        login(loginFullName.value, loginPassword.value, loginMasterPassword.value);
    });
    logoutBtn.addEventListener('click', logout);

    // === РЕГИСТРАЦИЯ (АСИНХРОННАЯ) ===
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
    registerForm.addEventListener('submit', async function(e) {
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
        try {
            const result = await registerUser(fullName, password, masterPassword);
            if (result.success) {
                alert('Регистрация успешна! Теперь войдите в систему.');
                registerModal.style.display = 'none';
                login(fullName, password, masterPassword);
            } else {
                registerError.textContent = result.message;
                registerError.style.display = 'block';
            }
        } catch(err) {
            console.error('Ошибка регистрации:', err);
            registerError.textContent = 'Ошибка соединения. Попробуйте позже.';
            registerError.style.display = 'block';
        }
    });

    // === ПЕРЕКЛЮЧЕНИЕ МЕЖДУ РАЗДЕЛАМИ ===
    manageUsersBtn.addEventListener('click', function() {
        if (!isAdmin) return;
        employeesSection.style.display = 'none';
        usersSection.style.display = 'block';
        showEmployeesBtn.style.display = 'inline-flex';
        renderUserTable(); // перерисовка из кеша usersList
    });
    showEmployeesBtn.addEventListener('click', function() {
        employeesSection.style.display = 'block';
        usersSection.style.display = 'none';
        showEmployeesBtn.style.display = 'none';
    });

    // === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (таблица) ===
    function renderUserTable() {
        const users = usersList; // используем кеш из подписки
        usersTableBody.innerHTML = '';
        if (!users || users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#7a8a9e;">Нет пользователей</td></tr>';
            return;
        }
        users.forEach((u, index) => {
            const tr = document.createElement('tr');
            const isSelf = u.fullName === currentUser.fullName;
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${u.fullName}</td>
                <td><span class="role-badge ${u.role}">${u.role === 'admin' ? 'Администратор' : 'Пользователь'}</span></td>
                <td>
                    ${!isSelf ? `
                        <button class="btn-icon role" data-name="${u.fullName}" data-action="toggle-role" title="Сменить роль"><i class="fas fa-exchange-alt"></i></button>
                        <button class="btn-icon delete" data-name="${u.fullName}" data-action="delete-user" title="Удалить"><i class="fas fa-trash"></i></button>
                    ` : `
                        <span style="color:#7a8a9e; font-size:0.85rem;">(это вы)</span>
                    `}
                </td>
            `;
            usersTableBody.appendChild(tr);
        });

        // Обработчики (асинхронные)
        document.querySelectorAll('#usersTableBody .btn-icon').forEach(btn => {
            btn.addEventListener('click', async function() {
                const name = this.dataset.name;
                const action = this.dataset.action;
                if (action === 'delete-user') {
                    if (!confirm(`Удалить пользователя ${name}?`)) return;
                    try {
                        let users = await getUsers();
                        users = users.filter(u => u.fullName !== name);
                        await saveUsers(users);
                        usersList = users; // обновляем кеш
                        renderUserTable();
                        const adminExists = users.some(u => u.role === 'admin');
                        if (!adminExists && users.length > 0) {
                            alert('Внимание! В системе больше нет администраторов. Назначьте нового.');
                        }
                    } catch(err) {
                        alert('Ошибка удаления: ' + err.message);
                    }
                } else if (action === 'toggle-role') {
                    try {
                        let users = await getUsers();
                        const user = users.find(u => u.fullName === name);
                        if (user) {
                            user.role = user.role === 'admin' ? 'user' : 'admin';
                            await saveUsers(users);
                            usersList = users;
                            renderUserTable();
                        }
                    } catch(err) {
                        alert('Ошибка изменения роли: ' + err.message);
                    }
                }
            });
        });
    }

    // Добавление пользователя (асинхронное)
    addUserForm.addEventListener('submit', async function(e) {
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
        try {
            let users = await getUsers();
            if (users.find(u => u.fullName === fullName)) {
                addUserError.textContent = 'Пользователь с таким ФИО уже существует';
                addUserError.style.display = 'block';
                return;
            }
            users.push({ fullName, password, role });
            await saveUsers(users);
            usersList = users;
            renderUserTable();
            newUserFullName.value = '';
            newUserPassword.value = '';
            alert('Пользователь добавлен');
        } catch(err) {
            alert('Ошибка добавления: ' + err.message);
        }
    });

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
    });

    // === СМЕНА ПАРОЛЯ (локально, так как мастер-пароль локальный) ===
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
        // Меняем пароль в Firebase
        getUsers().then(users => {
            const userIdx = users.findIndex(u => u.fullName === currentUser.fullName);
            if (userIdx !== -1) {
                users[userIdx].password = newPwd;
                saveUsers(users).then(() => {
                    currentUser.password = newPwd;
                    alert('Пароль успешно изменён!');
                    changePasswordModal.style.display = 'none';
                });
            } else {
                changePasswordError.textContent = 'Ошибка сохранения.';
                changePasswordError.style.display = 'block';
            }
        }).catch(err => {
            changePasswordError.textContent = 'Ошибка соединения.';
            changePasswordError.style.display = 'block';
        });
    });

    loginScreen.style.display = 'flex';
    appContent.style.display = 'none';
});
