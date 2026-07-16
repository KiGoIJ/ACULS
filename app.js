// ===== УПРАВЛЕНИЕ ПАРОЛЕМ =====
const PASSWORD_KEY = 'asuls_password_plain';
const DEFAULT_PASSWORD = 'admin';

function getStoredPassword() {
    let stored = localStorage.getItem(PASSWORD_KEY);
    if (!stored) {
        const encoded = btoa(DEFAULT_PASSWORD);
        localStorage.setItem(PASSWORD_KEY, encoded);
        return DEFAULT_PASSWORD;
    }
    try {
        return atob(stored);
    } catch {
        const encoded = btoa(DEFAULT_PASSWORD);
        localStorage.setItem(PASSWORD_KEY, encoded);
        return DEFAULT_PASSWORD;
    }
}

function checkPassword(input) {
    return input === getStoredPassword();
}

function changePassword(oldPwd, newPwd) {
    if (!checkPassword(oldPwd)) {
        throw new Error('Неверный старый пароль');
    }
    if (newPwd.length < 4) {
        throw new Error('Новый пароль должен содержать не менее 4 символов');
    }
    localStorage.setItem(PASSWORD_KEY, btoa(newPwd));
}

// ===== СОСТОЯНИЕ =====
let isAuthenticated = false;
const STORAGE_KEY = 'asuls_fsb_data';
let employees = [];
let editingId = null;
let filteredEmployees = []; // для отображения

// ===== ЗАГРУЗКА / СОХРАНЕНИЕ =====
function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    employees = raw ? JSON.parse(raw) : [];
    filteredEmployees = [...employees];
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

// ===== ФИЛЬТРАЦИЯ =====
function applyFilters() {
    const dept = document.getElementById('filterDepartment').value;
    const rank = document.getElementById('filterRank').value;
    const status = document.getElementById('filterStatus').value;
    const search = document.getElementById('searchInput').value.toLowerCase().trim();

    filteredEmployees = employees.filter(emp => {
        let match = true;
        if (dept && emp.department !== dept) match = false;
        if (rank && emp.rank !== rank) match = false;
        if (status && emp.status !== status) match = false;
        if (search) {
            const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.toLowerCase();
            if (!fio.includes(search)) match = false;
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
    select.value = currentValue; // сохраняем выбранное, если было
}

// ===== СТАТИСТИКА =====
function updateStats(list) {
    document.getElementById('totalCount').textContent = list.length;

    // По подразделениям
    const deptCount = {};
    list.forEach(emp => {
        const d = emp.department || 'Не указано';
        deptCount[d] = (deptCount[d] || 0) + 1;
    });
    const deptStr = Object.entries(deptCount).map(([k, v]) => `${k}: ${v}`).join('; ');
    document.getElementById('deptStats').textContent = deptStr || '—';

    // По званиям
    const rankCount = {};
    list.forEach(emp => {
        const r = emp.rank || 'Не указано';
        rankCount[r] = (rankCount[r] || 0) + 1;
    });
    const rankStr = Object.entries(rankCount).map(([k, v]) => `${k}: ${v}`).join('; ');
    document.getElementById('rankStats').textContent = rankStr || '—';

    // По статусам
    const statusCount = {};
    list.forEach(emp => {
        const s = emp.status || 'Не указано';
        statusCount[s] = (statusCount[s] || 0) + 1;
    });
    const statusStr = Object.entries(statusCount).map(([k, v]) => `${k}: ${v}`).join('; ');
    document.getElementById('statusStats').textContent = statusStr || '—';
}

// ===== ОТРИСОВКА ТАБЛИЦЫ =====
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    (data || filteredEmployees).forEach((emp) => {
        const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.trim();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fio}</td>
            <td>${emp.department || ''}</td>
            <td>${emp.rank || ''}</td>
            <td>${emp.position || ''}</td>
            <td>${emp.status || ''}</td>
            <td>
                <button class="btn-icon edit" data-id="${emp.id}"><i class="fas fa-pen"></i></button>
                <button class="btn-icon delete" data-id="${emp.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Обработчики удаления
    document.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm('Удалить сотрудника?')) {
                employees = employees.filter(emp => emp.id !== id);
                saveData();
                applyFilters(); // переприменяем фильтры
                populateFilterOptions(); // обновим списки фильтров
            }
        });
    });

    // Обработчики редактирования
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
}

