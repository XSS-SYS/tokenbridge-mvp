import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
const apiKey = process.env.LEMONSQUEEZY_API_KEY;

async function main() {
  const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${apiKey}` };
  
  // Check store details for payout info
  const sRes = await fetch(`https://api.lemonsqueezy.com/v1/stores`, { headers });
  const sData = await sRes.json();
  for (const s of sData.data || []) {
    console.log(`Store: ${s.attributes.name}`);
    console.log(`  ID: ${s.id}`);
    console.log(`  Currency: ${s.attributes.currency}`);
    console.log(`  Country: ${s.attributes.country}`);
    console.log(`  Platform: ${s.attributes.platform}`);
    console.log(`  Payouts: ${JSON.stringify(s.attributes.payouts || {})}`);
    console.log(`  Total sales: ${s.attributes.total_sales}`);
    console.log(`  Total revenue: ${s.attributes.total_revenue}`);
  }
}
main().catch(e => console.error(e.message));
