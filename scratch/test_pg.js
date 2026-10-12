require('dotenv').config();

async function testPG() {
  const isSandbox = process.env.PGKU_MODE === "SANDBOX";
  const baseUrl = isSandbox ? process.env.PGKU_SANDBOX_URL : process.env.PGKU_PRODUCTION_URL;
  const endpoint = isSandbox ? "sandbox/payment/detail" : "production/payment/detail";

  const ref = "970fa202-cb6a-49cd-a596-9bcbe3719a4f";
  console.log(`Checking ${baseUrl}/${endpoint}?reference=${ref}`);

  const res = await fetch(`${baseUrl}/${endpoint}?reference=${ref}`, {
    headers: {
      api_key: process.env.PGKU_API_KEY,
      kode_api: process.env.PGKU_KODE_API,
    }
  });

  const data = await res.json();
  console.log('Result for 970fa202...:', data);

  const ref2 = "f856f615-e37a-41e1-8db0-f725b9a3e8a5";
  const res2 = await fetch(`${baseUrl}/${endpoint}?reference=${ref2}`, {
    headers: {
      api_key: process.env.PGKU_API_KEY,
      kode_api: process.env.PGKU_KODE_API,
    }
  });
  const data2 = await res2.json();
  console.log('Result for f856f615...:', data2);
}

testPG().catch(console.error);
