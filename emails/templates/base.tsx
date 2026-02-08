import * as React from 'react';

interface BaseEmailProps {
  children: React.ReactNode;
  preview?: string;
}

export const BaseEmail = ({ children, preview }: BaseEmailProps) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      {preview && <meta name="description" content={preview} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0;
          padding: 0;
          background-color: #0a0a0a;
          color: #ffffff;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #0a0a0a;
        }
        
        .header {
          padding: 40px 20px;
          text-align: center;
          border-bottom: 1px solid #1a1a1a;
        }
        
        .logo-container {
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-dots {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .logo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .brand-name {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        
        .content {
          padding: 40px 20px;
        }
        
        .footer {
          padding: 40px 20px;
          border-top: 1px solid #1a1a1a;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        
        .footer a {
          color: #888;
          text-decoration: none;
        }
        
        .footer a:hover {
          color: #fff;
        }
        
        .button {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s;
        }
        
        .button:hover {
          transform: translateY(-2px);
        }
        
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #1a1a1a, transparent);
          margin: 30px 0;
        }
        
        .pillar-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          margin: 4px;
        }
        
        .pillar-cognition { background: rgba(139, 92, 246, 0.2); color: #8B5CF6; border: 1px solid rgba(139, 92, 246, 0.3); }
        .pillar-recovery { background: rgba(6, 182, 212, 0.2); color: #06B6D4; border: 1px solid rgba(6, 182, 212, 0.3); }
        .pillar-fueling { background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .pillar-mental { background: rgba(236, 72, 153, 0.2); color: #EC4899; border: 1px solid rgba(236, 72, 153, 0.3); }
        .pillar-physicality { background: rgba(245, 158, 11, 0.2); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3); }
        .pillar-finance { background: rgba(234, 179, 8, 0.2); color: #EAB308; border: 1px solid rgba(234, 179, 8, 0.3); }
      `}</style>
    </head>
    <body>
      <div className="container">
        <div className="header">
          <div className="logo-container">
            <div className="logo-dots">
              <div className="logo-dot" style={{ backgroundColor: '#8B5CF6' }}></div>
              <div className="logo-dot" style={{ backgroundColor: '#06B6D4' }}></div>
              <div className="logo-dot" style={{ backgroundColor: '#10B981' }}></div>
              <div className="logo-dot" style={{ backgroundColor: '#EC4899' }}></div>
              <div className="logo-dot" style={{ backgroundColor: '#F59E0B' }}></div>
              <div className="logo-dot" style={{ backgroundColor: '#EAB308' }}></div>
            </div>
            <span className="brand-name">Liberture</span>
          </div>
        </div>
        
        <div className="content">
          {children}
        </div>
        
        <div className="footer">
          <p style={{ marginBottom: '12px' }}>
            © 2026 Liberture. Master your biology. Unlock your potential.
          </p>
          <p style={{ marginBottom: '20px' }}>
            <a href="https://liberture.com">Website</a> · 
            <a href="https://liberture.com/marketplace"> Marketplace</a> · 
            <a href="https://liberture.com/knowledge"> Knowledge</a> · 
            <a href="https://liberture.com/about"> About</a>
          </p>
          <p style={{ fontSize: '12px', color: '#444' }}>
            <a href="{{unsubscribeUrl}}">Unsubscribe</a> · 
            <a href="https://liberture.com/dashboard/settings"> Notification Settings</a>
          </p>
        </div>
      </div>
    </body>
  </html>
);
