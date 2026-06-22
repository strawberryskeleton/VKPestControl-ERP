import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";

const CATS = ["Salaries", "Fuel", "Chemicals", "Vehicles", "Rent", "Utilities", "Miscellaneous"];

const Finance = () => {
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ category: "Fuel", amount: 0, description: "", date: new Date().toISOString().slice(0,10) });

  const load = async () => {
    const [e, i] = await Promise.all([api.get("/expenses"), api.get("/invoices")]);
    setExpenses(e.data); setInvoices(i.data);
  };
  useEffect(()=>{ load(); }, []);

  const save = async () => { try { await api.post("/expenses", { ...f, amount: +f.amount }); toast.success("Expense added"); setOpen(false); load(); } catch { toast.error("Error"); } };
  const del = async (id) => { await api.delete(`/expenses/${id}`); load(); };

  const totalIncome = useMemo(() => invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.total,0), [invoices]);
  const totalExp = useMemo(() => expenses.reduce((s,e)=>s+e.amount,0), [expenses]);
  const byCat = useMemo(() => {
    const m = {}; expenses.forEach(e => { m[e.category] = (m[e.category]||0)+e.amount; });
    return Object.entries(m).map(([name, value])=>({ name, value }));
  }, [expenses]);

  return (
    <div className="space-y-5" data-testid="finance-page">
      <div className="flex justify-between items-center">
        <div><h2 className="font-display text-2xl sm:text-3xl">Finance</h2><p className="text-sm text-muted-foreground">Income, expenses, P&L analysis.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-emerald-700 hover:bg-emerald-800 gap-2" data-testid="new-expense-btn"><Plus className="w-4 h-4"/>New Expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Category</Label>
                <Select value={f.category} onValueChange={v=>setF({...f, category:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{CATS.map(c=> <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Amount (AED)</Label><Input type="number" data-testid="exp-amount" value={f.amount} onChange={e=>setF({...f, amount:e.target.value})}/></div>
              <div><Label>Date</Label><Input type="date" value={f.date} onChange={e=>setF({...f, date:e.target.value})}/></div>
              <div><Label>Description</Label><Input value={f.description} onChange={e=>setF({...f, description:e.target.value})}/></div>
            </div>
            <Button onClick={save} data-testid="exp-save" className="bg-emerald-700 hover:bg-emerald-800">Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Income (Paid)</div><div className="font-display text-2xl mt-2 text-emerald-700">AED {totalIncome.toLocaleString()}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Expenses</div><div className="font-display text-2xl mt-2 text-rose-700">AED {totalExp.toLocaleString()}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Net Profit</div><div className={`font-display text-2xl mt-2 ${totalIncome-totalExp>=0?"text-emerald-700":"text-rose-700"}`}>AED {(totalIncome-totalExp).toLocaleString()}</div></Card>
      </div>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">Expenses by Category</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={byCat}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
            <XAxis dataKey="name" tick={{ fontSize: 12 }}/>
            <YAxis tick={{ fontSize: 12 }}/>
            <Tooltip/>
            <Bar dataKey="value" fill="#047857" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {expenses.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-xs">{e.date}</TableCell>
                <TableCell>{e.category}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.description}</TableCell>
                <TableCell>AED {e.amount.toLocaleString()}</TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={()=>del(e.id)} data-testid={`del-exp-${e.id}`}><Trash2 className="w-4 h-4"/></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Finance;
