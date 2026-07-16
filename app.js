const STORAGE_KEY = 'asuls_fsb_data';

let employees = [];

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
    tr.innerHTML = `
      <td>${emp.lastName} ${emp.firstName} ${emp.patronymic || ''}</td>
      <td>${emp.department || ''}</td>
      <td>${emp.rank || ''}</td>
      <td>${emp.position || ''}</td>
      <td>${emp.status || ''}</td>
      <td>
        <button data-index="${index}" class="editBtn">✏️</button>
        <button data-index="${index}" class="deleteBtn">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  // Обработчики для кнопок редактирования и удаления
  document.querySelectorAll('.deleteBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.target.dataset.index;
      if (confirm('Удалить сотрудника?')) {
        employees.splice(idx, 1);
        saveData();
        renderTable();
      }
    });
  });
  // редактирование пока опустим
}

document.getElementById('employeeForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const newEmp = {
    id: Date.now().toString(),
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
  employees.push(newEmp);
  saveData();
  renderTable();
  this.reset();
});

// Экспорт JSON
document.getElementById('exportBtn').addEventListener('click', function() {
  const blob = new Blob([JSON.stringify(employees, null, 2)], {type: 'application/json'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'asuls_export.json';
  link.click();
});

// Импорт JSON
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
    } catch(err) {
      alert('Ошибка импорта: неверный формат JSON');
    }
  };
  reader.readAsText(file);
  this.value = ''; // сброс
});

// Поиск (простой)
document.getElementById('searchInput').addEventListener('input', function() {
  const query = this.value.toLowerCase();
  const rows = document.querySelectorAll('#tableBody tr');
  rows.forEach(row => {
    const fio = row.cells[0]?.textContent.toLowerCase() || '';
    row.style.display = fio.includes(query) ? '' : 'none';
  });
});

// Инициализация
loadData();
renderTable();
