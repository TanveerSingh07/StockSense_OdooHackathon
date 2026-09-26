#!/bin/bash
echo "1. Creating Receipt..."
RES=$(curl -s -X POST http://localhost:3000/api/receipts \
  -H "Content-Type: application/json" \
  -d '{"supplierId":"cmui2hu930001y93mp4lgthaz","warehouseId":"cmui2htg00000y93mkgtqkao0","lines":[{"productId":"product_apple_1","quantity":50}]}')
echo $RES
ID=$(echo $RES | grep -o '"id":"[^"]*' | grep -o '[^"]*$')

echo "2. Validating Receipt $ID (Increases Stock)..."
curl -s -X PATCH http://localhost:3000/api/receipts/$ID \
  -H "Content-Type: application/json" \
  -d '{"status":"DONE"}'

echo -e "\n3. Creating Delivery Order for 30 apples..."
RES2=$(curl -s -X POST http://localhost:3000/api/deliveries \
  -H "Content-Type: application/json" \
  -d '{"customer":"Jane Doe","warehouseId":"cmui2htg00000y93mkgtqkao0","lines":[{"productId":"product_apple_1","quantity":30}]}')
echo $RES2
ID2=$(echo $RES2 | grep -o '"id":"[^"]*' | grep -o '[^"]*$')

echo "4. Validating Delivery $ID2 (Decreases Stock)..."
curl -s -X PATCH http://localhost:3000/api/deliveries/$ID2 \
  -H "Content-Type: application/json" \
  -d '{"status":"DONE"}'

echo -e "\n5. Creating another Delivery Order for 100 apples (should fail validation due to insufficient stock)..."
RES3=$(curl -s -X POST http://localhost:3000/api/deliveries \
  -H "Content-Type: application/json" \
  -d '{"customer":"John Smith","warehouseId":"cmui2htg00000y93mkgtqkao0","lines":[{"productId":"product_apple_1","quantity":100}]}')
echo $RES3
ID3=$(echo $RES3 | grep -o '"id":"[^"]*' | grep -o '[^"]*$')

echo "6. Validating Delivery $ID3..."
curl -s -X PATCH http://localhost:3000/api/deliveries/$ID3 \
  -H "Content-Type: application/json" \
  -d '{"status":"DONE"}'

