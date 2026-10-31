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
  <a href="#/p/${p.id}"><div class="img" ${tint(p)}>${p.was ? '<span class="tag sale">Sale</span>' : p.isNew ? '<span class="tag">New</span>' : ''}${p.sizes.length <= 2 ? '<span class="tag low">Last pieces</span>' : ''}${art(p)}</div>
  <div class="meta"><b>${esc(p.designer)}</b><span>${esc(p.name)}</span><div class="price">${p.was ? `<s>${money(p.was)}</s><em>${money(p.price)}</em>` : money(p.price)}</div></div></a></div>`;
}
const grid = list => list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<div class="empty">No products match your filters.</div>';

// ---- views
function home() {
  const fresh = [...PRODUCTS].sort((a, b) => b.added - a.added).filter(p => p.isNew).slice(0, 8);
  const sale = PRODUCTS.filter(p => p.was).slice(0, 4);
  const cats = [['Clothing', '#2b2b2b'], ['Shoes', '#58603f'], ['Streetwear', '#5a1f2b'], ['Accessories', '#1c2a44']];
  return `<section class="hero">
    <a href="#/shop?sort=new" style="--bg1:linear-gradient(160deg,#1c1c1c,#4a4a4a)"><svg class="hero-art" viewBox="0 0 100 100"><path d="${SHAPES.coat}"/></svg><div><h2>FW26<br>Collection</h2><p>Tailoring, outerwear and the new season essentials.</p><span class="btn light">Shop new arrivals</span></div></a>
    <a href="#/shop?cat=Streetwear" style="--bg1:linear-gradient(200deg,#5a1f2b,#111)"><svg class="hero-art" viewBox="0 0 100 100"><path d="${SHAPES.hoodie}"/></svg><div><h2>Street<br>Essentials</h2><p>Hoodies, tees and cargos from the underground's best labels.</p><span class="btn light">Shop streetwear</span></div></a>
  </section>
  ${dropStrip()}${marquee()}
  <section class="sec"><div class="sec-h"><h3>New Arrivals</h3><a href="#/shop?sort=new">View all</a></div>${grid(fresh)}</section>
  <section class="sec"><div class="sec-h"><h3>Shop by Category</h3></div><div class="cats">${cats.map(([c, col]) => `<a href="#/shop?cat=${c}" style="background:${col}">${c}</a>`).join('')}</div></section>
  ${fitCta()}${rvRow()}
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
  store.set('c20rv', [p.id, ...store.get('c20rv', []).filter(x => x !== p.id)].slice(0, 8));
  const more = PRODUCTS.filter(x => x.id !== p.id && (x.sub === p.sub || x.designer === p.designer)).slice(0, 4);
  return `<div class="crumbs"><a href="#/">Home</a> / <a href="#/shop?cat=${p.cat}">${p.cat}</a> / ${esc(p.name)}</div>
  <div class="pdp"><div class="gallery"><div class="img" ${tint(p)}>${art(p, 1)}</div><div class="img" ${tint(p)}>${art(p)}</div><div class="img" ${tint(p)}><svg viewBox="0 0 100 100"><g transform="scale(-1,1) translate(-100,0)"><path d="${SHAPES[p.shape]}" fill="${p.hex}" opacity=".8"/></g></svg></div></div>
  <div class="info"><h1><a href="#/shop?designer=${encodeURIComponent(p.designer)}">${esc(p.designer)}</a></h1><h2>${esc(p.name)}</h2>
  <div class="price">${p.was ? `<s style="color:var(--mute)">${money(p.was)}</s> <em style="color:var(--red);font-style:normal">${money(p.price)}</em>` : money(p.price)}</div>
  <div style="color:var(--mute)">Colour: ${p.color}</div>
  <div class="chips" id="sizes">${(SIZES[p.sizes[0] ? sizeKey(p) : 'one']).map(s => `<span class="chip ${p.sizes.includes(s) ? '' : 'off'}" data-size="${s}">${s}</span>`).join('')}</div>
  <button class="sf" id="sf">📏 Find my size</button><div class="err" id="err"></div>
  <button class="btn full" id="add">Add to bag</button>
  <button class="btn ghost full" data-wish="${p.id}">${wish.includes(p.id) ? '♥ Saved' : '♡ Save to wishlist'}</button>
  <details open><summary>Description</summary><p>${esc(p.desc)}</p></details>
  <details><summary>Shipping &amp; returns</summary><p>Free shipping over $250. Free returns within 30 days of delivery.</p></details>
  <details><summary>Composition &amp; care</summary><p>See label. Dry clean or hand wash cold unless stated.</p></details></div></div>
  <section class="sec"><div class="sec-h"><h3>You may also like</h3></div>${grid(more)}</section>${rvRow(p.id)}`;
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


