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
      const title = document.querySelector('.card__title i');
      if (title) title.className = 'fas fa-user-edit';
      const titleText = document.querySelector('.card__title');
      if (titleText) titleText.childNodes[2].textContent = ' Редактировать сотрудника';
      const submitBtn = document.querySelector('#employeeForm button[type="submit"]');
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить';
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
  const title = document.querySelector('.card__title i');
  if (title) title.className = 'fas fa-user-plus';
  const titleText = document.querySelector('.card__title');
  if (titleText) titleText.childNodes[2].textContent = ' Добавить сотрудника';
  const submitBtn = document.querySelector('#employeeForm button[type="submit"]');
  if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Добавить';
}

// ===== ОБРАБОТЧИКИ (обёрнуты в DOMContentLoaded) =====
document.addEventListener('DOMContentLoaded', function() {

  // Форма сотрудника
  const employeeForm = document.getElementById('employeeForm');
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

  // Поиск
  const searchInput = document.getElementById('searchInput');
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

  // Экспорт
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      const blob = new Blob([JSON.stringify(employees, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'asuls_export.json';
      link.click();
    });
  }

  // Импорт
  const importBtn = document.getElementById('importBtn');
  const importInput = document.getElementById('importInput');
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

  // Логин
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const pwd = document.getElementById('passwordInput').value;
      login(pwd);
    });
  }

  // Выход
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Смена пароля
  const changePwdBtn = document.getElementById('changePasswordBtn');
  const modal = document.getElementById('changePasswordModal');
  const modalClose = document.getElementById('modalClose');
  const changePwdForm = document.getElementById('changePasswordForm');

  if (changePwdBtn && modal) {
    changePwdBtn.addEventListener('click', function() {
      modal.style.display = 'flex';
      document.getElementById('oldPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
      document.getElementById('changePasswordError').style.display = 'none';
    });
  }

  if (modalClose && modal) {
    modalClose.addEventListener('click', function() {
      modal.style.display = 'none';
    });
  }

  if (modal) {
    window.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  if (changePwdForm) {
    changePwdForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const oldPwd = document.getElementById('oldPassword').value;
      const newPwd = document.getElementById('newPassword').value;
      const confirmPwd = document.getElementById('confirmPassword').value;
      const errorDiv = document.getElementById('changePasswordError');
      if (errorDiv) errorDiv.style.display = 'none';

      if (newPwd !== confirmPwd) {
        if (errorDiv) {
          errorDiv.textContent = 'Новый пароль и подтверждение не совпадают.';
          errorDiv.style.display = 'block';
        }
        return;
      }
      try {
        changePassword(oldPwd, newPwd);
        alert('Пароль успешно изменён!');
        if (modal) modal.style.display = 'none';
        logout(); // выходим, чтобы войти с новым паролем
      } catch (err) {
        if (errorDiv) {
          errorDiv.textContent = err.message;
          errorDiv.style.display = 'block';
        }
      }
    });
  }

}); // конец DOMContentLoaded

// ===== ФУНКЦИИ АВТОРИЗАЦИИ (вне DOMContentLoaded, чтобы были доступны) =====
function login(password) {
  if (checkPassword(password)) {
    isAuthenticated = true;
    const loginScreen = document.getElementById('loginScreen');
    const appContent = document.getElementById('appContent');
    if (loginScreen) loginScreen.style.display = 'none';
    if (appContent) appContent.style.display = 'block';
    loadData();
    renderTable();
    const error = document.getElementById('loginError');
    if (error) error.style.display = 'none';
    const pwdInput = document.getElementById('passwordInput');
    if (pwdInput) pwdInput.value = '';
  } else {
    const error = document.getElementById('loginError');
    if (error) error.style.display = 'block';
    const pwdInput = document.getElementById('passwordInput');
    if (pwdInput) {
      pwdInput.value = '';
      pwdInput.focus();
    }
  }
}

function logout() {
  isAuthenticated = false;
  const appContent = document.getElementById('appContent');
  const loginScreen = document.getElementById('loginScreen');
  if (appContent) appContent.style.display = 'none';
  if (loginScreen) loginScreen.style.display = 'flex';
  const pwdInput = document.getElementById('passwordInput');
  if (pwdInput) pwdInput.value = '';
  const error = document.getElementById('loginError');
  if (error) error.style.display = 'none';
}