function resetForm() {
    const form = document.getElementById('employeeForm');
    if (form) form.reset();
    editingId = null;
    const titleIcon = document.querySelector('.card__title i');
    const titleText = document.querySelector('.card__title');
    if (titleIcon) titleIcon.className = 'fas fa-user-plus';
    if (titleText) titleText.childNodes[2].textContent = ' Добавить сотрудника';
    const submitBtn = document.querySelector('#employeeForm button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Добавить';
}

// ===== ЭКСПОРТ В EXCEL =====
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

// ===== ИМПОРТ ИЗ EXCEL =====
function importFromExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet);
            // Преобразуем в наш формат
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
            // Заменяем данные (или можно добавить – сделаем замену)
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
    // Элементы
    const loginScreen = document.getElementById('loginScreen');
    const appContent = document.getElementById('appContent');
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const employeeForm = document.getElementById('employeeForm');
    const searchInput = document.getElementById('searchInput');
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

    // Смена пароля
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const modalClose = document.getElementById('modalClose');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const oldPassword = document.getElementById('oldPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const changePasswordError = document.getElementById('changePasswordError');

    // Функция входа
    function login(password) {
        if (checkPassword(password)) {
            isAuthenticated = true;
            if (loginScreen) loginScreen.style.display = 'none';
            if (appContent) appContent.style.display = 'block';
            loadData();
            populateFilterOptions();
            applyFilters();
            if (loginError) loginError.style.display = 'none';
            if (passwordInput) passwordInput.value = '';
        } else {
            if (loginError) loginError.style.display = 'block';
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    }

    function logout() {
        isAuthenticated = false;
        if (appContent) appContent.style.display = 'none';
        if (loginScreen) loginScreen.style.display = 'flex';
        if (passwordInput) passwordInput.value = '';
        if (loginError) loginError.style.display = 'none';
    }

    // Обработчики входа/выхода
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const pwd = passwordInput ? passwordInput.value : '';
            login(pwd);
        });
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Форма добавления/редактирования
    if (employeeForm) {
        employeeForm.addEventListener('submit', function(e) {
            e.preventDefault();
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
                status: document.getElementById('status').value
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
    }

    // Фильтры
    const filterFields = [filterDepartment, filterRank, filterStatus, searchInput];
    filterFields.forEach(field => {
        if (field) {
            field.addEventListener('change', applyFilters);
            field.addEventListener('input', applyFilters);
        }
    });

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            if (filterDepartment) filterDepartment.value = '';
            if (filterRank) filterRank.value = '';
            if (filterStatus) filterStatus.value = '';
            if (searchInput) searchInput.value = '';
            applyFilters();
        });
    }

    // Экспорт Excel
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel);
    }

    // Импорт Excel
    if (importExcelBtn && importExcelInput) {
        importExcelBtn.addEventListener('click', function() {
            importExcelInput.click();
        });
        importExcelInput.addEventListener('change', function(e) {
            if (this.files.length > 0) {
                importFromExcel(this.files[0]);
            }
            this.value = '';
        });
    }

    // Экспорт JSON
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', function() {
            const blob = new Blob([JSON.stringify(employees, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'asuls_data.json';
            link.click();
        });
    }

    // Импорт JSON
    if (importJsonBtn && importJsonInput) {
        importJsonBtn.addEventListener('click', function() {
            importJsonInput.click();
        });
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
    }

    // Смена пароля
    if (changePasswordBtn && changePasswordModal && modalClose && changePasswordForm) {
        changePasswordBtn.addEventListener('click', function() {
            changePasswordModal.style.display = 'flex';
            if (oldPassword) oldPassword.value = '';
            if (newPassword) newPassword.value = '';
            if (confirmPassword) confirmPassword.value = '';
            if (changePasswordError) changePasswordError.style.display = 'none';
        });

        modalClose.addEventListener('click', function() {
            changePasswordModal.style.display = 'none';
        });

        window.addEventListener('click', function(e) {
            if (e.target === changePasswordModal) {
                changePasswordModal.style.display = 'none';
            }
        });

        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const oldPwd = oldPassword ? oldPassword.value : '';
            const newPwd = newPassword ? newPassword.value : '';
            const confirmPwd = confirmPassword ? confirmPassword.value : '';
            if (changePasswordError) changePasswordError.style.display = 'none';

            if (newPwd !== confirmPwd) {
                if (changePasswordError) {
                    changePasswordError.textContent = 'Новый пароль и подтверждение не совпадают.';
                    changePasswordError.style.display = 'block';
                }
                return;
            }
            try {
                changePassword(oldPwd, newPwd);
                alert('Пароль успешно изменён!');
                changePasswordModal.style.display = 'none';
                logout();
            } catch (err) {
                if (changePasswordError) {
                    changePasswordError.textContent = err.message;
                    changePasswordError.style.display = 'block';
                }
            }
        });
    }

    // Инициализация: показываем экран входа
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appContent) appContent.style.display = 'none';
});