// ---- unique features: Drop, Fit Lab, Size Finder, Recently viewed
function nextDrop() { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + (5 - d.getDay() + 7) % 7); if (d <= new Date()) d.setDate(d.getDate() + 7); return d; }
function cdText() {
  let s = Math.max(0, Math.floor((nextDrop() - new Date()) / 1000));
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); s %= 60;
  return [[d, 'Days'], [h, 'Hrs'], [m, 'Min'], [s, 'Sec']].map(([n, l]) => `<div><b>${String(n).padStart(2, '0')}</b><span>${l}</span></div>`).join('');
}
setInterval(() => document.querySelectorAll('[data-cd]').forEach(e => e.innerHTML = cdText()), 1000);
const dropStrip = () => `<a href="#/drop" class="dropstrip"><span class="live">● NEXT DROP</span><div class="cd sm" data-cd>${cdText()}</div><span>Limited pieces, once they're gone they're gone →</span></a>`;
const marquee = () => `<div class="marq"><div>${'<span>No shortcuts</span><span class="o">Menswear only</span><span>FW26</span><span class="o">Class 2.0</span>'.repeat(6)}</div></div>`;
const fitCta = () => `<section class="banner fitcta"><h3>Fit Lab</h3><p style="margin-bottom:20px">Build a full outfit, lock what you love, shuffle the rest.</p><a class="btn light" href="#/fit">Build your fit</a></section>`;
function rvRow(excl) {
  const l = store.get('c20rv', []).filter(i => i !== excl).slice(0, 4).map(byId).filter(Boolean);
  return l.length ? `<section class="sec"><div class="sec-h"><h3>Recently viewed</h3></div>${grid(l)}</section>` : '';
}

const dropTotal = id => 24 + (id * 7) % 20;
let dropOpen = false, dropTimer = null, dropStock = {};
const dropItems = () => { const seen = new Set(); return PRODUCTS.filter(p => ['coat', 'jacket', 'hoodie', 'pants', 'shoe', 'boot'].includes(p.shape)).reverse().filter(p => !seen.has(p.shape) && seen.add(p.shape)).slice(0, 4); };
function dropReset() { dropStock = {}; dropItems().forEach(p => dropStock[p.id] = dropTotal(p.id)); }
dropReset();
function dropCard(p) {
  if (!dropOpen) return `<div class="card locked"><div class="img"><span class="tag">Locked</span>${art(p)}</div><div class="meta"><b>Mystery piece</b><span>Revealed at release</span></div></div>`;
  const left = dropStock[p.id], pct = Math.round(left / dropTotal(p.id) * 100);
  return `<a class="card ${left ? '' : 'gone'}" href="#/p/${p.id}"><div class="img" ${tint(p)}><span class="tag ${left ? 'sale' : ''}">${left ? 'Live' : 'Sold out'}</span>${art(p)}</div><div class="meta"><b>${esc(p.designer)}</b><span>${esc(p.name)}</span><div class="price">${money(p.price)}</div><div class="stock"><i style="width:${pct}%"></i></div><small>${left ? left + ' left' : 'Sold out'}</small></div></a>`;
}
function dropView() {
  return `<section class="drop"><div><span class="live">● LIMITED DROP 07</span><h1>The Friday<br>Drop</h1><p>Four pieces. One release. Once they're gone, they're gone.</p>
  ${dropOpen ? '<div class="cd live-now">LIVE NOW (demo)</div>' : `<div class="cd" data-cd>${cdText()}</div>`}
  <div class="drop-actions"><form id="notify"><input type="email" required placeholder="Email for drop alerts"><button>Notify me</button></form><button class="btn light" id="sim">${dropOpen ? 'Reset demo' : 'Simulate drop (demo)'}</button></div></div></section>
  <section class="sec"><div class="grid" id="dropGrid">${dropItems().map(dropCard).join('')}</div></section>`;
}
function dropBind() {
  $('#sim').onclick = () => { dropOpen = !dropOpen; dropReset(); route(); };
  $('#notify').onsubmit = e => { e.preventDefault(); e.target.reset(); toast("You're on the list"); };
  if (dropOpen) dropTimer = setInterval(() => {
    const g = $('#dropGrid'); if (!g) return clearInterval(dropTimer);
    const live = dropItems().filter(p => dropStock[p.id] > 0); if (!live.length) return clearInterval(dropTimer);
    const p = live[Math.floor(Math.random() * live.length)];
    dropStock[p.id] = Math.max(0, dropStock[p.id] - 1 - Math.floor(Math.random() * 3));
    g.innerHTML = dropItems().map(dropCard).join('');
  }, 1500);
}

