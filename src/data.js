// Demo catalogue (fictional products). Swap for an API/CMS later.
const DESIGNERS = ["Aldric Vane","Noir Atelier","Kōdo","Marlowe & Finch","Steelhouse","Ostra","Vantablack Club","Ruelle","Halden","Sable Park"];
const TYPES = [
 // [name, category, sub, base price, shape, sizes]
 ["Wool Overcoat","Clothing","Outerwear",1190,"coat","clo"],
 ["Leather Biker Jacket","Clothing","Outerwear",1850,"jacket","clo"],
 ["Quilted Bomber","Clothing","Outerwear",640,"jacket","clo"],
 ["Heavyweight Hoodie","Streetwear","Hoodies",260,"hoodie","clo"],
 ["Box Logo Tee","Streetwear","T-Shirts",85,"tee","clo"],
 ["Oversized Graphic Tee","Streetwear","T-Shirts",110,"tee","clo"],
 ["Cargo Trousers","Streetwear","Pants",340,"pants","waist"],
 ["Raw Selvedge Denim","Clothing","Denim",290,"pants","waist"],
 ["Pleated Wool Trousers","Clothing","Pants",420,"pants","waist"],
 ["Cashmere Crewneck","Clothing","Knitwear",560,"hoodie","clo"],
 ["Oxford Shirt","Clothing","Shirts",235,"tee","clo"],
 ["Single-Breasted Blazer","Clothing","Tailoring",980,"coat","clo"],
 ["Leather Chelsea Boot","Shoes","Boots",720,"boot","shoe"],
 ["Chunky Runner Sneaker","Shoes","Sneakers",410,"shoe","shoe"],
 ["Court Low Sneaker","Shoes","Sneakers",295,"shoe","shoe"],
 ["Penny Loafer","Shoes","Loafers",530,"shoe","shoe"],
 ["Leather Belt","Accessories","Belts",190,"belt","one"],
 ["Wool Beanie","Streetwear","Hats",70,"cap","one"],
 ["Five-Panel Cap","Streetwear","Hats",65,"cap","one"],
 ["Nylon Crossbody Bag","Accessories","Bags",380,"bag","one"],
 ["Leather Cardholder","Accessories","Small Goods",150,"bag","one"],
 ["Silk Twill Scarf","Accessories","Scarves",220,"belt","one"],
];
const COLORS = [["Black","#111"],["Bone","#e8e4da"],["Navy","#1c2a44"],["Olive","#58603f"],["Camel","#b58a58"],["Grey","#8a8d90"],["Burgundy","#5a1f2b"]];
const SIZES = {clo:["XS","S","M","L","XL","XXL"],waist:["28","30","32","34","36","38"],shoe:["40","41","42","43","44","45","46"],one:["OS"]};

// deterministic pseudo-random so catalogue is stable
let _s=7; const rnd=()=> (_s=(_s*16807)%2147483647)/2147483647;
const PRODUCTS = [];
TYPES.forEach((t,ti)=>{
  for(let k=0;k<3;k++){
    const d=DESIGNERS[Math.floor(rnd()*DESIGNERS.length)];
    const c=COLORS[Math.floor(rnd()*COLORS.length)];
    const price=Math.round(t[3]*(0.85+rnd()*0.4)/5)*5;
    const sale=rnd()<0.28;
    const sizes=SIZES[t[5]].filter(()=>rnd()>0.12);
    PRODUCTS.push({
      id:PRODUCTS.length+1, designer:d, name:t[0], cat:t[1], sub:t[2], shape:t[4],
      color:c[0], hex:c[1], price, was: sale? Math.round(price/0.7/5)*5 : null,
      sizes: sizes.length?sizes:SIZES[t[5]], isNew: rnd()<0.35, added: ti*3+k,
      desc:`${t[0]} by ${d}. Crafted in ${c[0].toLowerCase()} with a considered, modern men's fit. Made in Italy/Portugal/Japan. Model is 6'1" and wears size ${SIZES[t[5]][2]||"OS"}.`
    });
  }
});
