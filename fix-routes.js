const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('app/owner');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const old = content;
  
  // Replace href="/..." with href="/owner/..."
  content = content.replace(/href=\"\/(dashboard|game|kategori|produk|report|suplier|transaksi|user)(\/|\")/g, 'href=\"/owner/$1$2');
  
  // Replace router.push("/...") with router.push("/owner/...")
  content = content.replace(/router\.push\(\"\/(dashboard|game|kategori|produk|report|suplier|transaksi|user)(\/|\")/g, 'router.push(\"/owner/$1$2');
  
  if (old !== content) {
    fs.writeFileSync(f, content);
    console.log('Updated:', f);
  }
});
