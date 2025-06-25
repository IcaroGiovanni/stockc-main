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

// Lógica de Layout Comum
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/';
    return;
  }
  const userData = parseJwt(token);
  if (!userData) {
    localStorage.removeItem('authToken');
    window.location.href = '/';
    return;
  }

  // --- Seletores de elementos do Layout ---
  const companyNameSidebar = document.getElementById('company-name-sidebar');
  const logoutBtn = document.getElementById('logout-btn');
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  const navUsersLink = document.querySelector('nav a[href="/usuarios"]');
  const navLogsLink = document.querySelector('nav a[href="/logs"]');

  // O único elemento verdadeiramente essencial é o botão de logout.
  if (!logoutBtn) {
    console.error('Elemento crítico \'logout-btn\' não encontrado. A navegação pode estar quebrada.');
    alert('Erro crítico de layout. O botão de sair não foi encontrado.');
    return;
  }

  // --- Event Listeners do Layout ---
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('authToken');
    window.location.href = '/';
  });

  // --- Lógica de Visibilidade ---
  if (userData.role !== 'diretor') {
    if (navUsersLink) navUsersLink.style.display = 'none';
    if (navLogsLink) navLogsLink.style.display = 'none';
  }

  // Tenta preencher o nome da empresa, mas não quebra se falhar.
  if (companyNameSidebar) {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const empresaRes = await fetch('/api/empresa', { headers });
      if (empresaRes.ok) {
        const empresa = await empresaRes.json();
        companyNameSidebar.textContent = (empresa.nome_exibicao || empresa.nome || 'StockCtrl').toUpperCase();
      } else {
        const errorData = await empresaRes.json().catch(() => ({ message: 'Resposta não contém JSON válido.' }));
        const errorMessage = `Falha ao buscar dados da empresa. Status: ${empresaRes.status}. Mensagem: ${errorData.message}`;
        console.warn(errorMessage);
        // Não vamos mais mostrar um alert aqui para não interromper o usuário,
        // mas o log no console já é suficiente para depuração.
      }
    } catch (error) {
      console.error('Erro crítico ao carregar dados da empresa para o layout:', error);
      alert(`Erro crítico de rede ou script ao buscar dados da empresa: ${error.message}`);
    }
  } else {
    console.warn('Elemento \'company-name-sidebar\' não encontrado neste layout. O nome da empresa não será exibido.');
  }

  // 2. Fetch do Usuário para o widget de perfil
  if (userAvatar && userName && userData && userData.id) {
    try {
      const userRes = await fetch(`/api/usuarios/${userData.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (userRes.ok) {
        const user = await userRes.json();
        userName.textContent = user.full_name || user.username;
        if (user.profile_picture_url) {
          userAvatar.src = user.profile_picture_url;
        } else {
          userAvatar.src = `https://i.pravatar.cc/40?u=${user.username}`; // Avatar de fallback
        }
      } else {
        console.warn(`Não foi possível carregar os dados do usuário para o layout. Status: ${userRes.status}. Usando fallback.`);
        userName.textContent = userData.username;
        userAvatar.src = `https://i.pravatar.cc/40?u=${userData.username}`;
      }
    } catch (error) {
      console.error('Erro crítico ao buscar dados do usuário para o widget:', error);
      userName.textContent = userData.username; // Fallback em caso de erro de rede
      userAvatar.src = `https://i.pravatar.cc/40?u=${userData.username}`;
    }
  }
});