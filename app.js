// ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ И МАСТЕР-ПАРОЛЕМ =====
const USERS_KEY = 'asuls_users';
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

function getUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
        // Создаём администратора по умолчанию
        const defaultUsers = [
            { fullName: 'Администратор', password: 'admin', role: 'admin' }
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
        return defaultUsers;
    }
    return JSON.parse(raw);
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function authenticate(fullName, password, masterPassword) {
    if (masterPassword !== getMasterPassword()) {
        return { success: false, message: 'Неверный мастер-пароль' };
    }
    const users = getUsers();
    const user = users.find(u => u.fullName === fullName && u.password === password);
    if (!user) {
        return { success: false, message: 'Неверное ФИО или пароль' };
    }
    return { success: true, user: user };
}

// ===== СОСТОЯНИЕ =====
let currentUser = null;
let isAdmin = false;
const STORAGE_KEY = 'asuls_fsb_data';
let employees = [];
let editingId = null;
let filteredEmployees = [];

// ===== ЗАГРУЗКА / СОХРАНЕНИЕ ДАННЫХ =====
function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    employees = raw ? JSON.parse(raw) : [];
    filteredEmployees = [...employees];
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

// ===== ФИЛЬТРАЦИЯ С УМНЫМ ПОИСКОМ =====
function applyFilters() {
    const dept = document.getElementById('filterDepartment').value;
    const rank = document.getElementById('filterRank').value;
    const status = document.getElementById('filterStatus').value;
    const searchField = document.getElementById('searchField').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase().trim();

    filteredEmployees = employees.filter(emp => {
        let match = true;
        if (dept && emp.department !== dept) match = false;
        if (rank && emp.rank !== rank) match = false;
        if (status && emp.status !== status) match = false;
        if (searchText) {
            const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.toLowerCase();
            let fieldMatch = false;
            if (searchField === 'all') {
                fieldMatch = fio.includes(searchText) ||
                             (emp.department || '').toLowerCase().includes(searchText) ||
                             (emp.rank || '').toLowerCase().includes(searchText) ||
                             (emp.position || '').toLowerCase().includes(searchText) ||
                             (emp.status || '').toLowerCase().includes(searchText) ||
                             (emp.personalNumber || '').toLowerCase().includes(searchText);
            } else if (searchField === 'fio') {
                fieldMatch = fio.includes(searchText);
            } else if (searchField === 'department') {
                fieldMatch = (emp.department || '').toLowerCase().includes(searchText);
            } else if (searchField === 'rank') {
                fieldMatch = (emp.rank || '').toLowerCase().includes(searchText);
            } else if (searchField === 'position') {
                fieldMatch = (emp.position || '').toLowerCase().includes(searchText);
            } else if (searchField === 'status') {
                fieldMatch = (emp.status || '').toLowerCase().includes(searchText);
            } else if (searchField === 'personalNumber') {
                fieldMatch = (emp.personalNumber || '').toLowerCase().includes(searchText);
            }
            if (!fieldMatch) match = false;
        }
        return match;
    });
    renderTable(filteredEmployees);
    updateStats(filteredEmployees);
}

// ===== ОБНОВЛЕНИЕ СПИСКОВ ФИЛЬТРОВ =====
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

// ===== СТАТИСТИКА =====
function updateStats(list) {
    document.getElementById('totalCount').textContent = list.length;

    const deptCount = {};
    list.forEach(emp => {
        const d = emp.department || 'Не указано';
        deptCount[d] = (deptCount[d] || 0) + 1;
    });
    const deptStr = Object.entries(deptCount).map(([k, v]) => `${k}: ${v}`).join('; ');
    document.getElementById('deptStats').textContent = deptStr || '—';

    const rankCount = {};
    list.forEach(emp => {
        const r = emp.rank || 'Не указано';
        rankCount[r] = (rankCount[r] || 0) + 1;
    });
    const rankStr = Object.entries(rankCount).map(([k, v]) => `${k}: ${v}`).join('; ');
    document.getElementById('rankStats').textContent = rankStr || '—';

    const statusCount = {};
    list.forEach(emp => {
        const s = emp.status || 'Не указано';
        statusCount[s] = (statusCount[s] || 0) + 1;
    });
    const statusStr = Object.entries(statusCount).map(([k, v]) => `${k}: ${v}`).join('; ');
    document.getElementById('statusStats').textContent = statusStr || '—';
}