const SLOTS = [['top', 'Top', p => ['coat', 'jacket', 'hoodie', 'tee'].includes(p.shape)], ['bottom', 'Bottoms', p => p.shape === 'pants'], ['shoes', 'Shoes', p => ['shoe', 'boot'].includes(p.shape)], ['acc', 'Accessory', p => ['belt', 'cap', 'bag'].includes(p.shape)]];
const SK = { top: 't', bottom: 'b', shoes: 's', acc: 'a' };
const pool = k => PRODUCTS.filter(SLOTS.find(s => s[0] === k)[2]);
const pick = k => { const l = pool(k); return l[Math.floor(Math.random() * l.length)].id; };
let F = {}; const LK = {}, FS = {};
const prefSize = p => { const pr = store.get('c20size', {}), k = sizeKey(p); const v = k === 'clo' ? pr.clo : k === 'waist' ? pr.waist : k === 'shoe' ? pr.shoe : null; return v && p.sizes.includes(v) ? v : null; };
const fitSize = k => { const p = byId(F[k]); return FS[p.id] && p.sizes.includes(FS[p.id]) ? FS[p.id] : prefSize(p) || p.sizes[Math.floor((p.sizes.length - 1) / 2)]; };
function fitView() { return `<div class="crumbs"><a href="#/">Home</a> / Fit Lab</div><section class="sec fitsec"><div class="sec-h"><h3>Fit Lab</h3><span style="color:var(--mute)">Lock what you love. Shuffle the rest.</span></div><div id="fitbox"></div></section>`; }
function fitHTML() {
  const ps = Object.fromEntries(SLOTS.map(([k]) => [k, byId(F[k])]));
  const L = (p, x, y, w) => `<svg x="${x}" y="${y}" width="${w}" height="${w}" viewBox="0 0 100 100"><path d="${SHAPES[p.shape]}" fill="${p.hex}" stroke="rgba(0,0,0,.35)" stroke-width="1"/></svg>`;
  const total = SLOTS.reduce((a, [k]) => a + ps[k].price, 0);
  return `<div class="fit"><div class="mannequin"><svg viewBox="0 -30 200 330"><circle cx="100" cy="-8" r="17" fill="#cfcac0"/>${L(ps.bottom, 55, 105, 90)}${L(ps.shoes, 45, 145, 110)}${L(ps.top, 40, 5, 120)}${L(ps.acc, 138, 95, 56)}</svg></div>
  <div class="slots">${SLOTS.map(([k, label]) => { const p = ps[k], sz = fitSize(k); return `<div class="slot"><div class="slot-img" ${tint(p)}>${art(p)}</div><div class="slot-t"><small>${label}</small><a href="#/p/${p.id}"><b>${esc(p.designer)}</b> ${esc(p.name)}</a><span>${p.color} · ${money(p.price)}</span></div>
   <div class="slot-c"><button data-prev="${k}" aria-label="Previous">‹</button><button data-lock="${k}" class="${LK[k] ? 'on' : ''}" aria-label="Lock">${LK[k] ? '🔒' : '🔓'}</button><button data-next="${k}" aria-label="Next">›</button><select data-sz="${k}">${p.sizes.map(s => `<option ${s === sz ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>`; }).join('')}
  <div class="fit-total"><span>Total</span><b>${money(total)}</b></div>
  <div class="fit-actions"><button class="btn" id="shuf">Shuffle ⟳</button><button class="btn ghost" id="addfit">Add fit to bag</button><button class="btn ghost" id="share">Copy link</button></div></div></div>`;
}
function fitBind(q) {
  const saved = store.get('c20fit', {});
  SLOTS.forEach(([k]) => { const v = +q[SK[k]]; F[k] = byId(v) && pool(k).some(p => p.id === v) ? v : (byId(saved[k]) ? saved[k] : pick(k)); });
  const box = $('#fitbox');
  const draw = () => {
    store.set('c20fit', F); box.innerHTML = fitHTML();
    box.querySelectorAll('[data-prev],[data-next]').forEach(b => b.onclick = () => { const k = b.dataset.prev || b.dataset.next, l = pool(k), i = l.findIndex(p => p.id === F[k]); F[k] = l[(i + (b.dataset.next ? 1 : -1) + l.length) % l.length].id; draw(); });
    box.querySelectorAll('[data-lock]').forEach(b => b.onclick = () => { LK[b.dataset.lock] = !LK[b.dataset.lock]; draw(); });
    box.querySelectorAll('[data-sz]').forEach(s => s.onchange = () => { FS[F[s.dataset.sz]] = s.value; });
    $('#shuf').onclick = () => { SLOTS.forEach(([k]) => { if (!LK[k]) F[k] = pick(k); }); draw(); };
    $('#addfit').onclick = () => { SLOTS.forEach(([k]) => addCart(F[k], fitSize(k), true)); drawer(true); toast('Fit added to bag'); };
    $('#share').onclick = () => { const u = location.origin + location.pathname + '#/fit?' + SLOTS.map(([k]) => SK[k] + '=' + F[k]).join('&'); navigator.clipboard ? navigator.clipboard.writeText(u).then(() => toast('Link copied'), () => toast(u)) : toast(u); };
  };
  draw();
}

function calcSize(h, w, f, fit) {
  const bmi = w / ((h / 100) ** 2), score = (h - 170) / 6 + (w - 72) / 8;
  const i = Math.max(0, Math.min(5, Math.round(1.5 + score * 0.45) + ({ slim: -1, regular: 0, relaxed: 1 }[fit] || 0)));
  const out = { clo: SIZES.clo[i], waist: String(Math.max(28, Math.min(38, Math.round((28 + (bmi - 20) * 1.2) / 2) * 2))) };
  if (f) out.shoe = String(Math.max(40, Math.min(46, Math.round((f + 1.5) * 1.5))));
  return out;
}
const closeModal = () => { $('#modal').classList.remove('on'); $('#overlay').classList.remove('on'); };
function openFinder() {
  const m = $('#modal'), pr = store.get('c20size', {});
  m.innerHTML = `<button class="x" data-closem aria-label="Close">✕</button><h3 style="text-transform:uppercase;letter-spacing:.14em">Find my size</h3><form id="sfForm">
   <label>Height (cm)<input name="h" type="number" min="140" max="215" required value="${pr.h || ''}"></label>
   <label>Weight (kg)<input name="w" type="number" min="40" max="200" required value="${pr.w || ''}"></label>
   <label>Foot length (cm), optional<input name="f" type="number" step="0.5" min="22" max="32" value="${pr.f || ''}"></label>
   <label>Fit preference<select name="fit">${['slim', 'regular', 'relaxed'].map(x => `<option ${pr.fit === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><button class="btn full">Show my size</button></form>`;
  m.classList.add('on'); $('#overlay').classList.add('on');
  $('#sfForm').onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target), r = calcSize(+f.get('h'), +f.get('w'), +f.get('f'), f.get('fit'));
    store.set('c20size', { ...r, h: +f.get('h'), w: +f.get('w'), f: +f.get('f') || '', fit: f.get('fit') });
    m.innerHTML = `<h3 style="text-transform:uppercase;letter-spacing:.14em">Your sizes</h3><p style="margin:16px 0;line-height:1.8">Tops &amp; jackets <b>${r.clo}</b><br>Trousers waist <b>${r.waist}</b>${r.shoe ? `<br>Shoes (EU) <b>${r.shoe}</b>` : ''}</p><p style="color:var(--mute);margin-bottom:16px">Saved. We'll pre-select it on every product and in Fit Lab.</p><button class="btn full" data-closem>Done</button>`;
  };
}

