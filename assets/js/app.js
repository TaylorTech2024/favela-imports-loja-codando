const STORE_PHONE='5581983649142';
const money=v=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
let PRODUCTS=window.PRODUCTS||[];
let cart=JSON.parse(localStorage.getItem('favela_cart')||'[]');
let currentCat='all', currentSearch='';
const grid=document.getElementById('grid'), featured=document.getElementById('featuredGrid'), cartEl=document.getElementById('cart'), cartItems=document.getElementById('cartItems');
function toast(txt){const t=document.getElementById('toast');t.textContent=txt;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function label(c){return ({times:'Times',camisas:'Camisas',tenis:'Tênis',chinelos:'Chinelos',acessorios:'Acessórios'}[c]||c)}
function filtered(){return PRODUCTS.filter(p=>(currentCat==='all'||p.category===currentCat)&&p.name.toLowerCase().includes(currentSearch.toLowerCase()))}
function card(p,i,small=false){return `<article class="card" style="animation-delay:${i*40}ms"><span class="badge">${p.badge||'Novo'}</span><span class="heart">♡</span><div class="img-wrap"><img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='assets/img/logo-favela-imports.png'"></div><div class="card-body"><h3>${p.name}</h3><div class="price">R$ ${money(p.price)}</div><div class="parcel">12x de R$ ${money(p.price/12)}</div>${small?'':`<small>${label(p.category)} • estoque ${p.stock}</small>`}<div class="card-actions"><button data-add="${p.id}">Comprar</button><a class="zap" target="_blank" href="${whats(p)}">WhatsApp</a></div></div></article>`}
function renderProducts(){const list=filtered();grid.innerHTML=list.map((p,i)=>card(p,i)).join('')||'<p class="empty">Nenhum produto encontrado.</p>';bindAdd()}
function renderFeatured(){const ids=['tenis-nike-dunk','chinelo-yeezy-slide','bone-lacoste-preto','chinelo-kenner-gold','camisa-adidas-essential','camisa-nike-club'];featured.innerHTML=ids.map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean).map((p,i)=>card(p,i,true)).join('');bindAdd()}
function whats(p){return `https://wa.me/${STORE_PHONE}?text=${encodeURIComponent('Olá! Tenho interesse no produto: '+p.name+' - R$ '+money(p.price))}`}
function bindAdd(){document.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=e=>add(btn.dataset.add,e))}
function fly(img){const c=img.cloneNode(true),r=img.getBoundingClientRect(),b=document.getElementById('cartBtn').getBoundingClientRect();c.className='fly-img';c.style.left=r.left+'px';c.style.top=r.top+'px';c.style.setProperty('--tx',(b.left-r.left)+'px');c.style.setProperty('--ty',(b.top-r.top)+'px');document.body.appendChild(c);setTimeout(()=>c.remove(),900)}
function add(id,e){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;let it=cart.find(x=>x.id===id);it?it.qty++:cart.push({...p,qty:1});const im=e.target.closest('.card')?.querySelector('img');if(im)fly(im);save();cartEl.classList.add('open');toast('Produto adicionado ao carrinho!')}
function save(){localStorage.setItem('favela_cart',JSON.stringify(cart));renderCart()}
function renderCart(){document.getElementById('cartCount').textContent=cart.reduce((a,b)=>a+b.qty,0);cartItems.innerHTML=cart.length?cart.map(i=>`<div class="cart-item"><img src="${i.image}" onerror="this.onerror=null;this.src='assets/img/logo-favela-imports.png'"><span><b>${i.qty}x</b> ${i.name}<br>R$ ${money(i.price*i.qty)}</span><div><button onclick="qty('${i.id}',1)">+</button><button onclick="qty('${i.id}',-1)">-</button><button onclick="removeItem('${i.id}')">×</button></div></div>`).join(''):'<p>Carrinho vazio.</p>';document.getElementById('total').textContent=money(cart.reduce((a,b)=>a+b.price*b.qty,0))}
window.qty=(id,d)=>{const i=cart.find(x=>x.id===id);if(!i)return;i.qty+=d;if(i.qty<=0)cart=cart.filter(x=>x.id!==id);save()};
window.removeItem=id=>{cart=cart.filter(x=>x.id!==id);save();toast('Produto removido.')};
function openTab(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.navlink').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));window.scrollTo({top:0,behavior:'smooth'});setTimeout(reveal,80)}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>openTab(b.dataset.tab));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>openTab(b.dataset.go));
document.querySelectorAll('[data-cat-go]').forEach(b=>b.onclick=()=>{openTab('produtos');setTimeout(()=>setCat(b.dataset.catGo),80)});
document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>setCat(b.dataset.cat));
function setCat(c){currentCat=c;document.querySelectorAll('[data-cat]').forEach(b=>b.classList.toggle('active',b.dataset.cat===c));renderProducts()}
document.getElementById('searchInput').oninput=e=>{currentSearch=e.target.value;renderProducts()};
document.getElementById('searchBtn').onclick=()=>{openTab('produtos');setTimeout(()=>document.getElementById('searchInput').focus(),300)};
document.getElementById('menuBtn').onclick=()=>document.getElementById('tabs').classList.toggle('open');
document.getElementById('cartBtn').onclick=()=>cartEl.classList.add('open');document.getElementById('closeCart').onclick=()=>cartEl.classList.remove('open');
function msg(id,total){return encodeURIComponent(`Olá! Pedido concluído no site Favela Imports PE.\nCódigo: ${id}\n\nProdutos:\n${cart.map(i=>i.qty+'x '+i.name).join('\n')}\n\nTotal: R$ ${money(total)}`)}
document.getElementById('checkout').onsubmit=async e=>{e.preventDefault();if(!cart.length)return toast('Adicione produtos ao carrinho.');const f=new FormData(e.target),total=cart.reduce((a,b)=>a+b.price*b.qty,0);const payload={customer:{name:f.get('name'),phone:f.get('phone'),email:f.get('email'),address:f.get('address')},payment_method:f.get('payment_method'),delivery_method:f.get('delivery_method'),notes:f.get('notes'),items:cart,subtotal:total};let id='LOCAL-'+Date.now().toString().slice(-5);try{const r=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(r.ok){const data=await r.json();id=data.id||id}}catch(err){}document.getElementById('successText').innerHTML=`Seu pedido foi concluído com sucesso.<br><b>Código: ${id}</b><br><br><a class="zap" style="padding:14px;margin-top:12px" target="_blank" href="https://wa.me/${STORE_PHONE}?text=${msg(id,total)}">Enviar no WhatsApp</a>`;document.getElementById('successModal').classList.add('open');cart=[];save();cartEl.classList.remove('open');e.target.reset()};
document.getElementById('closeSuccess').onclick=()=>document.getElementById('successModal').classList.remove('open');
function reveal(){document.querySelectorAll('.reveal').forEach(el=>{if(el.getBoundingClientRect().top<innerHeight-40)el.classList.add('show')})}
addEventListener('scroll',reveal);addEventListener('load',reveal);
(async()=>{try{const r=await fetch('/api/products');if(r.ok)PRODUCTS=await r.json()}catch(e){}renderFeatured();renderProducts();renderCart();reveal()})();
