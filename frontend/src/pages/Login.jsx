import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Bug, Loader2 } from "lucide-react";
import { toast } from "sonner";

const QUICK = [
  { label: "Super Admin", email: "admin@pestcontrol.ae", pw: "admin123" },
  { label: "Operations Manager", email: "ops@pestcontrol.ae", pw: "ops123" },
  { label: "Sales", email: "sales@pestcontrol.ae", pw: "sales123" },
  { label: "Accountant", email: "accountant@pestcontrol.ae", pw: "acc123" },
  { label: "Technician", email: "tech1@pestcontrol.ae", pw: "tech123" },
];

const Login = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@pestcontrol.ae");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome, ${u.name}`);
      nav(u.role === "technician" ? "/technician" : "/");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:block relative overflow-hidden bg-emerald-900">
        <img alt="" src="https://images.pexels.com/photos/28648054/pexels-photo-28648054.jpeg" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 to-emerald-950/80" />
        <div className="relative z-10 p-12 h-full flex flex-col">
          <div className="flex items-center gap-3 text-white">
            <div className="w-11 h-11 rounded-md bg-emerald-500 flex items-center justify-center"><Bug className="w-6 h-6" /></div>
            <div>
              <div className="font-display text-2xl">PestERP</div>
              <div className="text-xs uppercase tracking-widest text-emerald-200/70">UAE Edition</div>
            </div>
          </div>
          <div className="mt-auto text-white">
            <h2 className="font-display text-4xl leading-tight mb-3">The complete operating system for pest control businesses.</h2>
            <p className="text-emerald-100/80 max-w-md">CRM, AMC, scheduling, technician app, finance & AI insights — purpose-built for the UAE market.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl sm:text-4xl mb-2">Sign in</h1>
          <p className="text-muted-foreground mb-8">Welcome back. Choose a role or sign in with credentials.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" data-testid="login-submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <div className="mt-8">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Quick demo logins</div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map((q) => (
                <button key={q.email} data-testid={`quick-${q.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => { setEmail(q.email); setPassword(q.pw); }}
                  className="text-left text-sm px-3 py-2 border border-border rounded-md hover:border-emerald-500/50 hover:bg-accent transition-colors">
                  <div className="font-medium">{q.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{q.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
