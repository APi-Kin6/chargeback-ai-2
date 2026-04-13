import React, { useEffect, useState } from 'react';

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const token = params.get('token');

    // If Nas.io sent them here, or they were already logged in
    if ((email && token) || localStorage.getItem('isPremium') === 'true') {
      setIsUnlocked(true);
      if (email) {
          setUserEmail(email);
          localStorage.setItem('isPremium', 'true');
          localStorage.setItem('userEmail', email);
      } else {
          setUserEmail(localStorage.getItem('userEmail') || "Member");
      }
    }
  }, []);

  // ── SCREEN 1: LOCKED (PAYWALL) ──
  if (!isUnlocked) {
    return (
      <div style={{ backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <h1>Chargeback Defender AI</h1>
        <p>Access Restricted. Please purchase on Nas.io.</p>
        <a href="https://nas.io/your-community" style={{ color: '#00ff00', textDecoration: 'none', border: '1px solid #00ff00', padding: '10px 20px', borderRadius: '5px' }}>
          Upgrade to Premium
        </a>
      </div>
    );
  }

  // ── SCREEN 2: UNLOCKED (YOUR ACTUAL PRODUCT) ──
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ borderBottom: '1px solid #eee', marginBottom: '20px' }}>
        <h2>Chargeback Defender: Dashboard</h2>
        <p>Logged in as: <strong>{userEmail}</strong></p>
      </header>

      <section>
        <h3>AI Dispute Generator</h3>
        <p>Paste the transaction details below to generate your defense letter.</p>
        
        {/* THIS IS WHERE YOUR ACTUAL TOOL GOES */}
        <textarea 
          placeholder="Paste chargeback reason here..." 
          style={{ width: '100%', height: '150px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <br />
        <button style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#000', color: '#fff', borderRadius: '5px', cursor: 'pointer' }}>
          Generate Response
        </button>
      </section>

      <footer style={{ marginTop: '50px', fontSize: '12px', color: '#888' }}>
        Premium Member Access | Ecofertile Tech
      </footer>
    </div>
  );
}

export default App;