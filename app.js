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
const STORAGE_KEY = 'asuls_tu_data';
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
                             (emp.personalNumber || '').toLowerCase().includes(searchText) ||
                             (emp.alias || '').toLowerCase().includes(searchText) ||
                             (emp.dop || '').toLowerCase().includes(searchText);
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
    updateSelectedCount();
}

// ===== ОБНОВЛЕНИЕ СПИСКОВ ДЛЯ ФИЛЬТРОВ И DATALIST =====
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

// ===== СТАТИСТИКА С ТЕГАМИ =====
function updateStats(list) {
    document.getElementById('totalCount').textContent = list.length;

    const deptCount = {};
    list.forEach(emp => {
        const d = emp.department || 'Не указано';
        deptCount[d] = (deptCount[d] || 0) + 1;
    });
    const deptHtml = Object.entries(deptCount)
        .map(([k, v]) => `<span class="stat-tag">${k}: ${v}</span>`)
        .join(' ');
    document.getElementById('deptStats').innerHTML = deptHtml || '—';

    const rankCount = {};
    list.forEach(emp => {
        const r = emp.rank || 'Не указано';
        rankCount[r] = (rankCount[r] || 0) + 1;
    });
    const rankHtml = Object.entries(rankCount)
        .map(([k, v]) => `<span class="stat-tag">${k}: ${v}</span>`)
        .join(' ');
    document.getElementById('rankStats').innerHTML = rankHtml || '—';

    const statusCount = {};
    list.forEach(emp => {
        const s = emp.status || 'Не указано';
        statusCount[s] = (statusCount[s] || 0) + 1;
    });
    const statusHtml = Object.entries(statusCount)
        .map(([k, v]) => `<span class="stat-tag">${k}: ${v}</span>`)
        .join(' ');
    document.getElementById('statusStats').innerHTML = statusHtml || '—';
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
        const statusClass = emp.status || 'active';

        tr.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" data-id="${emp.id}" ${!isAdmin ? 'disabled' : ''} /></td>
            <td>
                ${hasPhoto ? `<img src="${emp.photo}" alt="фото" style="width:40px; height:40px; border-radius:50%; object-fit:cover; cursor:pointer;" class="photo-thumb" data-id="${emp.id}" />` : '<span style="color:#aaa;">—</span>'}
            </td>
            <td>${fio}</td>
            <td>${emp.department || ''}</td>
            <td>${emp.rank || ''}</td>
            <td>${emp.position || ''}</td>
            <td><span class="status-badge ${statusClass}">${emp.status || '—'}</span></td>
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
                document.getElementById('formTitle').textContent = 'Редактировать сотрудника';
                document.querySelector('#employeeForm button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Сохранить';
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
                const checked = this.checked;
                document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = checked);
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
    const checked = document.querySelectorAll('.row-checkbox:checked').length;
    const el = document.getElementById('selectedCount');
    if (el) el.textContent = `Выбрано: ${checked}`;
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
    const fields = ['lastName', 'firstName', 'patronymic', 'birthDate', 'department', 'rank', 'position', 'personalNumber', 'hireDate', 'alias', 'notes', 'resolution', 'marks'];
    fields.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.value = emp[f] || '';
    });
    document.getElementById('gender').value = emp.gender || 'мужской';
    document.getElementById('status').value = emp.status || 'действует';
    document.getElementById('dop').value = emp.dop || '';
    document.getElementById('qualAgent').checked = !!emp.qualAgent;
    document.getElementById('qualSurveillance').checked = !!emp.qualSurveillance;
    document.getElementById('qualCrypto').checked = !!emp.qualCrypto;

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
    document.getElementById('employeeForm').reset();
    editingId = null;
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoPreviewImg').src = '#';
    document.getElementById('photo').value = '';
    document.getElementById('formTitle').textContent = 'Добавить сотрудника';
    document.querySelector('#employeeForm button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Добавить';
    document.querySelectorAll('.form-group input').forEach(inp => inp.classList.remove('error', 'success'));
    document.getElementById('personalNumber').value = generatePersonalNumber();
    document.getElementById('qualAgent').checked = false;
    document.getElementById('qualSurveillance').checked = false;
    document.getElementById('qualCrypto').checked = false;
    document.getElementById('notes').value = '';
    document.getElementById('resolution').value = '';
    document.getElementById('marks').value = '';
    document.getElementById('dop').value = '';
    document.getElementById('status').value = 'действует';
    document.getElementById('gender').value = 'мужской';
}

