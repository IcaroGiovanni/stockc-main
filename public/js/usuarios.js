document.addEventListener('DOMContentLoaded', () => {
  // --- Mapa de Cargos ---
  const roleMap = {
    'diretor': 'Diretor de Logística',
    'user': 'Auxiliar de Logística',
    'viewer': 'Jovem Logística'
  };
  const reverseRoleMap = Object.fromEntries(Object.entries(roleMap).map(a => a.reverse()));

  // IDs CORRIGIDOS para corresponder ao HTML moderno
  const modal = document.getElementById('modal-usuario');
  const btnNovo = document.getElementById('btn-novo-usuario');
  const closeModal = document.getElementById('close-modal-usuario');
  const form = document.getElementById('form-usuario');
  const tabela = document.getElementById('tabela-usuarios');
  const modalTitle = document.getElementById('modal-title-usuario');

  // Elementos do formulário
  const inputId = document.getElementById('usuario-id');
  const inputFullName = document.getElementById('full_name');
  const inputUsername = document.getElementById('username');
  const inputEmail = document.getElementById('email');
  const inputPassword = document.getElementById('password');
  const passwordGroup = document.getElementById('password-group');
  const inputRole = document.getElementById('role');

  // Elementos do Modal de Exclusão
  const deleteModal = document.getElementById('delete-confirm-modal-usuario');
  const itemNameSpan = document.getElementById('item-to-delete-name-usuario');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn-usuario');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn-usuario');


  const token = localStorage.getItem('authToken');
  if (!token) {
    // Não usar alert, pois pode ser bloqueado. Redirecionar diretamente.
    window.location.href = '/';
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // A verificação de elementos agora é mais granular para facilitar a depuração.
  if (!modal) console.error('Elemento \'modal-usuario\' não encontrado!');
  if (!btnNovo) console.error('Elemento \'btn-novo-usuario\' não encontrado!');
  if (!closeModal) console.error('Elemento \'close-modal-usuario\' não encontrado!');
  if (!form) console.error('Elemento \'form-usuario\' não encontrado!');
  if (!tabela) console.error('Elemento \'tabela-usuarios\' não encontrado!');
  if (!deleteModal) console.error('Elemento \'delete-confirm-modal-usuario\' não encontrado!');


  // --- Funções de UI (Modal) ---
  const openModal = (title, user = null) => {
    form.reset();
    modalTitle.textContent = title;
    if (user) {
      inputId.value = user.id;
      inputFullName.value = user.full_name || '';
      inputUsername.value = user.username;
      inputEmail.value = user.email;
      inputRole.value = user.role;
      passwordGroup.style.display = 'none'; // Esconder campo de senha na edição
    } else {
      inputId.value = '';
      passwordGroup.style.display = 'block'; // Mostrar campo de senha ao criar
      inputPassword.setAttribute('required', 'required');
    }
    modal.classList.remove('hidden');
  };

  const closeModalFunction = () => {
    modal.classList.add('hidden');
    form.reset();
    inputPassword.removeAttribute('required');
    populateRoles(); // Garante que o select volte ao normal
  };

  const openDeleteModal = (id, name) => {
    itemNameSpan.textContent = `"${name}"`;
    deleteModal.dataset.id = id;
    deleteModal.classList.remove('hidden');
  };

  const closeDeleteModal = () => {
    deleteModal.classList.add('hidden');
  };

  const populateRoles = (currentUserRole = 'diretor') => {
    inputRole.innerHTML = '';
    // Apenas um Diretor pode criar outro Diretor
    const rolesToShow = (currentUserRole === 'diretor')
      ? roleMap
      : { 'user': 'Auxiliar de Logística', 'viewer': 'Jovem Logística' };

    for (const [internalRole, displayName] of Object.entries(rolesToShow)) {
      const option = document.createElement('option');
      option.value = internalRole;
      option.textContent = displayName;
      inputRole.appendChild(option);
    }
  };


  // --- Event Listeners para Modais ---
  btnNovo.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('Adicionar Novo Usuário');
  });

  closeModal.addEventListener('click', closeModalFunction);
  document.querySelector('.modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      closeModalFunction();
    }
  });

  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', handleDelete);
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      closeDeleteModal();
    }
  });


  // --- Lógica da API ---
  async function carregarUsuarios() {
    try {
      const res = await fetch('/api/users', { headers });
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/';
        return;
      }
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const users = await res.json();
      renderTabela(users);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      tabela.innerHTML = '<tr><td colspan="5" class="error-message">Não foi possível carregar os usuários.</td></tr>';
    }
  }

  function renderTabela(users) {
    tabela.innerHTML = ''; // Limpa a tabela
    if (users.length === 0) {
      tabela.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Nenhum usuário encontrado.</td></tr>';
      return;
    }
    users.forEach(user => {
      const row = tabela.insertRow();
      row.innerHTML = `
                <td>${user.full_name || 'N/A'}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="role-tag role-${user.role}">${roleMap[user.role] || user.role}</span></td>
                <td class="actions">
                    <button class="btn-icon btn-edit" data-id="${user.id}" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-icon btn-delete" data-id="${user.id}" data-name="${user.username}" title="Apagar"><i class="fas fa-trash"></i></button>
                </td>
            `;
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = inputId.value;
    const isEditing = !!id;

    const dados = {
      full_name: inputFullName.value,
      username: inputUsername.value,
      email: inputEmail.value,
      role: inputRole.value
    };

    let url = '/register'; // Rota de criação (que também lida com novos usuários)
    let method = 'POST';

    if (isEditing) {
      url = `/api/usuarios/${id}`;
      method = 'PUT';
    } else {
      if (inputPassword.value) {
        dados.password = inputPassword.value;
      } else {
        // Idealmente, a validação 'required' pegaria isso, mas é uma segurança extra.
        alert('O campo senha é obrigatório para novos usuários.');
        return;
      }
    }

    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(dados) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Falha na operação.');

      alert(`Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      closeModalFunction();
      carregarUsuarios();

    } catch (err) {
      alert(`Erro: ${err.message}`);
      console.error(err);
    }
  });

  tabela.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');

    if (editBtn) {
      const id = editBtn.dataset.id;
      try {
        const res = await fetch(`/api/users/${id}`, { headers });
        if (!res.ok) throw new Error('Falha ao buscar dados do usuário.');
        const user = await res.json();
        openModal('Editar Usuário', user);
      } catch (err) {
        alert(err.message);
      }
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const name = deleteBtn.dataset.name;
      openDeleteModal(id, name);
    }
  });

  async function handleDelete() {
    const id = deleteModal.dataset.id;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || 'Falha ao apagar.');
      }
      alert('Usuário apagado com sucesso!');
      closeDeleteModal();
      carregarUsuarios();
    } catch (err) {
      alert(`Erro: ${err.message}`);
      console.error(err);
    }
  }

  // --- Inicialização ---
  const currentUserData = parseJwt(token);
  populateRoles(currentUserData.role);
  carregarUsuarios();
});