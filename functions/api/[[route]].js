export async function onRequest() {
  return new Response(JSON.stringify({ service: 'tpl-lerp-hrms-payroll', status: 'ok', items: [{"id":"EMP-1042","name":"Karthik Warrier (Senior Full-Stack Engineer)","phone":"919847011223","detail":"Shift: 09:30 AM Geo-Verified (Kochi HQ) • Oct Net Pay: ₹84,200","status":"PAYSLIP ISSUED ✅","amount":"₹84,200"},{"id":"LVE-409","name":"Sneha Nambiar (Product Marketing Lead)","phone":"919447022334","detail":"Earned Leave Request: Nov 18–20 (3 Days — Family Wedding) • Balance: 14d","status":"PENDING APPROVAL","amount":"3 Days Paid"},{"id":"EXP-812","name":"Rohit Shenoy (Enterprise Sales VP)","phone":"919895033445","detail":"Bangalore Client Visit Flight + Taj Stay (GST Invoice Attached)","status":"APPROVED // PAYROLL","amount":"₹16,450"}] }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120' }
  });
}
