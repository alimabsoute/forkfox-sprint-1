/* ===== ForkFox Social Dashboard ===== */
/* Static, GitHub Pages compatible. Reads content/day-XX.json
   and renders post slots with copy-to-clipboard + Ayrshare deep link. */

(function () {
  'use strict';

  /* ---------- Clipboard ---------- */
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for older browsers / file://
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  /* ---------- Toast ---------- */
  var toastEl = null;
  var toastTimer = null;
  function ensureToast() {
    if (toastEl) return toastEl;
    toastEl = document.createElement('div');
    toastEl.className = 'sd-toast';
    document.body.appendChild(toastEl);
    return toastEl;
  }
  function showToast(msg, opts) {
    opts = opts || {};
    var el = ensureToast();
    el.textContent = msg;
    el.classList.toggle('success', !!opts.success);
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, opts.duration || 2000);
  }

  /* ---------- Button helpers ---------- */
  function flashCopied(btn, label) {
    var original = btn.dataset.originalLabel || btn.textContent;
    btn.dataset.originalLabel = original;
    btn.classList.add('copied');
    btn.textContent = label || 'Copied';
    setTimeout(function () {
      btn.classList.remove('copied');
      btn.textContent = btn.dataset.originalLabel;
    }, 1800);
  }

  function bindCopyButton(btn, getText, toastMsg) {
    btn.addEventListener('click', function () {
      var text = typeof getText === 'function' ? getText() : getText;
      copyToClipboard(text).then(function () {
        flashCopied(btn);
        showToast(toastMsg || 'Copied!', { success: true });
      }).catch(function () {
        showToast('Copy failed — select and copy manually.');
      });
    });
  }

  /* ---------- Ayrshare deep link ---------- */
  function copyAndOpenAyrshare(payload) {
    var json = JSON.stringify(payload, null, 2);
    copyToClipboard(json).then(function () {
      showToast('Payload copied — paste into Ayrshare.', { success: true, duration: 2800 });
      window.open('https://app.ayrshare.com/post', '_blank', 'noopener');
    }).catch(function () {
      showToast('Copy failed — opening Ayrshare anyway.');
      window.open('https://app.ayrshare.com/post', '_blank', 'noopener');
    });
  }

  /* ---------- DOM helpers ---------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  /* ---------- Render a single post slot ---------- */
  function renderSlot(slot, idx) {
    var card = el('div', { class: 'sd-slot' });

    // Head: badge + time
    var head = el('div', { class: 'sd-slot-head' });
    var typeClass = (slot.type || '').toLowerCase().indexOf('feature') >= 0 ? 'feature'
                  : (slot.type || '').toLowerCase().indexOf('reshare') >= 0 ? 'reshare'
                  : (slot.type || '').toLowerCase().indexOf('novel') >= 0 ? 'novel'
                  : '';
    head.appendChild(el('span', { class: 'sd-slot-badge ' + typeClass, text: slot.type || 'Post ' + (idx + 1) }));
    if (slot.suggested_time || slot.scheduled_time) {
      head.appendChild(el('span', { class: 'sd-slot-time', text: slot.suggested_time || slot.scheduled_time }));
    }
    if (slot.title) {
      head.appendChild(el('div', {
        class: 'sd-slot-title',
        text: slot.title,
        style: 'font-size:14px;font-weight:600;color:#1A1A2E;margin-left:auto;'
      }));
    }
    card.appendChild(head);

    // Image
    if (slot.image_url || slot.image) {
      var src = slot.image_url || slot.image;
      var imgWrap = el('div', { class: 'sd-slot-image-wrap' });
      var img = el('img', { class: 'sd-slot-image', src: src, alt: slot.title || 'Post image' });
      img.addEventListener('click', function () { window.open(src, '_blank', 'noopener'); });
      img.addEventListener('error', function () { imgWrap.style.display = 'none'; });
      imgWrap.appendChild(img);
      card.appendChild(imgWrap);

      // Image URL copy
      card.appendChild(buildField('Image URL', src, 'mono', 'Copy image URL', 'Image URL copied'));
    }

    // IG caption
    if (slot.ig_caption || slot.caption_ig || slot.caption) {
      var ig = slot.ig_caption || slot.caption_ig || slot.caption;
      card.appendChild(buildField('Instagram caption', ig, 'ig', 'Copy IG caption', 'IG caption copied'));
    }

    // FB caption
    if (slot.fb_caption || slot.caption_fb) {
      var fb = slot.fb_caption || slot.caption_fb;
      card.appendChild(buildField('Facebook caption', fb, 'fb', 'Copy FB caption', 'FB caption copied'));
    }

    // Hashtags
    if (slot.hashtags) {
      var tagsStr = Array.isArray(slot.hashtags) ? slot.hashtags.join(' ') : String(slot.hashtags);
      card.appendChild(buildField('Hashtags', tagsStr, 'tags', 'Copy all tags', 'Hashtags copied'));
    }

    // Image prompt
    if (slot.image_prompt) {
      card.appendChild(buildField('Image-gen prompt', slot.image_prompt, 'image-prompt', 'Copy prompt', 'Image prompt copied'));
    }

    // Video prompt
    if (slot.video_prompt) {
      card.appendChild(buildField('Video-gen prompt', slot.video_prompt, 'video-prompt', 'Copy prompt', 'Video prompt copied'));
    }

    // Ayrshare CTA
    var ayrRow = el('div', { class: 'sd-ayrshare-row' });
    var ayrBtn = el('button', { class: 'sd-ayrshare-btn', type: 'button', text: 'Open Ayrshare' });
    var payload = {
      caption: slot.ig_caption || slot.caption || slot.fb_caption || '',
      image_url: slot.image_url || slot.image || '',
      scheduled_time: slot.scheduled_time || slot.suggested_time || '',
      platforms: slot.platforms || ['instagram', 'facebook']
    };
    if (slot.hashtags) {
      var tagsList = Array.isArray(slot.hashtags) ? slot.hashtags : String(slot.hashtags).split(/\s+/);
      payload.hashtags = tagsList.filter(Boolean);
    }
    ayrBtn.addEventListener('click', function () { copyAndOpenAyrshare(payload); });
    ayrRow.appendChild(ayrBtn);
    ayrRow.appendChild(el('div', {
      class: 'sd-ayrshare-help',
      text: 'Copies a JSON payload to your clipboard, opens Ayrshare. Paste, review, schedule.'
    }));
    card.appendChild(ayrRow);

    return card;
  }

  function buildField(label, value, labelClass, btnLabel, toastMsg) {
    var wrap = el('div', { class: 'sd-field' });
    var head = el('div', { class: 'sd-field-head' });
    head.appendChild(el('div', { class: 'sd-field-label ' + (labelClass || ''), text: label }));
    var btn = el('button', { class: 'sd-copy-btn', type: 'button', text: btnLabel || 'Copy' });
    bindCopyButton(btn, value, toastMsg || 'Copied!');
    head.appendChild(btn);
    wrap.appendChild(head);
    var valueClass = 'sd-field-value';
    if (labelClass === 'image-prompt' || labelClass === 'video-prompt' || labelClass === 'mono') {
      valueClass += ' mono';
    }
    if (labelClass === 'tags') valueClass += ' tags';
    wrap.appendChild(el('div', { class: valueClass, text: value }));
    return wrap;
  }

  /* ---------- Render a whole day ---------- */
  function renderDay(jsonData, mountEl) {
    mountEl.innerHTML = '';
    if (!jsonData || !jsonData.posts || jsonData.posts.length === 0) {
      mountEl.appendChild(buildEmptyState('No posts defined yet for this day.'));
      return;
    }
    var wrap = el('div', { class: 'sd-slots' });
    jsonData.posts.forEach(function (slot, i) { wrap.appendChild(renderSlot(slot, i)); });
    mountEl.appendChild(wrap);
  }

  function buildEmptyState(reason) {
    return el('div', { class: 'sd-empty' }, [
      el('h2', { text: 'Content not yet populated' }),
      el('p', { html:
        (reason ? reason + '<br><br>' : '') +
        'Run <code>build_social_calendar.py</code> to generate this day\'s content. JSON files live in <code>social-dashboard/content/</code>.'
      })
    ]);
  }

  /* ---------- Day loader ---------- */
  function loadDay(dayNum, mountEl) {
    var padded = String(dayNum).padStart(2, '0');
    var url = 'content/day-' + padded + '.json';
    fetch(url, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        renderDay(data, mountEl);
        // Update subtitle if JSON declares one
        if (data.subtitle) {
          var sub = document.querySelector('[data-sd-subtitle]');
          if (sub) sub.textContent = data.subtitle;
        }
      })
      .catch(function (err) {
        mountEl.innerHTML = '';
        mountEl.appendChild(buildEmptyState(
          'Could not load <code>' + url + '</code> (' + (err.message || 'error') + ').'
        ));
      });
  }

  /* ---------- Boot ---------- */
  function init() {
    var mount = document.querySelector('[data-sd-mount]');
    if (!mount) return;
    var dayNum = parseInt(mount.getAttribute('data-sd-day'), 10);
    if (!dayNum) return;
    loadDay(dayNum, mount);
  }

  // Expose for inline / future use
  window.ForkFoxSocialDashboard = {
    copyToClipboard: copyToClipboard,
    copyAndOpenAyrshare: copyAndOpenAyrshare,
    renderDay: renderDay,
    showToast: showToast,
    loadDay: loadDay
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