// ===== ОТРИСОВКА ТАБЛИЦЫ С АНИМИРОВАННЫМИ СТАТУСАМИ =====
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    (data || filteredEmployees).forEach((emp) => {
        const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.trim();
        const tr = document.createElement('tr');
        const hasPhoto = emp.photo && emp.photo.length > 100;
        // Статус с иконкой
        let statusClass = '';
        let statusText = emp.status || '—';
        if (emp.status === 'действует') statusClass = 'active';
        else if (emp.status === 'отпуск') statusClass = 'vacation';
        else if (emp.status === 'командировка') statusClass = 'mission';
        else if (emp.status === 'уволен') statusClass = 'fired';

        tr.innerHTML = `
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
                    <span class="status-text">${statusText}</span>
                </span>
            </td>
            <td>
                <button class="btn-icon edit" data-id="${emp.id}" ${!isAdmin ? 'disabled' : ''}><i class="fas fa-pen"></i></button>
                <button class="btn-icon delete" data-id="${emp.id}" ${!isAdmin ? 'disabled' : ''}><i class="fas fa-trash"></i></button>
                <button class="btn-icon print" data-id="${emp.id}"><i class="fas fa-print" title="Личное дело"></i></button>
                <button class="btn-icon report" data-id="${emp.id}"><i class="fas fa-file-alt" title="Отчёт"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Обработчики только если админ
    if (isAdmin) {
        document.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('Удалить сотрудника?')) {
                    employees = employees.filter(emp => emp.id !== id);
                    saveData();
                    applyFilters();
                    populateFilterOptions();
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
                const titleIcon = document.querySelector('.card__title i');
                const titleText = document.querySelector('.card__title');
                if (titleIcon) titleIcon.className = 'fas fa-user-edit';
                if (titleText) titleText.childNodes[2].textContent = ' Редактировать сотрудника';
                const submitBtn = document.querySelector('#employeeForm button[type="submit"]');
                if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    // Обработчики печати и отчёта (доступны всем)
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

    // Клик по фото
    document.querySelectorAll('.photo-thumb').forEach(img => {
        img.addEventListener('click', function() {
            const id = this.dataset.id;
            const emp = employees.find(e => e.id === id);
            if (emp && emp.photo) {
                showPhotoModal(emp.photo, `${emp.lastName} ${emp.firstName}`);
            }
        });
    });
}

// ===== ФОРМА С ФОТО =====
function fillForm(emp) {
    const fields = ['lastName', 'firstName', 'patronymic', 'birthDate', 'department', 'rank', 'position', 'personalNumber', 'hireDate'];
    fields.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.value = emp[f] || '';
    });
    const gender = document.getElementById('gender');
    if (gender) gender.value = emp.gender || 'мужской';
    const status = document.getElementById('status');
    if (status) status.value = emp.status || 'действует';

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
}

function resetForm() {
    const form = document.getElementById('employeeForm');
    if (form) form.reset();
    editingId = null;
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoPreviewImg').src = '#';
    document.getElementById('photo').value = '';
    const titleIcon = document.querySelector('.card__title i');
    const titleText = document.querySelector('.card__title');
    if (titleIcon) titleIcon.className = 'fas fa-user-plus';
    if (titleText) titleText.childNodes[2].textContent = ' Добавить сотрудника';
    const submitBtn = document.querySelector('#employeeForm button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Добавить';
}

// Предпросмотр фото
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'photo') {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const previewImg = document.getElementById('photoPreviewImg');
                const preview = document.getElementById('photoPreview');
                previewImg.src = ev.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }
});

// Удаление фото
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'removePhotoBtn') {
        document.getElementById('photo').value = '';
        document.getElementById('photoPreview').style.display = 'none';
        document.getElementById('photoPreviewImg').src = '#';
    }
});

// ===== МОДАЛЬНОЕ ОКНО ДЛЯ ФОТО =====
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

// ===== ГЕНЕРАТОР ОТЧЁТОВ (PDF) =====
function generateReport(emp) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.trim();
    const birthDate = emp.birthDate || '—';
    const gender = emp.gender || '—';
    const department = emp.department || '—';
    const rank = emp.rank || '—';
    const position = emp.position || '—';
    const personalNumber = emp.personalNumber || '—';
    const hireDate = emp.hireDate || '—';
    const status = emp.status || '—';
    const photo = emp.photo && emp.photo.length > 100 ? emp.photo : null;

    doc.setFontSize(18);
    doc.setTextColor('#0b1a2e');
    doc.text('ОТЧЁТ О СОТРУДНИКЕ', 105, 20, { align: 'center' });
    doc.setDrawColor(212, 175, 55);
    doc.line(20, 25, 190, 25);

    if (photo) {
        try {
            doc.addImage(photo, 'JPEG', 150, 35, 40, 50);
        } catch (e) {}
    }

    const fields = [
        ['ФИО', fio],
        ['Дата рождения', birthDate],
        ['Пол', gender],
        ['Подразделение', department],
        ['Звание', rank],
        ['Должность', position],
        ['Личный номер', personalNumber],
        ['Дата принятия', hireDate],
        ['Статус', status]
    ];
    let y = 35;
    const xLabel = 25;
    const xValue = 70;
    doc.setFontSize(12);
    fields.forEach(([label, value]) => {
        doc.setTextColor('#1a2f44');
        doc.text(label + ':', xLabel, y);
        doc.setTextColor('#000000');
        doc.text(value, xValue, y);
        y += 10;
    });

    doc.setFontSize(10);
    doc.setTextColor('#7a8a9e');
    doc.text('Сформировано в АСУЛС ТУ ФСБ', 105, 280, { align: 'center' });
    doc.text(new Date().toLocaleDateString(), 105, 285, { align: 'center' });

    doc.save(`Отчёт_${emp.lastName}_${emp.firstName}.pdf`);
}

// ===== ПЕЧАТЬ ЛИЧНОГО ДЕЛА (PDF) =====
function printEmployeeCard(emp) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.trim();
    const birthDate = emp.birthDate || '—';
    const gender = emp.gender || '—';
    const department = emp.department || '—';
    const rank = emp.rank || '—';
    const position = emp.position || '—';
    const personalNumber = emp.personalNumber || '—';
    const hireDate = emp.hireDate || '—';
    const status = emp.status || '—';
    const photo = emp.photo && emp.photo.length > 100 ? emp.photo : null;

    doc.setFontSize(18);
    doc.setTextColor('#0b1a2e');
    doc.text('ЛИЧНОЕ ДЕЛО', 105, 20, { align: 'center' });
    doc.setDrawColor(212, 175, 55);
    doc.line(20, 25, 190, 25);

    if (photo) {
        try {
            doc.addImage(photo, 'JPEG', 150, 35, 40, 50);
        } catch (e) {}
    }

    const fields = [
        ['ФИО', fio],
        ['Дата рождения', birthDate],
        ['Пол', gender],
        ['Подразделение', department],
        ['Звание', rank],
        ['Должность', position],
        ['Личный номер', personalNumber],
        ['Дата принятия', hireDate],
        ['Статус', status]
    ];
    let y = 35;
    const xLabel = 25;
    const xValue = 70;
    doc.setFontSize(12);
    fields.forEach(([label, value]) => {
        doc.setTextColor('#1a2f44');
        doc.text(label + ':', xLabel, y);
        doc.setTextColor('#000000');
        doc.text(value, xValue, y);
        y += 10;
    });

    doc.setFontSize(10);
    doc.setTextColor('#7a8a9e');
    doc.text('Сформировано в АСУЛС ТУ ФСБ', 105, 280, { align: 'center' });
    doc.text(new Date().toLocaleDateString(), 105, 285, { align: 'center' });

    doc.save(`Личное_дело_${emp.lastName}_${emp.firstName}.pdf`);
}

// ===== СВОДНЫЙ ОТЧЁТ =====
function generateSummaryReport() {
    if (filteredEmployees.length === 0) {
        alert('Нет данных для отчёта');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(16);
    doc.setTextColor('#0b1a2e');
    doc.text('СВОДНЫЙ ОТЧЁТ ПО ЛИЧНОМУ СОСТАВУ', 148, 15, { align: 'center' });
    doc.setDrawColor(212, 175, 55);
    doc.line(20, 20, 276, 20);

    // Заголовки таблицы
    const headers = ['№', 'ФИО', 'Подразделение', 'Звание', 'Должность', 'Статус'];
    const rows = filteredEmployees.map((emp, idx) => [
        (idx + 1).toString(),
        `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.trim(),
        emp.department || '',
        emp.rank || '',
        emp.position || '',
        emp.status || ''
    ]);

    doc.setFontSize(10);
    doc.setTextColor('#000');
    let y = 28;
    doc.setFillColor(26, 47, 68);
    doc.setTextColor(255, 255, 255);
    headers.forEach((h, i) => {
        doc.text(h, 20 + i * 43, y);
    });
    doc.setTextColor(0,0,0);
    y += 6;
    rows.forEach((row, idx) => {
        row.forEach((cell, i) => {
            doc.text(cell, 20 + i * 43, y);
        });
        y += 6;
        if (y > 190) {
            doc.addPage();
            y = 20;
        }
    });

    doc.setFontSize(10);
    doc.setTextColor('#7a8a9e');
    doc.text(`Всего: ${filteredEmployees.length} сотрудников`, 20, y + 10);
    doc.text(`Сформировано в АСУЛС ТУ ФСБ ${new Date().toLocaleDateString()}`, 148, y + 10, { align: 'center' });
    doc.save('Сводный_отчёт.pdf');
}

