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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";

const COLORS = ["#047857", "#3b82f6", "#f59e0b"];

const Investments = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ asset_type: "Mutual Fund", name: "", units: 0, quantity: 0, sip_amount: 0, avg_cost: 0, buy_price: 0, current_value: 0 });

  const load = async () => { const { data } = await api.get("/investments"); setItems(data); };
  useEffect(()=>{ load(); }, []);

  const save = async () => {
    try { await api.post("/investments", { ...f, units: +f.units, quantity: +f.quantity, sip_amount: +f.sip_amount, avg_cost: +f.avg_cost, buy_price: +f.buy_price, current_value: +f.current_value });
      toast.success("Added"); setOpen(false); load(); } catch { toast.error("Error"); }
  };
  const del = async (id) => { await api.delete(`/investments/${id}`); load(); };

  const totalValue = items.reduce((s,i)=>s+i.current_value, 0);
  const totalCost = items.reduce((s,i)=>s + (i.avg_cost * i.units || i.buy_price * i.quantity), 0);
  const pnl = totalValue - totalCost;

  const alloc = useMemo(() => {
    const m = {}; items.forEach(i => { m[i.asset_type] = (m[i.asset_type]||0)+i.current_value; });
    return Object.entries(m).map(([name, value])=>({ name, value }));
  }, [items]);

  // Projections (assume 12% CAGR + monthly SIP)
  const monthlySip = items.reduce((s,i)=>s + (i.sip_amount||0), 0);
  const project = (years) => {
    const r = 0.12 / 12;
    let val = totalValue;
    for (let m = 0; m < years*12; m++) val = val*(1+r) + monthlySip;
    return val;
  };
  const proj = [1,3,5,10].map(y => ({ year: `${y}y`, value: Math.round(project(y)) }));

  return (
    <div className="space-y-5" data-testid="investments-page">
      <div className="flex justify-between items-center">
        <div><h2 className="font-display text-2xl sm:text-3xl">Investment Tracker</h2><p className="text-sm text-muted-foreground">Portfolio of mutual funds, ETFs, and stocks with projections.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-emerald-700 hover:bg-emerald-800 gap-2" data-testid="new-inv-btn"><Plus className="w-4 h-4"/>New Holding</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Holding</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Type</Label>
                <Select value={f.asset_type} onValueChange={v=>setF({...f, asset_type:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{["Mutual Fund","ETF","Stock"].map(t=> <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Name</Label><Input data-testid="inv-name" value={f.name} onChange={e=>setF({...f, name:e.target.value})}/></div>
              {f.asset_type === "Mutual Fund" && (<>
                <div><Label>SIP Amount</Label><Input type="number" value={f.sip_amount} onChange={e=>setF({...f, sip_amount:e.target.value})}/></div>
                <div><Label>Units</Label><Input type="number" value={f.units} onChange={e=>setF({...f, units:e.target.value})}/></div>
                <div><Label>Avg Cost</Label><Input type="number" value={f.avg_cost} onChange={e=>setF({...f, avg_cost:e.target.value})}/></div>
              </>)}
              {f.asset_type === "ETF" && (<>
                <div><Label>Units</Label><Input type="number" value={f.units} onChange={e=>setF({...f, units:e.target.value})}/></div>
                <div><Label>Avg Cost</Label><Input type="number" value={f.avg_cost} onChange={e=>setF({...f, avg_cost:e.target.value})}/></div>
              </>)}
              {f.asset_type === "Stock" && (<>
                <div><Label>Quantity</Label><Input type="number" value={f.quantity} onChange={e=>setF({...f, quantity:e.target.value})}/></div>
                <div><Label>Buy Price</Label><Input type="number" value={f.buy_price} onChange={e=>setF({...f, buy_price:e.target.value})}/></div>
              </>)}
              <div className="col-span-2"><Label>Current Value</Label><Input type="number" data-testid="inv-curval" value={f.current_value} onChange={e=>setF({...f, current_value:e.target.value})}/></div>
            </div>
            <Button onClick={save} data-testid="inv-save" className="bg-emerald-700 hover:bg-emerald-800">Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Portfolio Value</div><div className="font-display text-2xl mt-2 text-emerald-700">AED {totalValue.toLocaleString()}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">P&L</div><div className={`font-display text-2xl mt-2 ${pnl>=0?"text-emerald-700":"text-rose-700"}`}>AED {pnl.toLocaleString()}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">10y Projection (12% CAGR)</div><div className="font-display text-2xl mt-2">AED {project(10).toLocaleString(undefined,{maximumFractionDigits:0})}</div></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-display text-lg mb-3">Asset Allocation</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={alloc} dataKey="value" nameKey="name" outerRadius={80} label>
                {alloc.map((a)=> <Cell key={a.name} fill={COLORS[alloc.indexOf(a) % COLORS.length]}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-display text-lg mb-3">Net Worth Forecast</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={proj}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
              <XAxis dataKey="year"/><YAxis/>
              <Tooltip/>
              <Line dataKey="value" stroke="#047857" strokeWidth={2.5}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Name</TableHead><TableHead>Qty</TableHead><TableHead>Cost</TableHead><TableHead>Value</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map(i => (
              <TableRow key={i.id}>
                <TableCell>{i.asset_type}</TableCell>
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell>{i.units || i.quantity}</TableCell>
                <TableCell>AED {(i.avg_cost || i.buy_price).toLocaleString()}</TableCell>
                <TableCell>AED {i.current_value.toLocaleString()}</TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={()=>del(i.id)} data-testid={`del-${i.id}`}><Trash2 className="w-4 h-4"/></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Investments;
