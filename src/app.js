(() => {
const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const money = n => '$' + n.toLocaleString('en-US');
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};
let cart = store.get('c20cart', []);   // {id,size,qty}
let wish = store.get('c20wish', []);   // ids
const byId = id => PRODUCTS.find(p => p.id === +id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ---- garment illustrations (inline SVG, no external assets)
const SHAPES = {
  coat: 'M30 10l12-4 8 6 8-6 12 4 10 22-10 6v52H30V38L20 32z',
  jacket: 'M32 12l10-4 8 5 8-5 10 4 12 24-9 5v38H29V41l-9-5z',
  hoodie: 'M36 12q14 10 28 0l16 8 8 26-10 4v34H32V50l-10-4 8-26z',
  tee: 'M34 10q16 10 32 0l22 12-8 20-10-4v46H30V38l-10 4-8-20z',
  pants: 'M32 8h36l6 84H56L50 40l-6 52H26z',
  shoe: 'M8 60q0-14 14-16l22-2 10 12 28 4q8 4 8 12v6H8z',
  boot: 'M30 8h26v44l28 10v22H20V54z',
  belt: 'M8 44h84v12H8z',
  cap: 'M20 62q0-34 30-34t30 34zM10 62h80v8H10z',
  bag: 'M24 36h52v46H24zM36 36q0-18 14-18t14 18',
};
const art = (p, big) => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${SHAPES[p.shape]}" fill="${p.hex}" stroke="${p.hex === '#e8e4da' ? '#bbb' : 'rgba(0,0,0,.35)'}" stroke-width="1"/>${big ? '<path d="M50 14v70" stroke="rgba(0,0,0,.12)"/>' : ''}</svg>`;
const tint = p => `style="background:${p.hex === '#111' || p.hex === '#1c2a44' ? '#dcdcdc' : '#efede8'}"`;

function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 1800); }
function save() { store.set('c20cart', cart); store.set('c20wish', wish); badge(); }
function badge() {
  $('#cartCount').textContent = cart.reduce((a, l) => a + l.qty, 0) || '';
  $('#wishCount').textContent = wish.length || '';
}

// ---- components
function card(p) {
  const on = wish.includes(p.id);
  return `<div class="card"><button class="heart ${on ? 'on' : ''}" data-wish="${p.id}" aria-label="Wishlist">${on ? '♥' : '♡'}</button>
  <a href="#/p/${p.id}"><div class="img" ${tint(p)}>${p.was ? '<span class="tag sale">Sale</span>' : p.isNew ? '<span class="tag">New</span>' : ''}${art(p)}</div>
  <div class="meta"><b>${esc(p.designer)}</b><span>${esc(p.name)}</span><div class="price">${p.was ? `<s>${money(p.was)}</s><em>${money(p.price)}</em>` : money(p.price)}</div></div></a></div>`;
}
const grid = list => list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<div class="empty">No products match your filters.</div>';

