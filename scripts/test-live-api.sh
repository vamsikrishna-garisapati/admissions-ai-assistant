#!/usr/bin/env bash

# AI Admissions Assistant - Live API Verification Script
# Usage: ./scripts/test-live-api.sh [http://localhost:8787]

API_BASE="${1:-http://localhost:8787}/api/v1"

echo "=========================================================="
echo "  AI Admissions Assistant API Verification"
echo "  Target: $API_BASE"
echo "=========================================================="
echo ""

# 1. Health Check
echo "🔍 1. Testing Health Check (GET /health)..."
HEALTH_RES=$(curl -s -X GET "$API_BASE/health")
echo "Response: $HEALTH_RES"
echo ""

# 2. Create Session
echo "🔑 2. Testing Session Creation (POST /sessions)..."
SESSION_RES=$(curl -s -X POST "$API_BASE/sessions" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Terminal-Test-Agent")
echo "Response: $SESSION_RES"

SESSION_ID=$(echo "$SESSION_RES" | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)
TOKEN=$(echo "$SESSION_RES" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to parse session ID or token from response."
  exit 1
fi

echo "✅ Session ID: $SESSION_ID"
echo "✅ Token: $TOKEN"
echo ""

# 3. Retrieve Session Details (Authorized)
echo "🔒 3. Testing Authorized Session Lookup (GET /sessions/:id)..."
SESSION_LOOKUP=$(curl -s -X GET "$API_BASE/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $SESSION_LOOKUP"
echo ""

# 4. Security IDOR Check (Unauthorized)
echo "🛡️  4. Testing Security Boundary with Forged Token..."
FORGED_RES=$(curl -s -w "\nHTTP Status: %{http_code}\n" -X GET "$API_BASE/sessions/$SESSION_ID" \
  -H "Authorization: Bearer forged.tampered_token_signature")
echo "$FORGED_RES"
echo ""

# 5. Lead Capture with Phone & Deterministic Scoring
echo "📋 5. Testing Lead Capture & Scoring (POST /leads)..."
LEAD_RES=$(curl -s -X POST "$API_BASE/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fullName": "Kiran Kumar",
    "phoneNumber": "9849012345",
    "email": "kiran@example.com",
    "qualification": "B.Tech CSE",
    "graduationYear": 2024,
    "currentStatus": "Fresher looking for job",
    "interestedCourse": "Full Stack Python",
    "callbackRequested": true,
    "preferredCallbackTime": "Tomorrow 4 PM"
  }')
echo "Response: $LEAD_RES"
echo ""

# 6. Phone Validation Failure (Blocked Dummy Number)
echo "🚫 6. Testing Phone Validation Filter (Dummy 9999999999)..."
DUMMY_PHONE_RES=$(curl -s -X POST "$API_BASE/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "phoneNumber": "9999999999",
    "callbackRequested": true
  }')
echo "Response: $DUMMY_PHONE_RES"
echo ""

# 7. DPDP Consent Withdrawal
echo "⚖️  7. Testing Privacy Consent Withdrawal (POST /privacy/withdraw)..."
WITHDRAW_RES=$(curl -s -X POST "$API_BASE/privacy/withdraw" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "reason": "Decided to pursue Master degree"
  }')
echo "Response: $WITHDRAW_RES"
echo ""

# 8. Chat (JSON non-stream) — requires knowledge ingest for grounded answers
echo "💬 8. Testing Chat (POST /chat stream=false)..."
CHAT_RES=$(curl -s -X POST "$API_BASE/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Which courses do you offer?",
    "stream": false
  }')
echo "Response: $CHAT_RES"
echo ""

# 9. Message history
echo "🗂️  9. Testing Message History (GET /sessions/:id/messages)..."
MSG_RES=$(curl -s -X GET "$API_BASE/sessions/$SESSION_ID/messages" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $MSG_RES"
echo ""

echo "=========================================================="
echo "  ✅ All API verification scenarios executed!"
echo "=========================================================="

