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
document.addEventListener('DOMContentLoaded', function() {
  // Получаем все элементы
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const passwordInput = document.getElementById('passwordInput');
  const logoutBtn = document.getElementById('logoutBtn');
  const employeeForm = document.getElementById('employeeForm');
  const searchInput = document.getElementById('searchInput');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importInput = document.getElementById('importInput');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const changePasswordModal = document.getElementById('changePasswordModal');
  const modalClose = document.getElementById('modalClose');
  const changePasswordForm = document.getElementById('changePasswordForm');
  const oldPassword = document.getElementById('oldPassword');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const changePasswordError = document.getElementById('changePasswordError');

  // Проверяем наличие элементов и выводим предупреждения, если что-то не найдено
  if (!loginForm) console.warn('loginForm not found');
  if (!loginError) console.warn('loginError not found');
  if (!passwordInput) console.warn('passwordInput not found');
  if (!logoutBtn) console.warn('logoutBtn not found');
  if (!employeeForm) console.warn('employeeForm not found');
  if (!searchInput) console.warn('searchInput not found');
  if (!exportBtn) console.warn('exportBtn not found');
  if (!importBtn) console.warn('importBtn not found');
  if (!importInput) console.warn('importInput not found');
  if (!changePasswordBtn) console.warn('changePasswordBtn not found');
  if (!changePasswordModal) console.warn('changePasswordModal not found');
  if (!modalClose) console.warn('modalClose not found');
  if (!changePasswordForm) console.warn('changePasswordForm not found');
  if (!oldPassword) console.warn('oldPassword not found');
  if (!newPassword) console.warn('newPassword not found');
  if (!confirmPassword) console.warn('confirmPassword not found');
  if (!changePasswordError) console.warn('changePasswordError not found');

  // Функция входа
  function login(password) {
    if (checkPassword(password)) {
      isAuthenticated = true;
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('appContent').style.display = 'block';
      loadData();
      renderTable();
      loginError.style.display = 'none';
      passwordInput.value = '';
    } else {
      loginError.style.display = 'block';
      passwordInput.value = '';
      passwordInput.focus();
    }
  }

  function logout() {
    isAuthenticated = false;
    document.getElementById('appContent').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    passwordInput.value = '';
    loginError.style.display = 'none';
  }

  // Обработчики событий
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const pwd = passwordInput.value;
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

  if (changePasswordBtn && changePasswordModal && modalClose && changePasswordForm) {
    changePasswordBtn.addEventListener('click', function() {
      changePasswordModal.style.display = 'flex';
      oldPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
      changePasswordError.style.display = 'none';
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
      const oldPwd = oldPassword.value;
      const newPwd = newPassword.value;
      const confirmPwd = confirmPassword.value;
      changePasswordError.style.display = 'none';

      if (newPwd !== confirmPwd) {
        changePasswordError.textContent = 'Новый пароль и подтверждение не совпадают.';
        changePasswordError.style.display = 'block';
        return;
      }
      try {
        changePassword(oldPwd, newPwd);
        alert('Пароль успешно изменён!');
        changePasswordModal.style.display = 'none';
        logout(); // выходим, чтобы войти с новым паролем
      } catch (err) {
        changePasswordError.textContent = err.message;
        changePasswordError.style.display = 'block';
      }
    });
  }

  // Инициализация: экран входа уже виден, основное скрыто
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appContent').style.display = 'none';
});
