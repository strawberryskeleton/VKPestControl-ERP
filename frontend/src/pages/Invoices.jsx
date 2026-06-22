import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Download } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { toast } from "sonner";
import { esc, openPrintWindow, printCss } from "../lib/pdf";

const STATUS_VARIANT = { Paid: "bg-emerald-100 text-emerald-800", Sent: "bg-blue-100 text-blue-700", Overdue: "bg-rose-100 text-rose-800", Draft: "bg-slate-100 text-slate-700" };

const today = () => new Date().toISOString().slice(0,10);
const plus = (n) => { const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };

const Invoices = () => {
  const [items, setItems] = useState([]);
  const [custs, setCusts] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ customer_id: "", amount: 0, vat: 0, total: 0, due_date: plus(15), status: "Draft", description: "" });

  const load = async () => { const [i, c] = await Promise.all([api.get("/invoices"), api.get("/customers")]); setItems(i.data); setCusts(c.data); };
  useEffect(()=>{ load(); }, []);

  const recalc = (a) => { const x = parseFloat(a)||0; const v = +(x*0.05).toFixed(2); return { amount:x, vat:v, total: +(x+v).toFixed(2) }; };
  const save = async () => { try { await api.post("/invoices", f); toast.success("Invoice created"); setOpen(false); load(); } catch { toast.error("Error"); } };
  const setStatus = async (id, status) => { await api.patch(`/invoices/${id}/status`, { status }); load(); };

  const printPdf = (inv) => {
    const html = `<!doctype html><html><head><title>${esc(inv.invoice_number)}</title><style>${printCss}</style></head><body>
    <div class="header"><div><h1>TAX INVOICE</h1><div>${esc(inv.invoice_number)}</div></div>
    <div style="text-align:right"><strong>PestERP UAE</strong><br/>Dubai, UAE<br/>TRN: 100123456700003</div></div>
    <div><strong>Bill to:</strong> ${esc(inv.customer_name)}</div>
    <div><strong>Due:</strong> ${esc(inv.due_date)}</div>
    <table><thead><tr><th>Description</th><th class="right">Amount</th></tr></thead>
    <tbody><tr><td>${esc(inv.description||"Pest control service")}</td><td class="right">${esc(inv.amount.toFixed(2))}</td></tr></tbody></table>
    <table style="margin-top:8px;border:none"><tr><td style="border:none;text-align:right">VAT (5%)</td><td style="border:none;text-align:right;width:140px">${esc(inv.vat.toFixed(2))}</td></tr>
    <tr><td style="border:none;text-align:right" class="total">TOTAL</td><td style="border:none;text-align:right" class="total">AED ${esc(inv.total.toFixed(2))}</td></tr></table>
    <script>window.print();<\/script></body></html>`;
    openPrintWindow(html);
  };

  return (
    <div className="space-y-5" data-testid="invoices-page">
      <div className="flex justify-between items-center">
        <div><h2 className="font-display text-2xl sm:text-3xl">Invoices</h2><p className="text-sm text-muted-foreground">VAT-compliant invoicing.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-emerald-700 hover:bg-emerald-800 gap-2" data-testid="new-invoice-btn"><Plus className="w-4 h-4"/>New Invoice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Customer</Label>
                <Select value={f.customer_id} onValueChange={v=>setF({...f, customer_id:v})}>
                  <SelectTrigger data-testid="inv-customer"><SelectValue placeholder="Select"/></SelectTrigger>
                  <SelectContent>{custs.map(c=> <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Amount (AED)</Label><Input type="number" data-testid="inv-amount" value={f.amount} onChange={e=>setF({...f, ...recalc(e.target.value)})}/></div>
              <div><Label>Due Date</Label><Input type="date" value={f.due_date} onChange={e=>setF({...f, due_date:e.target.value})}/></div>
              <div><Label>Description</Label><Input value={f.description} onChange={e=>setF({...f, description:e.target.value})}/></div>
              <div className="text-sm">VAT: AED {f.vat} · <strong>Total: AED {f.total}</strong></div>
            </div>
            <Button onClick={save} data-testid="inv-save" className="bg-emerald-700 hover:bg-emerald-800">Save</Button>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map(i => (
              <TableRow key={i.id} data-testid={`inv-row-${i.id}`}>
                <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                <TableCell>{i.customer_name}</TableCell>
                <TableCell>AED {i.total}</TableCell>
                <TableCell className="text-xs">{i.due_date}</TableCell>
                <TableCell>
                  <Select value={i.status} onValueChange={(v)=>setStatus(i.id, v)}>
                    <SelectTrigger className={`w-32 h-8 text-xs ${STATUS_VARIANT[i.status]||""}`}><SelectValue/></SelectTrigger>
                    <SelectContent>{["Draft","Sent","Paid","Overdue"].map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={()=>printPdf(i)} data-testid={`pdf-inv-${i.id}`}><Download className="w-4 h-4"/></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Invoices;
