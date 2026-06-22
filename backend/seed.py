"""Seed demo data for Pest Control ERP."""
import uuid, bcrypt
from datetime import datetime, timezone, timedelta

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def gen_id():
    return str(uuid.uuid4())

def hash_pw(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

async def seed_all(db):
    # Users
    users = [
        {"id": gen_id(), "name": "Admin", "email": "admin@pestcontrol.ae", "password": hash_pw("admin123"), "role": "super_admin", "phone": "+971500000001", "active": True, "created_at": now_iso()},
        {"id": gen_id(), "name": "Operations Manager", "email": "ops@pestcontrol.ae", "password": hash_pw("ops123"), "role": "ops_manager", "phone": "+971500000002", "active": True, "created_at": now_iso()},
        {"id": gen_id(), "name": "Sales Rep", "email": "sales@pestcontrol.ae", "password": hash_pw("sales123"), "role": "sales", "phone": "+971500000003", "active": True, "created_at": now_iso()},
        {"id": gen_id(), "name": "Accountant", "email": "accountant@pestcontrol.ae", "password": hash_pw("acc123"), "role": "accountant", "phone": "+971500000004", "active": True, "created_at": now_iso()},
    ]
    tech_names = ["Rashid Khan", "Mohammed Ali", "Ahmed Hassan", "Vijay Kumar", "Suresh Nair", "Imran Sheikh", "Bilal Ahmed", "Faisal Hussain", "Karthik Iyer", "Salman Raza", "Ravi Patel", "Tariq Aziz"]
    technicians = []
    for i, n in enumerate(tech_names):
        t = {"id": gen_id(), "name": n, "email": f"tech{i+1}@pestcontrol.ae", "password": hash_pw("tech123"), "role": "technician", "phone": f"+97150111{i:04d}", "active": True, "created_at": now_iso()}
        technicians.append(t)
    await db.users.insert_many(users + technicians)

    # Customers
    areas = ["JLT", "Dubai Marina", "Downtown", "Business Bay", "JVC", "Al Barsha", "Deira", "Sharjah", "Mirdif", "Silicon Oasis"]
    cust_names = [
        ("Al Habtoor Tower", "Commercial"), ("Dar Wasl Mall", "Commercial"),
        ("Marina Heights Villa", "Residential"), ("Burj Al Arab Office", "Commercial"),
        ("JLT Residence 12", "Residential"), ("Damac Heights", "Residential"),
        ("Emaar Square Cafe", "Commercial"), ("Mirdif Hills Villa", "Residential"),
        ("DSO Tech Park", "Commercial"), ("Sharjah Family Home", "Residential"),
        ("Al Quoz Warehouse", "Commercial"), ("Downtown Loft 22", "Residential"),
        ("JVC Garden Villa", "Residential"), ("Business Bay Tower B", "Commercial"),
        ("Al Barsha Restaurant", "Commercial"),
    ]
    customers = []
    for i, (n, t) in enumerate(cust_names):
        c = {
            "id": gen_id(),
            "code": f"CUST-{1001+i}",
            "name": n,
            "contact_person": ["Mr. Khalid", "Ms. Aisha", "Mr. Omar", "Ms. Fatima", "Mr. Sami"][i % 5],
            "mobile": f"+97155{1000000+i:07d}",
            "email": f"contact{i+1}@example.ae",
            "address": f"Building {i+10}, Street {i+1}",
            "area": areas[i % len(areas)],
            "city": "Dubai",
            "customer_type": t,
            "trn_number": f"100{i}123456789",
            "active": True,
            "created_at": now_iso(),
        }
        customers.append(c)
    await db.customers.insert_many(customers)

    # Leads
    sources = ["Google", "Website", "Referral", "Facebook", "Instagram", "WhatsApp"]
    stages = ["New", "Contacted", "Site Inspection", "Quotation Sent", "Follow Up", "Negotiation", "Won", "Lost"]
    services_req = ["General Pest Control", "Cockroach Treatment", "Termite Treatment", "Bed Bug Treatment", "Rodent Control"]
    leads = []
    for i in range(18):
        leads.append({
            "id": gen_id(),
            "name": f"Lead Contact {i+1}",
            "mobile": f"+97152{2000000+i:07d}",
            "email": f"lead{i+1}@example.ae",
            "area": areas[i % len(areas)],
            "source": sources[i % len(sources)],
            "service_required": services_req[i % len(services_req)],
            "estimated_value": 500 + (i * 250),
            "stage": stages[i % len(stages)],
            "notes": "Initial inquiry via website form.",
            "created_at": now_iso(),
            "updated_at": now_iso(),
        })
    await db.leads.insert_many(leads)

    # AMC contracts
    today = datetime.now(timezone.utc).date()
    amcs = []
    for i, c in enumerate(customers[:10]):
        start = today - timedelta(days=30 * (i+1))
        end = start + timedelta(days=365)
        amcs.append({
            "id": gen_id(),
            "contract_number": f"AMC-{2001+i}",
            "customer_id": c["id"],
            "customer_name": c["name"],
            "amc_type": c["customer_type"],
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "contract_value": 1200 + (i * 300),
            "visits_per_year": 4 if c["customer_type"] == "Residential" else 12,
            "visits_used": i % 4,
            "status": "Active",
            "created_at": now_iso(),
        })
    await db.amc.insert_many(amcs)

    # Jobs
    service_types = ["General Pest Control", "Cockroach Treatment", "Termite Treatment", "Bed Bug Treatment", "Rodent Control", "Mosquito Fogging"]
    job_statuses = ["Scheduled", "Assigned", "In Progress", "Completed", "Completed", "Completed"]
    jobs = []
    for i in range(40):
        c = customers[i % len(customers)]
        t = technicians[i % len(technicians)]
        sched = today + timedelta(days=(i - 20))
        status = job_statuses[i % len(job_statuses)]
        j = {
            "id": gen_id(),
            "job_number": f"JOB-{5001+i}",
            "customer_id": c["id"],
            "customer_name": c["name"],
            "customer_mobile": c["mobile"],
            "customer_address": c["address"],
            "service_type": service_types[i % len(service_types)],
            "technician_id": t["id"],
            "technician_name": t["name"],
            "scheduled_date": sched.isoformat(),
            "scheduled_time": f"{9 + (i % 8):02d}:00",
            "status": status,
            "notes": "Standard service",
            "before_photos": [],
            "after_photos": [],
        }
        if status == "Completed":
            j["completed_at"] = now_iso()
            j["chemicals_used"] = "Cypermethrin 0.5L"
            j["tech_notes"] = "Treatment completed successfully."
        j["created_at"] = now_iso()
        jobs.append(j)
    await db.jobs.insert_many(jobs)

    # Invoices
    invoices = []
    for i in range(25):
        c = customers[i % len(customers)]
        amt = 350 + (i * 75)
        vat = round(amt * 0.05, 2)
        statuses_inv = ["Paid", "Paid", "Paid", "Sent", "Overdue", "Draft"]
        st = statuses_inv[i % len(statuses_inv)]
        inv = {
            "id": gen_id(),
            "invoice_number": f"INV-{3001+i}",
            "customer_id": c["id"],
            "customer_name": c["name"],
            "amount": amt,
            "vat": vat,
            "total": amt + vat,
            "due_date": (today + timedelta(days=15)).isoformat(),
            "status": st,
            "description": "Pest control service",
            "created_at": now_iso(),
        }
        if st == "Paid":
            inv["paid_at"] = (today - timedelta(days=i)).isoformat()
        invoices.append(inv)
    await db.invoices.insert_many(invoices)

    # Expenses
    cats = ["Salaries", "Fuel", "Chemicals", "Vehicles", "Rent", "Utilities", "Miscellaneous"]
    expenses = []
    for i in range(20):
        expenses.append({
            "id": gen_id(),
            "category": cats[i % len(cats)],
            "amount": 200 + (i * 150),
            "description": f"{cats[i % len(cats)]} expense for month",
            "date": (today - timedelta(days=i*2)).isoformat(),
            "created_at": now_iso(),
        })
    await db.expenses.insert_many(expenses)

    # Inventory
    chemicals = [
        ("Cypermethrin 10%", "Insecticide", 50, "Liters"),
        ("Fipronil Gel", "Bait", 30, "Tubes"),
        ("Imidacloprid", "Insecticide", 25, "Liters"),
        ("Brodifacoum", "Rodenticide", 15, "Kg"),
        ("Deltamethrin SC", "Insecticide", 40, "Liters"),
        ("Boric Acid", "Powder", 20, "Kg"),
        ("Glue Boards", "Trap", 100, "Pcs"),
        ("Snap Traps", "Trap", 60, "Pcs"),
    ]
    inv_items = []
    for name, cat, qty, unit in chemicals:
        inv_items.append({
            "id": gen_id(),
            "chemical_name": name,
            "category": cat,
            "supplier": "Bayer / Syngenta",
            "quantity": qty,
            "unit": unit,
            "batch_number": f"BATCH-{uuid.uuid4().hex[:6].upper()}",
            "expiry_date": (today + timedelta(days=400)).isoformat(),
            "min_stock": 10,
            "created_at": now_iso(),
        })
    await db.inventory.insert_many(inv_items)

    # Investments
    investments = [
        {"id": gen_id(), "asset_type": "Mutual Fund", "name": "HDFC Top 100", "units": 250, "sip_amount": 5000, "avg_cost": 800, "current_value": 230000, "created_at": now_iso()},
        {"id": gen_id(), "asset_type": "ETF", "name": "Vanguard S&P 500", "units": 30, "avg_cost": 380, "current_value": 14250, "created_at": now_iso()},
        {"id": gen_id(), "asset_type": "Stock", "name": "Apple Inc.", "quantity": 20, "buy_price": 150, "current_value": 4200, "created_at": now_iso()},
        {"id": gen_id(), "asset_type": "Stock", "name": "Microsoft Corp", "quantity": 15, "buy_price": 280, "current_value": 6300, "created_at": now_iso()},
    ]
    await db.investments.insert_many(investments)
