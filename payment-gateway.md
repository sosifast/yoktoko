## 1. Daftar Channel Pembayaran

Method	GET
Sandbox URL	https://socialboosters.web.id/api/v1/sandbox/payment/channels
Production URL	https://socialboosters.web.id/api/v1/production/payment/channel

Header	
api_key
kode_api

Sample:
curl -X GET "https://socialboosters.web.id/api/v1/sandbox/payment/channels"
  -H "api_key: "
  -H "kode_api: "

Response:
{
    "success": true,
    "message": "Daftar channel pembayaran (Virtual Account & QRIS)",
    "mode": "sandbox",
    "data": [
        {
            "code": "BRIVA",
            "name": "BRI Virtual Account",
            "payment_type": "virtual_account",
            "active": true
        },
        {
            "code": "QRIS",
            "name": "QRIS",
            "payment_type": "qris",
            "active": true
        }
    ]
}


## Buat Transaksi

Method	POST
Sandbox URL	https://socialboosters.web.id/api/v1/sandbox/payment/create
Production URL	https://socialboosters.web.id/api/v1/production/payment/create

{
    "method": "BRIVA",
    "amount": 50000,
    "callback_url": "https://domain.com/webhook",
    "return_url": "https://domain.com/thanks"
}

sample:
curl -X POST "https://socialboosters.web.id/api/v1/sandbox/payment/create"
  -H "Content-Type: application/json"
  -H "api_key: "
  -H "kode_api: "
  -d '{"method":"BRIVA","amount":50000}'

  Response:
  {
    "success": true,
    "message": "Transaksi berhasil dibuat",
    "mode": "sandbox",
    "data": {
        "id": 1,
        "reference": "T0001ABCDEF",
        "merchant_ref": "INV-20260725120000-ABC123",
        "status": "UNPAID",
        "amount": 50000,
        "payment": {
            "va_number": "5758123456789012",
            "qr_url": null
        }
    }
}

## Detail Transaksi
Method	GET
Sandbox URL	https://socialboosters.web.id/api/v1/sandbox/payment/detail
Production URL	https://socialboosters.web.id/api/v1/production/payment/detail

arameter	Tipe	Wajib	Keterangan
reference	string	Ya	Query param — reference atau merchant_ref 

curl -X GET "https://socialboosters.web.id/api/v1/sandbox/payment/detail?reference=T0001ABCDEF"
  -H "api_key: "
  -H "kode_api: "

{
    "success": true,
    "message": "Detail transaksi ditemukan",
    "mode": "sandbox",
    "data": {
        "id": 1,
        "name": "TOP UP SMM",
        "reference": "T0001ABCDEF",
        "status": "Success",
        "amount": 50000
    }
}

## Validasi Callback
Method	POST
URL Tujuan	URL website yang terdaftar (callback_url / domain website)
Berlaku	Sandbox & Production

body:
{
    "reference": "T0001ABCDEF",
    "merchant_ref": "INV-20260725120000-ABC123",
    "status": "PAID",
    "amount": 50000,
    "signature": "hmac_sha256..."
}

contoh:
<?php
$payload = json_decode(file_get_contents('php://input'), true);

$expected = hash_hmac('sha256', json_encode([
    'reference'    => $payload['reference'],
    'merchant_ref' => $payload['merchant_ref'],
    'status'       => $payload['status'],
]), '3552760533433972');

if (hash_equals($expected, $payload['signature']) && $payload['status'] === 'PAID') {
    // Proses pesanan sukses
}

{
    "reference": "T0001ABCDEF",
    "merchant_ref": "INV-20260725120000-ABC123",
    "status": "PAID",
    "amount": 50000,
    "signature": "hmac_sha256..."
}
