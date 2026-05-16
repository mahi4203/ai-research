// pages/index.js
import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

const SUGGESTED_QUERIES = [
  "What's in the news today?",
  "Latest AI developments",
  "Global market update",
  "Tech industry news",
];

function MessageContent({ content }) {
  // Parse the emoji-prefixed sections into structured display
  const lines = content.split('\n');
  return (
    <div className="response-content">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;

        // Section headers (lines with emojis)
        if (/^[✅📈📍🔰]/.test(line)) {
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: i > 0 ? 18 : 0, marginBottom: 8,
            }}>
              <span style={{ fontSize: 15 }}>{line.split(' ')[0]}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--text-secondary)',
              }}>
                {line.slice(line.indexOf(' ') + 1)}
              </span>
            </div>
          );
        }

        // Bullet points
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} style={{
              display: 'flex', gap: 8, padding: '5px 0',
              borderBottom: '1px solid var(--border-subtle)',
              alignItems: 'flex-start',
            }}>
              <span style={{ color: 'var(--accent-blue)', marginTop: 1, flexShrink: 0 }}>·</span>
              <span style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-primary)' }}>
                {line.slice(2)}
              </span>
            </div>
          );
        }

        // Regular text
        return (
          <p key={i} style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--text-primary)' }}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg, #0a84ff, #409cff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 14, fontWeight: 700, color: 'white',
        boxShadow: '0 2px 12px rgba(10,132,255,0.35)',
      }}>R</div>
      <div style={{
        background: 'var(--bg-glass-light)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '20px 20px 20px 4px',
        padding: '14px 18px',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <div className="thinking-dot" />
          <div className="thinking-dot" />
          <div className="thinking-dot" />
        </div>
        <div style={{
          marginTop: 6, fontSize: 11,
          color: 'var(--text-tertiary)', letterSpacing: '0.02em',
        }}>
          Searching verified sources…
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (query) => {
    const q = (query || input).trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', content: q };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error || 'Something went wrong.'}`,
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Network error: ${err.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      <Head>
        <title>Research AI</title>
        <meta name="description" content="AI-powered research assistant with verified sources" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔍</text></svg>" />
      </Head>

      {/* Ambient blobs */}
      <div className="glow-blob" style={{
        width: 600, height: 600,
        background: 'radial-gradient(circle, #0a84ff, transparent)',
        top: -200, left: -200,
      }} />
      <div className="glow-blob" style={{
        width: 500, height: 500,
        background: 'radial-gradient(circle, #30d158, transparent)',
        bottom: -150, right: -150,
        opacity: 0.07,
      }} />
      <div className="noise-overlay" />

      {/* Layout */}
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        maxWidth: 760, margin: '0 auto', padding: '0 16px',
        position: 'relative', zIndex: 1,
      }}>

        {/* Header */}
        <header style={{
          padding: '20px 0 16px',
          borderBottom: isEmpty ? 'none' : '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0a84ff 0%, #30d158 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, boxShadow: '0 2px 16px rgba(10,132,255,0.3)',
            }}>🔍</div>
            <div>
              <div style={{
                fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}>Research AI</div>
              <div style={{
                fontSize: 11, color: 'var(--text-tertiary)',
                letterSpacing: '0.01em',
              }}>Verified sources only</div>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              style={{
                background: 'var(--bg-glass-light)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '980px',
                color: 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500,
                padding: '6px 14px',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              New chat
            </button>
          )}
        </header>

        {/* Messages or Welcome */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>

          {isEmpty ? (
            <div className="fade-in" style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', textAlign: 'center', padding: '40px 0',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '24px',
                background: 'linear-gradient(135deg, #0a84ff 0%, #30d158 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, marginBottom: 24,
                boxShadow: '0 8px 32px rgba(10,132,255,0.25)',
              }}>🔍</div>

              <h1 style={{
                fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em',
                color: 'var(--text-primary)', marginBottom: 10,
                lineHeight: 1.15,
              }}>Research AI</h1>

              <p style={{
                fontSize: 16, color: 'var(--text-secondary)',
                maxWidth: 360, lineHeight: 1.6, marginBottom: 40,
              }}>
                Ask anything. Get verified, source-backed answers from trusted news outlets worldwide.
              </p>

              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 10,
                justifyContent: 'center', maxWidth: 480,
              }}>
                {SUGGESTED_QUERIES.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSubmit(q)}
                    style={{
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '980px',
                      color: 'var(--text-secondary)',
                      fontSize: 13.5, fontWeight: 450,
                      padding: '9px 18px',
                      cursor: 'pointer',
                      backdropFilter: 'blur(12px)',
                      transition: 'all 0.2s ease',
                      letterSpacing: '-0.01em',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                      e.currentTarget.style.background = 'var(--bg-glass-light)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-medium)';
                      e.currentTarget.style.background = 'var(--bg-glass)';
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Trust indicators */}
              <div style={{
                marginTop: 48, display: 'flex', gap: 20, flexWrap: 'wrap',
                justifyContent: 'center',
              }}>
                {[
                  { icon: '✅', label: 'Verified sources' },
                  { icon: '⚡', label: 'Real-time search' },
                  { icon: '🛡️', label: 'No speculation' },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, color: 'var(--text-tertiary)',
                  }}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === 'user' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div className="msg-user">{msg.content}</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #0a84ff, #409cff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'white', marginTop: 2,
                        boxShadow: '0 2px 12px rgba(10,132,255,0.3)',
                      }}>R</div>
                      <div className="msg-assistant">
                        <MessageContent content={msg.content} />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && <ThinkingBubble />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{
          padding: '12px 0 20px',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-end',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-medium)',
            borderRadius: 20,
            padding: '10px 10px 10px 16px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
            onFocusCapture={e => {
              e.currentTarget.style.borderColor = 'rgba(10,132,255,0.4)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3), 0 0 0 3px rgba(10,132,255,0.1)';
            }}
            onBlurCapture={e => {
              e.currentTarget.style.borderColor = 'var(--border-medium)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
            }}
          >
            <textarea
              ref={textareaRef}
              className="apple-input"
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              rows={1}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: '4px 0',
                fontSize: 15,
                lineHeight: 1.5,
                minHeight: 28,
              }}
            />

            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36,
                borderRadius: '50%',
                background: input.trim() && !loading ? 'var(--accent-blue)' : 'var(--bg-glass-light)',
                border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                transform: input.trim() && !loading ? 'scale(1)' : 'scale(0.9)',
              }}
            >
              {loading ? (
                <div className="spinner" style={{ width: 16, height: 16 }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 13V3M3 8l5-5 5 5" stroke="white" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>

          <p style={{
            textAlign: 'center', fontSize: 11,
            color: 'var(--text-tertiary)', marginTop: 10,
            letterSpacing: '0.01em',
          }}>
            Powered by Groq · Tavily · Verified sources only
          </p>
        </div>
      </div>
    </>
  );
}
