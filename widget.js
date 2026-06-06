(function () {
  const SUPABASE_URL = 'https://orzwsloqlkndvwgjavlq.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_WWuhW2rX_neFnnmpERESpg_wfL4FuiF';

  const api = (path, options = {}) =>
    fetch(`${SUPABASE_URL}/rest/v1${path}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: options.prefer || '',
      },
      ...options,
    }).then(r => r.json());

  function plural(n) {
    if (n % 10 === 1 && n % 100 !== 11) return '';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'а';
    return 'ов';
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderStars(rating, filled) {
    return [1,2,3,4,5].map(i =>
      `<span class="cc-star ${i <= filled ? 'cc-star_on' : ''}" data-val="${i}">★</span>`
    ).join('');
  }

  async function loadReviews(productUid, container, tabBtn) {
    const data = await api(`/reviews?product_uid=eq.${productUid}&approved=eq.true&order=created_at.desc`);
    const count = data.length;
    const avg = count ? (data.reduce((s, r) => s + r.rating, 0) / count).toFixed(1) : null;

    // Обновляем кнопку таба
    if (tabBtn) {
      const titleEl = tabBtn.querySelector('.t-store__tabs__button-title');
      if (titleEl) {
        titleEl.innerHTML = count
          ? `Отзывы <span class="cc-tab-meta">${avg} ★&nbsp;&nbsp;${count}</span>`
          : 'Отзывы';
      }
    }

    // Шапка с рейтингом
    const summary = container.querySelector('.cc-summary');
    if (count) {
      const bars = [5,4,3,2,1].map(star => {
        const cnt = data.filter(r => r.rating === star).length;
        const pct = Math.round(cnt / count * 100);
        return `<div class="cc-bar-row">
          <span class="cc-bar-label">${star} ★</span>
          <div class="cc-bar-track"><div class="cc-bar-fill" style="width:${pct}%"></div></div>
          <span class="cc-bar-num">${cnt}</span>
        </div>`;
      }).join('');
      summary.innerHTML = `
        <div class="cc-rating-wrap">
          <div class="cc-rating-left">
            <div class="cc-rating-num">${avg}</div>
            <div class="cc-rating-stars">${renderStars(0, Math.round(parseFloat(avg)))}</div>
            <div class="cc-rating-count">${count} отзыв${plural(count)}</div>
          </div>
          <div class="cc-rating-bars">${bars}</div>
        </div>`;
    } else {
      summary.innerHTML = '<p class="cc-empty">Отзывов пока нет — оставьте первый!</p>';
    }

    // Список отзывов
    container.querySelector('.cc-list').innerHTML = data.map(r => `
      <div class="cc-review">
        <div class="cc-review-top">
          <div class="cc-review-stars-static">${renderStars(0, r.rating)}</div>
          <span class="cc-review-author">${esc(r.name)}</span>
          <span class="cc-review-date">${new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
        </div>
        <div class="cc-review-text">${esc(r.text)}</div>
      </div>
    `).join('');
  }

  async function handleSubmit(e, productUid, container, tabBtn) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.cc-btn');
    const ratingVal = parseInt(form.dataset.rating || '0');
    if (!ratingVal) {
      form.querySelector('.cc-stars-hint').style.display = 'block';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Отправляем...';
    await api('/reviews', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify({
        product_uid: productUid,
        name: form.ccname.value.trim(),
        rating: ratingVal,
        text: form.text.value.trim(),
      }),
    });
    form.style.display = 'none';
    container.querySelector('.cc-thanks').style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Отправить отзыв';
  }

  function injectStyles() {
    if (document.getElementById('cc-styles')) return;
    const s = document.createElement('style');
    s.id = 'cc-styles';
    s.textContent = `
      .cc-tab-meta { font-size: 11px; color: #999; margin-left: 6px; font-weight: 400; }

      .cc-widget { font-family: inherit; padding: 4px 0 32px; }

      /* Рейтинг */
      .cc-rating-wrap { display: flex; gap: 32px; align-items: center; margin-bottom: 28px; padding: 20px 0 24px; border-bottom: 1px solid #ebebeb; flex-wrap: wrap; }
      .cc-rating-left { display: flex; flex-direction: column; align-items: center; min-width: 72px; }
      .cc-rating-num { font-size: 44px; font-weight: 300; line-height: 1; color: #111; }
      .cc-rating-stars { display: flex; gap: 2px; margin: 6px 0 4px; }
      .cc-rating-stars .cc-star, .cc-review-stars-static .cc-star { font-size: 16px; color: #ddd; pointer-events: none; }
      .cc-rating-stars .cc-star_on, .cc-review-stars-static .cc-star_on { color: #111; }
      .cc-rating-count { font-size: 12px; color: #999; white-space: nowrap; }

      .cc-rating-bars { flex: 1; min-width: 140px; }
      .cc-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; font-size: 12px; color: #999; }
      .cc-bar-label { min-width: 26px; }
      .cc-bar-track { flex: 1; height: 3px; background: #eee; border-radius: 2px; overflow: hidden; }
      .cc-bar-fill { height: 100%; background: #111; border-radius: 2px; }
      .cc-bar-num { min-width: 14px; text-align: right; }

      .cc-empty { font-size: 14px; color: #999; margin: 0 0 24px; }

      /* Форма */
      .cc-form-wrap { background: #f7f7f7; border-radius: 4px; padding: 20px 20px 16px; margin-bottom: 28px; }
      .cc-form-title { font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 16px; color: #111; }
      .cc-field { margin-bottom: 12px; }
      .cc-field label { display: block; font-size: 11px; letter-spacing: 0.07em; text-transform: uppercase; color: #888; margin-bottom: 6px; }
      .cc-field input, .cc-field textarea {
        width: 100%; padding: 9px 12px; border: 1px solid #ddd; border-radius: 3px;
        font-size: 14px; font-family: inherit; color: #111; background: #fff;
        box-sizing: border-box; outline: none; transition: border-color 0.15s;
      }
      .cc-field input:focus, .cc-field textarea:focus { border-color: #111; }
      .cc-field textarea { height: 80px; resize: vertical; }

      /* Кликабельные звёздочки */
      .cc-stars-pick { display: flex; gap: 4px; margin-bottom: 4px; cursor: pointer; }
      .cc-stars-pick .cc-star { font-size: 24px; color: #ddd; transition: color 0.1s; line-height: 1; }
      .cc-stars-pick .cc-star_on { color: #111; }
      .cc-stars-hint { display: none; font-size: 12px; color: #e55; margin-bottom: 8px; }

      .cc-btn {
        background: #111; color: #fff; border: none; padding: 11px 28px;
        font-size: 13px; letter-spacing: 0.07em; text-transform: uppercase;
        cursor: pointer; font-family: inherit; margin-top: 4px; border-radius: 3px;
        transition: background 0.15s;
      }
      .cc-btn:hover { background: #333; }
      .cc-btn:disabled { opacity: 0.5; cursor: default; }
      .cc-thanks { display: none; font-size: 14px; color: #555; padding: 16px 0; }

      /* Отзывы */
      .cc-review { padding: 18px 0; border-bottom: 1px solid #ebebeb; }
      .cc-review:last-child { border-bottom: none; }
      .cc-review-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
      .cc-review-stars-static { display: flex; gap: 2px; }
      .cc-review-author { font-size: 13px; font-weight: 600; color: #111; }
      .cc-review-date { font-size: 12px; color: #bbb; margin-left: auto; }
      .cc-review-text { font-size: 14px; color: #444; line-height: 1.6; margin: 0; }
    `;
    document.head.appendChild(s);
  }

  function createWidget(productUid) {
    const el = document.createElement('div');
    el.className = 'cc-widget';
    el.innerHTML = `
      <div class="cc-summary"></div>
      <div class="cc-form-wrap">
        <div class="cc-form-title">Оставить отзыв</div>
        <form autocomplete="off">
          <div class="cc-field">
            <label>Оценка</label>
            <div class="cc-stars-pick">${[1,2,3,4,5].map(i => `<span class="cc-star" data-val="${i}">★</span>`).join('')}</div>
            <div class="cc-stars-hint">Пожалуйста, выберите оценку</div>
          </div>
          <div class="cc-field">
            <label>Ваше имя</label>
            <input name="ccname" required placeholder="Введите имя" />
          </div>
          <div class="cc-field">
            <label>Отзыв</label>
            <textarea name="text" required placeholder="Поделитесь впечатлением о товаре..."></textarea>
          </div>
          <button type="submit" class="cc-btn">Отправить отзыв</button>
        </form>
      </div>
      <div class="cc-thanks">✓ Спасибо за отзыв! Он появится после проверки.</div>
      <div class="cc-list"></div>
    `;

    // Кликабельные звёздочки
    const form = el.querySelector('form');
    const stars = el.querySelectorAll('.cc-stars-pick .cc-star');
    stars.forEach(star => {
      star.addEventListener('mouseover', () => {
        const val = parseInt(star.dataset.val);
        stars.forEach(s => s.classList.toggle('cc-star_on', parseInt(s.dataset.val) <= val));
      });
      star.addEventListener('mouseout', () => {
        const cur = parseInt(form.dataset.rating || '0');
        stars.forEach(s => s.classList.toggle('cc-star_on', parseInt(s.dataset.val) <= cur));
      });
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val);
        form.dataset.rating = val;
        el.querySelector('.cc-stars-hint').style.display = 'none';
        stars.forEach(s => s.classList.toggle('cc-star_on', parseInt(s.dataset.val) <= val));
      });
    });

    form.addEventListener('submit', e => handleSubmit(e, productUid, el, null));
    loadReviews(productUid, el, null);
    return el;
  }

  // Встройка в табы Tilda
  function injectIntoTabs(productUid) {
    const tabsContainer = document.querySelector('.js-store-tabs');
    if (!tabsContainer) return false;
    if (tabsContainer.querySelector('.cc-tab-btn')) return true; // уже есть

    const controls = tabsContainer.querySelector('.t-store__tabs__controls');
    const list = tabsContainer.querySelector('.t-store__tabs__list');
    if (!controls || !list) return false;

    injectStyles();

    // Кнопка таба
    const btn = document.createElement('div');
    btn.className = 't-store__tabs__button js-store-tab-button cc-tab-btn';
    btn.innerHTML = '<div class="t-store__tabs__button-title t-name t-name_xs">Отзывы</div>';
    controls.appendChild(btn);

    // Панель таба
    const panel = document.createElement('div');
    panel.className = 't-store__tabs__item cc-tab-panel';
    const widget = createWidget(productUid);

    // Обновляем tabBtn ссылку для рейтинга в заголовке
    loadReviews(productUid, widget, btn);

    panel.appendChild(widget);
    list.appendChild(panel);

    // Клик на наш таб
    btn.addEventListener('click', () => {
      tabsContainer.querySelectorAll('.t-store__tabs__button').forEach(b => b.classList.remove('t-store__tabs__button_active'));
      tabsContainer.querySelectorAll('.t-store__tabs__item').forEach(p => p.classList.remove('t-store__tabs__item_active'));
      btn.classList.add('t-store__tabs__button_active');
      panel.classList.add('t-store__tabs__item_active');
    });

    // Клик на другие табы — скрываем нашу панель
    tabsContainer.querySelectorAll('.js-store-tab-button:not(.cc-tab-btn)').forEach(b => {
      b.addEventListener('click', () => {
        btn.classList.remove('t-store__tabs__button_active');
        panel.classList.remove('t-store__tabs__item_active');
      });
    });

    return true;
  }

  function tryAutoInject(productUid) {
    return injectIntoTabs(productUid);
  }

  function startInjecting(productUid) {
    // Пробуем сразу
    if (tryAutoInject(productUid)) return;

    // Retry каждые 300мс до 10 секунд — ловим момент когда Tilda рендерит попап
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (tryAutoInject(productUid) || attempts > 33) clearInterval(interval);
    }, 300);
  }

  function init() {
    // Ручные блоки
    document.querySelectorAll('[data-cc-product]').forEach(el => {
      const productUid = el.dataset.ccProduct;
      injectStyles();
      el.appendChild(createWidget(productUid));
    });

    // Автовстройка в страницы товаров Tilda
    const match = window.location.pathname.match(/tproduct\/(\d+)/);
    if (match) startInjecting(match[1]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
