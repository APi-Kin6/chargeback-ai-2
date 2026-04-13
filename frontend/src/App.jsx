import React, { useEffect, useState } from 'react';

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    platform: "Stripe",
    region: "United States",
    reasonCode: "",
    claimDetails: "",
    pastSuccessContext: "",
    evidenceLinks: ""
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const token = params.get('token');
    const savedAccess = localStorage.getItem('chargeback_premium');

    if ((email && token) || savedAccess === 'true') {
      setIsUnlocked(true);
      if (email) {
        setUserEmail(email);
        localStorage.setItem('chargeback_premium', 'true');
        localStorage.setItem('chargeback_email', email);
      } else {
        setUserEmail(localStorage.getItem('chargeback_email') || "Pro Member");
      }
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateDefense = async () => {
    if (!formData.claimDetails) return alert("Please provide the claim details.");
    setLoading(true);
    
    try {
      const response = await fetch('https://chargeback-api.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, email: userEmail })
      });
      const data = await response.json();
      setAiResponse(data.letter || "AI generation failed. Ensure your backend API is fully deployed.");
    } catch (error) {
      setAiResponse("Backend Connection Error. Please ensure the 'chargeback-api' is live on Render.");
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div style={{ backgroundColor: '#0f172a', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <h1>🛡️ Chargeback Defender AI</h1>
        <p>Access Restricted. Please purchase on Nas.io.</p>
        <a href="https://nas.io/your-link" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none' }}>Upgrade to Premium</a>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Navigation */}
      <nav style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>🛡️ Chargeback Defender <span style={{color: '#60a5fa'}}>PREMIUM</span></span>
        <div style={{ fontSize: '0.85rem' }}>User: {userEmail}</div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '30px auto', display: 'grid', gridTemplateColumns: '450px 1fr', gap: '25px', padding: '0 20px' }}>
        
        {/* LEFT COLUMN: LEGAL INTAKE FORM */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b' }}>Case Parameters</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={labelStyle}>Platform</label>
              <select name="platform" value={formData.platform} onChange={handleInputChange} style={inputStyle}>
                <option>Stripe</option>
                <option>PayPal</option>
                <option>Shopify Payments</option>
                <option>Adyen</option>
                <option>Square</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Jurisdiction/Region</label>
              <select name="region" value={formData.region} onChange={handleInputChange} style={inputStyle}>
                <option>United States (UCC)</option>
                <option>United Kingdom (CRA)</option>
                <option>European Union (GDPR/PSD2)</option>
                <option>Australia (ACL)</option>
                <option>Global/Other</option>
              </select>
            </div>
          </div>

          <label style={labelStyle}>Reason Code (e.g., 10.4, Service Not Rendered)</label>
          <input name="reasonCode" value={formData.reasonCode} onChange={handleInputChange} placeholder="Reason Code" style={inputStyle} />

          <label style={labelStyle}>Full Claim Details & Customer Argument</label>
          <textarea name="claimDetails" value={formData.claimDetails} onChange={handleInputChange} placeholder="Paste exactly what the customer or bank said..." style={{ ...inputStyle, height: '120px', resize: 'none' }} />

          <label style={labelStyle}>Past Precedents / Winning Arguments</label>
          <textarea name="pastSuccessContext" value={formData.pastSuccessContext} onChange={handleInputChange} placeholder="e.g., Previously won by showing IP address matches billing..." style={{ ...inputStyle, height: '80px', resize: 'none' }} />

          <button 
            onClick={generateDefense} 
            disabled={loading}
            style={{ width: '100%', marginTop: '15px', backgroundColor: loading ? '#94a3b8' : '#2563eb', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
          >
            {loading ? "Analyzing Policy & Drafting..." : "Generate Custom Response"}
          </button>
        </div>

        {/* RIGHT COLUMN: AI RESPONSE & PREVIEW */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', flexGrow: 1, minHeight: '500px' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>Drafted Defense Letter</h3>
            <div style={{ backgroundColor: '#fdfdfd', border: '1px solid #cbd5e1', padding: '20px', borderRadius: '8px', minHeight: '400px', whiteSpace: 'pre-wrap', color: '#334155', lineHeight: '1.6', fontSize: '0.95rem' }}>
              {aiResponse || "Once you fill the parameters and click generate, your tailored legal defense will appear here."}
            </div>
            {aiResponse && (
              <button 
                onClick={() => { navigator.clipboard.writeText(aiResponse); alert("Copied to clipboard!"); }}
                style={{ marginTop: '15px', width: '100%', padding: '10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                📋 Copy Professional Draft
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Styles
const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px', marginTop: '10px', textTransform: 'uppercase' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' };

export default App;