// ===== ЭКСПОРТ / ИМПОРТ EXCEL =====
function exportToExcel() {
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
}

function importFromExcel(file) {
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
                    applyFilters();
                    populateFilterOptions();
                    alert('Импорт выполнен успешно!');
                }
            } else {
                alert('Файл не содержит данных.');
            }
        } catch (err) {
            alert('Ошибка при чтении файла: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
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
    const employeeForm = document.getElementById('employeeForm');
    const searchInput = document.getElementById('searchInput');
    const searchField = document.getElementById('searchField');
    const filterDepartment = document.getElementById('filterDepartment');
    const filterRank = document.getElementById('filterRank');
    const filterStatus = document.getElementById('filterStatus');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const importExcelBtn = document.getElementById('importExcelBtn');
    const importExcelInput = document.getElementById('importExcelInput');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const importJsonBtn = document.getElementById('importJsonBtn');
    const importJsonInput = document.getElementById('importJsonInput');
    const summaryReportBtn = document.getElementById('summaryReportBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const modalClose = document.getElementById('modalClose');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const oldPassword = document.getElementById('oldPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const changePasswordError = document.getElementById('changePasswordError');
    const manageUsersBtn = document.getElementById('manageUsersBtn');
    const manageUsersModal = document.getElementById('manageUsersModal');
    const manageUsersClose = document.getElementById('manageUsersClose');
    const userListDiv = document.getElementById('userList');
    const addUserForm = document.getElementById('addUserForm');
    const newUserFullName = document.getElementById('newUserFullName');
    const newUserPassword = document.getElementById('newUserPassword');
    const newUserRole = document.getElementById('newUserRole');
    const addUserError = document.getElementById('addUserError');

    // Функция входа
    function login(fullName, password, masterPassword) {
        const result = authenticate(fullName, password, masterPassword);
        if (result.success) {
            currentUser = result.user;
            isAdmin = currentUser.role === 'admin';
            loginScreen.style.display = 'none';
            appContent.style.display = 'block';
            userDisplay.textContent = currentUser.fullName + (isAdmin ? ' (админ)' : '');

            // Показываем/скрываем элементы для админа
            document.getElementById('formCard').style.display = isAdmin ? 'block' : 'none';
            manageUsersBtn.style.display = isAdmin ? 'inline-flex' : 'none';
            // Кнопки экспорта/импорта доступны всем, но импорт только админу
            importExcelBtn.style.display = isAdmin ? 'inline-flex' : 'none';
            importJsonBtn.style.display = isAdmin ? 'inline-flex' : 'none';

            loadData();
            populateFilterOptions();
            applyFilters();
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
    }

    // Обработчик входа
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        login(loginFullName.value, loginPassword.value, loginMasterPassword.value);
    });

    logoutBtn.addEventListener('click', logout);

    // Обработчик формы добавления/редактирования (только для админа)
    employeeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!isAdmin) return;
        const photoInput = document.getElementById('photo');
        let photoData = '';
        const previewImg = document.getElementById('photoPreviewImg');
        if (previewImg.src && previewImg.src.startsWith('data:')) {
            photoData = previewImg.src;
        } else {
            const emp = employees.find(e => e.id === editingId);
            if (emp && emp.photo) photoData = emp.photo;
        }

        const newEmp = {
            id: editingId || Date.now().toString(),
            lastName: document.getElementById('lastName').value.trim(),
            firstName: document.getElementById('firstName').value.trim(),
            patronymic: document.getElementById('patronymic').value.trim(),
            birthDate: document.getElementById('birthDate').value,
            gender: document.getElementById('gender').value,
            department: document.getElementById('department').value.trim(),
            rank: document.getElementById('rank').value.trim(),
            position: document.getElementById('position').value.trim(),
            personalNumber: document.getElementById('personalNumber').value.trim(),
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
        populateFilterOptions();
        applyFilters();
        resetForm();
    });

    // Фильтры
    const filterFields = [filterDepartment, filterRank, filterStatus, searchField, searchInput];
    filterFields.forEach(field => {
        if (field) {
            field.addEventListener('change', applyFilters);
            field.addEventListener('input', applyFilters);
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

    // Экспорт/импорт
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
                        populateFilterOptions();
                        applyFilters();
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

    // Сводный отчёт
    summaryReportBtn.addEventListener('click', generateSummaryReport);

    // Смена пароля (только для текущего пользователя)
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
        // Обновляем пароль в списке пользователей
        const users = getUsers();
        const userIdx = users.findIndex(u => u.fullName === currentUser.fullName);
        if (userIdx !== -1) {
            users[userIdx].password = newPwd;
            saveUsers(users);
            currentUser.password = newPwd; // обновляем сессию
            alert('Пароль успешно изменён!');
            changePasswordModal.style.display = 'none';
        } else {
            changePasswordError.textContent = 'Ошибка сохранения.';
            changePasswordError.style.display = 'block';
        }
    });

    // Управление пользователями (только админ)
    manageUsersBtn.addEventListener('click', function() {
        if (!isAdmin) return;
        renderUserList();
        manageUsersModal.style.display = 'flex';
    });
    manageUsersClose.addEventListener('click', () => manageUsersModal.style.display = 'none');
    window.addEventListener('click', function(e) {
        if (e.target === manageUsersModal) manageUsersModal.style.display = 'none';
    });

    function renderUserList() {
        const users = getUsers();
        userListDiv.innerHTML = '';
        users.forEach(u => {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.innerHTML = `
                <span>${u.fullName} <span class="user-role">(${u.role})</span></span>
                <button class="user-del" data-name="${u.fullName}"><i class="fas fa-trash"></i></button>
            `;
            userListDiv.appendChild(div);
        });
        document.querySelectorAll('.user-del').forEach(btn => {
            btn.addEventListener('click', function() {
                const name = this.dataset.name;
                if (name === currentUser.fullName) {
                    alert('Нельзя удалить самого себя');
                    return;
                }
                if (confirm(`Удалить пользователя ${name}?`)) {
                    let users = getUsers().filter(u => u.fullName !== name);
                    saveUsers(users);
                    renderUserList();
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
        const users = getUsers();
        if (users.find(u => u.fullName === fullName)) {
            addUserError.textContent = 'Пользователь с таким ФИО уже существует';
            addUserError.style.display = 'block';
            return;
        }
        users.push({ fullName, password, role });
        saveUsers(users);
        renderUserList();
        newUserFullName.value = '';
        newUserPassword.value = '';
        alert('Пользователь добавлен');
    });

    // Начальное состояние
    loginScreen.style.display = 'flex';
    appContent.style.display = 'none';
});
