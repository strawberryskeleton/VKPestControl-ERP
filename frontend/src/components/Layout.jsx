import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import {
  LayoutDashboard, Users, Sparkles, Briefcase, Calendar, FileText, Receipt,
  Wallet, Package, TrendingUp, Bot, LogOut, Menu, X, Bug, ShieldCheck, ClipboardList, FileCheck
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import AIAssistant from "./AIAssistant";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin","ops_manager","sales","accountant","technician"] },
  { to: "/customers", label: "Customers", icon: Users, roles: ["super_admin","ops_manager","sales","accountant"] },
  { to: "/leads", label: "Leads", icon: Sparkles, roles: ["super_admin","ops_manager","sales"] },
  { to: "/quotations", label: "Quotations", icon: FileCheck, roles: ["super_admin","ops_manager","sales"] },
  { to: "/amc", label: "AMC Contracts", icon: ShieldCheck, roles: ["super_admin","ops_manager","sales","accountant"] },
  { to: "/jobs", label: "Jobs", icon: Briefcase, roles: ["super_admin","ops_manager","sales"] },
  { to: "/schedule", label: "Schedule", icon: Calendar, roles: ["super_admin","ops_manager"] },
  { to: "/technician", label: "Technician App", icon: Bug, roles: ["super_admin","technician"] },
  { to: "/reports", label: "Service Reports", icon: ClipboardList, roles: ["super_admin","ops_manager"] },
  { to: "/invoices", label: "Invoices", icon: Receipt, roles: ["super_admin","accountant","sales"] },
  { to: "/finance", label: "Finance", icon: Wallet, roles: ["super_admin","accountant"] },
  { to: "/inventory", label: "Inventory", icon: Package, roles: ["super_admin","ops_manager"] },
  { to: "/investments", label: "Investments", icon: TrendingUp, roles: ["super_admin","accountant"] },
];

const SidebarContent = ({ onNav }) => {
  const { user, logout } = useAuth();
  const items = NAV.filter(n => user?.role === "super_admin" || n.roles.includes(user?.role));
  return (
    <div className="flex flex-col h-full bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))]">
      <div className="px-6 py-5 border-b border-white/10 flex items-center gap-2">
        <div className="w-9 h-9 rounded-md bg-emerald-500 flex items-center justify-center"><Bug className="w-5 h-5 text-white" /></div>
        <div>
          <div className="font-display text-lg leading-none">PestERP</div>
          <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">UAE Edition</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} onClick={onNav}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
                isActive ? "bg-emerald-500/15 text-emerald-300 font-medium" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`
            }
            data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-xs text-white/50 mb-2">Signed in as</div>
        <div className="text-sm font-medium">{user?.name}</div>
        <div className="text-xs text-white/50 capitalize mb-3">{user?.role?.replace("_", " ")}</div>
        <button onClick={logout} data-testid="logout-btn" className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-sm">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 sticky top-0 h-screen"><SidebarContent /></aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border h-14 flex items-center px-4 lg:px-6 gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" data-testid="open-sidebar"><Menu className="w-5 h-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64"><SidebarContent onNav={() => setOpen(false)} /></SheetContent>
          </Sheet>
          <h1 className="font-display text-lg sm:text-xl">Pest Control ERP</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={() => setAiOpen(true)} className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2" data-testid="open-ai">
              <Bot className="w-4 h-4" /> <span className="hidden sm:inline">AI Assistant</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 animate-fade-in">{children}</main>
      </div>

      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

export default Layout;