function handleFormSubmit(e) {
    e.preventDefault();
    if (!isAdmin) return;

    const lastName = document.getElementById('lastName');
    const firstName = document.getElementById('firstName');
    let valid = validateField(lastName);
    if (!validateField(firstName)) valid = false;
    if (!valid) {
        alert('Пожалуйста, исправьте ошибки в форме');
        return;
    }

    let photoData = '';
    const previewImg = document.getElementById('photoPreviewImg');
    if (previewImg.src && previewImg.src.startsWith('data:')) {
        photoData = previewImg.src;
    } else {
        const emp = employees.find(e => e.id === editingId);
        if (emp && emp.photo) photoData = emp.photo;
    }

    let personalNumber = document.getElementById('personalNumber').value.trim();
    if (!personalNumber) {
        personalNumber = generatePersonalNumber();
    }

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
        alias: document.getElementById('alias').value.trim(),
        dop: document.getElementById('dop').value,
        qualAgent: document.getElementById('qualAgent').checked,
        qualSurveillance: document.getElementById('qualSurveillance').checked,
        qualCrypto: document.getElementById('qualCrypto').checked,
        notes: document.getElementById('notes').value.trim(),
        resolution: document.getElementById('resolution').value.trim(),
        marks: document.getElementById('marks').value.trim(),
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
    alert('Сотрудник сохранён');
}

