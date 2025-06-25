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

  fetchDashboardData();
});