import * as React from 'react';
import { BaseEmail } from './base';

interface WeeklyDigestEmailProps {
  name: string;
  weekNumber: number;
  newProtocols: Array<{ title: string; pillar: string; url: string }>;
  newArticles: Array<{ title: string; pillar: string; url: string }>;
  streakDays?: number;
}

export const WeeklyDigestEmail = ({ 
  name, 
  weekNumber, 
  newProtocols, 
  newArticles,
  streakDays 
}: WeeklyDigestEmailProps) => (
  <BaseEmail preview={`Your Liberture Weekly Digest - Week ${weekNumber}`}>
    <h1 style={{
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '12px',
    }}>
      Your Weekly Optimization Report
    </h1>
    
    <p style={{ fontSize: '16px', color: '#999', marginBottom: '30px' }}>
      Week {weekNumber} · {name}
    </p>

    {streakDays && streakDays > 0 && (
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '12px',
        marginBottom: '30px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔥</div>
        <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
          {streakDays} Day Streak!
        </div>
        <p style={{ color: '#bbb', margin: 0 }}>
          You're on fire! Keep the momentum going.
        </p>
      </div>
    )}

    <div className="divider"></div>

    {newProtocols.length > 0 && (
      <>
        <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px' }}>
          🆕 New Protocols This Week
        </h2>

        {newProtocols.map((protocol, idx) => (
          <div key={idx} style={{
            padding: '16px',
            background: '#0f0f0f',
            border: '1px solid #1a1a1a',
            borderRadius: '8px',
            marginBottom: '12px',
          }}>
            <span className={`pillar-badge pillar-${protocol.pillar.toLowerCase()}`}>
              {protocol.pillar}
            </span>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              margin: '12px 0 8px',
              color: '#fff'
            }}>
              {protocol.title}
            </h3>
            <a 
              href={protocol.url}
              style={{
                color: '#06B6D4',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Learn More →
            </a>
          </div>
        ))}

        <div className="divider"></div>
      </>
    )}

    {newArticles.length > 0 && (
      <>
        <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px' }}>
          📚 New Knowledge Articles
        </h2>

        {newArticles.map((article, idx) => (
          <div key={idx} style={{
            padding: '16px',
            background: '#0f0f0f',
            border: '1px solid #1a1a1a',
            borderRadius: '8px',
            marginBottom: '12px',
          }}>
            <span className={`pillar-badge pillar-${article.pillar.toLowerCase()}`}>
              {article.pillar}
            </span>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              margin: '12px 0 8px',
              color: '#fff'
            }}>
              {article.title}
            </h3>
            <a 
              href={article.url}
              style={{
                color: '#8B5CF6',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Read Now →
            </a>
          </div>
        ))}

        <div className="divider"></div>
      </>
    )}

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
        View Full Dashboard →
      </a>
    </div>

    <p style={{ color: '#666', fontSize: '14px', textAlign: 'center' }}>
      Want to pause weekly digests?{' '}
      <a href="https://liberture.com/dashboard/settings" style={{ color: '#888' }}>
        Update your notification settings
      </a>
    </p>
  </BaseEmail>
);

export default WeeklyDigestEmail;
