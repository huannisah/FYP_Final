'use client';

import React, { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false }) => {
  const [message, setMessage] = useState('');
  const maxLength = 1000;

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charsLeft = maxLength - message.length;
  const isNearLimit = charsLeft <= 100;

  return (
    <>
      <style>{`
        .mb-textarea:focus {
          outline: none;
          border-color: #c07d5b !important;
          box-shadow: 0 0 0 3px rgba(192,125,91,0.1);
        }
        .mb-textarea:disabled { opacity: 0.5; cursor: not-allowed; }
        .mb-send-btn:hover:not(:disabled) {
          background: #a8694a !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(192,125,91,0.35) !important;
        }
        .mb-send-btn:disabled { background: #e5ddd8 !important; color: #bbb !important; box-shadow: none !important; cursor: not-allowed; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Textarea row */}
        <div style={{ position: 'relative' }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Share what's on your mind!"
            rows={3}
            maxLength={maxLength}
            disabled={disabled}
            className="mb-textarea"
            style={{
              width: '100%',
              padding: '14px 18px',
              paddingBottom: 32,
              border: '1.5px solid #ede5de',
              borderRadius: 18,
              fontSize: '0.92rem',
              fontFamily: "'DM Sans', sans-serif",
              color: '#333',
              background: disabled ? '#faf7f5' : '#fdfaf8',
              resize: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
          />
          {/* Char count */}
          <span
            style={{
              position: 'absolute',
              bottom: 10,
              right: 14,
              fontSize: '0.72rem',
              color: isNearLimit ? '#c07d5b' : '#ccc',
              fontWeight: isNearLimit ? 500 : 400,
              transition: 'color 0.15s',
            }}
          >
            {message.length}/{maxLength}
          </span>
        </div>

        {/* Footer row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>

          <button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="mb-send-btn"
            style={{
              padding: '9px 24px',
              background: !message.trim() || disabled ? '#e5ddd8' : '#c07d5b',
              color: !message.trim() || disabled ? '#bbb' : '#fff',
              border: 'none',
              borderRadius: 50,
              fontFamily: "'Lora', serif",
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: !message.trim() || disabled ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s, transform 0.1s, box-shadow 0.2s',
              boxShadow: !message.trim() || disabled ? 'none' : '0 4px 14px rgba(192,125,91,0.25)',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatInput;
