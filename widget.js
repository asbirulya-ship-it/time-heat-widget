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
     