// ---- router
function route() {
  const h = location.hash || '#/', path = h.split('?')[0].slice(1) || '/', q = parseQ(h);
  const [, a, b] = path.split('/');
  $('#nav').classList.remove('on');
  app.innerHTML = !a ? home() : a === 'shop' ? shop(q) : a === 'p' ? pdp(b) : a === 'drop' ? dropView() : a === 'fit' ? fitView() : a === 'designers' ? designers() : a === 'wishlist' ? wishlist()
    : a === 'checkout' ? checkout() : a === 'info' && info[b] ? `<div class="page"><h1>${info[b][0]}</h1><p>${info[b][1]}</p></div>` : a === 'done' ? '<div class="page"><h1>Thank you</h1><p>Your demo order has been placed. No payment was taken.</p><p><a class="btn" href="#/">Continue shopping</a></p></div>' : notFound();
  scrollTo(0, 0);
  clearInterval(dropTimer);
  if (a === 'drop') dropBind();
  if (a === 'fit') fitBind(q);
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
    const p0 = byId(b); let size = prefSize(p0);
    if (size) { const c = app.querySelector(`[data-size="${size}"]`); if (c) c.classList.add('on'); }
    $('#sf').onclick = openFinder;
    app.querySelectorAll('[data-size]').forEach(c => c.onclick = () => { size = c.dataset.size; app.querySelectorAll('[data-size]').forEach(x => x.classList.toggle('on', x === c)); $('#err').textContent = ''; });
    $('#add').onclick = () => { if (!size) { $('#err').textContent = 'Please select a size.'; return; } addCart(+b, size); };
  }
}

