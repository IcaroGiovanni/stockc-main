document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.remove('active');
      if (i === index) {
        slide.classList.add('active');
      }
    });
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  if (slides.length > 0) {
    showSlide(currentSlide);
    setInterval(nextSlide, 5000); // Change slide every 5 seconds
  }

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('authToken', data.token);

        // Solução de contorno: buscar dados da empresa separadamente
        // já que o payload do token não está confiável no momento.
        try {
          const empresaResponse = await fetch('/api/empresa', {
            headers: { 'Authorization': `Bearer ${data.token}` }
          });
          const empresaData = await empresaResponse.json();

          if (empresaResponse.ok && empresaData.onboarding_completed === false) {
            window.location.href = '/onboarding';
          } else {
            window.location.href = '/dashboard';
          }
        } catch (e) {
          // Se a busca de empresa falhar, vai para o dashboard como padrão
          console.error('Erro ao buscar dados da empresa após login, redirecionando para dashboard.', e);
          window.location.href = '/dashboard';
        }
      } else {
        alert(`Erro: ${data.message || 'Resposta inválida do servidor.'}`);
      }
    } catch (error) {
      console.error('Erro ao tentar fazer login:', error);
      alert('Não foi possível conectar ao servidor. Verifique o console para mais detalhes.');
    }
  });
});

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