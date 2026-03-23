'use client';

import React from 'react';
import { Message } from '@/lib/api';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const timestamp = format(new Date(message.timestamp), 'h:mm a');

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Bubble */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isUser ? '#c07d5b' : '#fff',
            color: isUser ? '#fff' : '#3a3a3a',
            boxShadow: isUser
              ? '0 2px 12px rgba(192,125,91,0.2)'
              : '0 2px 8px rgba(0,0,0,0.06)',
            fontSize: '0.92rem',
            lineHeight: 1.65,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <pre
            style={{
              margin: 0,
              padding: 0,
              background: 'transparent',
              border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.92rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.65,
              color: 'inherit',
            }}
          >
            {message.content}
          </pre>
        </div>

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            paddingLeft: isUser ? 0 : 4,
            paddingRight: isUser ? 4 : 0,
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#ccc' }}>{timestamp}</span>

        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
