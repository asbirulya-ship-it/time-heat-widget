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

  async function loadReviews(productUid, container) {
    const data = await api(`/reviews?product_uid=eq.${productUid}&approved=eq.true&order=created_at.desc`);
    const count = data.length;
    const avg = count ? (data.reduce((s, r) => s + r.rating, 0) / count).toFixed(1) : null;

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
            <div class="cc-rating-stars">${[1,2,3,4,5].map(i=>`<span class="cc-star ${i<=Math.round(parseFloat(avg))?'cc-star_on':''}">★</span>`).join('')}</div>
            <div class="cc-rating-count">${count} отзыв${plural(count)}</div>
          </div>
          <div class="cc-rating-bars">${bars}</div>
        </div>`;
    } else {
      summary.innerHTML = '<p class="cc-empty">Отзывов пока нет — оставьте первый!</p>';
    }

    container.querySelector('.cc-list').innerHTML = data.map(r => `
      <div class="cc-review">
        <div class="cc-review-top">
          <span class="cc-review-stars-static">${[1,2,3,4,5].map(i=>`<span class="cc-star ${i<=r.rating?'cc-star_on':''}">★</span>`).join('')}</span>
          <span class="cc-review-author">${esc(r.name)}</span>
          <span class="cc-review-date">${new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
        </div>
        <div class="cc-review-text">${esc(r.text)}</div>
      </div>
    `).join('');
  }

  async function handleSubmit(e, productUid, container) {
    // Останавливаем всплытие чтобы не мешать Tilda
    e.preventDefault();
    e.stopPropagation();

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
      .cc-section { font-family: inherit; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e8e8e8; }
      .cc-section-title { font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #111; margin-bottom: 20px; }

      .cc-rating-wrap { display: flex; gap: 28px; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #ebebeb; flex-wrap: wrap; }
      .cc-rating-left { display: flex; flex-direction: column; align-items: center; min-width: 68px; }
      .cc-rating-num { font-size: 42px; font-weight: 300; line-height: 1; color: #111; }
      .cc-rating-stars { display: flex; gap: 2px; margin: 6px 0 4px; }
      .cc-rating-count { font-size: 12px; color: #999; white-space: nowrap; }

      .cc-star { font-size: 15px; color: #ddd; }
      .cc-star_on { color: #111; }

      .cc-rating-bars { flex: 1; min-width: 130px; }
      .cc-bar-row { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; font-size: 12px; color: #999; }
      .cc-bar-label { min-width: 24px; }
      .cc-bar-track { flex: 1; height: 3px; background: #eee; border-radius: 2px; overflow: hidden; }
      .cc-bar-fill { height: 100%; background: #111; border-radius: 2px; }
      .cc-bar-num { min-width: 12px; text-align: right; }

      .cc-empty { font-size: 14px; color: #999; margin: 0 0 20px; }

      /* Форма */
      .cc-form-wrap { background: #f7f7f7; border-radius: 3px; padding: 18px 18px 14px; margin-bottom: 24px; }
      .cc-form-title { font-size: 12px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #111; margin-bottom: 14px; }
      .cc-field { margin-bottom: 11px; }
      .cc-field label { display: block; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #888; margin-bottom: 5px; }
      .cc-field input, .cc-field textarea {
        width: 100%; padding: 8px 11px; border: 1px solid #ddd; border-radius: 2px;
        font-size: 14px; font-family: inherit; color: #111; background: #fff;
        box-sizing: border-box; outline: none; transition: border-color 0.15s;
      }
      .cc-field input:focus, .cc-field textarea:focus { border-color: #111; }
      .cc-field textarea { height: 76px; resize: vertical; }

      .cc-stars-pick { display: flex; gap: 3px; margin-bottom: 3px; cursor: pointer; user-select: none; }
      .cc-stars-pick .cc-star { font-size: 22px; transition: color 0.1s; }
      .cc-stars-hint { display: none; font-size: 12px; color: #e55; margin-bottom: 6px; }

      .cc-btn {
        background: #111; color: #fff; border: none; padding: 10px 26px;
        font-size: 12px; letter-spacing: 0.07em; text-transform: uppercase;
        cursor: pointer; font-family: inherit; margin-top: 4px; border-radius: 2px;
      }
      .cc-btn:hover { background: #333; }
      .cc-btn:disabled { opacity: 0.5; cursor: default; }
      .cc-thanks { display: none; font-size: 14px; color: #555; padding: 12px 0; }

      .cc-review { padding: 16px 0; border-bottom: 1px solid #ebebeb; }
      .cc-review:last-child { border-bottom: none; }
      .cc-review-top { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap; }
      .cc-review-stars-static { display: flex; gap: 2px; }
      .cc-review-author { font-size: 13px; font-weight: 600; color: #111; }
      .cc-review-date { font-size: 12px; color: #bbb; margin-left: auto; }
      .cc-review-text { font-size: 14px; color: #444; line-height: 1.6; margin: 0; }
    `;
    document.head.appendChild(s);
  }

  function createWidget(productUid) {
    const el = document.createElement('div');
    el.className = 'cc-section';
    el.innerHTML = `
      <div class="cc-section-title">Отзывы покупателей</div>
      <div class="cc-summary"></div>
      <div class="cc-form-wrap">
        <div class="cc-form-title">Оставить отзыв</div>
        <form autocomplete="off">
          <div class="cc-field">
            <label>Оценка</label>
            <div class="cc-stars-pick">
              <span class="cc-star" data-val="1">★</span>
              <span class="cc-star" data-val="2">★</span>
              <span class="cc-star" data-val="3">★</span>
              <span class="cc-star" data-val="4">★</span>
              <span class="cc-star" data-val="5">★</span>
            </div>
            <div class="cc-stars-hint">Пожалуйста, выберите оценку</div>
          </div>
          <div class="cc-field">
            <label>Имя</label>
            <input name="ccname" required placeholder="Введите имя" />
          </div>
          <div class="cc-field">
            <label>Отзыв</label>
            <textarea name="text" required placeholder="Поделитесь впечатлением о товаре..."></textarea>
          </div>
          <button type="submit" class="cc-btn">Отправить отзыв</button>
        </form>
      </div>
      <div class="cc-thanks">✓ Спасибо! Отзыв появится после проверки.</div>
      <div class="cc-list"></div>
    `;

    // Кликабельные звёздочки — stopPropagation на каждом событии
    const form = el.querySelector('form');
    const stars = el.querySelectorAll('.cc-stars-pick .cc-star');
    stars.forEach(star => {
      star.addEventListener('mouseover', e => { e.stopPropagation();
        const val = parseInt(star.dataset.val);
        stars.forEach(s => s.classList.toggle('cc-star_on', parseInt(s.dataset.val) <= val));
      });
      star.addEventListener('mouseout', e => { e.stopPropagation();
        const cur = parseInt(form.dataset.rating || '0');
        stars.forEach(s => s.classList.toggle('cc-star_on', parseInt(s.dataset.val) <= cur));
      });
      star.addEventListener('click', e => { e.stopPropagation();
        const val = parseInt(star.dataset.val);
        form.dataset.rating = val;
        el.querySelector('.cc-stars-hint').style.display = 'none';
        stars.forEach(s => s.classList.toggle('cc-star_on', parseInt(s.dataset.val) <= val));
      });
    });

    form.addEventListener('submit', e => handleSubmit(e, productUid, el));
    loadReviews(productUid, el);
    return el;
  }

  // Вставляем ПОСЛЕ блока табов (не внутрь)
  function tryInject(productUid) {
    // Уже вставлен?
    if (document.querySelector('.cc-section')) return true;

    // Ищем блок табов или правую колонку попапа
    const anchor = document.querySelector('.js-store-tabs') ||
                   document.querySelector('.t-store__prod-popup__col-right');
    if (!anchor) return false;

    injectStyles();
    const widget = createWidget(productUid);
    anchor.parentNode.insertBefore(widget, anchor.nextSibling);
    return true;
  }

  function init() {
    const match = window.location.pathname.match(/tproduct\/(\d+)/);
    if (!match) return;
    const productUid = match[1];

    // Пробуем сразу, потом каждые 200мс до 8 секунд
    if (!tryInject(productUid)) {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        if (tryInject(productUid) || attempts > 40) clearInterval(timer);
      }, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
