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

  async function loadReviews(productUid, container) {
    const data = await api(`/reviews?product_uid=eq.${productUid}&approved=eq.true&order=created_at.desc`);
    const avg = data.length ? (data.reduce((s, r) => s + r.rating, 0) / data.length).toFixed(1) : null;

    container.querySelector('.cc-summary').innerHTML = data.length
      ? `<span class="cc-avg">${avg} ★</span> <span class="cc-count">${data.length} отзыв${plural(data.length)}</span>`
      : '<span class="cc-count">Пока нет отзывов</span>';

    container.querySelector('.cc-list').innerHTML = data.map(r => `
      <div class="cc-review">
        <div class="cc-review-header">
          <strong>${esc(r.name)}</strong>
          <span class="cc-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
          <span class="cc-date">${new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
        </div>
        <p>${esc(r.text)}</p>
      </div>
    `).join('');
  }

  function plural(n) {
    if (n % 10 === 1 && n % 100 !== 11) return '';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'а';
    return 'ов';
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function handleSubmit(e, productUid, container) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Отправляем...';

    await api('/reviews', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify({
        product_uid: productUid,
        name: form.name.value.trim(),
        rating: parseInt(form.rating.value),
        text: form.text.value.trim(),
      }),
    });

    form.reset();
    container.querySelector('.cc-thanks').style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Отправить';
  }

  function injectStyles() {
    if (document.getElementById('cc-styles')) return;
    const s = document.createElement('style');
    s.id = 'cc-styles';
    s.textContent = `
      .cc-widget { font-family: inherit; max-width: 100%; margin: 24px 0; }
      .cc-summary { margin-bottom: 16px; font-size: 16px; }
      .cc-avg { font-weight: bold; color: #f59e0b; }
      .cc-form { background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
      .cc-form label { font-size: 13px; color: #555; }
      .cc-form input, .cc-form select, .cc-form textarea {
        width: 100%; padding: 8px; margin: 4px 0 12px; border: 1px solid #ddd;
        border-radius: 4px; font-size: 14px; box-sizing: border-box; font-family: inherit; }
      .cc-form textarea { height: 80px; resize: vertical; }
      .cc-form button { background: #1a1a1a; color: #fff; border: none;
        padding: 10px 24px; border-radius: 4px; cursor: pointer; font-size: 14px; }
      .cc-form button:disabled { opacity: 0.5; }
      .cc-thanks { display: none; color: green; margin-top: 8px; font-size: 14px; }
      .cc-review { border-bottom: 1px solid #eee; padding: 12px 0; }
      .cc-review:last-child { border-bottom: none; }
      .cc-review-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; flex-wrap: wrap; }
      .cc-stars { color: #f59e0b; letter-spacing: 2px; }
      .cc-date { color: #999; font-size: 12px; margin-left: auto; }
      .cc-review p { margin: 0; font-size: 14px; color: #333; line-height: 1.5; }
      .cc-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; }
    `;
    document.head.appendChild(s);
  }

  function createWidget(productUid) {
    const el = document.createElement('div');
    el.className = 'cc-widget';
    el.innerHTML = `
      <div class="cc-title">Отзывы покупателей</div>
      <div class="cc-summary">Загружаем отзывы...</div>
      <form class="cc-form">
        <label>Ваше имя</label>
        <input name="name" required placeholder="Имя" />
        <label>Оценка</label>
        <select name="rating" required>
          <option value="">— выберите —</option>
          <option value="5">★★★★★ Отлично</option>
          <option value="4">★★★★☆ Хорошо</option>
          <option value="3">★★★☆☆ Нормально</option>
          <option value="2">★★☆☆☆ Плохо</option>
          <option value="1">★☆☆☆☆ Ужасно</option>
        </select>
        <label>Отзыв</label>
        <textarea name="text" required placeholder="Напишите ваш отзыв..."></textarea>
        <button type="submit">Отправить отзыв</button>
        <div class="cc-thanks">✓ Спасибо! Отзыв появится после проверки.</div>
      </form>
      <div class="cc-list"></div>
    `;
    el.querySelector('form').addEventListener('submit', e => handleSubmit(e, productUid, el));
    loadReviews(productUid, el);
    return el;
  }

  // Автоопределение страницы товара Tilda
  function autoInject() {
    // Берём product_uid из URL: /tproduct/333130885012-...
    const match = window.location.pathname.match(/tproduct\/(\d+)/);
    if (!match) return false;

    const productUid = match[1];

    // Ждём появления попапа товара (он загружается динамически)
    const tryInject = () => {
      const descr = document.querySelector('.js-store-prod-text');
      if (descr && !document.querySelector('.cc-widget')) {
        injectStyles();
        const widget = createWidget(productUid);
        descr.parentNode.insertBefore(widget, descr.nextSibling);
        return true;
      }
      return false;
    };

    if (!tryInject()) {
      // Если попап ещё не появился — ждём
      const observer = new MutationObserver(() => {
        if (tryInject()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
    return true;
  }

  function init() {
    injectStyles();

    // Ручные блоки: <div data-cc-product="..."></div>
    document.querySelectorAll('[data-cc-product]').forEach(el => {
      const productUid = el.dataset.ccProduct;
      el.classList.add('cc-widget');
      el.innerHTML = createWidget(productUid).innerHTML;
      el.querySelector('form').addEventListener('submit', e => handleSubmit(e, productUid, el));
      loadReviews(productUid, el);
    });

    // Автовстройка в страницы товаров Tilda
    autoInject();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
