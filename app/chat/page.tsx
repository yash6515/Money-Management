"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import type { ChatMessage, ChatSession } from "@/lib/types";
import { uid } from "@/lib/utils";
import { Sparkles, Send, MessageSquare, Plus } from "lucide-react";

export default function ChatPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">(user?.language || "en");
  const [seeded, setSeeded] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const sess = await store.listChatSessions(user.id);
      setSessions(sess);
      if (sess[0]) setCurrentId(sess[0].id);
      setSeeded(await store.getPreSeededPrompts());
    })();
  }, [user]);

  const current = sessions.find((s) => s.id === currentId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current?.messages.length, loading]);

  async function newSession() {
    if (!user) return;
    const cs: ChatSession = {
      id: uid(),
      user_id: user.id,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await store.upsertChatSession(cs);
    setSessions([cs, ...sessions]);
    setCurrentId(cs.id);
  }

  async function send(text?: string) {
    if (!user) return;
    const content = (text ?? input).trim();
    if (!content) return;
    setInput("");
    setLoading(true);

    // Ensure a session exists
    let sess = current;
    if (!sess) {
      sess = {
        id: uid(),
        user_id: user.id,
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSessions([sess, ...sessions]);
      setCurrentId(sess.id);
    }

    const userMsg: ChatMessage = { role: "user", content, ts: new Date().toISOString() };
    const updated: ChatSession = { ...sess, messages: [...sess.messages, userMsg], updated_at: new Date().toISOString() };
    await store.upsertChatSession(updated);
    setSessions((all) => all.map((s) => (s.id === updated.id ? updated : s)));

    try {
      const systemPrompt = await store.getChatbotPrompt();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.messages.map((m) => ({ role: m.role, content: m.content })),
          system: systemPrompt,
          user_profile: user,
          language,
        }),
      });
      const data = await res.json();
      const reply: ChatMessage = {
        role: "assistant",
        content: data.text || "Sorry, I couldn't respond right now.",
        ts: new Date().toISOString(),
      };
      const final: ChatSession = { ...updated, messages: [...updated.messages, reply], updated_at: new Date().toISOString() };
      await store.upsertChatSession(final);
      setSessions((all) => all.map((s) => (s.id === final.id ? final : s)));
      store.track("ai_call", user.id, { endpoint: "chat" });
      if (data.usage?.in) {
        await store.addAIUsage({
          user_id: user.id,
          user_name: user.name,
          endpoint: "chat",
          tokens_in: data.usage.in,
          tokens_out: data.usage.out,
          cost_usd: (data.usage.in * 3 + data.usage.out * 15) / 1_000_000,
        });
      }
    } catch (e) {
      /* noop */
    }
    setLoading(false);
  }

  if (!user) return null;

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4 animate-fade-in h-[calc(100vh-6rem)]">
      {/* Sessions sidebar */}
      <Card className="hidden md:flex flex-col min-h-0">
        <div className="p-4 border-b border-white/5">
          <Button className="w-full" size="sm" onClick={newSession}><Plus className="h-4 w-4" /> New chat</Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
          {sessions.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-6">No chats yet</div>
          )}
          {sessions.map((s) => {
            const title = s.messages[0]?.content.slice(0, 40) || "New chat";
            return (
              <button
                key={s.id}
                onClick={() => setCurrentId(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${s.id === currentId ? "bg-teal/15 text-teal" : "hover:bg-white/5"}`}
              >
                <div className="truncate">{title}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(s.updated_at).toLocaleDateString()}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Chat pane */}
      <Card className="flex flex-col min-h-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal/20 grid place-items-center">
              <MessageSquare className="h-4 w-4 text-teal" />
            </div>
            <div>
              <div className="font-semibold text-sm flex items-center gap-2">
                Paise Coach <Badge className="text-[10px]"><Sparkles className="h-2.5 w-2.5 mr-0.5" />Claude</Badge>
              </div>
              <div className="text-[10px] text-muted-foreground">Personal finance AI for India</div>
            </div>
          </div>
          <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
            <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 space-y-4">
          {!current || current.messages.length === 0 ? (
            <div className="h-full grid place-items-center">
              <div className="text-center max-w-md">
                <div className="h-12 w-12 mx-auto rounded-xl bg-gradient-to-br from-teal to-purple grid place-items-center mb-4">
                  <Sparkles className="h-6 w-6 text-black" />
                </div>
                <h2 className="font-display text-xl font-bold">Ask anything about money</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  FDs, SIPs, PPF, tax planning, loans — I'm trained on Indian finance.
                </p>
                <div className="grid gap-2 mt-6">
                  {seeded.slice(0, 5).map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="text-left text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {current.messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-teal to-purple grid place-items-center">
                      <Sparkles className="h-4 w-4 text-black" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user" ? "bg-teal text-black rounded-br-sm" : "bg-white/5 rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-teal to-purple grid place-items-center">
                    <Sparkles className="h-4 w-4 text-black animate-pulse" />
                  </div>
                  <div className="bg-white/5 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-muted-foreground">
                    Thinking<span className="animate-pulse">…</span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 md:p-4 border-t border-white/5">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={language === "hi" ? "कुछ पूछें..." : "Ask anything about money..."}
              className="min-h-[44px] max-h-40 resize-none"
              rows={1}
            />
            <Button onClick={() => send()} disabled={loading || !input.trim()}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
