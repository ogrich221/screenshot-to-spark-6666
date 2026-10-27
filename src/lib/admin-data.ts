export type Status = "Verified" | "Review needed" | "Temporarily restricted" | "Closed";

export type Customer = {
  id: string; name: string; email: string; phone: string; country: string; joined: string;
  status: Status; risk: "Low" | "Medium" | "High"; segment: "Personal" | "Business" | "Premier";
};

export const customers: Customer[] = [
  { id: "c-1001", name: "Maya Chen", email: "maya.chen@mail.com", phone: "+1 415 555 0142", country: "United States", joined: "2023-03-14", status: "Verified", risk: "Low", segment: "Premier" },
  { id: "c-1002", name: "Daniel Kowalski", email: "d.kowalski@mail.com", phone: "+44 20 7946 0321", country: "United Kingdom", joined: "2024-01-08", status: "Review needed", risk: "Medium", segment: "Personal" },
  { id: "c-1003", name: "Sofia Laurent", email: "sofia.l@mail.fr", phone: "+33 1 70 18 22 90", country: "France", joined: "2022-11-02", status: "Verified", risk: "Low", segment: "Personal" },
  { id: "c-1004", name: "Harbor & Pine Ltd", email: "finance@harborpine.co", phone: "+1 604 555 0199", country: "Canada", joined: "2023-07-21", status: "Verified", risk: "Low", segment: "Business" },
  { id: "c-1005", name: "Kenji Watanabe", email: "kenji.w@mail.jp", phone: "+81 3 5550 8812", country: "Japan", joined: "2024-05-30", status: "Temporarily restricted", risk: "High", segment: "Personal" },
  { id: "c-1006", name: "Lucía Fernández", email: "lucia.f@mail.es", phone: "+34 91 555 0177", country: "Spain", joined: "2021-09-12", status: "Verified", risk: "Low", segment: "Premier" },
  { id: "c-1007", name: "Arjun Mehta", email: "arjun.m@mail.in", phone: "+91 22 5550 3344", country: "India", joined: "2024-08-03", status: "Review needed", risk: "Medium", segment: "Business" },
  { id: "c-1008", name: "Emma Schulz", email: "emma.schulz@mail.de", phone: "+49 30 5550 2211", country: "Germany", joined: "2020-04-18", status: "Closed", risk: "Low", segment: "Personal" },
  { id: "c-1009", name: "Rafael Souza", email: "rafael.s@mail.br", phone: "+55 11 5550 9087", country: "Brazil", joined: "2023-12-01", status: "Verified", risk: "Low", segment: "Personal" },
  { id: "c-1010", name: "Olivia Bennett", email: "olivia.b@mail.au", phone: "+61 2 5550 6611", country: "Australia", joined: "2022-06-25", status: "Verified", risk: "Medium", segment: "Premier" },
];

export const accounts = [
  { id: "ac-2001", customer: "c-1001", type: "Current account", number: "•••• 4821", balance: 0, currency: "USD", status: "Verified" as Status, restriction: "None" },
  { id: "ac-2002", customer: "c-1001", type: "Savings · Holiday goal", number: "•••• 7710", balance: 0, currency: "USD", status: "Verified" as Status, restriction: "None" },
  { id: "ac-2003", customer: "c-1002", type: "Current account", number: "•••• 1290", balance: 0, currency: "GBP", status: "Review needed" as Status, restriction: "Outbound transfers paused" },
  { id: "ac-2004", customer: "c-1003", type: "Current account", number: "•••• 5532", balance: 0, currency: "EUR", status: "Verified" as Status, restriction: "None" },
  { id: "ac-2005", customer: "c-1004", type: "Business account", number: "•••• 9001", balance: 0, currency: "CAD", status: "Verified" as Status, restriction: "None" },
  { id: "ac-2006", customer: "c-1005", type: "Current account", number: "•••• 6634", balance: 0, currency: "JPY", status: "Temporarily restricted" as Status, restriction: "All debits blocked" },
  { id: "ac-2007", customer: "c-1006", type: "Premier account", number: "•••• 3348", balance: 0, currency: "EUR", status: "Verified" as Status, restriction: "None" },
  { id: "ac-2008", customer: "c-1007", type: "Business account", number: "•••• 7765", balance: 0, currency: "INR", status: "Review needed" as Status, restriction: "Pending documents" },
  { id: "ac-2009", customer: "c-1008", type: "Current account", number: "•••• 2201", balance: 0, currency: "EUR", status: "Closed" as Status, restriction: "Closed by customer" },
];

