'use client';

import React from 'react';

interface CrisisResourcesProps {
  onClose: () => void;
}

const CrisisResources: React.FC<CrisisResourcesProps> = ({ onClose }) => {
  const resources = [
    {
      name: 'National Mindline',
      number: '1771',
      description: 'Mental health support',
      hours: 'Available 24/7',
    },
    {
      name: 'Samaritans of Singapore',
      number: '1767',
      description: 'Suicide prevention and crisis support',
      hours: 'Available 24/7',
    },
    {
      name: 'NTU Psychological Crisis Hotline',
      number: '6790 4462',
      description: 'Mental health emergency services for current NTU students',
      hours: 'Available 24/7',
    },
  ];

  return (
    <>
      <style>{`
        .crisis-resource-card:hover {
          border-color: #f5b8b8 !important;
          background: #fff9f9 !important;
        }
        .crisis-phone:hover { color: #a83232 !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: 28,
            maxWidth: 580,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 16px 64px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(160deg, #fdf0e6 0%, #fae4d4 100%)',
              borderRadius: '28px 28px 0 0',
              padding: '32px 36px 28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#c4a090',
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                Immediate support
              </p>
              <h2
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: '1.6rem',
                  color: '#2c2c2c',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Know that you're not alone.
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#7a5c4a', lineHeight: 1.65, maxWidth: 400 }}>
                If you're having thoughts of harming yourself or are in immediate danger, please reach out to any of these numbers right away.
              </p>
            </div>

          </div>

          {/* Body */}
          <div style={{ padding: '28px 36px 36px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Primary resources */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {resources.map((resource, index) => (
                <div
                  key={index}
                  className="crisis-resource-card"
                  style={{
                    border: '1.5px solid #f5e8e0',
                    borderRadius: 16,
                    padding: '16px 20px',
                    transition: 'border-color 0.15s, background 0.15s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div>
                    <p style={{ fontSize: '0.88rem', fontWeight: 500, color: '#3a3a3a', marginBottom: 2 }}>
                      {resource.name}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#aaa' }}>
                      {resource.description} · {resource.hours}
                    </p>
                  </div>
                  <a
                    href={`tel:${resource.number}`}
                    className="crisis-phone"
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: '#c05050',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      fontFamily: "'Lora', serif",
                      transition: 'color 0.15s',
                    }}
                  >
                    {resource.number}
                  </a>
                </div>
              ))}
            </div>

            {/* Emergency notice */}
            <div style={{ paddingLeft: 14, borderLeft: '3px solid #f5b8b8' }}>
              <p style={{ fontSize: '0.85rem', color: '#c05050', lineHeight: 1.6, fontWeight: 500 }}>
                In case of emergency, call <strong>995</strong> or go to the nearest hospital emergency department immediately.
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #ece4dc, transparent)' }} />

            {/* Additional support */}
            <div>
              <p
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#ccc',
                  fontWeight: 500,
                  marginBottom: 12,
                }}
              >
                Additional support
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Singapore Association for Mental Health', number: '1800 283 7019' },
                  { label: 'TOUCHline (Youth Counselling)', number: '1800 377 2252' },
                  { label: 'Care Corner Counselling (Mandarin)', number: '1800 353 5800' },
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#7a6a62' }}>{item.label}</span>
                    <a
                      href={`tel:${item.number}`}
                      style={{ fontSize: '0.85rem', color: '#c07d5b', fontWeight: 500, textDecoration: 'none' }}
                    >
                      {item.number}
                    </a>
                  </li>
                ))}
                <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#7a6a62' }}>Online Resources</span>
                  <a
                    href="https://www.healthhub.sg/programmes/186/MindSG"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.85rem', color: '#c07d5b', fontWeight: 500, textDecoration: 'underline' }}
                  >
                    MindSG ↗
                  </a>
                </li>
              </ul>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                alignSelf: 'flex-end',
                padding: '11px 28px',
                background: '#c07d5b',
                color: '#fff',
                border: 'none',
                borderRadius: 50,
                fontFamily: "'Lora', serif",
                fontSize: '0.92rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(192,125,91,0.25)',
                transition: 'background 0.2s, transform 0.1s',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#a8694a'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#c07d5b'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default CrisisResources;
