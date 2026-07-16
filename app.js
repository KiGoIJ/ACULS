// ===== УПРАВЛЕНИЕ ПАРОЛЕМ (простая версия) =====
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

// ===== СОСТОЯНИЕ АВТОРИЗАЦИИ =====
let isAuthenticated = false;

// ===== ОСНОВНЫЕ ПЕРЕМЕННЫЕ =====
const STORAGE_KEY = 'asuls_fsb_data';
let employees = [];
let editingId = null;

// ===== ЗАГРУЗКА / СОХРАНЕНИЕ ДАННЫХ =====
function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    employees = raw ? JSON.parse(raw) : [];
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

// ===== ОТРИСОВКА ТАБЛИЦЫ =====
function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    employees.forEach((emp) => {
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

    document.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm('Удалить сотрудника?')) {
                employees = employees.filter(emp => emp.id !== id);
                saveData();
                renderTable();
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

// ===== ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ DOM =====
document.addEventListener('DOMContentLoaded', function() {
    // Элементы экрана входа
    const loginScreen = document.getElementById('loginScreen');
    const appContent = document.getElementById('appContent');
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');

    // Основные элементы
    const logoutBtn = document.getElementById('logoutBtn');
    const employeeForm = document.getElementById('employeeForm');
    const searchInput = document.getElementById('searchInput');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importInput = document.getElementById('importInput');

    // Элементы смены пароля
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
            renderTable();
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

    // --- Обработчики ---
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
            renderTable();
            resetForm();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            const rows = document.querySelectorAll('#tableBody tr');
            rows.forEach(row => {
                const fio = row.cells[0]?.textContent.toLowerCase() || '';
                row.style.display = fio.includes(query) ? '' : 'none';
            });
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const blob = new Blob([JSON.stringify(employees, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'asuls_export.json';
            link.click();
        });
    }

    if (importBtn && importInput) {
        importBtn.addEventListener('click', function() {
            importInput.click();
        });
        importInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    const imported = JSON.parse(ev.target.result);
                    if (Array.isArray(imported)) {
                        employees = imported;
                        saveData();
                        renderTable();
                        alert('Импорт выполнен успешно');
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

    // Инициализация: показываем экран входа, скрываем основное содержимое
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appContent) appContent.style.display = 'none';
});