// ---- cart
const total = () => cart.reduce((a, l) => a + byId(l.id).price * l.qty, 0);
const ship = t => t === 0 || t >= 250 ? 0 : 15;
function addCart(id, size, quiet) {
  const l = cart.find(x => x.id === id && x.size === size);
  l ? l.qty++ : cart.push({ id, size, qty: 1 }); save(); renderDrawer(); if (!quiet) drawer(true);
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
  if (e.target.closest('[data-closem]')) { closeModal(); route_soft(); return; }
  if (e.target.closest('[data-close]') || e.target.id === 'overlay') { drawer(false); closeModal(); }
});
function route_soft() { const y = scrollY; route(); scrollTo(0, y); }
$('#cartBtn').onclick = () => drawer(true);
$('#menuBtn').onclick = () => $('#nav').classList.toggle('on');
$('#search').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.value.trim()) { location.hash = '#/shop?q=' + encodeURIComponent(e.target.value.trim()); e.target.value = ''; } });
$('#news').onsubmit = e => { e.preventDefault(); e.target.reset(); toast('Welcome to the list'); };
document.addEventListener('submit', e => { if (e.target.id === 'co') { e.preventDefault(); cart = []; save(); location.hash = '#/done'; } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { drawer(false); closeModal(); } });
addEventListener('hashchange', route);
document.documentElement.dataset.theme = store.get('c20theme', 'light');
$('#themeBtn').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; store.set('c20theme', t); };
badge(); route();
})();
