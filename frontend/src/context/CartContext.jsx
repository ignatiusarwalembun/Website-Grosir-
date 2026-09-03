import { createContext, useContext, useMemo, useState } from 'react';
const CartContext = createContext(null);
const readCart = () => { try { return JSON.parse(localStorage.getItem('grosirhub-cart')) || []; } catch { return []; } };
export function CartProvider({ children }) {
  const [items,setItems] = useState(readCart);
  const save = next => { setItems(next); localStorage.setItem('grosirhub-cart', JSON.stringify(next)); };
  const add = (product, qty=1) => {
    const existing = items.find(i => i.id === product.id);
    save(existing ? items.map(i => i.id===product.id ? {...i, quantity:i.quantity+qty} : i) : [...items,{...product,quantity:qty}]);
  };
  const update = (id, qty) => save(items.map(i => i.id===id ? {...i,quantity:Math.max(1,qty)} : i));
  const remove = id => save(items.filter(i=>i.id!==id));
  const clear = () => save([]);
  const count = items.reduce((a,b)=>a+b.quantity,0);
  const subtotal = items.reduce((sum,i)=>sum+i.wholesalePrice*i.quantity,0);
  const value = useMemo(()=>({items,add,update,remove,clear,count,subtotal}),[items,count,subtotal]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
