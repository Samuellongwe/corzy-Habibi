import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowUpRight, CalendarDays, Check, ChevronRight, CircleCheck, MapPin, Menu as MenuIcon, MessageCircle, Minus, Phone, Plus, QrCode, ShoppingBag, Sparkles, Utensils, X } from 'lucide-react';
import mezzeImage from './assets/cozy-mezze.png';
import sushiImage from './assets/cozy-sushi.png';

type Category = 'Lebanese Fusion' | 'International' | 'Sushi' | 'Breakfast' | 'Dessert';
type Product = { id: string; name: string; category: Category; price: number; description: string; visual: 'mezze' | 'sushi' | 'warm' | 'green'; image?: string };
type CartItem = Product & { quantity: number };

const phoneNumber = '+260975939999';
const categories = ['All', 'Lebanese Fusion', 'International', 'Sushi', 'Breakfast', 'Dessert'] as const;

const products: Product[] = [
  { id: 'chicken-zinger', name: 'Chicken Zinger Strips', category: 'International', price: 185, description: 'Crisp, seasoned and made for sharing.', visual: 'warm', image: mezzeImage },
  { id: 'cheeseburger', name: 'The Cozy Cheeseburger', category: 'International', price: 240, description: 'Stacked, toasted and properly loaded.', visual: 'warm' },
  { id: 'hummus', name: 'Hummus', category: 'Lebanese Fusion', price: 120, description: 'Creamy chickpea classic with olive oil.', visual: 'mezze', image: mezzeImage },
  { id: 'lebanese-grill', name: 'Lebanese Grill', category: 'Lebanese Fusion', price: 320, description: 'A generous plate for serious cravings.', visual: 'mezze', image: mezzeImage },
  { id: 'sushi-selection', name: 'Sushi Selection', category: 'Sushi', price: 280, description: 'Fresh Japanese-inspired favourites.', visual: 'sushi', image: sushiImage },
  { id: 'caterpillar-roll', name: 'Caterpillar Roll', category: 'Sushi', price: 260, description: 'Crisp, creamy and finished with avocado.', visual: 'sushi', image: sushiImage },
  { id: 'morning-bun', name: 'Morning Bun', category: 'Breakfast', price: 160, description: 'Golden egg, cheddar and breakfast comfort.', visual: 'warm' },
  { id: 'grain-egg-bowl', name: 'Grain & Egg Bowl', category: 'Breakfast', price: 170, description: 'Fresh, filling and full of colour.', visual: 'green' },
  { id: 'lotus-waffle', name: 'Lotus Waffle', category: 'Dessert', price: 150, description: 'Crisp waffle, ice cream and indulgence.', visual: 'warm' },
  { id: 'cheesecake-crepe', name: 'Cheesecake Crepe', category: 'Dessert', price: 170, description: 'A dessert worth coming back for.', visual: 'warm' },
  { id: 'watermelon-fresh', name: 'Watermelon Fresh', category: 'International', price: 90, description: 'Cold, bright and refreshing.', visual: 'green' },
  { id: 'arabic-coffee', name: 'Arabic Coffee', category: 'Breakfast', price: 80, description: 'A warm finish to your morning.', visual: 'warm' },
];

function money(value: number) {
  return `K${value.toLocaleString('en-ZM')}`;
}

function openWhatsApp(message: string) {
  window.open(`https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

function Brand() {
  return <a className="brand-lockup" href="#home" aria-label="Cozy Habibi home" data-testid="link-brand"><span className="brand-word">COZY</span><span className="brand-sub">HABIBI</span></a>;
}

function FoodCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  return (
    <article className="food-card" data-testid={`card-product-${product.id}`}>
      <div className={`food-image food-image--${product.visual}`} style={product.image ? { backgroundImage: `url(${product.image})` } : undefined} aria-label={`${product.name} food photograph`} />
      <div className="food-info">
        <div className="food-category">{product.category.toUpperCase()}</div>
        <h3 className="food-name">{product.name}</h3>
        <p className="food-description">{product.description}</p>
        <div className="food-bottom">
          <span className="food-price" data-testid={`text-price-${product.id}`}>{money(product.price)}</span>
          <button className="add-button" type="button" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to bag`} data-testid={`button-add-${product.id}`}><Plus size={16} strokeWidth={1.8} /></button>
        </div>
      </div>
    </article>
  );
}