export type TxStatus = "Completed" | "Pending" | "Flagged" | "Reversed";
export const transactions = [
  { id: "tx-9001", customer: "c-1001", date: "2026-10-27 09:12", description: "Corner Café", amount: 0, currency: "USD", status: "Completed" as TxStatus },
  { id: "tx-9002", customer: "c-1004", date: "2026-10-27 08:55", description: "Supplier payment · Northwind", amount: 0, currency: "CAD", status: "Pending" as TxStatus },
  { id: "tx-9003", customer: "c-1005", date: "2026-10-27 08:31", description: "International transfer · unknown payee", amount: 0, currency: "JPY", status: "Flagged" as TxStatus },
  { id: "tx-9004", customer: "c-1001", date: "2026-10-26 17:40", description: "Salary · Brightline Studio", amount: 0, currency: "USD", status: "Completed" as TxStatus },
  { id: "tx-9005", customer: "c-1002", date: "2026-10-26 15:02", description: "Transfer to savings", amount: 0, currency: "GBP", status: "Completed" as TxStatus },
  { id: "tx-9006", customer: "c-1007", date: "2026-10-26 12:18", description: "Incoming wire · Mehta Exports", amount: 0, currency: "INR", status: "Flagged" as TxStatus },
  { id: "tx-9007", customer: "c-1006", date: "2026-10-26 10:44", description: "Hotel Lisboa", amount: 0, currency: "EUR", status: "Completed" as TxStatus },
  { id: "tx-9008", customer: "c-1003", date: "2026-10-25 19:20", description: "Refund · Online store", amount: 0, currency: "EUR", status: "Reversed" as TxStatus },
  { id: "tx-9009", customer: "c-1009", date: "2026-10-25 14:05", description: "Metro Transit", amount: 0, currency: "BRL", status: "Completed" as TxStatus },
  { id: "tx-9010", customer: "c-1010", date: "2026-10-25 09:30", description: "Mortgage payment", amount: 0, currency: "AUD", status: "Completed" as TxStatus },
];

export const cards = [
  { id: "cd-1", customer: "c-1001", type: "Debit · Contactless", last4: "4821", status: "Active", limit: 0, expires: "08/29" },
  { id: "cd-2", customer: "c-1006", type: "Metal · Premier", last4: "3348", status: "Active", limit: 0, expires: "02/30" },
  { id: "cd-3", customer: "c-1005", type: "Debit · Contactless", last4: "6634", status: "Frozen", limit: 0, expires: "11/28" },
  { id: "cd-4", customer: "c-1002", type: "Virtual", last4: "1290", status: "Active", limit: 0, expires: "04/27" },
  { id: "cd-5", customer: "c-1004", type: "Business · Team", last4: "9001", status: "Active", limit: 0, expires: "09/29" },
  { id: "cd-6", customer: "c-1008", type: "Debit · Contactless", last4: "2201", status: "Cancelled", limit: 0, expires: "01/26" },
];

export const cases = [
  { id: "CS-418", customer: "c-1002", subject: "Can't see my salary deposit", priority: "Needs attention", status: "Open", owner: "Alex Rivera", updated: "12 min ago" },
  { id: "CS-417", customer: "c-1005", subject: "Card frozen while travelling", priority: "Urgent", status: "Open", owner: "Alex Rivera", updated: "26 min ago" },
  { id: "CS-415", customer: "c-1001", subject: "Question about currency fee", priority: "Informational", status: "Waiting on customer", owner: "Alex Rivera", updated: "1 h ago" },
  { id: "CS-412", customer: "c-1007", subject: "Upload business documents", priority: "Needs attention", status: "Open", owner: "Alex Rivera", updated: "3 h ago" },
  { id: "CS-409", customer: "c-1003", subject: "Statement download", priority: "Informational", status: "Resolved", owner: "Alex Rivera", updated: "Yesterday" },
];

export const alerts = [
  { id: "AL-77", level: "Urgent", title: "Unusual international transfer", detail: "Kenji Watanabe · ¥0.00 to a new payee from a new device", customer: "c-1005", time: "08:31" },
  { id: "AL-76", level: "Urgent", title: "Large incoming wire needs source-of-funds check", detail: "Arjun Mehta · ₹0.00 from Mehta Exports", customer: "c-1007", time: "Yesterday" },
  { id: "AL-74", level: "Needs attention", title: "ID document expires in 14 days", detail: "Daniel Kowalski · passport", customer: "c-1002", time: "Yesterday" },
  { id: "AL-71", level: "Needs attention", title: "Business verification incomplete", detail: "Arjun Mehta · missing registration certificate", customer: "c-1007", time: "2 days ago" },
  { id: "AL-69", level: "Informational", title: "Annual review due next month", detail: "Olivia Bennett · Premier customer", customer: "c-1010", time: "3 days ago" },
];

export const activity = [
  { time: "09:14", kind: "Account", text: "Maya Chen opened a new savings goal: Holiday" },
  { time: "08:55", kind: "Large transaction", text: "Harbor & Pine Ltd sent CA$0.00 to Northwind (pending approval)" },
  { time: "08:40", kind: "Request", text: "Daniel Kowalski asked about a missing salary deposit" },
  { time: "08:31", kind: "Alert", text: "Unusual transfer flagged on Kenji Watanabe's account" },
  { time: "07:00", kind: "System", text: "Overnight reconciliation completed with no differences" },
];

export const customerById = (id: string) => customers.find((c) => c.id === id);
export const money = (n: number, c: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
