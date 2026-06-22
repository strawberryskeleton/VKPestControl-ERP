import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Bot, Send, Sparkles } from "lucide-react";
import { api } from "../lib/api";

const SUGGESTED = [
  "Which customers have AMC expiring in the next 30 days?",
  "Forecast our revenue for next month based on current trends.",
  "Suggest a WhatsApp follow-up for an overdue invoice customer.",
  "Generate a quotation description for a 6-month cockroach treatment plan.",
  "Identify our top performing technicians this month.",
];

const AIAssistant = ({ open, onClose }) => {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const ask = async (text) => {
    const question = (text ?? q).trim();
    if (!question) return;
    const uid = `u-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    setMessages((m) => [...m, { id: uid, role: "user", text: question }]);
    setQ("");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/ask", { question });
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "ai", text: data.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "ai", text: "Sorry, the AI is unavailable. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2 font-display"><Bot className="w-5 h-5 text-emerald-600" /> AI Assistant</SheetTitle>
          <div className="text-xs text-muted-foreground">Powered by Claude Sonnet 4.5</div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/> Try asking</div>
              {SUGGESTED.map((s) => (
                <button key={s} onClick={() => ask(s)} data-testid={`ai-suggest-${SUGGESTED.indexOf(s)}`}
                  className="w-full text-left text-sm p-3 rounded-md border border-border hover:border-emerald-500/50 hover:bg-accent transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`p-3 rounded-md text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-emerald-50 dark:bg-emerald-950/40 ml-6" : "bg-muted mr-6"}`}>
              {m.text}
            </div>
          ))}
          {loading && <div className="text-sm text-muted-foreground animate-pulse">Thinking…</div>}
        </div>
        <div className="p-3 border-t flex gap-2">
          <Textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask the AI…"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); }}}
            data-testid="ai-input" className="resize-none min-h-[44px]" />
          <Button onClick={() => ask()} disabled={loading || !q.trim()} data-testid="ai-send" className="bg-emerald-700 hover:bg-emerald-800">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AIAssistant;
