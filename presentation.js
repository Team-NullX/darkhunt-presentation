/**
 * Project Dark Hunt — Presentation Website Interactive Engine
 * Handles dynamic rendering of targets, logos, modal inspection, table matrix, and theme toggling.
 */

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
  let targets = [];
  try {
    const response = await fetch('targets_matrix_data.json');
    targets = await response.json();
  } catch (err) {
    console.error('Failed to load targets data:', err);
    return;
  }

  // 3. Page 1: Render Targets Grid (if on presentation.html)
  const targetsGrid = document.getElementById('targetsGrid');
  const searchInput = document.getElementById('targetSearchInput');
  const sectorFilterGroup = document.getElementById('sectorFilterGroup');

  if (targetsGrid) {
    renderTargets(targets);

    // Search filter
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const activeBtn = sectorFilterGroup ? sectorFilterGroup.querySelector('.filter-btn.active') : null;
        const activeSector = activeBtn ? activeBtn.getAttribute('data-sector') : 'ALL';
        filterAndRender(query, activeSector);
      });
    }

    // Sector Filter Buttons
    if (sectorFilterGroup) {
      sectorFilterGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        sectorFilterGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sector = btn.getAttribute('data-sector');
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        filterAndRender(query, sector);
      });
    }
  }

  function filterAndRender(query, sector) {
    const filtered = targets.filter(t => {
      const matchQuery = !query || 
        t.name.toLowerCase().includes(query) ||
        t.sector.toLowerCase().includes(query) ||
        t.kpi.toLowerCase().includes(query) ||
        t.threat.toLowerCase().includes(query) ||
        t.evidence.some(e => e.toLowerCase().includes(query));

      const matchSector = sector === 'ALL' || matchesSectorCategory(t.sector, sector);
      return matchQuery && matchSector;
    });

    renderTargets(filtered);
  }

  function matchesSectorCategory(targetSector, category) {
    const s = targetSector.toLowerCase();
    const c = category.toLowerCase();
    if (c.includes('defense') && (s.includes('defense') || s.includes('law') || s.includes('tri-services'))) return true;
    if (c.includes('banking') && (s.includes('bank') || s.includes('insurance') || s.includes('fintech'))) return true;
    if (c.includes('aviation') && (s.includes('aviation') || s.includes('transport'))) return true;
    if (c.includes('identity') && s.includes('identity')) return true;
    if (c.includes('retail') && (s.includes('retail') || s.includes('commerce') || s.includes('industrial'))) return true;
    if (c.includes('telecom') && (s.includes('telecom') || s.includes('power') || s.includes('utilities') || s.includes('isp'))) return true;
    if (c.includes('health') && (s.includes('health') || s.includes('education') || s.includes('academia'))) return true;
    if (c.includes('vendor') && (s.includes('vendor') || s.includes('contractor') || s.includes('broker'))) return true;
    return false;
  }

  function renderTargets(items) {
    if (!targetsGrid) return;
    if (items.length === 0) {
      targetsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-dim); background-color: var(--bg-card); border-radius: 8px; border: 1px dashed var(--border-color);">
          <h3>No matching target organizations found.</h3>
          <p style="margin-top: 0.5rem; font-size: 0.85rem;">Try adjusting your search criteria or resetting sector filters.</p>
        </div>
      `;
      return;
    }

    targetsGrid.innerHTML = items.map(t => {
      const threatClass = t.threat.toLowerCase() === 'critical' ? 'badge-critical' : (t.threat.toLowerCase() === 'high' ? 'badge-high' : 'badge-low');
      
      const logoHtml = t.logo 
        ? `<img src="assets/logos/${t.logo}" alt="${t.name} Logo" class="target-logo-img" loading="lazy">`
        : `<div class="target-logo-fallback" style="background: linear-gradient(135deg, ${t.color}, #090d16);">${t.abbr}</div>`;

      const evdChips = t.evidence.map(e => `<span class="evd-chip">${e}</span>`).join('');

      return `
        <article class="target-card" data-id="${t.id}">
          <div class="target-card-header">
            <div class="target-logo-frame">
              ${logoHtml}
            </div>
            <div class="target-title-block">
              <div class="target-num-kpi">
                <span>#${t.id.toString().padStart(2, '0')}</span>
                <span>•</span>
                <span>${t.kpi}</span>
              </div>
              <h3 class="target-name" title="${t.name}">${t.name}</h3>
              <div class="target-sector-tag">${t.sector}</div>
            </div>
          </div>

          <div class="target-threat-row">
            <span class="badge ${threatClass}">${t.threat} THREAT</span>
            <div class="evd-badges">
              ${evdChips}
            </div>
          </div>

          <p class="target-summary">${t.summary || t.leaked_data[0]}</p>

          <div class="onion-box">
            <span class="onion-label">Darknet Origin Proof:</span>
            <span class="onion-value">${t.onion}</span>
          </div>

          <div class="target-card-footer">
            <button class="btn-card view-detail-btn" data-id="${t.id}">View Attack Vectors & Impact ➔</button>
            <a href="matrix.html#target-${t.id}" class="btn-card" style="color: var(--text-dim);">Matrix Row ↗</a>
          </div>
        </article>
      `;
    }).join('');

    // Attach Click Events for Detail Modal
    targetsGrid.querySelectorAll('.view-detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const item = targets.find(x => x.id === id);
        if (item) openModal(item);
      });
    });
  }

  // 4. Modal Deep Dive
  const modal = document.getElementById('targetDetailModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalContent = document.getElementById('modalContent');

  if (modalCloseBtn && modal) {
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  function openModal(t) {
    if (!modal || !modalContent) return;
    const threatClass = t.threat.toLowerCase() === 'critical' ? 'badge-critical' : (t.threat.toLowerCase() === 'high' ? 'badge-high' : 'badge-low');

    const logoHtml = t.logo 
      ? `<img src="assets/logos/${t.logo}" alt="${t.name}" style="max-height: 48px; max-width: 48px; object-fit: contain;">`
      : `<div style="width: 48px; height: 48px; border-radius: 8px; background: ${t.color}; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff;">${t.abbr}</div>`;

    modalContent.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
        <div style="background: #fff; padding: 4px; border-radius: 8px; border: 1px solid var(--border-color);">${logoHtml}</div>
        <div>
          <span class="badge ${threatClass}">${t.threat} TIER</span>
          <h2 style="font-size: 1.25rem; font-weight: 800; margin-top: 4px;">${t.name}</h2>
          <p style="font-size: 0.8rem; color: var(--text-muted);">${t.sector} // ${t.kpi}</p>
        </div>
      </div>

      <div style="background-color: var(--bg-surface); padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
        <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">Verified Tor Onion Origin:</span>
        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-cyan); word-break: break-all; margin-top: 2px;">${t.onion}</div>
        <div style="margin-top: 0.5rem; display: flex; gap: 0.4rem; align-items: center;">
          <span style="font-size: 0.75rem; color: var(--text-muted);">Visual Proof Artifacts:</span>
          ${t.evidence.map(e => `<span class="evd-chip" style="background-color: var(--bg-card);">${e}</span>`).join('')}
        </div>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--accent-blue); margin-bottom: 0.5rem;">Compromised Data Fields:</h4>
        <ul style="padding-left: 1.2rem; font-size: 0.82rem; color: var(--text-muted); line-height: 1.5;">
          ${t.leaked_data.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--accent-rose); margin-bottom: 0.5rem;">Real-World Consequences:</h4>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;"><strong>Citizen Impact:</strong> ${t.impact_citizen}</p>
        <p style="font-size: 0.82rem; color: var(--text-muted);"><strong>Institutional Impact:</strong> ${t.impact_institutional}</p>
      </div>

      <div>
        <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--accent-amber); margin-bottom: 0.5rem;">Threatened Cyber Attack Vectors:</h4>
        <ul style="padding-left: 1.2rem; font-size: 0.82rem; color: var(--text-muted); line-height: 1.5;">
          ${t.attack_vectors.map(item => `<li><strong>${item.split(' ')[0]} ${item.split(' ')[1] || ''}:</strong> ${item}</li>`).join('')}
        </ul>
      </div>
    `;

    modal.classList.add('active');
  }

  function closeModal() {
    if (modal) modal.classList.remove('active');
  }

  // 5. Page 2: Render Matrix Table (if on matrix.html)
  const matrixTableBody = document.getElementById('matrixTableBody');
  if (matrixTableBody) {
    matrixTableBody.innerHTML = targets.map(t => {
      const threatClass = t.threat.toLowerCase() === 'critical' ? 'badge-critical' : (t.threat.toLowerCase() === 'high' ? 'badge-high' : 'badge-low');
      
      const logoThumb = t.logo 
        ? `<div class="table-logo-thumb"><img src="assets/logos/${t.logo}" alt="${t.name}"></div>`
        : `<div class="table-logo-thumb" style="background: ${t.color}; color: #fff; font-weight: 800; font-size: 0.75rem;">${t.abbr}</div>`;

      return `
        <tr id="target-${t.id}">
          <td style="font-weight: 700; font-family: var(--font-mono); color: var(--text-dim);">${t.id}</td>
          <td>
            <div class="table-target-col">
              ${logoThumb}
              <div>
                <strong style="color: var(--text-main); font-size: 0.88rem; display: block;">${t.name}</strong>
                <span style="font-size: 0.72rem; color: var(--text-dim);">${t.sector} // ${t.kpi}</span>
                <div style="margin-top: 4px;"><span class="badge ${threatClass}">${t.threat}</span></div>
              </div>
            </div>
          </td>
          <td>
            <div style="margin-bottom: 4px;">
              <strong style="font-size: 0.72rem; color: var(--text-dim);">EVIDENCE:</strong>
              ${t.evidence.map(e => `<span class="evd-chip">${e}</span>`).join(' ')}
            </div>
            <div>
              <strong style="font-size: 0.72rem; color: var(--text-dim);">ONION / FORUM:</strong>
              <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-cyan); word-break: break-all;">${t.onion}</div>
            </div>
          </td>
          <td>
            <ul class="table-bullet-list">
              ${t.leaked_data.map(d => `<li>${d}</li>`).join('')}
            </ul>
          </td>
          <td>
            <p style="margin-bottom: 0.4rem;"><strong>Citizen:</strong> ${t.impact_citizen}</p>
            <p><strong>Institutional:</strong> ${t.impact_institutional}</p>
          </td>
          <td>
            <ul class="table-bullet-list">
              ${t.attack_vectors.map(v => `<li>${v}</li>`).join('')}
            </ul>
          </td>
        </tr>
      `;
    }).join('');
  }
});