// ---- views
function home() {
  const fresh = [...PRODUCTS].sort((a, b) => b.added - a.added).filter(p => p.isNew).slice(0, 8);
  const sale = PRODUCTS.filter(p => p.was).slice(0, 4);
  const cats = [['Clothing', '#2b2b2b'], ['Shoes', '#58603f'], ['Streetwear', '#5a1f2b'], ['Accessories', '#1c2a44']];
  return `<section class="hero">
    <a href="#/shop?sort=new" style="--bg1:linear-gradient(160deg,#1c1c1c,#4a4a4a)"><div><h2>FW26<br>Collection</h2><p>Tailoring, outerwear and the new season essentials.</p><span class="btn light">Shop new arrivals</span></div></a>
    <a href="#/shop?cat=Streetwear" style="--bg1:linear-gradient(200deg,#5a1f2b,#111)"><div><h2>Street<br>Essentials</h2><p>Hoodies, tees and cargos from the underground's best labels.</p><span class="btn light">Shop streetwear</span></div></a>
  </section>
  <section class="sec"><div class="sec-h"><h3>New Arrivals</h3><a href="#/shop?sort=new">View all</a></div>${grid(fresh)}</section>
  <section class="sec"><div class="sec-h"><h3>Shop by Category</h3></div><div class="cats">${cats.map(([c, col]) => `<a href="#/shop?cat=${c}" style="background:${col}">${c}</a>`).join('')}</div></section>
  <section class="banner"><h3>Up to 30% off</h3><p style="margin-bottom:20px">Selected designers, while stock lasts.</p><a class="btn light" href="#/shop?sale=1">Shop sale</a></section>
  <section class="sec"><div class="sec-h"><h3>Sale Picks</h3><a href="#/shop?sale=1">View all</a></div>${grid(sale)}</section>
  <section class="sec"><div class="sec-h"><h3>Featured Designers</h3><a href="#/designers">A–Z</a></div><div class="designers">${DESIGNERS.map(d => `<a href="#/shop?designer=${encodeURIComponent(d)}">${esc(d)}</a>`).join('')}</div></section>`;
}

