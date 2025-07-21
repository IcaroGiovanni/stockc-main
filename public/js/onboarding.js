document.addEventListener('DOMContentLoaded', () => {
  const steps = document.querySelectorAll('.step-content');
  const stepIndicators = document.querySelectorAll('.steps-indicator .step');
  const stepLines = document.querySelectorAll('.steps-indicator .step-line');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const finishBtn = document.getElementById('finish-btn');
  const form = document.getElementById('onboarding-form');
  const locationsContainer = document.getElementById('locations-container');
  const addLocationBtn = document.getElementById('add-location-btn');

  const locationDefinitions = [{ id: 'main', name: 'Estoque Principal', protected: true }];
  let currentStep = 1;

  const updateButtons = () => {
    prevBtn.style.display = (currentStep === 1) ? 'none' : 'inline-block';
    nextBtn.style.display = (currentStep === steps.length) ? 'none' : 'inline-block';
    finishBtn.style.display = (currentStep === steps.length) ? 'inline-block' : 'none';
  };

  const updateIndicators = (stepNumber) => {
    stepIndicators.forEach((indicator, index) => {
      if (index < stepNumber) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
    stepLines.forEach((line, index) => {
      if (index < stepNumber - 1) {
        line.classList.add('active');
      } else {
        line.classList.remove('active');
      }
    });
  };

  const showStep = (stepNumber) => {
    // Validação de campos obrigatórios antes de avançar
    if (stepNumber > currentStep) {
      const currentStepForm = document.getElementById(`step-${currentStep}`);
      const requiredInputs = currentStepForm.querySelectorAll('input[required]');
      for (const input of requiredInputs) {
        if (!input.value.trim()) {
          showToast(`O campo "${input.previousElementSibling.textContent}" é obrigatório.`);
          input.focus();
          return; // Impede de avançar
        }
      }
    }

    steps.forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');

    currentStep = stepNumber;
    updateButtons();
    updateIndicators(currentStep);
  };

  const renderLocations = () => {
    locationsContainer.innerHTML = '';
    locationDefinitions.forEach((loc, index) => {
      const locationEl = document.createElement('div');
      locationEl.className = 'flex items-center gap-2';
      locationEl.innerHTML = `
                <input type="text" class="neo-input flex-grow" value="${loc.name}" ${loc.protected ? 'disabled' : ''} data-index="${index}" placeholder="Nome do Local">
                <button type="button" class="btn-icon-danger" data-index="${index}" ${loc.protected ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            `;
      locationsContainer.appendChild(locationEl);
    });
  };

  addLocationBtn.addEventListener('click', () => {
    if (locationDefinitions.length < 5) { // Limite de 5 locais no onboarding
      locationDefinitions.push({ id: `new_${Date.now()}`, name: '' });
      renderLocations();
    } else {
      showToast('Você pode adicionar mais locais na tela de configurações.');
    }
  });

  locationsContainer.addEventListener('change', (e) => {
    if (e.target.tagName === 'INPUT') {
      const index = e.target.dataset.index;
      locationDefinitions[index].name = e.target.value.trim();
    }
  });

  locationsContainer.addEventListener('click', (e) => {
    const button = e.target.closest('.btn-icon-danger');
    if (button) {
      const index = button.dataset.index;
      locationDefinitions.splice(index, 1);
      renderLocations();
    }
  });

  nextBtn.addEventListener('click', () => showStep(currentStep + 1));
  prevBtn.addEventListener('click', () => showStep(currentStep - 1));

  finishBtn.addEventListener('click', () => {
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const finalLocations = locationDefinitions.filter(l => l.name.trim() !== '');
    if(finalLocations.length === 0) {
      showToast('Você precisa definir pelo menos um local de estoque.');
      return;
    }

    data.location_definitions = finalLocations;
    data.onboarding_completed = true;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) { throw new Error('Token de autenticação não encontrado.'); }

      const response = await fetch('/api/empresa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Falha ao salvar configurações.');
      }

      showToast('Configurações salvas com sucesso!', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);

    } catch (error) {
      console.error('Erro no onboarding:', error);
      showToast(error.message, 'error');
    }
  });

  // Função de Toast (pode ser movida para um arquivo global)
  function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast ${type} show`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  // Initialize
  showStep(1);
  renderLocations();
});