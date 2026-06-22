import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { Users, ShieldCheck, AlertTriangle, Briefcase, CheckCircle2, Clock, Wallet, TrendingDown, TrendingUp, Receipt, Activity } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, FunnelChart, Funnel, LabelList } from "recharts";

const COLORS = ["#047857", "#3b82f6", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6"];

const Kpi = ({ icon: Icon, label, value, hint, accent = "emerald", testid }) => (
  <Card data-testid={testid} className="p-5 hover:-translate-y-0.5 transition-all border-border">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-2xl font-display mt-2">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </div>
      <div className={`w-9 h-9 rounded-md flex items-center justify-center bg-${accent}-50 text-${accent}-700`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  </Card>
);

const fmtAED = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/dashboard/kpis"), api.get("/dashboard/charts")]).then(([k, c]) => {
      setKpis(k.data); setCharts(c.data);
    });
  }, []);

  if (!kpis || !charts) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time overview of operations, revenue, and pipeline.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Kpi testid="kpi-customers" icon={Users} label="Total Customers" value={kpis.total_customers} hint={`${kpis.active_customers} active`} />
        <Kpi testid="kpi-amc" icon={ShieldCheck} label="Active AMC" value={kpis.active_amc} hint={`${kpis.expiring_amc} expiring 30d`} accent="emerald" />
        <Kpi testid="kpi-jobs-today" icon={Briefcase} label="Jobs Today" value={kpis.jobs_today} hint={`${kpis.jobs_week} this week`} accent="blue" />
        <Kpi testid="kpi-completed" icon={CheckCircle2} label="Completed Jobs" value={kpis.completed_jobs} accent="emerald" />
        <Kpi testid="kpi-pending" icon={Clock} label="Pending Jobs" value={kpis.pending_jobs} accent="amber" />
        <Kpi testid="kpi-revenue" icon={TrendingUp} label="Monthly Revenue" value={fmtAED(kpis.monthly_revenue)} accent="emerald" />
        <Kpi testid="kpi-expenses" icon={TrendingDown} label="Monthly Expenses" value={fmtAED(kpis.monthly_expenses)} accent="rose" />
        <Kpi testid="kpi-profit" icon={Wallet} label="Monthly Profit" value={fmtAED(kpis.monthly_profit)} accent="emerald" />
        <Kpi testid="kpi-outstanding" icon={Receipt} label="Outstanding" value={fmtAED(kpis.outstanding_invoices)} accent="amber" />
        <Kpi testid="kpi-utilization" icon={Activity} label="Tech Utilization" value={`${kpis.technician_utilization}%`} accent="blue" />
        <Kpi testid="kpi-expiring-amc" icon={AlertTriangle} label="Expiring AMCs" value={kpis.expiring_amc} hint="Next 30 days" accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-display text-lg">Revenue Trend (6 months)</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={charts.revenue_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#047857" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-lg mb-3">Jobs by Service</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={charts.jobs_by_type} dataKey="value" nameKey="name" outerRadius={80} label>
                {charts.jobs_by_type.map((entry) => <Cell key={entry.name} fill={COLORS[charts.jobs_by_type.indexOf(entry) % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-lg mb-3">Lead Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.lead_funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="stage" type="category" width={110} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-display text-lg mb-3">Technician Performance</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.tech_performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="jobs" fill="#047857" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
