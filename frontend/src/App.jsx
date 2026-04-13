import React, { useEffect, useState } from 'react';

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    // Look for ?email=... and ?token=... in the URL
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const token = params.get('token');

    if (email && token) {
      setIsUnlocked(true);
      setUserEmail(email);
      // Optional: Save to local storage so they stay logged in
      localStorage.setItem('isPremium', 'true');
    } else if (localStorage.getItem('isPremium') === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  if (!isUnlocked) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1>Chargeback Defender AI</h1>
        <p>Please purchase access on Nas.io to continue.</p>
        <a href="https://nas.io/your-community-link" target="_blank">Upgrade to Premium</a>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {userEmail || "Premium Member"}</h1>
      <p>Your AI Chargeback tools are now active.</p>
      {/* Your actual tool components go here */}
    </div>
  );
}

export default App;