function initGroupAction() {
    const applyBtn = document.getElementById('groupActionApplyBtn');
    if (!applyBtn) return;
    applyBtn.addEventListener('click', function() {
        const action = document.getElementById('groupActionSelect').value;
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
        error.style.display = 'none';
        if (action === 'status') {
            title.innerHTML = '<i class="fas fa-edit"></i> Изменить статус';
            label.textContent = 'Новый статус (действует, отпуск, командировка, уволен)';
            field.placeholder = 'Введите статус';
        } else if (action === 'department') {
            title.innerHTML = '<i class="fas fa-edit"></i> Изменить подразделение';
            label.textContent = 'Новое подразделение';
            field.placeholder = 'Введите подразделение';
        }
        field.value = '';
        modal.style.display = 'flex';
        field.focus();
    });

    document.getElementById('groupActionClose').addEventListener('click', function() {
        document.getElementById('groupActionModal').style.display = 'none';
    });

    document.getElementById('groupActionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const action = document.getElementById('groupActionSelect').value;
        const value = document.getElementById('groupActionValue').value.trim();
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
            populateFilterOptions();
            applyFilters();
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

// ===== ОТЧЁТЫ (PDF) — ПРОВЕРКА НАЛИЧИЯ jsPDF =====
function generateReport(emp) {
    if (typeof window.jspdf === 'undefined') {
        alert('Библиотека jsPDF не загружена. Проверьте подключение в index.html.');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.trim();
    
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor('#0b1a2e');
    doc.text('ОТЧЁТ О СОТРУДНИКЕ', 105, 20, { align: 'center' });
    
    doc.setDrawColor(212, 175, 55);
    doc.line(20, 25, 190, 25);
    
    let y = 35;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor('#000000');
    
    const fields = [
        ['ФИО', fio],
        ['Дата рождения', emp.birthDate || '—'],
        ['Пол', emp.gender || '—'],
        ['Подразделение', emp.department || '—'],
        ['Звание', emp.rank || '—'],
        ['Должность', emp.position || '—'],
        ['Личный номер', emp.personalNumber || '—'],
        ['Дата принятия', emp.hireDate || '—'],
        ['Статус', emp.status || '—'],
        ['Псевдоним', emp.alias || '—'],
        ['Допуск', emp.dop || '—'],
        ['Агентурная', emp.qualAgent ? 'Да' : 'Нет'],
        ['Наружное', emp.qualSurveillance ? 'Да' : 'Нет'],
        ['Шифр.', emp.qualCrypto ? 'Да' : 'Нет'],
        ['Особые отметки', emp.notes || '—'],
        ['Резолюция', emp.resolution || '—'],
        ['Отметки', emp.marks || '—']
    ];
    
    fields.forEach(([label, value]) => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        doc.setFont('times', 'bold');
        doc.text(label + ':', 20, y);
        doc.setFont('times', 'normal');
        const maxWidth = 130;
        const lines = doc.splitTextToSize(value, maxWidth);
        doc.text(lines, 65, y);
        y += 10 * lines.length + 2;
    });
    
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor('#7a8a9e');
    doc.text('Сформировано в АСУЛС ТУ ФСБ', 105, 285, { align: 'center' });
    doc.text(new Date().toLocaleDateString(), 105, 290, { align: 'center' });
    
    doc.save(`Отчёт_${emp.lastName}_${emp.firstName}.pdf`);
}

function printEmployeeCard(emp) {
    generateReport(emp);
}

function generateSummaryReport() {
    if (typeof window.jspdf === 'undefined') {
        alert('Библиотека jsPDF не загружена. Проверьте подключение в index.html.');
        return;
    }
    if (filteredEmployees.length === 0) {
        alert('Нет данных для отчёта');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.setTextColor('#0b1a2e');
    doc.text('СВОДНЫЙ ОТЧЁТ ПО ЛИЧНОМУ СОСТАВУ ТУ ФСБ', 148, 15, { align: 'center' });
    doc.setDrawColor(212, 175, 55);
    doc.line(20, 20, 276, 20);
    
    const headers = ['№', 'ФИО', 'Подразделение', 'Звание', 'Должность', 'Статус'];
    const colWidths = [10, 60, 40, 30, 40, 30];
    let y = 28;
    doc.setFillColor(26, 47, 68);
    doc.rect(20, y-6, 256, 8, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor('#ffffff');
    let x = 20;
    headers.forEach((h, i) => {
        doc.text(h, x + (i === 0 ? 0 : 2), y);
        x += colWidths[i];
    });
    
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#000000');
    y += 8;
    
    filteredEmployees.forEach((emp, idx) => {
        const row = [
            (idx+1).toString(),
            `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.trim(),
            emp.department || '',
            emp.rank || '',
            emp.position || '',
            emp.status || ''
        ];
        let x2 = 20;
        row.forEach((cell, i) => {
            const lines = doc.splitTextToSize(cell, colWidths[i] - 2);
            doc.text(lines, x2 + 2, y);
            x2 += colWidths[i];
        });
        y += 6;
        if (y > 190) {
            doc.addPage();
            y = 20;
            doc.setFillColor(26, 47, 68);
            doc.rect(20, y-6, 256, 8, 'F');
            doc.setFont('times', 'bold');
            doc.setFontSize(11);
            doc.setTextColor('#ffffff');
            let xh = 20;
            headers.forEach((h, i) => {
                doc.text(h, xh + (i === 0 ? 0 : 2), y);
                xh += colWidths[i];
            });
            doc.setFont('times', 'normal');
            doc.setFontSize(10);
            doc.setTextColor('#000000');
            y += 8;
        }
    });
    
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor('#7a8a9e');
    doc.text(`Всего: ${filteredEmployees.length} сотрудников`, 20, y+10);
    doc.text(`Сформировано в АСУЛС ТУ ФСБ ${new Date().toLocaleDateString()}`, 148, y+10, { align: 'center' });
    doc.save('Сводный_отчёт_ТУ_ФСБ.pdf');
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
        'Статус': emp.status || '',
        'Псевдоним': emp.alias || '',
        'Допуск': emp.dop || '',
        'Агентурная': emp.qualAgent ? 'Да' : 'Нет',
        'Наружное': emp.qualSurveillance ? 'Да' : 'Нет',
        'Шифр. техника': emp.qualCrypto ? 'Да' : 'Нет',
        'Особые отметки': emp.notes || '',
        'Резолюция': emp.resolution || '',
        'Отметки': emp.marks || ''
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники ТУ ФСБ');
    XLSX.writeFile(wb, 'АСУЛС_ТУ_ФСБ_список.xlsx');
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
                status: (row['Статус'] || '').toString().trim(),
                alias: (row['Псевдоним'] || '').toString().trim(),
                dop: (row['Допуск'] || '').toString().trim(),
                qualAgent: (row['Агентурная'] || '').toLowerCase() === 'да',
                qualSurveillance: (row['Наружное'] || '').toLowerCase() === 'да',
                qualCrypto: (row['Шифр. техника'] || '').toLowerCase() === 'да',
                notes: (row['Особые отметки'] || '').toString().trim(),
                resolution: (row['Резолюция'] || '').toString().trim(),
                marks: (row['Отметки'] || '').toString().trim()
            }));
            if (imported.length > 0) {
                if (confirm(`Найдено ${imported.length} записей. Заменить все текущие данные?`)) {
                    employees = imported;
                    saveData();
                    populateFilterOptions();
                    applyFilters();
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

    function login(fullName, password, masterPassword) {
        const result = authenticate(fullName, password, masterPassword);
        if (result.success) {
            currentUser = result.user;
            isAdmin = currentUser.role === 'admin';
            loginScreen.style.display = 'none';
            appContent.style.display = 'block';
            userDisplay.textContent = currentUser.fullName + (isAdmin ? ' (админ)' : '');

            document.getElementById('formCard').style.display = isAdmin ? 'block' : 'none';
            manageUsersBtn.style.display = isAdmin ? 'inline-flex' : 'none';
            importExcelBtn.style.display = isAdmin ? 'inline-flex' : 'none';
            importJsonBtn.style.display = isAdmin ? 'inline-flex' : 'none';

            loadData();
            populateFilterOptions();
            if (isAdmin) document.getElementById('personalNumber').value = generatePersonalNumber();
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

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        login(loginFullName.value, loginPassword.value, loginMasterPassword.value);
    });
    logoutBtn.addEventListener('click', logout);

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
        link.download = 'asuls_tu_data.json';
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

    summaryReportBtn.addEventListener('click', generateSummaryReport);

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
        const users = getUsers();
        const userIdx = users.findIndex(u => u.fullName === currentUser.fullName);
        if (userIdx !== -1) {
            users[userIdx].password = newPwd;
            saveUsers(users);
            currentUser.password = newPwd;
            alert('Пароль успешно изменён!');
            changePasswordModal.style.display = 'none';
        } else {
            changePasswordError.textContent = 'Ошибка сохранения.';
            changePasswordError.style.display = 'block';
        }
    });

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

    employeeForm.addEventListener('submit', handleFormSubmit);

    document.addEventListener('input', function(e) {
        if (e.target.matches('#lastName, #firstName, #personalNumber')) {
            validateField(e.target);
        }
    });

    document.getElementById('department').addEventListener('change', function() {
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
        if (!rankField.value) rankField.value = mostRank;
        const posField = document.getElementById('position');
        if (!posField.value) posField.value = mostPos;
    });

    document.getElementById('quickModeCheck').addEventListener('change', function() {
        document.querySelectorAll('.extended-fields').forEach(el => {
            el.style.display = this.checked ? 'none' : 'flex';
        });
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

    initGroupAction();

    loginScreen.style.display = 'flex';
    appContent.style.display = 'none';
});
