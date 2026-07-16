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
let filteredEmployees = [];

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

// ===== ОТРИСОВКА ТАБЛИЦЫ =====
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    (data || filteredEmployees).forEach((emp) => {
        const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.trim();
        const tr = document.createElement('tr');
        const hasPhoto = emp.photo && emp.photo.length > 100;
        tr.innerHTML = `
            <td>
                ${hasPhoto ? `<img src="${emp.photo}" alt="фото" style="width:40px; height:40px; border-radius:50%; object-fit:cover; cursor:pointer;" class="photo-thumb" data-id="${emp.id}" />` : '<span style="color:#aaa;">—</span>'}
            </td>
            <td>${fio}</td>
            <td>${emp.department || ''}</td>
            <td>${emp.rank || ''}</td>
            <td>${emp.position || ''}</td>
            <td>${emp.status || ''}</td>
            <td>
                <button class="btn-icon edit" data-id="${emp.id}"><i class="fas fa-pen"></i></button>
                <button class="btn-icon delete" data-id="${emp.id}"><i class="fas fa-trash"></i></button>
                <button class="btn-icon print" data-id="${emp.id}"><i class="fas fa-print" title="Печать личного дела"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Удаление
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

    // Редактирование
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

    // Печать PDF
    document.querySelectorAll('.print').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const emp = employees.find(e => e.id === id);
            if (emp) printEmployeeCard(emp);
        });
    });

    // Клик по фото — увеличение
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

// ===== ПЕЧАТЬ ЛИЧНОГО ДЕЛА В PDF =====
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
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const modalClose = document.getElementById('modalClose');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const oldPassword = document.getElementById('oldPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const changePasswordError = document.getElementById('changePasswordError');

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

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login(passwordInput.value);
        });
    }
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    if (employeeForm) {
        employeeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const photoInput = document.getElementById('photo');
            let photoData = '';
            const previewImg = document.getElementById('photoPreviewImg');
            if (previewImg.src && previewImg.src.startsWith('data:')) {
                photoData = previewImg.src;
            } else {
                // Если фото не меняли, но есть сохранённое – оставляем
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

    // Excel
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportToExcel);
    if (importExcelBtn && importExcelInput) {
        importExcelBtn.addEventListener('click', () => importExcelInput.click());
        importExcelInput.addEventListener('change', function(e) {
            if (this.files.length) {
                importFromExcel(this.files[0]);
                this.value = '';
            }
        });
    }

    // JSON
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', function() {
            const blob = new Blob([JSON.stringify(employees, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'asuls_data.json';
            link.click();
        });
    }
    if (importJsonBtn && importJsonInput) {
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
        modalClose.addEventListener('click', () => changePasswordModal.style.display = 'none');
        window.addEventListener('click', function(e) {
            if (e.target === changePasswordModal) changePasswordModal.style.display = 'none';
        });
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const oldPwd = oldPassword.value;
            const newPwd = newPassword.value;
            const confirmPwd = confirmPassword.value;
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

    // Начальное состояние
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appContent) appContent.style.display = 'none';
});