function parseQ(h) { const q = {}; (h.split('?')[1] || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); q[k] = decodeURIComponent(v || ''); }); return q; }
const setQ = (q) => { const s = Object.entries(q).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&'); location.hash = '#/shop' + (s ? '?' + s : ''); };

function shop(q) {
  let l = PRODUCTS.slice();
  if (q.cat) l = l.filter(p => p.cat === q.cat);
  if (q.sub) l = l.filter(p => p.sub === q.sub);
  if (q.designer) l = l.filter(p => p.designer === q.designer);
  if (q.color) l = l.filter(p => p.color === q.color);
  if (q.size) l = l.filter(p => p.sizes.includes(q.size));
  if (q.sale) l = l.filter(p => p.was);
  if (q.max) l = l.filter(p => p.price <= +q.max);
  if (q.q) { const s = q.q.toLowerCase(); l = l.filter(p => (p.designer + ' ' + p.name + ' ' + p.color + ' ' + p.sub).toLowerCase().includes(s)); }
  const sorts = { new: (a, b) => b.added - a.added, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price };
  if (q.sort && sorts[q.sort]) l.sort(sorts[q.sort]);
  const pool = PRODUCTS.filter(p => !q.cat || p.cat === q.cat);
  const subs = [...new Set(pool.map(p => p.sub))].sort();
  const designers = [...new Set(PRODUCTS.map(p => p.designer))].sort();
  const sizes = [...new Set(PRODUCTS.flatMap(p => p.sizes))];
  const title = q.q ? `Results for “${esc(q.q)}”` : q.sale ? 'Sale' : q.designer || q.cat || (q.sort === 'new' ? 'New Arrivals' : 'All Men’s');
  const sel = (k, v) => q[k] === v ? 'on' : '';
  const link = (k, v) => `data-q="${k}" data-v="${esc(v)}"`;
  return `<div class="crumbs"><a href="#/">Home</a> / ${title}</div>
  <div class="plp"><aside class="filters" id="filters">
    <h4>Category</h4>${['Clothing', 'Shoes', 'Accessories', 'Streetwear'].map(c => `<label><input type="radio" name="cat" ${q.cat === c ? 'checked' : ''} ${link('cat', c)}> ${c}</label>`).join('')}
    <h4>Type</h4>${subs.map(s => `<label><input type="radio" name="sub" ${q.sub === s ? 'checked' : ''} ${link('sub', s)}> ${s}</label>`).join('')}
    <h4>Designer</h4><select ${link('designer', '')} style="width:100%;padding:8px"><option value="">All</option>${designers.map(d => `<option ${q.designer === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select>
    <h4>Size</h4><div class="chips">${sizes.map(s => `<span class="chip ${sel('size', s)}" ${link('size', s)}>${s}</span>`).join('')}</div>
    <h4>Colour</h4>${COLORS.map(([n, h]) => `<span class="swatch ${sel('color', n)}" title="${n}" style="background:${h}" ${link('color', n)}></span>`).join('')}
    <h4>Max price</h4><select ${link('max', '')} style="width:100%;padding:8px"><option value="">Any</option>${[200, 500, 1000, 2000].map(m => `<option value="${m}" ${q.max == m ? 'selected' : ''}>Under ${money(m)}</option>`).join('')}</select>
    <h4>Sale</h4><label><input type="checkbox" ${q.sale ? 'checked' : ''} ${link('sale', '1')}> Sale only</label>
    <p style="margin-top:20px"><a href="#/shop" class="rm" style="margin:0">Clear all</a></p>
  </aside><section>
    <div class="bar"><div><b style="text-transform:uppercase;letter-spacing:.14em">${title}</b> <span style="color:var(--mute)">${l.length} items</span> <button class="rm" id="ftoggle" style="display:${innerWidth < 900 ? 'inline' : 'none'}">Filters</button></div>
    <select id="sort"><option value="">Featured</option><option value="new" ${q.sort === 'new' ? 'selected' : ''}>Newest</option><option value="low" ${q.sort === 'low' ? 'selected' : ''}>Price: low to high</option><option value="high" ${q.sort === 'high' ? 'selected' : ''}>Price: high to low</option></select></div>
    ${grid(l)}</section></div>`;
}

function pdp(id) {
  const p = byId(id); if (!p) return notFound();
  const more = PRODUCTS.filter(x => x.id !== p.id && (x.sub === p.sub || x.designer === p.designer)).slice(0, 4);
  return `<div class="crumbs"><a href="#/">Home</a> / <a href="#/shop?cat=${p.cat}">${p.cat}</a> / ${esc(p.name)}</div>
  <div class="pdp"><div class="gallery"><div class="img" ${tint(p)}>${art(p, 1)}</div><div class="img" ${tint(p)}>${art(p)}</div><div class="img" ${tint(p)}><svg viewBox="0 0 100 100"><g transform="scale(-1,1) translate(-100,0)"><path d="${SHAPES[p.shape]}" fill="${p.hex}" opacity=".8"/></g></svg></div></div>
  <div class="info"><h1><a href="#/shop?designer=${encodeURIComponent(p.designer)}">${esc(p.designer)}</a></h1><h2>${esc(p.name)}</h2>
  <div class="price">${p.was ? `<s style="color:var(--mute)">${money(p.was)}</s> <em style="color:var(--red);font-style:normal">${money(p.price)}</em>` : money(p.price)}</div>
  <div style="color:var(--mute)">Colour: ${p.color}</div>
  <div class="chips" id="sizes">${(SIZES[p.sizes[0] ? sizeKey(p) : 'one']).map(s => `<span class="chip ${p.sizes.includes(s) ? '' : 'off'}" data-size="${s}">${s}</span>`).join('')}</div>
  <div class="err" id="err"></div>
  <button class="btn full" id="add">Add to bag</button>
  <button class="btn ghost full" data-wish="${p.id}">${wish.includes(p.id) ? '♥ Saved' : '♡ Save to wishlist'}</button>
  <details open><summary>Description</summary><p>${esc(p.desc)}</p></details>
  <details><summary>Shipping &amp; returns</summary><p>Free shipping over $250. Free returns within 30 days of delivery.</p></details>
  <details><summary>Composition &amp; care</summary><p>See label. Dry clean or hand wash cold unless stated.</p></details></div></div>
  <section class="sec"><div class="sec-h"><h3>You may also like</h3></div>${grid(more)}</section>`;
}
const sizeKey = p => ['clo', 'waist', 'shoe', 'one'].find(k => SIZES[k].some(s => p.sizes.includes(s)) && p.sizes.every(s => SIZES[k].includes(s))) || 'one';

function designers() {
  const g = {}; DESIGNERS.slice().sort().forEach(d => (g[d[0]] = g[d[0]] || []).push(d));
  return `<div class="crumbs"><a href="#/">Home</a> / Designers</div><div class="sec"><div class="sec-h"><h3>Designers A–Z</h3></div></div>
  <div class="az">${Object.entries(g).map(([k, v]) => `<h5>${k}</h5>${v.map(d => `<a href="#/shop?designer=${encodeURIComponent(d)}">${esc(d)}</a>`).join('')}`).join('')}</div>`;
}
function wishlist() { const l = wish.map(byId).filter(Boolean); return `<div class="sec"><div class="sec-h"><h3>Wishlist (${l.length})</h3></div>${l.length ? grid(l) : '<div class="empty">Nothing saved yet. Tap ♡ on any item.</div>'}</div>`; }
function checkout() {
  if (!cart.length) return '<div class="empty">Your bag is empty. <a class="rm" href="#/shop">Continue shopping</a></div>';
  const t = total();
  return `<div class="checkout"><form id="co"><h3 style="letter-spacing:.14em;text-transform:uppercase">Delivery</h3>
   <input required placeholder="Full name"><input required type="email" placeholder="Email"><input required placeholder="Address"><input required placeholder="City / Postcode">
   <h3 style="margin-top:16px;letter-spacing:.14em;text-transform:uppercase">Payment</h3><input required placeholder="Card number (demo — do not enter real data)" inputmode="numeric"><button class="btn full">Place order · ${money(t + ship(t))}</button></form>
   <div>${cart.map(l => { const p = byId(l.id); return `<div class="line"><div class="img" ${tint(p)}>${art(p)}</div><div><b>${esc(p.designer)}</b><br>${esc(p.name)}<br>Size ${l.size} · Qty ${l.qty}<br>${money(p.price * l.qty)}</div></div>` }).join('')}
   <p style="margin-top:14px">Subtotal ${money(t)} · Shipping ${ship(t) ? money(ship(t)) : 'Free'}</p></div></div>`;
}
const info = { shipping: ['Shipping', 'Free standard shipping on orders over $250, otherwise $15. Express available at checkout.'], returns: ['Returns', 'Return unworn items with tags within 30 days for a full refund.'], size: ['Size guide', 'Tops: XS (34) – XXL (46) chest. Trousers: waist in inches. Shoes: EU sizing. If between sizes, size up.'] };
const notFound = () => '<div class="empty">Page not found. <a class="rm" href="#/">Home</a></div>';

// ---- router
function route() {
  const h = location.hash || '#/', path = h.split('?')[0].slice(1) || '/', q = parseQ(h);
  const [, a, b] = path.split('/');
  $('#nav').classList.remove('on');
  app.innerHTML = !a ? home() : a === 'shop' ? shop(q) : a === 'p' ? pdp(b) : a === 'designers' ? designers() : a === 'wishlist' ? wishlist()
    : a === 'checkout' ? checkout() : a === 'info' && info[b] ? `<div class="page"><h1>${info[b][0]}</h1><p>${info[b][1]}</p></div>` : a === 'done' ? '<div class="page"><h1>Thank you</h1><p>Your demo order has been placed. No payment was taken.</p><p><a class="btn" href="#/">Continue shopping</a></p></div>' : notFound();
  scrollTo(0, 0);
  if (a === 'shop') {
    app.querySelectorAll('[data-q]').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'click', () => {
      const k = el.dataset.q, nq = { ...q };
      const v = el.tagName === 'SELECT' ? el.value : el.dataset.v;
      nq[k] = (el.tagName !== 'SELECT' && nq[k] === v) ? '' : v;
      if (k === 'cat') nq.sub = '';
      setQ(nq);
    }));
    $('#sort').onchange = e => setQ({ ...q, sort: e.target.value });
    const ft = $('#ftoggle'); if (ft) ft.onclick = () => $('#filters').classList.toggle('on');
  }
  if (a === 'p') {
    let size = null;
    app.querySelectorAll('[data-size]').forEach(c => c.onclick = () => { size = c.dataset.size; app.querySelectorAll('[data-size]').forEach(x => x.classList.toggle('on', x === c)); $('#err').textContent = ''; });
    $('#add').onclick = () => { if (!size) { $('#err').textContent = 'Please select a size.'; return; } addCart(+b, size); };
  }
}

// ---- cart
const total = () => cart.reduce((a, l) => a + byId(l.id).price * l.qty, 0);
const ship = t => t === 0 || t >= 250 ? 0 : 15;
function addCart(id, size) {
  const l = cart.find(x => x.id === id && x.size === size);
  l ? l.qty++ : cart.push({ id, size, qty: 1 }); save(); drawer(true); renderDrawer();
}
function renderDrawer() {
  const d = $('#drawer'), t = total();
  d.innerHTML = `<header><span>Bag (${cart.reduce((a, l) => a + l.qty, 0)})</span><button data-close>✕</button></header>
  <div class="items">${cart.length ? cart.map((l, i) => { const p = byId(l.id); return `<div class="line"><div class="img" ${tint(p)}>${art(p)}</div><div><b style="text-transform:uppercase;letter-spacing:.1em;font-size:11px">${esc(p.designer)}</b><br>${esc(p.name)}<br><span style="color:var(--mute)">Size ${l.size}</span><br>${money(p.price)}<br>
   <div class="qty"><button data-q="-1" data-i="${i}">−</button><span>${l.qty}</span><button data-q="1" data-i="${i}">+</button></div><button class="rm" data-rm="${i}">Remove</button></div></div>` }).join('') : '<div class="empty">Your bag is empty.</div>'}</div>
  ${cart.length ? `<footer><div class="tot"><span>Subtotal</span><span>${money(t)}</span></div><p style="color:var(--mute);margin-bottom:12px">${ship(t) ? `Add ${money(250 - t)} more for free shipping` : 'Free shipping applied'}</p><a href="#/checkout" class="btn full" data-close>Checkout</a></footer>` : ''}`;
}
function drawer(on) { $('#drawer').classList.toggle('on', on); $('#overlay').classList.toggle('on', on); if (on) renderDrawer(); }

// ---- global events
document.addEventListener('click', e => {
  const w = e.target.closest('[data-wish]');
  if (w) { e.preventDefault(); const id = +w.dataset.wish; wish = wish.includes(id) ? wish.filter(x => x !== id) : [...wish, id]; save(); toast(wish.includes(id) ? 'Saved to wishlist' : 'Removed'); route_soft(); return; }
  const dq = e.target.closest('#drawer [data-q]'); if (dq) { const l = cart[+dq.dataset.i]; l.qty += +dq.dataset.q; if (l.qty < 1) cart.splice(+dq.dataset.i, 1); save(); renderDrawer(); return; }
  const rm = e.target.closest('[data-rm]'); if (rm) { cart.splice(+rm.dataset.rm, 1); save(); renderDrawer(); return; }
  if (e.target.closest('[data-close]') || e.target.id === 'overlay') drawer(false);
});
function route_soft() { const y = scrollY; route(); scrollTo(0, y); }
$('#cartBtn').onclick = () => drawer(true);
$('#menuBtn').onclick = () => $('#nav').classList.toggle('on');
$('#search').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.value.trim()) { location.hash = '#/shop?q=' + encodeURIComponent(e.target.value.trim()); e.target.value = ''; } });
$('#news').onsubmit = e => { e.preventDefault(); e.target.reset(); toast('Welcome to the list'); };
document.addEventListener('submit', e => { if (e.target.id === 'co') { e.preventDefault(); cart = []; save(); location.hash = '#/done'; } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') drawer(false); });
addEventListener('hashchange', route);
badge(); route();
})();
