require('dotenv').config();

async function checkApiKey() {
  const res = await fetch("https://socialboosters.web.id/api/v1/sandbox/payment/channels", {
    headers: {
      api_key: process.env.PGKU_API_KEY,
      kode_api: process.env.PGKU_KODE_API
    }
  });
  console.log("Channels status:", res.status);
  const data = await res.json();
  console.log("Channels response:", JSON.stringify(data, null, 2));
}

checkApiKey().catch(console.error);
