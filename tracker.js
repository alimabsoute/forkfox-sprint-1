/**
 * ForkFox Sprint Tracker — checkbox + note persistence via localStorage.
 *
 * Auto-decorates:
 *   - .task                 (each task card on day pages — checkbox + note)
 *   - .eod ul li            (end-of-day checklist items — checkbox + note inline)
 *   - .step-list li         (substep items — checkbox only, no note)
 *   - .field-card           (each field card on field-doc pages — checkbox + note)
 *
 * Storage keys:
 *   ff:check:<page-path>:<item-id>  -> "true"
 *   ff:note:<page-path>:<item-id>   -> "<text>"
 *
 * Export/import: ff.exportProgress() / ff.importProgress(json)
 */
(function() {
  // Page key: pathname minus leading repo prefix
  const PAGE_KEY = location.pathname
    .replace(/^.*?(\/day-\d+)/, '$1')
    .replace(/\/$/, '')
    .replace(/\.html$/, '') || '/';

  function k(type, id) { return 'ff:' + type + ':' + PAGE_KEY + ':' + id; }
  function getCheck(id) { return localStorage.getItem(k('check', id)) === 'true'; }
  function setCheck(id, v) {
    if (v) localStorage.setItem(k('check', id), 'true');
    else localStorage.removeItem(k('check', id));
  }
  function getNote(id) { return localStorage.getItem(k('note', id)) || ''; }
  function setNote(id, t) {
    if (t.trim()) localStorage.setItem(k('note', id), t);
    else localStorage.removeItem(k('note', id));
  }
  function getCollapse(id) { return localStorage.getItem(k('collapse', id)) === 'true'; }
  function setCollapse(id, v) {
    if (v) localStorage.setItem(k('collapse', id), 'true');
    else localStorage.removeItem(k('collapse', id));
  }

  function makeCheckbox(id, big) {
    const wrap = document.createElement('label');
    wrap.className = 'ff-check' + (big ? ' ff-check-big' : '');
    wrap.title = 'Mark complete';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = getCheck(id);
    input.addEventListener('change', () => {
      setCheck(id, input.checked);
      wrap.classList.toggle('checked', input.checked);
      const card = wrap.closest('.task, .field-card');
      if (card) card.classList.toggle('item-done', input.checked);
    });
    if (input.checked) wrap.classList.add('checked');
    wrap.appendChild(input);
    return wrap;
  }

  function makeNotePill(id) {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'ff-note-pill';
    pill.title = 'Add a note';

    function refresh() {
      const has = getNote(id).length > 0;
      pill.classList.toggle('has-note', has);
      pill.innerHTML = has
        ? '<span class="ff-note-icon">📝</span><span class="ff-note-count">note</span>'
        : '<span class="ff-note-icon">📝</span>';
    }
    refresh();

    pill.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openPopover(id, pill, refresh);
    });
    return pill;
  }

  let activePopover = null;

  function closePopover() {
    if (activePopover) {
      activePopover.remove();
      activePopover = null;
      document.removeEventListener('click', outsideClick, true);
      document.removeEventListener('keydown', escClose, true);
    }
  }

  function outsideClick(e) {
    if (!activePopover) return;
    if (!activePopover.contains(e.target) && !e.target.closest('.ff-note-pill')) {
      const ta = activePopover.querySelector('textarea');
      const id = activePopover.dataset.itemId;
      if (id && ta) setNote(id, ta.value);
      closePopover();
    }
  }

  function escClose(e) {
    if (e.key === 'Escape') {
      const ta = activePopover && activePopover.querySelector('textarea');
      const id = activePopover && activePopover.dataset.itemId;
      if (id && ta) setNote(id, ta.value);
      closePopover();
    }
  }

  function openPopover(id, anchor, refreshPill) {
    closePopover();
    const pop = document.createElement('div');
    pop.className = 'ff-note-popover';
    pop.dataset.itemId = id;
    pop.innerHTML = `
      <div class="ff-note-head">
        <span class="ff-note-title">Note</span>
        <button class="ff-note-close" type="button" title="Close">×</button>
      </div>
      <textarea class="ff-note-text" placeholder="Status, blockers, what worked, follow-ups…"></textarea>
      <div class="ff-note-actions">
        <button class="ff-note-clear" type="button">Clear</button>
        <span class="ff-note-status"></span>
        <button class="ff-note-save" type="button">Save</button>
      </div>
    `;
    document.body.appendChild(pop);

    const ta = pop.querySelector('textarea');
    ta.value = getNote(id);

    const status = pop.querySelector('.ff-note-status');
    function flash(msg) {
      status.textContent = msg;
      setTimeout(() => { status.textContent = ''; }, 1400);
    }

    pop.querySelector('.ff-note-save').addEventListener('click', () => {
      setNote(id, ta.value);
      flash('Saved ✓');
      refreshPill();
    });
    pop.querySelector('.ff-note-clear').addEventListener('click', () => {
      ta.value = '';
      setNote(id, '');
      flash('Cleared');
      refreshPill();
    });
    pop.querySelector('.ff-note-close').addEventListener('click', () => {
      setNote(id, ta.value);
      refreshPill();
      closePopover();
    });

    // Auto-save on blur
    ta.addEventListener('blur', () => {
      setNote(id, ta.value);
      refreshPill();
    });

    // Position near anchor
    const rect = anchor.getBoundingClientRect();
    const popW = 320;
    const popH = 240;
    let left = rect.right + 12;
    let top = rect.top + window.scrollY - 8;
    if (left + popW > window.innerWidth - 16) {
      left = rect.left - popW - 12;
    }
    if (left < 16) left = 16;
    if (top + popH > window.scrollY + window.innerHeight - 16) {
      top = window.scrollY + window.innerHeight - popH - 16;
    }
    pop.style.position = 'absolute';
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';

    setTimeout(() => ta.focus(), 60);
    activePopover = pop;
    setTimeout(() => {
      document.addEventListener('click', outsideClick, true);
      document.addEventListener('keydown', escClose, true);
    }, 10);
  }

  function decorate() {
    // Big task cards on day pages
    document.querySelectorAll('.task').forEach((card, i) => {
      const head = card.querySelector('.task-head');
      if (!head) return;
      const id = 'task-' + (i + 1);
      const wrap = document.createElement('div');
      wrap.className = 'ff-task-controls';
      wrap.appendChild(makeCheckbox(id, true));
      wrap.appendChild(makeNotePill(id));
      head.appendChild(wrap);
      if (getCheck(id)) card.classList.add('item-done');

      // Wire collapse toggle (button is already in template)
      const toggle = head.querySelector('.task-toggle');
      const icon = toggle ? toggle.querySelector('.toggle-icon') : null;
      function applyCollapseState(collapsed) {
        card.classList.toggle('collapsed', collapsed);
        if (icon) icon.textContent = collapsed ? '+' : '−';
      }
      // Restore persisted state
      applyCollapseState(getCollapse(id));

      if (toggle) {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const newCollapsed = !card.classList.contains('collapsed');
          applyCollapseState(newCollapsed);
          setCollapse(id, newCollapsed);
        });
      }
      // Click anywhere on the head (when collapsed) to expand — but skip checkbox/note/copy buttons
      head.addEventListener('click', (e) => {
        if (!card.classList.contains('collapsed')) return;
        if (e.target.closest('.ff-check, .ff-note-pill, .task-toggle, button, a, input, label')) return;
        applyCollapseState(false);
        setCollapse(id, false);
      });
    });

    // End-of-day checklist items
    document.querySelectorAll('.eod ul li').forEach((li, i) => {
      const id = 'eod-' + (i + 1);
      // Strip the existing :before pseudo-checkbox by adding a class
      li.classList.add('ff-eod-item');
      const wrap = document.createElement('span');
      wrap.className = 'ff-inline-controls';
      wrap.appendChild(makeCheckbox(id, false));
      wrap.appendChild(makeNotePill(id));
      li.insertBefore(wrap, li.firstChild);
    });

    // Step-list items (substeps inside tasks) — checkbox only, no note
    document.querySelectorAll('.step-list li').forEach((li, i) => {
      const taskCard = li.closest('.task');
      const taskIdx = taskCard ? Array.from(document.querySelectorAll('.task')).indexOf(taskCard) + 1 : 0;
      const id = 'step-' + taskIdx + '-' + (i + 1);
      li.classList.add('ff-step-item');
      const cb = makeCheckbox(id, false);
      cb.classList.add('ff-step-check');
      li.insertBefore(cb, li.firstChild);
    });

    // Field cards on field-doc pages
    document.querySelectorAll('.field-card').forEach((card, i) => {
      const head = card.querySelector('.field-card-head');
      if (!head) return;
      const id = 'field-' + (i + 1);
      const wrap = document.createElement('div');
      wrap.className = 'ff-field-controls';
      wrap.appendChild(makeCheckbox(id, false));
      wrap.appendChild(makeNotePill(id));
      head.appendChild(wrap);
      if (getCheck(id)) card.classList.add('item-done');
    });
  }

  // Toolbar at top of every page: progress summary + export/import
  function injectStatusBar() {
    const total = document.querySelectorAll('.task, .eod ul li, .field-card').length;
    if (total === 0) return;

    const bar = document.createElement('div');
    bar.className = 'ff-statusbar';
    bar.innerHTML = `
      <div class="ff-statusbar-progress">
        <span class="ff-prog-label">Progress on this page:</span>
        <span class="ff-prog-count"><span class="ff-prog-done">0</span> / <span class="ff-prog-total">0</span></span>
        <div class="ff-prog-bar"><div class="ff-prog-fill"></div></div>
      </div>
      <div class="ff-statusbar-actions">
        <button class="ff-collapse-all" type="button" title="Collapse all task cards on this page">▴ Collapse all</button>
        <button class="ff-expand-all" type="button" title="Expand all task cards">▾ Expand all</button>
        <span class="ff-statusbar-divider"></span>
        <button class="ff-export" type="button" title="Export ALL progress + notes (across all pages)">⬇ Export</button>
        <button class="ff-import" type="button" title="Import progress from JSON file">⬆ Import</button>
        <button class="ff-reset" type="button" title="Clear progress on this page only">↻ Reset page</button>
      </div>
    `;

    // Insert just under the .header
    const header = document.querySelector('.header');
    if (header && header.parentNode) {
      header.parentNode.insertBefore(bar, header.nextSibling);
    }

    function refreshProgress() {
      const items = document.querySelectorAll('.task, .ff-eod-item, .field-card');
      const total = items.length;
      let done = 0;
      items.forEach(it => {
        const cb = it.querySelector('.ff-check input');
        if (cb && cb.checked) done++;
      });
      bar.querySelector('.ff-prog-done').textContent = done;
      bar.querySelector('.ff-prog-total').textContent = total;
      const pct = total ? Math.round(100 * done / total) : 0;
      bar.querySelector('.ff-prog-fill').style.width = pct + '%';
    }

    document.addEventListener('change', (e) => {
      if (e.target.matches('.ff-check input')) refreshProgress();
    });
    refreshProgress();

    bar.querySelector('.ff-export').addEventListener('click', () => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ff:')) data[key] = localStorage.getItem(key);
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.download = `forkfox-sprint-progress-${stamp}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    bar.querySelector('.ff-import').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            let n = 0;
            Object.entries(data).forEach(([k, v]) => {
              if (k.startsWith('ff:')) { localStorage.setItem(k, v); n++; }
            });
            alert(`Imported ${n} entries. Reloading…`);
            location.reload();
          } catch (err) {
            alert('Import failed: ' + err.message);
          }
        };
        reader.readAsText(file);
      });
      input.click();
    });

    function applyAllCollapse(collapsed) {
      document.querySelectorAll('.task').forEach((card, i) => {
        const id = 'task-' + (i + 1);
        card.classList.toggle('collapsed', collapsed);
        const icon = card.querySelector('.toggle-icon');
        if (icon) icon.textContent = collapsed ? '+' : '−';
        setCollapse(id, collapsed);
      });
    }
    const collapseAllBtn = bar.querySelector('.ff-collapse-all');
    const expandAllBtn = bar.querySelector('.ff-expand-all');
    if (collapseAllBtn) collapseAllBtn.addEventListener('click', () => applyAllCollapse(true));
    if (expandAllBtn) expandAllBtn.addEventListener('click', () => applyAllCollapse(false));

    bar.querySelector('.ff-reset').addEventListener('click', () => {
      if (!confirm('Clear all progress + notes on THIS page? (Other pages unaffected.)')) return;
      const prefix = 'ff:check:' + PAGE_KEY + ':';
      const prefixN = 'ff:note:' + PAGE_KEY + ':';
      const toDelete = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(prefix) || key.startsWith(prefixN))) toDelete.push(key);
      }
      toDelete.forEach(k => localStorage.removeItem(k));
      location.reload();
    });
  }

  // Public API
  window.ff = {
    exportProgress: function() {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ff:')) data[key] = localStorage.getItem(key);
      }
      return data;
    },
    importProgress: function(data) {
      Object.entries(data).forEach(([k, v]) => {
        if (k.startsWith('ff:')) localStorage.setItem(k, v);
      });
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { decorate(); injectStatusBar(); });
  } else {
    decorate();
    injectStatusBar();
  }
})();
