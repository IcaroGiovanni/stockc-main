document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('logs-table-body');
  const searchInput = document.getElementById('search-logs');
  const loader = document.getElementById('loader-overlay');

  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/';
    return;
  }
  const headers = { 'Authorization': `Bearer ${token}` };

  let allLogs = [];

  const showLoader = (show) => loader.classList.toggle('hidden', !show);

  const renderLogs = (logs) => {
    tableBody.innerHTML = '';
    if (logs.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhum log de atividade encontrado.</td></tr>';
      return;
    }

    logs.forEach(log => {
      const row = tableBody.insertRow();
      const details = log.details ? JSON.stringify(JSON.parse(log.details), null, 2) : '{}';

      row.innerHTML = `
                <td>${new Date(log.created_at).toLocaleString('pt-BR')}</td>
                <td>${log.user_full_name || 'Sistema'}</td>
                <td><span class="role-tag">${log.action.replace(/_/g, ' ')}</span></td>
                <td><pre>${details}</pre></td>
            `;
    });
  };

  const filterLogs = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredLogs = allLogs.filter(log => {
      const action = log.action.toLowerCase();
      const user = (log.user_full_name || '').toLowerCase();
      return action.includes(searchTerm) || user.includes(searchTerm);
    });
    renderLogs(filteredLogs);
  };

  const fetchLogs = async () => {
    showLoader(true);
    try {
      const res = await fetch('/api/logs', { headers });
      if (!res.ok) {
        if(res.status === 403) throw new Error('Acesso negado.');
        throw new Error('Falha ao carregar os logs.');
      }
      allLogs = await res.json();
      renderLogs(allLogs);
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="4" class="error-message">${error.message}</td></tr>`;
    } finally {
      showLoader(false);
    }
  };

  searchInput.addEventListener('input', filterLogs);
  fetchLogs();
});