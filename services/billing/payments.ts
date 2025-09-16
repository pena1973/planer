
// services/payments.ts
export async function createCheckoutSession(
  amount: number,  
  userId: number,
  teamId: number,
  token: string,
  t: (key: string) => string,
  setMessage: (msg: string) => void,  
) {
  const res = await fetch('/api/payments/create-checkout', {
    method: 'POST',
    headers: new Headers({
      'Authorization': 'Basic ' + token,
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({
      amount: amount,
      userId: userId,
      teamId: teamId,      
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ redirectUrl: string }>;
}
