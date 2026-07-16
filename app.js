const STORAGE_KEY = 'asuls_fsb_data';
let employees = [];
let editingId = null;

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  employees = raw ? JSON.parse(raw) : [];
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  employees.forEach((emp, index) => {
    const tr = document.createElement('tr');
    const fio = `${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}`.trim();
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

  // Удаление
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

  // Редактирование – заполняем форму данными
  document.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const emp = employees.find(e => e.id === id);
      if (!emp) return;
      editingId = id;
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
      document.querySelector('.card__title i').className = 'fas fa-user-edit';
      document.querySelector('.card__title').childNodes[2].textContent = ' Редактировать сотрудника';
      document.querySelector('#employeeForm button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Сохранить';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// Обработка отправки формы (добавление / обновление)
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
    // Обновляем
    const index = employees.findIndex(e => e.id === editingId);
    if (index !== -1) employees[index] = newEmp;
    editingId = null;
    // Возвращаем заголовок и кнопку
    document.querySelector('.card__title i').className = 'fas fa-user-plus';
    document.querySelector('.card__title').childNodes[2].textContent = ' Добавить сотрудника';
    document.querySelector('#employeeForm button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Добавить';
  } else {
    employees.push(newEmp);
  }
  saveData();
  renderTable();
  this.reset();
  // Сброс состояния редактирования (если было)
  if (!editingId) {
    // ничего
  }
});

// Экспорт
document.getElementById('exportBtn').addEventListener('click', function() {
  const blob = new Blob([JSON.stringify(employees, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'asuls_export.json';
  link.click();
});

// Импорт
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

// Поиск
document.getElementById('searchInput').addEventListener('input', function() {
  const query = this.value.toLowerCase().trim();
  const rows = document.querySelectorAll('#tableBody tr');
  rows.forEach(row => {
    const fio = row.cells[0]?.textContent.toLowerCase() || '';
    row.style.display = fio.includes(query) ? '' : 'none';
  });
});

// Инициализация
loadData();
renderTable();
