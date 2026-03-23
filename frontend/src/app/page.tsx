"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ChatInterface from "@/components/ChatInterface";
import { chatAPI, type Conversation } from "@/lib/api";
import {
  LS_MENTAL_HEALTH_USER_EMAIL,
  LS_MENTAL_HEALTH_USER_ID,
  clearStoredMentalHealthUser,
} from "@/lib/mental-health-storage";
import { format, formatDistanceToNow } from "date-fns";
import { MessageCircle } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pastConversations, setPastConversations] = useState<Conversation[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Resolve userId from localStorage or by email, then load past conversations
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;

    let mounted = true;

    async function resolveUserAndConversations() {
      const sessionEmail = session!.user!.email!;
      const storedEmail = localStorage.getItem(LS_MENTAL_HEALTH_USER_EMAIL);
      let currentUserId = localStorage.getItem(LS_MENTAL_HEALTH_USER_ID);

      if (currentUserId && (!storedEmail || storedEmail !== sessionEmail)) {
        clearStoredMentalHealthUser();
        currentUserId = null;
        if (mounted) {
          setUserId(null);
          setConversationId(null);
          setPastConversations([]);
          setShowWelcome(true);
        }
      }

      if (!currentUserId) {
        try {
          const res = await chatAPI.getUserIdByEmail(sessionEmail);
          currentUserId = res.user_id;
          if (mounted) {
            setUserId(currentUserId);
            localStorage.setItem(LS_MENTAL_HEALTH_USER_ID, currentUserId);
            localStorage.setItem(LS_MENTAL_HEALTH_USER_EMAIL, sessionEmail);
          }
        } catch {
          if (mounted) setIsInitializing(false);
          return;
        }
      } else if (mounted) {
        setUserId(currentUserId);
      }

      if (!currentUserId || !mounted) return;

      try {
        const conversations = await chatAPI.getUserConversations(currentUserId);
        if (mounted) setPastConversations(conversations);
      } catch {
        if (mounted) setPastConversations([]);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    }

    resolveUserAndConversations();
    return () => { mounted = false; };
  }, [status, session?.user?.email]);

  const handleStartChat = async () => {
    if (!session?.user?.email) {
      setError("Email not found. Please sign in again.");
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      let currentUserId = userId;
      if (!currentUserId) {
        try {
          const user = await chatAPI.createUser(
            session.user.email,
            true,
            true,
          );
          currentUserId = user.user_id;
        } catch (err) {
          console.log("User may already exist:", err);
          try {
            const res = await chatAPI.getUserIdByEmail(session.user.email);
            currentUserId = res.user_id;
          } catch {
            throw new Error("Could not create or find user");
          }
        }

        setUserId(currentUserId);
        localStorage.setItem(LS_MENTAL_HEALTH_USER_ID, currentUserId);
        localStorage.setItem(LS_MENTAL_HEALTH_USER_EMAIL, session.user.email);
      }

      const conversation = await chatAPI.createConversation(currentUserId);
      setConversationId(conversation.conversation_id);
      setShowWelcome(false);
    } catch (error) {
      console.error("Error starting chat:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to start chat. Please try again.",
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleEndConversation = () => {
    setConversationId(null);
    setShowWelcome(true);
  };

  const handleOpenConversation = (convId: string) => {
    setConversationId(convId);
    setShowWelcome(false);
  };

  // Loading state
  if (status === "loading" || isInitializing) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#fdf6f0", fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="text-center">
          <div
            className="rounded-full h-10 w-10 mx-auto mb-4 animate-spin"
            style={{ border: "3px solid #f0ddd0", borderTopColor: "#c07d5b" }}
          />
          <p style={{ color: "#bbb", fontSize: "0.88rem" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  // Welcome screen
  if (showWelcome || !conversationId) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
          .conv-btn:hover { background: #fdf3ec !important; }
          .conv-btn:hover .conv-icon { background: #c07d5b !important; color: #fff !important; }
          .conv-btn:hover .conv-chevron { color: #c07d5b !important; }
          .start-btn:hover:not(:disabled) { background: #a8694a !important; transform: translateY(-2px); box-shadow: 0 6px 22px rgba(192,125,91,0.35) !important; }
          .conv-btn:hover .conv-icon svg { stroke: #fff; }
        `}</style>

        <div
          className="min-h-screen flex items-center justify-center p-10"
          style={{ background: "#fdf6f0", fontFamily: "'DM Sans', sans-serif" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              maxWidth: 1000,
              width: "100%",
              minHeight: 560,
              background: "#fff",
              borderRadius: 32,
              boxShadow: "0 8px 56px rgba(0,0,0,0.07)",
              overflow: "hidden",
            }}
          >
            {/* ── LEFT PANEL: recent chats + crisis ── */}
            <div
              style={{
                padding: "52px 44px",
                display: "flex",
                flexDirection: "column",
                gap: 32,
              }}
            >
              {/* Error */}
              {error && (
                <div
                  style={{
                    background: "#fff5f5",
                    border: "1px solid #fad4d4",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontSize: "0.85rem",
                    color: "#b83232",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Recent chats */}
              {pastConversations.length > 0 && (
                <div>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "#ccc",
                      fontWeight: 500,
                      marginBottom: 14,
                    }}
                  >
                    Your recent conversations
                  </p>
                  <ul
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      maxHeight: 240,
                      overflowY: "auto",
                      listStyle: "none",
                    }}
                  >
                    {pastConversations.map((conv) => (
                      <li key={conv.conversation_id}>
                        <button
                          type="button"
                          onClick={() => handleOpenConversation(conv.conversation_id)}
                          className="conv-btn"
                          style={{
                            background: "none",
                            border: "none",
                            borderRadius: 14,
                            padding: "12px 14px",
                            textAlign: "left",
                            cursor: "pointer",
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            transition: "background 0.15s",
                          }}
                        >
                          {/* Icon */}
                          <div
                            className="conv-icon"
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: "#f5ede7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1rem",
                              flexShrink: 0,
                              transition: "all 0.15s",
                            }}
                          >
                            <MessageCircle size={16} strokeWidth={1.8} color="#c07d5b" className="conv-icon-svg" />
                          </div>

                          {/* Text */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: "0.87rem",
                                fontWeight: 500,
                                color: "#3a3a3a",
                                display: "block",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {format(new Date(conv.started_at), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                            <span
                              style={{
                                fontSize: "0.76rem",
                                color: "#bbb",
                                marginTop: 2,
                                display: "block",
                              }}
                            >
                              {formatDistanceToNow(new Date(conv.started_at), { addSuffix: true })}
                              {" · "}
                              {conv.total_messages} message{conv.total_messages !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Active pill */}
                          {conv.is_active && (
                            <span
                              style={{
                                fontSize: "0.68rem",
                                background: "#eef7ee",
                                color: "#5a9e5a",
                                borderRadius: 20,
                                padding: "2px 8px",
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                              }}
                            >
                              Active
                            </span>
                          )}

                          {/* Chevron */}
                          <span
                            className="conv-chevron"
                            style={{ color: "#ddd", fontSize: "0.9rem", flexShrink: 0, transition: "color 0.15s" }}
                          >
                            ›
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: "linear-gradient(to right, transparent, #ece4dc, transparent)",
                }}
              />

              {/* Crisis */}
              <div style={{ paddingLeft: 14, borderLeft: "3px solid #f5b8b8" }}>
                <h3
                  style={{
                    fontFamily: "'Lora', serif",
                    fontSize: "0.9rem",
                    color: "#c05050",
                    marginBottom: 6,
                  }}
                >
                  Need urgent help?
                </h3>
                <p style={{ fontSize: "0.83rem", color: "#c06060", marginBottom: 8, lineHeight: 1.5 }}>
                  If you're having thoughts of self-harm or suicide, please reach out to someone right away.
                </p>
                <ul style={{ listStyle: "none", fontSize: "0.81rem", color: "#c06060", lineHeight: 2 }}>
                  <li>National Mindline: <strong>1771</strong> (24/7)</li>
                  <li>National Mindline WhatsApp: <strong>+65 6669 1771</strong> (24/7)</li>
                  <li>Samaritans of Singapore: <strong>1767</strong> (24/7)</li>
                </ul>
              </div>
            </div>

            {/* ── RIGHT PANEL: intro + start button ── */}
            <div
              style={{
                background: "linear-gradient(160deg, #fdf0e6 0%, #fae4d4 100%)",
                padding: "56px 48px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Intro */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: "2.8rem", marginBottom: 20 }}>🌿</div>
                <h1
                  style={{
                    fontFamily: "'Lora', serif",
                    fontSize: "2.4rem",
                    color: "#2c2c2c",
                    fontWeight: 600,
                    lineHeight: 1.2,
                    marginBottom: 16,
                  }}
                >
                  Hey, I'm MindBuddy.
                </h1>
                <p style={{ color: "#7a5c4a", fontSize: "0.97rem", lineHeight: 1.75, marginBottom: 12 }}>
                Whether you’re feeling stressed, overwhelmed, or just a little off, I’m here to listen and help you through it.
                </p>
                <p style={{ color: "#9a6e5a", fontSize: "0.88rem", fontWeight: 500 }}>
                  I'm not a replacement for a real professional, but I'm always available if you need someone to talk to.
                </p>

                {/* User bar */}
                {session?.user?.email && (
                  <p style={{ marginTop: 28, fontSize: "0.8rem", color: "#bbb" }}>
                    Signed in as {session.user.email}
                    <Link
                      href="/profile"
                      style={{
                        color: "#c07d5b",
                        textDecoration: "underline",
                        marginLeft: 8,
                        fontSize: "0.8rem",
                      }}
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Are you sure you want to sign out?")) {
                          clearStoredMentalHealthUser();
                          void signOut({ callbackUrl: "/auth/signin" });
                        }
                      }}
                      style={{
                        color: "#c07d5b",
                        textDecoration: "underline",
                        marginLeft: 8,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        padding: 0,
                      }}
                    >
                      Sign out
                    </button>
                  </p>
                )}
              </div>

              {/* Start button */}
              <button
                onClick={handleStartChat}
                disabled={isInitializing}
                className="start-btn"
                style={{
                  width: "100%",
                  padding: 15,
                  marginTop: 32,
                  background: isInitializing ? "#ddd" : "#c07d5b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 50,
                  fontFamily: "'Lora', serif",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: isInitializing ? "not-allowed" : "pointer",
                  transition: "background 0.2s, transform 0.1s, box-shadow 0.2s",
                  boxShadow: isInitializing ? "none" : "0 4px 16px rgba(192,125,91,0.28)",
                  flexShrink: 0,
                }}
              >
                {isInitializing ? "Starting..." : "Start a new conversation"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <ChatInterface
      conversationId={conversationId}
      onEndConversation={handleEndConversation}
    />
  );
}
