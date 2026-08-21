const products=[
{name:"Chicken Zinger Strips",cat:"International",price:185,img:"https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",desc:"Crispy, seasoned chicken strips."},
{name:"Cheeseburger",cat:"International",price:240,img:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",desc:"Stacked, toasted and loaded."},
{name:"Hummus",cat:"Lebanese Fusion",price:120,img:"https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=800&q=80",desc:"Creamy chickpea classic with warmth."},
{name:"Lebanese Grill",cat:"Lebanese Fusion",price:320,img:"https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",desc:"A generous plate for serious cravings."},
{name:"Sushi Selection",cat:"Sushi",price:280,img:"https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",desc:"Fresh Japanese-inspired favourites."},
{name:"Caterpillar Roll",cat:"Sushi",price:260,img:"https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80",desc:"Crispy, creamy and finished with avocado."},
{name:"Morning Bun",cat:"Breakfast",price:160,img:"https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",desc:"Golden egg, cheddar and breakfast comfort."},
{name:"Grain & Egg Bowl",cat:"Breakfast",price:170,img:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",desc:"Fresh, filling and full of colour."},
{name:"Lotus Waffle",cat:"Dessert",price:150,img:"https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80",desc:"Crispy waffle, ice cream and indulgence."},
{name:"Cheesecake Crepe",cat:"Dessert",price:170,img:"https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80",desc:"A dessert worth coming back for."},
{name:"Watermelon Fresh",cat:"International",price:90,img:"https://images.unsplash.com/photo-1563114773-84221bd62daa?auto=format&fit=crop&w=800&q=80",desc:"Fresh and refreshing."},
{name:"Arabic Coffee",cat:"Breakfast",price:80,img:"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",desc:"A warm finish to your morning."}
];
let cart=JSON.parse(localStorage.getItem("cozyCart")||"[]");
const grid=document.getElementById("menuGrid");
function renderMenu(cat="all"){
 grid.innerHTML=products.filter(p=>cat==="all"||p.cat===cat).map((p,i)=>`<article class="food-card"><div class="food-img" style="background-image:url('${p.img}')"></div><div class="food-info"><small>${p.cat.toUpperCase()}</small><h3>${p.name}</h3><p>${p.desc}</p><div class="food-bottom"><span class="price">K${p.price}</span><button class="add" onclick="addToCart(${products.indexOf(p)})">+</button></div></div></article>`).join("");
}
function addToCart(i){const p=products[i];const x=cart.find(a=>a.name===p.name);x?x.qty++:cart.push({...p,qty:1});save();toast(`${p.name} added to your bag`)}
function save(){localStorage.setItem("cozyCart",JSON.stringify(cart));document.getElementById("cartCount").textContent=cart.reduce((a,b)=>a+b.qty,0);renderCart()}
function renderCart(){
 const el=document.getElementById("cartItems");
 if(!cart.length){el.innerHTML='<p style="color:#777;text-align:center;padding:50px 0">Your bag is empty.<br>Add something delicious.</p>';document.getElementById("cartTotal").textContent="K0";return}
 el.innerHTML=cart.map((p,i)=>`<div class="cart-row"><img src="${p.img}"><div><h4>${p.name}</h4><small>K${p.price} · ${p.cat}</small></div><div class="qty"><button onclick="changeQty(${i},-1)">−</button> ${p.qty} <button onclick="changeQty(${i},1)">+</button></div></div>`).join("");
 document.getElementById("cartTotal").textContent="K"+cart.reduce((a,b)=>a+b.price*b.qty,0);
}
function changeQty(i,n){cart[i].qty+=n;if(cart[i].qty<=0)cart.splice(i,1);save()}
function openCart(){renderCart();document.getElementById("overlay").classList.add("show")}
function closeCart(e){if(!e||e.target===document.getElementById("overlay"))document.getElementById("overlay").classList.remove("show")}
function sendWhatsAppOrder(){
 if(!cart.length)return toast("Add something to your bag first");
 const total=cart.reduce((a,b)=>a+b.price*b.qty,0);
 const lines=cart.map(p=>`${p.qty}x ${p.name} — K${p.price*p.qty}`).join("\n");
 const msg=`Hello Cozy Habibi 👋\n\nI'd like to place an order:\n${lines}\n\nTotal: K${total}\n\nPlease confirm availability and ordering details.`;
 window.open(`https://wa.me/260975939999?text=${encodeURIComponent(msg)}`,"_blank");
}
function simulateTableOrder(){toast("Table 14 demo activated — your next order will be tagged to Table 14")}
function joinClub(){toast("Cozy Club demo — membership flow ready for the live build")}
function scrollToClub(){document.getElementById("club").scrollIntoView({behavior:"smooth"})}
function requestReservation(e){
 e.preventDefault();
 const name=document.getElementById("guestName").value,phone=document.getElementById("guestPhone").value,date=document.getElementById("guestDate").value,time=document.getElementById("guestTime").value,people=document.getElementById("guestPeople").value;
 const msg=`Hello Cozy 👋\n\nI'd like to request a table.\nName: ${name}\nPhone: ${phone}\nDate: ${date}\nTime: ${time}\nGuests: ${people}`;
 window.open(`https://wa.me/260975939999?text=${encodeURIComponent(msg)}`,"_blank");
}
function toast(t){const x=document.getElementById("toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2600)}
document.querySelectorAll("#tabs button").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("#tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderMenu(b.dataset.cat)}));
renderMenu();save();
