const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new sqlite3.Database(path.join(DATA_DIR, 'loja.sqlite'));

const seedProducts = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.seed.json'), 'utf8'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    payment_method TEXT,
    delivery_method TEXT,
    items_json TEXT NOT NULL,
    subtotal REAL NOT NULL,
    status TEXT DEFAULT 'novo',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  const stmt = db.prepare(`INSERT INTO products(id,name,price,category,image,stock,active) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, price=excluded.price, category=excluded.category, image=excluded.image, stock=excluded.stock, active=excluded.active`);
  seedProducts.forEach(p => stmt.run([p.id,p.name,p.price,p.category,p.image,p.stock,p.active]));
  stmt.finalize();
});

app.use(express.json({limit:'8mb'}));
app.use(express.static(path.join(__dirname, 'public')));

function adminAuth(req,res,next){
  const auth=req.headers.authorization||'';
  const [type,token]=auth.split(' ');
  if(type!=='Basic'||!token) return res.status(401).set('WWW-Authenticate','Basic').send('Login necessário');
  const [u,p]=Buffer.from(token,'base64').toString().split(':');
  if(u===(process.env.ADMIN_USER||'admin') && p===(process.env.ADMIN_PASSWORD||'123456')) return next();
  return res.status(401).send('Acesso negado');
}
const all=(sql,params=[])=>new Promise((ok,fail)=>db.all(sql,params,(e,r)=>e?fail(e):ok(r)));
const get=(sql,params=[])=>new Promise((ok,fail)=>db.get(sql,params,(e,r)=>e?fail(e):ok(r)));
const run=(sql,params=[])=>new Promise((ok,fail)=>db.run(sql,params,function(e){e?fail(e):ok(this)}));

app.get('/api/products', async (req,res)=>{
  const rows = await all('SELECT * FROM products WHERE active=1 ORDER BY category,name');
  res.json(rows);
});
app.get('/api/admin/products', adminAuth, async (req,res)=> res.json(await all('SELECT * FROM products ORDER BY created_at DESC')));
app.post('/api/admin/products', adminAuth, async (req,res)=>{
  const p=req.body; if(!p.name||!p.price||!p.category||!p.image) return res.status(400).json({error:'Produto incompleto'});
  const id=(p.id||p.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')+'-'+Date.now().toString().slice(-4);
  await run('INSERT INTO products(id,name,price,category,image,stock,active) VALUES(?,?,?,?,?,?,?)',[id,p.name,Number(p.price),p.category,p.image,Number(p.stock||0),p.active?1:0]);
  res.json({ok:true,id});
});
app.patch('/api/admin/products/:id', adminAuth, async (req,res)=>{
  const p=req.body;
  await run('UPDATE products SET name=?, price=?, category=?, image=?, stock=?, active=? WHERE id=?',[p.name,Number(p.price),p.category,p.image,Number(p.stock||0),p.active?1:0,req.params.id]);
  res.json({ok:true});
});

app.post('/api/orders', async (req,res)=>{
  try{
    const {customer,items,subtotal,payment_method,delivery_method,notes}=req.body;
    if(!customer?.name||!customer?.phone||!Array.isArray(items)||!items.length) return res.status(400).json({error:'Dados incompletos'});
    const id=uuidv4().slice(0,8).toUpperCase();
    await run(`INSERT INTO orders(id,customer_name,phone,email,address,payment_method,delivery_method,items_json,subtotal,notes) VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [id,customer.name,customer.phone,customer.email||'',customer.address||'',payment_method||'',delivery_method||'',JSON.stringify(items),Number(subtotal||0),notes||'']);
    for(const item of items){ await run('UPDATE products SET stock = MAX(stock - ?, 0) WHERE id=?',[Number(item.qty||1),item.id]); }
    res.json({ok:true,id,whatsapp:`https://wa.me/5581983649142?text=${encodeURIComponent('Olá! Fiz um pedido no site Favela Imports PE. Código: '+id)}`});
  }catch(err){ res.status(500).json({error:'Erro ao salvar pedido'}); }
});

app.get('/api/orders/:id', async (req,res)=>{
  const row = await get('SELECT id, customer_name, subtotal, status, created_at FROM orders WHERE id=?',[String(req.params.id).toUpperCase()]);
  if(!row) return res.status(404).json({error:'Pedido não encontrado'});
  res.json(row);
});
app.get('/api/admin/orders',adminAuth,async (req,res)=>res.json((await all('SELECT * FROM orders ORDER BY created_at DESC')).map(r=>({...r,items:JSON.parse(r.items_json||'[]')}))));
app.patch('/api/admin/orders/:id',adminAuth,async (req,res)=>{ await run('UPDATE orders SET status=? WHERE id=?',[req.body.status||'novo',req.params.id]); res.json({ok:true}); });

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`Favela Imports PE rodando em http://localhost:${PORT}`));
