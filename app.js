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
      document.querySelector('.card__title i').className = 'fas fa-user-edit';
      document.querySelector('.card__title').childNodes[2].textContent = ' Редактировать сотрудника';
      document.querySelector('#employeeForm button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Сохранить';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function fillForm(emp) {
  document.getElementById('lastName').value = emp.lastName || '';
  document.getElementById('firstName').value = emp.firstName || '';
  document.getElementById('patronymic').value = emp.patronymic || '';
  document.getElementById('birthDate').value = emp.birthDate || '';
  document.getElementById('gender').value = emp.gender || 'мужской';
  document.getElementById('department').value = emp.department || '';
  document.getElementById('rank').value = emp.rank || '';
  document.getElementById('position').value = emp.position || '';
  document.getElementById('personalNumber').value = emp.personalNumber || '';
  document.getElementById('hireDate').value = emp.hireDate || '';
  document.getElementById('status').value = emp.status || 'действует';
}

function resetForm() {
  document.getElementById('employeeForm').reset();
  editingId = null;
  document.querySelector('.card__title i').className = 'fas fa-user-plus';
  document.querySelector('.card__title').childNodes[2].textContent = ' Добавить сотрудника';
  document.querySelector('#employeeForm button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Добавить';
}

// ===== ОБРАБОТКА ФОРМЫ =====
document.getElementById('employeeForm').addEventListener('submit', function(e) {
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

// ===== ПОИСК =====
document.getElementById('searchInput').addEventListener('input', function() {
  const query = this.value.toLowerCase().trim();
  const rows = document.querySelectorAll('#tableBody tr');
  rows.forEach(row => {
    const fio = row.cells[0]?.textContent.toLowerCase() || '';
    row.style.display = fio.includes(query) ? '' : 'none';
  });
});

// ===== ЭКСПОРТ / ИМПОРТ =====
document.getElementById('exportBtn').addEventListener('click', function() {
  const blob = new Blob([JSON.stringify(employees, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'asuls_export.json';
  link.click();
});

document.getElementById('importBtn').addEventListener('click', function() {
  document.getElementById('importInput').click();
});
document.getElementById('importInput').addEventListener('change', function(e) {
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

// ===== АВТОРИЗАЦИЯ =====
function login(password) {
  if (checkPassword(password)) {
    isAuthenticated = true;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContent').style.display = 'block';
    loadData();
    renderTable();
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('passwordInput').value = '';
  } else {
    document.getElementById('loginError').style.display = 'block';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
  }
}

function logout() {
  isAuthenticated = false;
  document.getElementById('appContent').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('passwordInput').value = '';
  document.getElementById('loginError').style.display = 'none';
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const pwd = document.getElementById('passwordInput').value;
  login(pwd);
});

document.getElementById('logoutBtn').addEventListener('click', logout);

// ===== СМЕНА ПАРОЛЯ =====
const modal = document.getElementById('changePasswordModal');
const modalClose = document.getElementById('modalClose');

document.getElementById('changePasswordBtn').addEventListener('click', function() {
  modal.style.display = 'flex';
  document.getElementById('oldPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  document.getElementById('changePasswordError').style.display = 'none';
});

modalClose.addEventListener('click', function() {
  modal.style.display = 'none';
});

window.addEventListener('click', function(e) {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const oldPwd = document.getElementById('oldPassword').value;
  const newPwd = document.getElementById('newPassword').value;
  const confirmPwd = document.getElementById('confirmPassword').value;
  const errorDiv = document.getElementById('changePasswordError');
  errorDiv.style.display = 'none';

  if (newPwd !== confirmPwd) {
    errorDiv.textContent = 'Новый пароль и подтверждение не совпадают.';
    errorDiv.style.display = 'block';
    return;
  }
  try {
    changePassword(oldPwd, newPwd);
    alert('Пароль успешно изменён!');
    modal.style.display = 'none';
    logout(); // выходим, чтобы войти с новым паролем
  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.style.display = 'block';
  }
});

// ===== ИНИЦИАЛИЗАЦИЯ =====
// При загрузке показываем экран входа (он уже виден по умолчанию)
