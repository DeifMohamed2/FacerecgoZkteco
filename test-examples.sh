#!/bin/bash

# Test examples for ZKTeco Integration API
# Make sure the server is running on port 8090

BASE_URL="http://localhost:8090"

echo "=== Testing ZKTeco Integration API ==="
echo ""

# 1. Health Check
echo "1. Health Check:"
curl -s "$BASE_URL/health" | jq .
echo ""
echo "---"
echo ""

# 2. Device Ping
echo "2. Device Ping:"
curl -s "$BASE_URL/iclock/ping"
echo ""
echo "---"
echo ""

# 3. Get Request (Device polling for commands)
echo "3. Device Get Request:"
curl -s "$BASE_URL/iclock/getrequest?SN=TEST123"
echo ""
echo "---"
echo ""

# 4. Simulate Attendance Data
echo "4. Simulate Attendance Data:"
curl -s -X POST "$BASE_URL/iclock/cdata" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'SN=TEST123&table=ATTLOG&CardNo=EMP001&Time=2025-01-15+10:30:00&Status=0&Verify=1'
echo ""
echo "---"
echo ""

# 5. Login (Get Token)
echo "5. Login (Get Token):"
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')
echo "Token: $TOKEN"
echo ""
echo "---"
echo ""

# 6. Register Device
echo "6. Register Device:"
curl -s -X POST "$BASE_URL/api/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "sn": "TEST123",
    "name": "Test Device",
    "ip": "192.168.1.100",
    "port": 80
  }' | jq .
echo ""
echo "---"
echo ""

# 7. List Devices
echo "7. List Devices:"
curl -s -X GET "$BASE_URL/api/devices" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""
echo "---"
echo ""

# 8. Create User
echo "8. Create User:"
curl -s -X POST "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "empId": "EMP001",
    "name": "John Doe",
    "cardNo": "12345"
  }' | jq .
echo ""
echo "---"
echo ""

# 9. Get Attendance
echo "9. Get Attendance:"
curl -s -X GET "$BASE_URL/api/attendance" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""
echo "---"
echo ""

# 10. Queue Command
echo "10. Queue Command:"
curl -s -X POST "$BASE_URL/api/devices/TEST123/command" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "command": "RESTART"
  }' | jq .
echo ""
echo "---"
echo ""

echo "=== Tests Complete ==="


