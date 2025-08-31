// components/auth/SendCodeForm.tsx
import React from 'react';
export function SendCodeForm({ purpose }: { purpose: 'signup'|'password_reset' }) {
  const [email, setEmail] = React.useState(''); const [cooldown, setCd] = React.useState(0);
  React.useEffect(()=>{ if(!cooldown) return; const id=setInterval(()=>setCd(c=>c-1),1000); return ()=>clearInterval(id)},[cooldown]);
  const submit = async (e:React.FormEvent)=>{ e.preventDefault();
    const r = await fetch('/api/auth/send-code',{method:'POST',headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, purpose })}).then(r=>r.json());
    if (r?.cooldownSec) setCd(r.cooldownSec);
    alert('Если e-mail существует — мы отправили код.');
  };
  return (
    <form onSubmit={submit}>
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail" required />
      <button disabled={cooldown>0}>{cooldown>0?`Повторно через ${cooldown}s`:'Отправить код'}</button>
    </form>
  );
}
// export function SendCodeForm({ purpose }:{ purpose:'signup'|'password_reset' }) {
//   const [email,setEmail]=React.useState(''); const [cd,setCd]=React.useState(0);
//   React.useEffect(()=>{ if(!cd) return; const id=setInterval(()=>setCd(c=>c-1),1000); return()=>clearInterval(id);},[cd]);
//   const submit=async(e)=>{e.preventDefault();
//     const r=await fetch('/api/auth/send-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,purpose})}).then(r=>r.json());
//     if(r?.cooldownSec) setCd(r.cooldownSec);
//     alert('Если e-mail существует — код отправлен.');
//   };
//   return (<form onSubmit={submit}>
//     <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail"/>
//     <button disabled={cd>0}>{cd?`Повторно через ${cd}s`:'Отправить код'}</button>
//   </form>);
// }
