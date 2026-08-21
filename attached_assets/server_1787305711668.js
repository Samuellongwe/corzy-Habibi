require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const { z } = require('zod');

const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || './data/cozy.db';
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be set and at least 32 characters long.');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL, price INTEGER NOT NULL CHECK(price>=0), image TEXT, description TEXT, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, order_number TEXT UNIQUE NOT NULL, table_number TEXT, customer_name TEXT, customer_phone TEXT, status TEXT NOT NULL DEFAULT 'pending', total INTEGER NOT NULL, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id INTEGER, name TEXT NOT NULL, price INTEGER NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0));
CREATE TABLE IF NOT EXISTS reservations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, guests INTEGER NOT NULL CHECK(guests BETWEEN 1 AND 20), status TEXT NOT NULL DEFAULT 'requested', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS loyalty_members (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL, points INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);

const seed = [
 ['Chicken Zinger Strips','International',185,'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80','Crispy, seasoned chicken strips.'],
 ['Cheeseburger','International',240,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80','Stacked, toasted and loaded.'],
 ['Hummus','Lebanese Fusion',120,'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=800&q=80','Creamy chickpea classic with warmth.'],
 ['Lebanese Grill','Lebanese Fusion',320,'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80','A generous plate for serious cravings.'],
 ['Sushi Selection','Sushi',280,'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80','Fresh Japanese-inspired favourites.'],
 ['Caterpillar Roll','Sushi',260,'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80','Crispy, creamy and finished with avocado.'],
 ['Morning Bun','Breakfast',160,'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80','Golden egg, cheddar and breakfast comfort.'],
 ['Grain & Egg Bowl','Breakfast',170,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80','Fresh, filling and full of colour.'],
 ['Lotus Waffle','Dessert',150,'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80','Crispy waffle, ice cream and indulgence.'],
 ['Cheesecake Crepe','Dessert',170,'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80','A dessert worth coming back for.'],
 ['Watermelon Fresh','International',90,'https://images.unsplash.com/photo-1563114773-84221bd62daa?auto=format&fit=crop&w=800&q=80','Fresh and refreshing.'],
 ['Arabic Coffee','Breakfast',80,'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80','A warm finish to your morning.']
];
if (db.prepare('SELECT COUNT(*) c FROM products').get().c === 0) {
 const s=db.prepare('INSERT INTO products(name,category,price,image,description) VALUES(?,?,?,?,?)'); const tx=db.transaction(()=>seed.forEach(x=>s.run(...x))); tx();
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use('/api/auth', rateLimit({ windowMs: 15*60*1000, limit: 20, standardHeaders: true, legacyHeaders: false }));
app.use('/api', rateLimit({ windowMs: 60*1000, limit: 120, standardHeaders: true, legacyHeaders: false }));

const orderSchema=z.object({tableNumber:z.string().max(20).optional().nullable(),customerName:z.string().max(100).optional().nullable(),customerPhone:z.string().max(30).optional().nullable(),notes:z.string().max(500).optional().nullable(),items:z.array(z.object({productId:z.number().int().positive(),quantity:z.number().int().min(1).max(50)})).min(1).max(50)});
const reservationSchema=z.object({name:z.string().min(2).max(100),phone:z.string().min(5).max(30),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),time:z.string().regex(/^\d{2}:\d{2}$/),guests:z.number().int().min(1).max(20)});
const memberSchema=z.object({name:z.string().min(2).max(100),phone:z.string().min(5).max(30)});

function auth(req,res,next){try{const h=req.headers.authorization||''; if(!h.startsWith('Bearer ')) throw new Error(); req.admin=jwt.verify(h.slice(7),JWT_SECRET); next();}catch{return res.status(401).json({error:'Authentication required'});}}
function orderNo(){return `CZ-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;}

app.get('/api/health',(req,res)=>res.json({ok:true,service:'cozy-ordering',time:new Date().toISOString()}));
app.get('/api/menu',(req,res)=>res.json({items:db.prepare('SELECT id,name,category,price,image,description FROM products WHERE active=1 ORDER BY category,name').all()}));
app.post('/api/auth/login',async(req,res)=>{const username=String(req.body.username||'');const password=String(req.body.password||'');const admin=db.prepare('SELECT * FROM admins WHERE username=?').get(username);if(!admin||!(await bcrypt.compare(password,admin.password_hash))) return res.status(401).json({error:'Invalid credentials'});res.json({token:jwt.sign({id:admin.id,username:admin.username},JWT_SECRET,{expiresIn:'8h'})});});

app.post('/api/orders',(req,res)=>{const parsed=orderSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid order',details:parsed.error.flatten()});const {items,...meta}=parsed.data;const ids=items.map(i=>i.productId);const placeholders=ids.map(()=>'?').join(',');const products=db.prepare(`SELECT id,name,price FROM products WHERE active=1 AND id IN (${placeholders})`).all(...ids);if(products.length!==new Set(ids).size)return res.status(400).json({error:'One or more menu items are unavailable'});const byId=new Map(products.map(p=>[p.id,p]));let total=0;const normalized=items.map(i=>{const p=byId.get(i.productId);total+=p.price*i.quantity;return {...i,name:p.name,price:p.price};});const number=orderNo();const tx=db.transaction(()=>{const o=db.prepare('INSERT INTO orders(order_number,table_number,customer_name,customer_phone,total,notes) VALUES(?,?,?,?,?,?)').run(number,meta.tableNumber||null,meta.customerName||null,meta.customerPhone||null,total,meta.notes||null);const s=db.prepare('INSERT INTO order_items(order_id,product_id,name,price,quantity) VALUES(?,?,?,?,?)');normalized.forEach(i=>s.run(o.lastInsertRowid,i.productId,i.name,i.price,i.quantity));return o.lastInsertRowid;});const id=tx();res.status(201).json({id,orderNumber:number,total,status:'pending'});});
app.get('/api/orders',auth,(req,res)=>res.json(db.prepare(`SELECT o.*, (SELECT json_group_array(json_object('name',oi.name,'price',oi.price,'quantity',oi.quantity)) FROM order_items oi WHERE oi.order_id=o.id) items FROM orders o ORDER BY o.created_at DESC LIMIT 200`).all().map(o=>({...o,items:JSON.parse(o.items)}))));
app.patch('/api/orders/:id/status',auth,(req,res)=>{const allowed=['pending','confirmed','preparing','ready','completed','cancelled'];if(!allowed.includes(req.body.status))return res.status(400).json({error:'Invalid status'});const r=db.prepare('UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.status,req.params.id);if(!r.changes)return res.status(404).json({error:'Order not found'});res.json({ok:true});});

app.post('/api/reservations',(req,res)=>{const p=reservationSchema.safeParse(req.body);if(!p.success)return res.status(400).json({error:'Invalid reservation',details:p.error.flatten()});const r=db.prepare('INSERT INTO reservations(name,phone,date,time,guests) VALUES(?,?,?,?,?)').run(p.data.name,p.data.phone,p.data.date,p.data.time,p.data.guests);res.status(201).json({id:r.lastInsertRowid,status:'requested'});});
app.get('/api/reservations',auth,(req,res)=>res.json(db.prepare('SELECT * FROM reservations ORDER BY date,time DESC LIMIT 200').all()));
app.patch('/api/reservations/:id/status',auth,(req,res)=>{const allowed=['requested','confirmed','seated','completed','cancelled'];if(!allowed.includes(req.body.status))return res.status(400).json({error:'Invalid status'});const r=db.prepare('UPDATE reservations SET status=? WHERE id=?').run(req.body.status,req.params.id);if(!r.changes)return res.status(404).json({error:'Reservation not found'});res.json({ok:true});});

app.post('/api/loyalty/join',(req,res)=>{const p=memberSchema.safeParse(req.body);if(!p.success)return res.status(400).json({error:'Invalid member details'});try{const r=db.prepare('INSERT INTO loyalty_members(name,phone) VALUES(?,?)').run(p.data.name,p.data.phone);res.status(201).json({id:r.lastInsertRowid,points:0});}catch{return res.status(409).json({error:'A member with that phone number already exists'});}});
app.get('/api/loyalty',auth,(req,res)=>res.json(db.prepare('SELECT id,name,phone,points,created_at FROM loyalty_members ORDER BY created_at DESC').all()));

app.get('/api/admin/stats',auth,(req,res)=>res.json({orders:db.prepare('SELECT COUNT(*) c FROM orders').get().c,pendingOrders:db.prepare("SELECT COUNT(*) c FROM orders WHERE status IN ('pending','confirmed','preparing')").get().c,reservations:db.prepare("SELECT COUNT(*) c FROM reservations WHERE status IN ('requested','confirmed')").get().c,members:db.prepare('SELECT COUNT(*) c FROM loyalty_members').get().c,revenue:db.prepare("SELECT COALESCE(SUM(total),0) v FROM orders WHERE status='completed'").get().v}));

app.use(express.static(path.join(__dirname,'public'),{extensions:['html']}));
app.get('/admin',authGuardHtml,(req,res)=>res.sendFile(path.join(__dirname,'public','admin.html')));
function authGuardHtml(req,res,next){res.sendFile(path.join(__dirname,'public','admin.html'));}
app.use((req,res,next)=>res.status(404).json({error:'Not found'}));
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Internal server error'});});

app.listen(PORT,()=>console.log(`Cozy production server listening on http://localhost:${PORT}`));
