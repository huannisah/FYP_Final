'use client';

import React, { useState, useEffect, useRef } from 'react';
import { chatAPI, Message } from '@/lib/api';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import CrisisResources from './CrisisResources';
import { signOut } from 'next-auth/react';
import { clearStoredMentalHealthUser } from '@/lib/mental-health-storage';
import Link from 'next/link';

interface ChatInterfaceProps {
  conversationId: string;
  onEndConversation?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversationId, onEndConversation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCrisisResources, setShowCrisisResources] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMessages = async () => {
    try {
      const loadedMessages = await chatAPI.getConversationMessages(conversationId);
      setMessages(loadedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load conversation history');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const userMessage: Message = {
        message_id: `temp-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = `${apiUrl}/messages/`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, content }),
      });

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream')) {
        const assistantId = `assistant-${Date.now()}`;
        let fullText = '';

        setMessages((prev) => [
          ...prev.filter((m) => m.message_id !== userMessage.message_id),
          userMessage,
          {
            message_id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
          } as Message,
        ]);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        if (!reader) throw new Error('No response body');

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const raw = line.slice(6);
              if (!raw) continue;
              try {
                const piece = JSON.parse(raw);
                fullText += piece;
              } catch {
                fullText += raw;
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.message_id === assistantId ? { ...m, content: fullText } : m,
                ),
              );
            }
          }
        }
      } else {
        const data = await response.json();
        const assistantMessage: Message = {
          message_id: data.message_id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp,
          sentiment: data.sentiment,
          intent: data.intent,
        };
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.message_id !== userMessage.message_id);
          return [...filtered, userMessage, assistantMessage];
        });
        if (assistantMessage.intent?.intent === 'crisis') {
          setShowCrisisResources(true);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setMessages((prev) => prev.filter((msg) => !msg.message_id.startsWith('temp-')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndConversation = async () => {
    if (confirm('Are you sure you want to end this conversation?')) {
      try {
        await chatAPI.endConversation(conversationId);
        onEndConversation?.();
      } catch (err) {
        console.error('Error ending conversation:', err);
        setError('Failed to end conversation');
      }
    }
  };

  return (
    <>
      <style>{`
        .nav-btn-crisis:hover { background: #fff0f0 !important; color: #a83232 !important; }
        .menu-btn:hover { background: #f0e8e0 !important; }
        .menu-item:hover { background: #fdf3ec !important; }
        .menu-item-danger:hover { background: #fff5f5 !important; color: #c05050 !important; }
        .end-conv-btn:hover { color: #c07d5b !important; }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        .dot { animation: bounce-dot 1.2s ease-in-out infinite; }
        .dot:nth-child(2) { animation-delay: 0.15s; }
        .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown { animation: dropdown-in 0.15s ease; }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: '#fdf6f0',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #f0e8e0',
            padding: '0 32px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              maxWidth: 900,
              width: '100%',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.3rem' }}>🌿</span>
              <span
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: '#2c2c2c',
                }}
              >
                MindBuddy
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

              {/* Help button */}
              <button
                onClick={() => setShowCrisisResources(!showCrisisResources)}
                className="nav-btn-crisis"
                style={{
                  padding: '7px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: '#c05050',
                  background: '#fff5f5',
                  border: 'none',
                  borderRadius: 50,
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                Help
              </button>

              {/* Menu button + dropdown */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="menu-btn"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: showMenu ? '#f0e8e0' : '#f5f0ec',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s',
                    flexShrink: 0,
                  }}
                  aria-label="Menu"
                >
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="16" height="2" rx="1" fill="#9a8a82"/>
                    <rect y="5" width="16" height="2" rx="1" fill="#9a8a82"/>
                    <rect y="10" width="16" height="2" rx="1" fill="#9a8a82"/>
                  </svg>
                </button>

                {/* Dropdown */}
                {showMenu && (
                  <div
                    className="dropdown"
                    style={{
                      position: 'absolute',
                      top: 46,
                      right: 0,
                      background: '#fff',
                      borderRadius: 16,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                      minWidth: 160,
                      overflow: 'hidden',
                      zIndex: 100,
                      border: '1px solid #f0e8e0',
                    }}
                  >
                    <Link
                      href="/profile"
                      onClick={() => setShowMenu(false)}
                      className="menu-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 16px',
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        color: '#5a4a42',
                        textDecoration: 'none',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span> </span> Profile
                    </Link>

                    <div style={{ height: 1, background: '#f5ede8', margin: '0 12px' }} />

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        if (confirm('Are you sure you want to sign out?')) {
                          clearStoredMentalHealthUser();
                          void signOut({ callbackUrl: '/auth/signin' });
                        }
                      }}
                      className="menu-item menu-item-danger"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 16px',
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        color: '#9a8a82',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s, color 0.15s',
                      }}
                    >
                      <span> </span> Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Crisis Modal ── */}
        {showCrisisResources && (
          <CrisisResources onClose={() => setShowCrisisResources(false)} />
        )}

        {/* ── Messages Area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {messages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '160px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: '2.4rem', marginBottom: 4 }}>🌿</div>
                <p style={{ fontSize: '0.92rem', color: '#9a8a82', lineHeight: 1.7, maxWidth: 420 }}>
                  I'm here for you! Feel free to share what's on your mind.
                </p>
                <p style={{ fontSize: '0.8rem', color: '#bbb', lineHeight: 1.6, maxWidth: 380, paddingTop: 4 }}>
                  I'm an AI and not a replacement for professional care. If you're in crisis, use the{' '}
                  <strong style={{ color: '#c05050' }}>Help</strong> button above.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage key={message.message_id} message={message} />
            ))}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: '18px 18px 18px 4px',
                    padding: '12px 18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    display: 'flex',
                    gap: 5,
                    alignItems: 'center',
                  }}
                >
                  <div className="dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#d4b8a8' }} />
                  <div className="dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#d4b8a8' }} />
                  <div className="dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#d4b8a8' }} />
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  background: '#fff5f5',
                  border: '1px solid #fad4d4',
                  borderRadius: 12,
                  padding: '12px 16px',
                  fontSize: '0.85rem',
                  color: '#b83232',
                }}
              >
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Input Area ── */}
        <div
          style={{
            background: '#fff',
            borderTop: '1px solid #f0e8e0',
            padding: '16px 32px 20px',
            flexShrink: 0,
          }}
        >
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <p style={{ fontSize: '0.75rem', color: '#ccc' }}>
                Your conversations are private and stored securely.
              </p>
              <button
                onClick={handleEndConversation}
                className="end-conv-btn"
                style={{
                  fontSize: '0.75rem',
                  color: '#bbb',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  transition: 'color 0.15s',
                }}
              >
                End conversation
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatInterface;
