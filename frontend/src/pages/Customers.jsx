import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Search, Eye } from "lucide-react";
import { toast } from "sonner";

const empty = { name: "", contact_person: "", mobile: "", email: "", address: "", area: "", city: "Dubai", customer_type: "Residential", trn_number: "" };

const Customers = () => {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async (search) => {
    const { data } = await api.get("/customers", { params: search ? { q: search } : {} });
    setItems(data);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await api.post("/customers", form);
      toast.success("Customer created");
      setOpen(false); setForm(empty); load();
    } catch { toast.error("Error creating"); }
  };

  return (
    <div className="space-y-5" data-testid="customers-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl">Customers</h2>
          <p className="text-sm text-muted-foreground">CRM directory of residential & commercial clients.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-customer-btn" className="bg-emerald-700 hover:bg-emerald-800 gap-2"><Plus className="w-4 h-4" /> New Customer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              {[["Name","name"],["Contact Person","contact_person"],["Mobile","mobile"],["Email","email"],["Address","address"],["Area","area"],["City","city"],["TRN","trn_number"]].map(([l,k]) => (
                <div key={k} className={k==="address"?"col-span-2":""}>
                  <Label>{l}</Label>
                  <Input data-testid={`cust-${k}`} value={form[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} />
                </div>
              ))}
              <div className="col-span-2">
                <Label>Type</Label>
                <Select value={form.customer_type} onValueChange={(v)=>setForm({...form, customer_type:v})}>
                  <SelectTrigger data-testid="cust-type"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Residential">Residential</SelectItem><SelectItem value="Commercial">Commercial</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={create} data-testid="cust-save" className="bg-emerald-700 hover:bg-emerald-800">Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input data-testid="cust-search" className="pl-9" placeholder="Search name, mobile, code…" value={q} onChange={(e)=>{setQ(e.target.value); load(e.target.value);}} />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Mobile</TableHead>
              <TableHead>Area</TableHead><TableHead>Type</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id} data-testid={`cust-row-${c.id}`}>
                <TableCell className="font-mono text-xs">{c.code}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.mobile}</TableCell>
                <TableCell>{c.area}</TableCell>
                <TableCell><Badge variant={c.customer_type === "Commercial" ? "default" : "secondary"}>{c.customer_type}</Badge></TableCell>
                <TableCell><Link to={`/customers/${c.id}`}><Button size="sm" variant="ghost" data-testid={`view-${c.id}`}><Eye className="w-4 h-4" /></Button></Link></TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No customers</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Customers;
