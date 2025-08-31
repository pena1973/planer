// components/auth/VerifyCodeForm.tsx
import React from 'react';
export function VerifyCodeForm({ purpose, onVerified }:{
  purpose: 'signup'|'password_reset',
  onVerified: (verifyToken: string)=>void
}) {
  const [email,setEmail] = React.useState(''); const [code,setCode] = React.useState(''); const [err,setErr]=React.useState('');
  const submit = async (e:React.FormEvent)=>{ e.preventDefault(); setErr('');
    const r = await fetch('/api/auth/verify-code',{method:'POST',headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, purpose, code })}).then(r=>r.json());
    if (r?.ok) onVerified(r.verifyToken); else setErr('Код неверен или истёк.');
  };
  return (
    <form onSubmit={submit}>
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail" required />
      <input type="text" value={code} onChange={e=>setCode(e.target.value)} placeholder="6-значный код" inputMode="numeric" pattern="\d{6}" required />
      <button>Подтвердить</button>
      {err && <p>{err}</p>}
    </form>
  );
}

// export function VerifyCodeForm({ purpose, onVerified }:{ purpose:'signup'|'password_reset', onVerified:(token:string)=>void }) {
//   const [email,setEmail]=React.useState(''); const [code,setCode]=React.useState(''); const [err,setErr]=React.useState('');
//   const submit=async(e)=>{e.preventDefault(); setErr('');
//     const r=await fetch('/api/auth/verify-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,purpose,code})}).then(r=>r.json());
//     if(r?.ok) onVerified(r.verifyToken); else setErr('Код неверный или истёк.');
//   };
//   return (<form onSubmit={submit}>
//     <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail"/>
//     <input type="text" required inputMode="numeric" pattern="\d{6}" value={code} onChange={e=>setCode(e.target.value)} placeholder="6-значный код"/>
//     <button>Подтвердить</button>{err && <p>{err}</p>}
//   </form>);
// }
