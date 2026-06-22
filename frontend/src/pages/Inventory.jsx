import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Plus, AlertTriangle, Trash2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { toast } from "sonner";

const empty = { chemical_name: "", category: "Insecticide", supplier: "", quantity: 0, unit: "Liters", batch_number: "", expiry_date: "", min_stock: 10 };

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);

  const load = async () => { const { data } = await api.get("/inventory"); setItems(data); };
  useEffect(()=>{ load(); }, []);

  const save = async () => { try { await api.post("/inventory", { ...f, quantity: +f.quantity, min_stock: +f.min_stock }); toast.success("Item added"); setOpen(false); setF(empty); load(); } catch { toast.error("Error"); } };
  const del = async (id) => { await api.delete(`/inventory/${id}`); load(); };

  const today = new Date();
  const isLow = (i) => i.quantity <= i.min_stock;
  const isExpiringSoon = (i) => { if (!i.expiry_date) return false; const d = new Date(i.expiry_date); return (d-today)/86400000 < 30; };

  return (
    <div className="space-y-5" data-testid="inventory-page">
      <div className="flex justify-between items-center">
        <div><h2 className="font-display text-2xl sm:text-3xl">Inventory</h2><p className="text-sm text-muted-foreground">Chemicals, baits, and traps with stock alerts.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-emerald-700 hover:bg-emerald-800 gap-2" data-testid="new-inv-btn"><Plus className="w-4 h-4"/>New Item</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Item</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              {[["Chemical Name","chemical_name"],["Category","category"],["Supplier","supplier"],["Unit","unit"],["Batch","batch_number"]].map(([l,k])=>(
                <div key={k}><Label>{l}</Label><Input data-testid={`inv-${k}`} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/></div>
              ))}
              <div><Label>Quantity</Label><Input type="number" data-testid="inv-quantity" value={f.quantity} onChange={e=>setF({...f, quantity:e.target.value})}/></div>
              <div><Label>Min Stock</Label><Input type="number" value={f.min_stock} onChange={e=>setF({...f, min_stock:e.target.value})}/></div>
              <div className="col-span-2"><Label>Expiry Date</Label><Input type="date" value={f.expiry_date} onChange={e=>setF({...f, expiry_date:e.target.value})}/></div>
            </div>
            <Button onClick={save} data-testid="inv-save" className="bg-emerald-700 hover:bg-emerald-800">Save</Button>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Supplier</TableHead><TableHead>Stock</TableHead><TableHead>Batch</TableHead><TableHead>Expiry</TableHead><TableHead>Alerts</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map(i => (
              <TableRow key={i.id} data-testid={`inv-row-${i.id}`}>
                <TableCell className="font-medium">{i.chemical_name}</TableCell>
                <TableCell>{i.category}</TableCell>
                <TableCell className="text-sm">{i.supplier}</TableCell>
                <TableCell>{i.quantity} {i.unit}</TableCell>
                <TableCell className="font-mono text-xs">{i.batch_number}</TableCell>
                <TableCell className="text-xs">{i.expiry_date}</TableCell>
                <TableCell className="flex gap-1">
                  {isLow(i) && <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3"/>Low</Badge>}
                  {isExpiringSoon(i) && <Badge className="bg-amber-100 text-amber-800">Expiring</Badge>}
                </TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={()=>del(i.id)} data-testid={`del-inv-${i.id}`}><Trash2 className="w-4 h-4"/></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Inventory;
