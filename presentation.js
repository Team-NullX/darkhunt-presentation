/**
 * Project Dark Hunt — 3-Slide Presentation Interactive Engine
 * Handles modal inspection, slide arrow keyboard navigation, and theme toggling.
 */

let targetsData = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Theme Toggle Initialization
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('pdh-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('pdh-theme', newTheme);
      updateThemeButton(newTheme);
    });
  }

  function updateThemeButton(theme) {
    if (!themeToggle) return;
    themeToggle.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
  }

  // 2. Fetch Targets Data
  try {
    const response = await fetch('targets_matrix_data.json');
    targetsData = await response.json();
  } catch (err) {
    console.error('Failed to load targets data:', err);
  }

  // 3. Modal Elements & Close Handler
  const modal = document.getElementById('targetDetailModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // 4. Keyboard Arrow Navigation (PPTX Style)
  const pathname = window.location.pathname;
  const isPage1 = pathname.endsWith('presentation.html') || pathname.endsWith('index.html') || pathname.endsWith('/');
  const isPage2 = pathname.endsWith('categories.html') || pathname.endsWith('matrix.html');
  const isPage3 = pathname.endsWith('vectors.html') || pathname.endsWith('defense.html');

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }

    // Only navigate if modal is not open
    if (modal && modal.classList.contains('active')) return;

    if (e.key === 'ArrowRight') {
      if (isPage1) window.location.href = 'categories.html';
      else if (isPage2) window.location.href = 'vectors.html';
    } else if (e.key === 'ArrowLeft') {
      if (isPage3) window.location.href = 'categories.html';
      else if (isPage2) window.location.href = 'presentation.html';
    }
  });
});

// Global Function to Open Target Modal
function openTargetModal(id) {
  const modal = document.getElementById('targetDetailModal');
  const modalContent = document.getElementById('modalContent');
  if (!modal || !modalContent) return;

  const t = targetsData.find(item => item.id === id);
  if (!t) return;

  const threatClass = t.threat.toLowerCase() === 'critical' ? 'badge-critical' : (t.threat.toLowerCase() === 'high' ? 'badge-high' : 'badge-low');
  const logoSrc = t.logo.startsWith('assets/') ? t.logo : `assets/logos/${t.logo}`;
  
  modalContent.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
      <div style="background: #fff; padding: 4px; border-radius: 8px; border: 1px solid var(--border-color); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        <img src="${logoSrc}" alt="${t.name}" style="max-height: 40px; max-width: 40px; object-fit: contain;">
      </div>
      <div>
        <span class="badge ${threatClass}">${t.threat} TIER</span>
        <h2 style="font-size: 1.15rem; font-weight: 800; margin-top: 3px;">${t.name}</h2>
        <p style="font-size: 0.75rem; color: var(--text-muted);">${t.sector} // ${t.kpi}</p>
      </div>
    </div>

    <div style="margin-bottom: 1rem;">
      <strong style="font-size: 0.78rem; color: var(--text-dim); text-transform: uppercase;">Exfiltrated Data Profile:</strong>
      <ul style="list-style: square; padding-left: 1.25rem; font-size: 0.82rem; color: var(--text-main); margin-top: 0.35rem; line-height: 1.4;">
        ${t.leaked_data.map(d => `<li>${d}</li>`).join('')}
      </ul>
    </div>

    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
      <div style="font-size: 0.75rem; margin-bottom: 0.4rem;">
        <strong style="color: var(--threat-crit-text);">Citizen Impact:</strong>
        <span style="color: var(--text-muted);">${t.impact_citizen}</span>
      </div>
      <div style="font-size: 0.75rem;">
        <strong style="color: var(--accent-amber);">Institutional Risk:</strong>
        <span style="color: var(--text-muted);">${t.impact_institutional}</span>
      </div>
    </div>

    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
      <div>
        <strong style="color: var(--text-dim);">Evidence:</strong>
        ${t.evidence.map(e => `<span class="evd-chip">${e}</span>`).join(' ')}
      </div>
      <div style="font-family: var(--font-mono); color: var(--accent-cyan);">
        ${t.onion.length > 35 ? t.onion.substring(0, 32) + '...' : t.onion}
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('targetDetailModal');
  if (modal) modal.classList.remove('active');
}
