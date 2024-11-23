// pages/index.tsx
import { useEffect, useState } from 'react';

const Home = () => {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const fetchMessage = async () => {
      const response = await fetch('/api/hello');
      const data = await response.json();
      setMessage(data.message);
    };
    
    fetchMessage();
  }, []);

  return (
    <div>
      <h1>Welcome to the Next.js App!</h1>
      <p>{message}</p>
    </div>
  );
};

export default Home;
