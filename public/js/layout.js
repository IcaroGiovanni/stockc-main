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
  const logoSC = document.querySelector('.logo-sc');

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

  // Tenta preencher o nome da empresa e a logo, mas não quebra se falhar.
  if (companyNameSidebar || logoSC) {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const empresaRes = await fetch('/api/empresa', { headers });
      if (empresaRes.ok) {
        const empresa = await empresaRes.json();
        
        // Atualiza o nome da empresa no sidebar
        if (companyNameSidebar) {
          companyNameSidebar.textContent = (empresa.nome_exibicao || empresa.nome || 'StockCtrl').toUpperCase();
        }
        
        // Verifica se existe um elemento para a logo e se a empresa tem uma logo
        if (logoSC && logoSC.parentElement && logoSC.parentElement.parentElement) {
          // Verifica se já existe uma imagem de logo
          let logoImg = logoSC.parentElement.querySelector('img.company-logo');
          
          // Se a empresa tem uma logo, exibe a logo da empresa
          if (empresa.logo) {
            // Se não existe uma imagem de logo, cria uma
            if (!logoImg) {
              logoImg = document.createElement('img');
              logoImg.className = 'company-logo';
              logoImg.alt = 'Logo da empresa';
              logoImg.style.maxHeight = '40px';
              logoImg.style.maxWidth = '100%';
              logoImg.style.marginBottom = '5px';
              
              // Insere a imagem antes do texto SC
              logoSC.parentElement.insertBefore(logoImg, logoSC);
              
              // Esconde o texto SC quando a logo está presente
              logoSC.style.display = 'none';
            }
            
            // Define a fonte da imagem como a logo da empresa
            logoImg.src = empresa.logo;
          }
        }
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
    console.warn('Elementos de identificação da empresa não encontrados neste layout. As informações da empresa não serão exibidas.');
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

  // --- Funcionalidade do Menu Mobile ---
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  // Mostrar botão hamburger em telas pequenas
  function checkMobileMenu() {
    if (window.innerWidth <= 768) {
      if (mobileMenuToggle) mobileMenuToggle.classList.remove('hidden');
    } else {
      if (mobileMenuToggle) mobileMenuToggle.classList.add('hidden');
      if (sidebar) sidebar.classList.remove('mobile-open');
    }
  }
  
  // Event listener para o botão hamburger
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      if (sidebar) {
        sidebar.classList.toggle('mobile-open');
      }
    });
  }
  
  // Fechar menu ao clicar fora dele (em mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (sidebar && sidebar.classList.contains('mobile-open')) {
        if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
          sidebar.classList.remove('mobile-open');
        }
      }
    }
  });
  
  // Verificar tamanho da tela ao carregar e redimensionar
  checkMobileMenu();
  window.addEventListener('resize', checkMobileMenu);

  // Handler para o link do Chatbot no sidebar
  const chatbotLink = document.querySelector('a[href="/chatbot"]');
  if (chatbotLink) {
      chatbotLink.addEventListener('click', function(e) {
          e.preventDefault();
          // Cria modal se não existir
          let modal = document.getElementById('modal-chatbot-dev');
          if (!modal) {
              modal = document.createElement('div');
              modal.id = 'modal-chatbot-dev';
              modal.style.position = 'fixed';
              modal.style.top = '0';
              modal.style.left = '0';
              modal.style.width = '100vw';
              modal.style.height = '100vh';
              modal.style.background = 'rgba(0,0,0,0.5)';
              modal.style.display = 'flex';
              modal.style.alignItems = 'center';
              modal.style.justifyContent = 'center';
              modal.style.zIndex = '9999';
              modal.innerHTML = `
                  <div style="background:#23232b;padding:32px 40px;border-radius:16px;box-shadow:0 4px 32px #000a;text-align:center;max-width:90vw;">
                      <h2 style="color:#facc15;font-size:1.5rem;margin-bottom:12px;"><i class='fas fa-robot'></i> Chatbot</h2>
                      <p style="color:#fff;font-size:1.1rem;">Em desenvolvimento</p>
                      <button id="close-modal-chatbot-dev" style="margin-top:24px;padding:10px 28px;background:#facc15;color:#23232b;border:none;border-radius:8px;font-weight:600;font-size:1rem;cursor:pointer;">Fechar</button>
                  </div>
              `;
              document.body.appendChild(modal);
              document.getElementById('close-modal-chatbot-dev').onclick = function() {
                  modal.remove();
              };
          }
      });
  }
});