function App() {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [clubJoined, setClubJoined] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [reservationSent, setReservationSent] = useState(false);
  const [reservation, setReservation] = useState({ name: '', phone: '', date: '', time: '', guests: '2' });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cozyHabibiCart');
      if (saved) setCart(JSON.parse(saved) as CartItem[]);
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cozyHabibiCart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const filteredProducts = useMemo(() => activeCategory === 'All' ? products : products.filter((product) => product.category === activeCategory), [activeCategory]);
  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart]);

  function addToCart(product: Product) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      return found ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }];
    });
    setToastMessage(`${product.name} added to your bag`);
  }

  function changeQuantity(id: string, amount: number) {
    setCart((current) => current.flatMap((item) => {
      if (item.id !== id) return [item];
      const quantity = item.quantity + amount;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }));
  }

  function sendOrder() {
    if (!cart.length) {
      setToastMessage('Your bag is waiting for something delicious.');
      return;
    }
    const lines = cart.map((item) => `${item.quantity}x ${item.name} — ${money(item.price * item.quantity)}`).join('\n');
    openWhatsApp(`Hello Cozy Habibi,\n\nI'd like to place an order:\n${lines}\n\nTotal: ${money(cartTotal)}\n\nPlease confirm availability and ordering details.`);
  }

  function handleReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { name, phone, date, time, guests } = reservation;
    openWhatsApp(`Hello Cozy,\n\nI'd like to request a table.\nName: ${name}\nPhone: ${phone}\nDate: ${date}\nTime: ${time}\nGuests: ${guests}`);
    setReservationSent(true);
    setToastMessage('Your reservation request is ready in WhatsApp.');
  }

  function joinClub() {
    setClubJoined(true);
    setToastMessage('Welcome to Cozy Club. Your first 250 points are on us.');
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileNavOpen(false);
  }

  return (
    <div className="cozy-app" id="home">
      <div className="announcement-bar">WELCOME HABIBI · LAMASAT COMPLEX · MAKENI, LUSAKA</div>
      <header className="site-header">
        <Brand />
        <nav className={`main-nav ${mobileNavOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href="#menu" onClick={() => setMobileNavOpen(false)} data-testid="link-menu">Menu</a>
          <a href="#experience" onClick={() => setMobileNavOpen(false)} data-testid="link-experience">Experience</a>
          <a href="#club" onClick={() => setMobileNavOpen(false)} data-testid="link-club">Cozy Club</a>
          <a href="#contact" onClick={() => setMobileNavOpen(false)} data-testid="link-contact">Contact</a>
        </nav>
        <div className="header-actions">
          <a className="phone-link" href={`tel:${phoneNumber}`} data-testid="link-phone"><Phone size={13} /> +260 97 593 9999</a>
          <button className="bag-trigger" type="button" onClick={() => setCartOpen(true)} data-testid="button-open-bag"><ShoppingBag size={15} /><span>Bag</span><span className="bag-count" data-testid="text-cart-count">{cartCount}</span></button>
          <button className="mobile-menu" type="button" onClick={() => setMobileNavOpen((open) => !open)} aria-label="Toggle navigation" data-testid="button-mobile-menu"><MenuIcon size={22} /></button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">FOOD · HARMONY · LAUGHTER</p>
            <h1>Come for the food.<br /><em>Stay for the feeling.</em></h1>
            <p className="hero-description">Lebanese fusion, global comfort food, sushi and freshly baked moments — served with the kind of warmth that turns dinner into a story.</p>
            <div className="hero-actions">
              <button className="btn btn-primary" type="button" onClick={() => scrollTo('menu')} data-testid="button-explore-menu">Explore the menu <ArrowUpRight size={15} /></button>
              <button className="btn btn-outline" type="button" onClick={() => scrollTo('club')} data-testid="button-join-hero"><Sparkles size={14} /> Join Cozy Club</button>
            </div>
            <div className="hero-facts"><span className="status">Open today</span><span><MapPin size={11} style={{ verticalAlign: 'middle' }} /> Makeni, Lusaka</span><span>09:00 — late</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-note">
              <div className="hero-note-label">TONIGHT'S MOOD</div>
              <div className="hero-note-title">Make tonight worth remembering.</div>
              <button className="text-link" type="button" onClick={() => scrollTo('menu')} data-testid="button-order-hero">Order something good <ChevronRight size={13} style={{ verticalAlign: 'middle' }} /></button>
            </div>
          </div>
        </section>

        <div className="ticker" aria-label="Cuisine categories"><span>LEBANESE FUSION</span><Sparkles className="ticker-dot" size={11} /><span>INTERNATIONAL</span><Sparkles className="ticker-dot" size={11} /><span>SUSHI</span><Sparkles className="ticker-dot" size={11} /><span>BAKERY</span><Sparkles className="ticker-dot" size={11} /><span>LOUNGE AFTER DARK</span></div>

        <section className="section" id="menu">
          <div className="section-head">
            <div><p className="eyebrow">ORDER FROM COZY</p><h2 className="section-title">Your cravings,<br /><em>handled.</em></h2></div>
            <p className="section-note">Choose a category, add your favourites to the bag, then send your order directly to Cozy on WhatsApp. Menu prices shown are demo placeholders.</p>
          </div>
          <div className="category-tabs" role="tablist" aria-label="Menu categories">
            {categories.map((category) => <button className={`category-tab ${activeCategory === category ? 'active' : ''}`} type="button" role="tab" aria-selected={activeCategory === category} onClick={() => setActiveCategory(category)} key={category} data-testid={`button-category-${category.toLowerCase().replaceAll(' ', '-')}`}>{category}</button>)}
          </div>
          <div className="menu-grid">
            {filteredProducts.map((product) => <FoodCard product={product} onAdd={addToCart} key={product.id} />)}
          </div>
          <p className="demo-note">DEMO PRICES ARE PLACEHOLDERS · REPLACE WITH COZY'S APPROVED CURRENT PRICES BEFORE LAUNCH</p>
        </section>

        <section className="feature-band" id="experience">
          <div className="feature-image" aria-label="Sushi at Cozy" />
          <div className="feature-copy">
            <p className="eyebrow">THE FEATURE TO SELL</p>
            <h2 className="section-title">Your table.<br /><em>Your order.</em></h2>
            <p>Put a QR code on every table. Guests scan, browse the menu and send their order without waiting for someone to take it manually.</p>
            <div className="steps"><div className="step"><span className="step-number">01</span><strong>Scan the table QR</strong></div><div className="step"><span className="step-number">02</span><strong>Build your order</strong></div><div className="step"><span className="step-number">03</span><strong>Send it to the kitchen</strong></div></div>
            <button className="btn btn-primary" type="button" onClick={() => setQrOpen(true)} data-testid="button-table-demo"><QrCode size={15} /> Try Table 14 demo <ArrowUpRight size={14} /></button>
          </div>
        </section>

        <section className="club-section" id="club">
          <div><p className="eyebrow">COZY HABIBI CLUB</p><h2 className="club-title">Come back.<br /><em>Get rewarded.</em></h2><p className="club-intro">Every visit can become a reason to come back. Join the club for little extras, first dibs and a table that already knows your name.</p></div>
          <div className="club-card">
            <div className="club-top"><span>COZY CLUB</span><Sparkles size={15} /></div>
            <p>{clubJoined ? 'You are in. The next good thing is already waiting.' : 'Every visit can become a reason to come back.'}</p>
            <div className="points"><strong>{clubJoined ? '250' : '250'}</strong><span>POINTS</span></div>
            <div className="progress"><span /></div>
            <small>{clubJoined ? 'You are 50 points from your next reward' : '50 more points to your next reward'}</small>
            <button className="club-action" type="button" onClick={joinClub} disabled={clubJoined} data-testid="button-join-club">{clubJoined ? <><Check size={14} style={{ verticalAlign: 'middle' }} /> Club member</> : <>Join the Club <ArrowUpRight size={13} style={{ verticalAlign: 'middle' }} /></>}</button>
          </div>
        </section>

        <section className="experience-band">
          <div className="experience-copy">
            <p className="eyebrow">THE COZY EXPERIENCE</p>
            <h2 className="experience-title">Where flavour<br /><em>feels like home.</em></h2>
            <p>From a slow breakfast and fresh bakery treats to a late-night table surrounded by good energy, Cozy brings different cravings under one roof.</p>
            <div className="feature-row"><span>01</span><b>Dining</b><small>Breakfast to dinner</small></div>
            <div className="feature-row"><span>02</span><b>Bakery</b><small>Freshly baked daily</small></div>
            <div className="feature-row"><span>03</span><b>Lounge</b><small>Good vibes after dark</small></div>
          </div>
          <div className="experience-image" aria-label="Cozy restaurant atmosphere" />
        </section>

        <section className="reservation-section" id="contact">
          <div className="reservation-copy">
            <p className="eyebrow">MAKE IT A PLAN</p>
            <h2 className="reservation-title">See you at<br /><em>Cozy.</em></h2>
            <p><MapPin size={14} style={{ verticalAlign: 'middle' }} /> Lamasat Complex, Linda Road, Makeni, Lusaka</p>
            <p><CalendarDays size={14} style={{ verticalAlign: 'middle' }} /> Mon–Thu & Sun: 09:00–22:00<br />Fri–Sat: 09:00–23:00</p>
          </div>
          <form className="reservation-form" onSubmit={handleReservation}>
            <input required value={reservation.name} onChange={(event) => setReservation({ ...reservation, name: event.target.value })} placeholder="Your name" aria-label="Your name" data-testid="input-reservation-name" />
            <input required value={reservation.phone} onChange={(event) => setReservation({ ...reservation, phone: event.target.value })} placeholder="Phone number" aria-label="Phone number" data-testid="input-reservation-phone" />
            <div className="form-two"><input required type="date" value={reservation.date} onChange={(event) => setReservation({ ...reservation, date: event.target.value })} aria-label="Reservation date" data-testid="input-reservation-date" /><input required type="time" value={reservation.time} onChange={(event) => setReservation({ ...reservation, time: event.target.value })} aria-label="Reservation time" data-testid="input-reservation-time" /></div>
            <input required type="number" min="1" max="20" value={reservation.guests} onChange={(event) => setReservation({ ...reservation, guests: event.target.value })} placeholder="Guests" aria-label="Number of guests" data-testid="input-reservation-guests" />
            {reservationSent && <div className="form-feedback" data-testid="status-reservation"><CircleCheck size={14} style={{ verticalAlign: 'middle' }} /> Your request is ready to send in WhatsApp.</div>}
            <button className="btn btn-primary" type="submit" data-testid="button-request-table"><MessageCircle size={15} /> Request a table <ArrowUpRight size={14} /></button>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <Brand /><p className="footer-copy">Where flavour feels like home.</p><a href={`tel:${phoneNumber}`} data-testid="link-footer-phone">+260 97 593 9999</a>
      </footer>

      <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }} role="dialog" aria-modal="true" aria-label="Your bag">
        <aside className="cart-drawer">
          <div className="cart-header"><h2 className="cart-title">Your bag</h2><button className="close-button" type="button" onClick={() => setCartOpen(false)} aria-label="Close bag" data-testid="button-close-bag"><X size={17} /></button></div>
          <div className="cart-items">
            {cart.length ? cart.map((item) => <div className="cart-row" key={item.id} data-testid={`row-cart-${item.id}`}><div className={`cart-row-image food-image--${item.visual}`} style={item.image ? { backgroundImage: `url(${item.image})` } : undefined} /><div><h3 className="cart-row-name">{item.name}</h3><div className="cart-row-meta">{money(item.price)} · {item.category}</div></div><div className="quantity-control"><button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label={`Decrease ${item.name}`} data-testid={`button-decrease-${item.id}`}><Minus size={12} /></button><span data-testid={`text-quantity-${item.id}`}>{item.quantity}</span><button type="button" onClick={() => changeQuantity(item.id, 1)} aria-label={`Increase ${item.name}`} data-testid={`button-increase-${item.id}`}><Plus size={12} /></button></div></div>) : <div className="empty-bag" data-testid="status-empty-bag"><div className="empty-bag-mark"><Utensils size={22} /></div><h4>Nothing in here yet.</h4><p>Your bag is waiting for something delicious.<br />Take a look around and follow your craving.</p></div>}
          </div>
          <div className="cart-bottom"><div className="cart-total"><span>Total</span><strong data-testid="text-cart-total">{money(cartTotal)}</strong></div><button className="btn btn-primary full-width" type="button" onClick={sendOrder} data-testid="button-whatsapp-order"><MessageCircle size={15} /> Order via WhatsApp <ArrowUpRight size={14} /></button><small className="cart-help">Demo ordering flow. Cozy will confirm availability and final details in WhatsApp.</small></div>
        </aside>
      </div>

      {qrOpen && <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setQrOpen(false); }}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="qr-title"><button className="close-button" type="button" onClick={() => setQrOpen(false)} aria-label="Close table demo" data-testid="button-close-qr"><X size={17} /></button><h3 id="qr-title">Table 14 is yours.</h3><p>This demo tags your next bag as a table order — exactly how a guest scan can move from menu to kitchen without the paper shuffle.</p><div className="qr-demo"><span>TABLE 14</span></div><div className="modal-actions"><button className="btn btn-outline" type="button" onClick={() => setQrOpen(false)} data-testid="button-cancel-qr">Not now</button><button className="btn btn-primary" type="button" onClick={() => { setQrOpen(false); setToastMessage('Table 14 demo activated. Your next order is tagged.'); scrollTo('menu'); }} data-testid="button-activate-qr"><Check size={14} /> Activate demo</button></div></div></div>}
      <div className={`toast ${toastMessage ? 'show' : ''}`} role="status" data-testid="status-toast">{toastMessage}</div>
    </div>
  );
}

export default App;
