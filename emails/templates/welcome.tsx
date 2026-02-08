import * as React from 'react';
import { BaseEmail } from './base';

interface WelcomeEmailProps {
  name: string;
  email: string;
}

export const WelcomeEmail = ({ name, email }: WelcomeEmailProps) => (
  <BaseEmail preview={`Welcome to Liberture, ${name}! Start optimizing your biology today.`}>
    <h1 style={{
      fontSize: '32px',
      fontWeight: '700',
      marginBottom: '16px',
      background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }}>
      Welcome to Liberture, {name}! 🎉
    </h1>
    
    <p style={{ fontSize: '18px', color: '#ccc', marginBottom: '30px', lineHeight: '1.6' }}>
      You've just taken the first step toward mastering your biology. Liberture is your unified platform 
      for tracking, optimizing, and unlocking peak performance across all six pillars of health.
    </p>

    <div className="divider"></div>

    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
      Your Six Pillars of Optimization
    </h2>

    <div style={{ marginBottom: '30px' }}>
      <div style={{ 
        padding: '16px', 
        background: 'rgba(139, 92, 246, 0.1)', 
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <strong style={{ color: '#8B5CF6' }}>🧠 Cognition</strong>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#bbb' }}>
          Enhance focus, memory, and mental clarity
        </p>
      </div>

      <div style={{ 
        padding: '16px', 
        background: 'rgba(6, 182, 212, 0.1)', 
        border: '1px solid rgba(6, 182, 212, 0.2)',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <strong style={{ color: '#06B6D4' }}>💤 Recovery</strong>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#bbb' }}>
          Optimize sleep, reduce stress, accelerate healing
        </p>
      </div>

      <div style={{ 
        padding: '16px', 
        background: 'rgba(16, 185, 129, 0.1)', 
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <strong style={{ color: '#10B981' }}>🍽️ Fueling</strong>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#bbb' }}>
          Master nutrition, hydration, and metabolic health
        </p>
      </div>

      <div style={{ 
        padding: '16px', 
        background: 'rgba(236, 72, 153, 0.1)', 
        border: '1px solid rgba(236, 72, 153, 0.2)',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <strong style={{ color: '#EC4899' }}>🧘 Mental</strong>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#bbb' }}>
          Build resilience, emotional intelligence, and inner peace
        </p>
      </div>

      <div style={{ 
        padding: '16px', 
        background: 'rgba(245, 158, 11, 0.1)', 
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <strong style={{ color: '#F59E0B' }}>💪 Physicality</strong>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#bbb' }}>
          Strength, endurance, mobility, and longevity
        </p>
      </div>

      <div style={{ 
        padding: '16px', 
        background: 'rgba(234, 179, 8, 0.1)', 
        border: '1px solid rgba(234, 179, 8, 0.2)',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <strong style={{ color: '#EAB308' }}>💰 Finance</strong>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#bbb' }}>
          Financial sovereignty and freedom to optimize
        </p>
      </div>
    </div>

    <div style={{ textAlign: 'center', margin: '40px 0' }}>
      <a 
        href="https://liberture.com/dashboard" 
        className="button"
        style={{
          display: 'inline-block',
          padding: '14px 28px',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
          color: '#ffffff',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '16px',
        }}
      >
        Go to Dashboard →
      </a>
    </div>

    <div className="divider"></div>

    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
      What's Next?
    </h3>

    <ul style={{ color: '#bbb', lineHeight: '1.8', paddingLeft: '20px' }}>
      <li>Explore our <a href="https://liberture.com/marketplace" style={{ color: '#06B6D4', textDecoration: 'none' }}>Marketplace</a> of protocols</li>
      <li>Browse the <a href="https://liberture.com/knowledge" style={{ color: '#8B5CF6', textDecoration: 'none' }}>Knowledge Base</a> for insights</li>
      <li>Set your first BOS Level goals in your Dashboard</li>
      <li>Join our community of optimizers</li>
    </ul>

    <p style={{ marginTop: '30px', color: '#888', fontSize: '14px' }}>
      Questions? Hit reply to this email. We're here to help you reach Level 10.
    </p>
  </BaseEmail>
);

export default WelcomeEmail;
