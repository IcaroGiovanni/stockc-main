// Função para decodificar um token JWT (não verifica a assinatura)
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return `%${  (`00${  c.charCodeAt(0).toString(16)}`).slice(-2)}`;
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Erro ao decodificar o token:', e);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // A lógica de preenchimento do Header/Sidebar foi movida para /js/layout.js
  // Este arquivo agora pode focar apenas na lógica específica do Dashboard (ex: carregar gráficos e estatísticas)

  const token = localStorage.getItem('authToken');
  if (!token) {
    // Se não houver token, talvez redirecionar para o login
    console.error('Token não encontrado. O usuário não está autenticado.');
    return;
  }

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar os dados do dashboard.');
      }

      const data = await response.json();
      updateDashboardUI(data);
      renderActionsChart(data.logsPorDia || []);
      renderActivityCalendar(data.logsPorDia || []);

    } catch (error) {
      console.error('Erro ao buscar dados para o dashboard:', error);
      // Opcional: mostrar uma mensagem de erro na UI
    }
  };

  const updateDashboardUI = (data) => {
    // Adiciona uma verificação de segurança para o objeto de dados principal
    if (data) {
      // Atualiza os cards de estatísticas
      document.getElementById('total-produtos').textContent = data.total_products || 0;
      document.getElementById('total-itens').textContent = data.total_items || 0;
      document.getElementById('logs-hoje').textContent = data.logs_today || 0;
      document.getElementById('total-usuarios').textContent = data.total_users || 0;

      // Atualiza a tabela de atividades recentes
      const activityBody = document.getElementById('recent-activity-body');
      activityBody.innerHTML = ''; // Limpa o conteúdo existente

      if (data.atividadesRecentes && data.atividadesRecentes.length > 0) {
        data.atividadesRecentes.forEach(log => {
          const tr = document.createElement('tr');

          let produtoNome = 'N/A';
          if (log.details) {
            try {
              const detailsObj = JSON.parse(log.details);
              produtoNome = detailsObj.nome || `ID ${detailsObj.produtoId}` || 'N/A';
            } catch (e) {
              produtoNome = 'N/A';
            }
          }

          tr.innerHTML = `
                        <td>${produtoNome}</td>
                        <td><span class="activity-tag">${log.action.replace(/_/g, ' ')}</span></td>
                        <td>${log.user_full_name}</td>
                        <td>${new Date(log.timestamp_br).toLocaleString('pt-BR')}</td>
                    `;
          activityBody.appendChild(tr);
        });
      } else {
        activityBody.innerHTML = '<tr><td colspan="4" class="text-center p-8">Nenhuma atividade recente.</td></tr>';
      }
    } else {
      console.error('Dados recebidos do dashboard são nulos ou indefinidos. Exibindo valores padrão.');
      // Define valores padrão para todos os campos em caso de erro
      document.getElementById('total-produtos').textContent = 0;
      document.getElementById('total-itens').textContent = 0;
      document.getElementById('logs-hoje').textContent = 0;
      document.getElementById('total-usuarios').textContent = 0;
      const activityBody = document.getElementById('recent-activity-body');
      activityBody.innerHTML = '<tr><td colspan="4" class="text-center p-8 text-red-500">Erro ao carregar atividades.</td></tr>';
    }
  };

  // Gráfico de ações por dia
  function renderActionsChart(logsPorDia) {
    const ctx = document.getElementById('actionsChart').getContext('2d');
    if (!logsPorDia || logsPorDia.length === 0) {
      ctx.clearRect(0, 0, 400, 120);
      return;
    }
    const labels = logsPorDia.map(l => l.dia);
    const data = logsPorDia.map(l => l.total);
    if (window.actionsChartInstance) window.actionsChartInstance.destroy();
    window.actionsChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Ações',
          data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.15)',
          pointBackgroundColor: '#fbbf24',
          pointBorderColor: '#fbbf24',
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#fff' }, grid: { color: '#23283a' } },
          y: { beginAtZero: true, ticks: { color: '#fff' }, grid: { color: '#23283a' } }
        }
      }
    });
  }

  // Calendário de atividades
  function renderActivityCalendar(logsPorDia) {
    const calendarEl = document.getElementById('activity-calendar');
    if (!calendarEl) return;
    // Limpa
    calendarEl.innerHTML = '';
    // Pega mês/ano atual
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Mapeia logs por dia
    const logsMap = {};
    logsPorDia.forEach(l => { logsMap[l.dia] = l.total; });
    // Cabeçalho
    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.marginBottom = '8px';
    header.innerHTML = `<b>${now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</b>`;
    calendarEl.appendChild(header);
    // Dias da semana
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const weekRow = document.createElement('div');
    weekRow.style.display = 'flex';
    weekRow.style.justifyContent = 'center';
    weekDays.forEach(d => {
      const wd = document.createElement('span');
      wd.textContent = d;
      wd.style.width = '32px';
      wd.style.display = 'inline-block';
      wd.style.textAlign = 'center';
      wd.style.color = '#fbbf24';
      weekRow.appendChild(wd);
    });
    calendarEl.appendChild(weekRow);
    // Dias do mês
    const firstDay = new Date(year, month, 1).getDay();
    let dayCount = 1;
    for (let w = 0; w < 6; w++) {
      const week = document.createElement('div');
      week.style.display = 'flex';
      week.style.justifyContent = 'center';
      for (let d = 0; d < 7; d++) {
        const dayEl = document.createElement('span');
        dayEl.className = 'calendar-day';
        if (w === 0 && d < firstDay) {
          dayEl.innerHTML = '&nbsp;';
        } else if (dayCount <= daysInMonth) {
          dayEl.textContent = dayCount;
          const diaStr = `${year}-${String(month+1).padStart(2,'0')}-${String(dayCount).padStart(2,'0')}`;
          if (logsMap[diaStr] >= 5) {
            dayEl.classList.add('active-blue');
          } else if (logsMap[diaStr] > 0) {
            dayEl.classList.add('active-yellow');
          }
          if (dayCount === now.getDate()) {
            dayEl.classList.add('today');
          }
          dayCount++;
        } else {
          dayEl.innerHTML = '&nbsp;';
        }
        week.appendChild(dayEl);
      }
      calendarEl.appendChild(week);
      if (dayCount > daysInMonth) break;
    }
  }

  fetchDashboardData();
});