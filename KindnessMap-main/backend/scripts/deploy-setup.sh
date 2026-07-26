#!/bin/bash
# ============================================================
# KindnessMap – Deployment Automation Script
# ============================================================
# This script automates setting environment variables on
# Vercel (frontend) and Render (backend) for production.
#
# Prerequisites:
#   1. Vercel CLI installed:  npm install -g vercel
#   2. Logged into Vercel:     vercel login
#   3. Render API Key from:    https://dashboard.render.com/u/settings#api-keys
#   4. Render Service ID from: your Render dashboard URL
#
# Usage:
#   chmod +x scripts/deploy-setup.sh
#   ./scripts/deploy-setup.sh
# ============================================================

set -e

echo "============================================"
echo "  KindnessMap – Deployment Setup"
echo "============================================"

# ─── Vercel Setup ───────────────────────────────────

echo ""
echo "📦 Setting up Vercel environment variables..."
echo ""

# Google OAuth
echo "→ Setting VITE_GOOGLE_CLIENT_ID..."
vercel env add VITE_GOOGLE_CLIENT_ID production <<< "739741002165-6t4c64ucbr1re1n4a0gslc86gh52gdoc.apps.googleusercontent.com" 2>/dev/null || \
  echo "   ⚠️  Could not set automatically. Please set manually in Vercel dashboard."

echo ""
echo "✅ Vercel env vars configured!"
echo ""
echo "   Don't forget to also set these manually if needed:"
echo "   - VITE_HERE_MAPS_API_KEY  (if you have one)"
echo ""

# ─── Render Setup ───────────────────────────────────

echo "📦 Setting up Render environment variables..."
echo ""

# Check for Render API key
if [ -z "$RENDER_API_KEY" ]; then
  echo "⚠️  RENDER_API_KEY not set."
  echo "   Generate one at: https://dashboard.render.com/u/settings#api-keys"
  echo "   Then re-run:  export RENDER_API_KEY=your_key_here"
  echo "   And run this script again."
  echo ""
  echo "   Alternatively, set these vars manually in your Render dashboard:"
  echo ""
  echo "   ┌─────────────────────────────────────────────────────────────┐"
  echo "   │  VARIABLE              │  VALUE                             │"
  echo "   ├─────────────────────────────────────────────────────────────┤"
  echo "   │  DATABASE_URL          │  mysql://... (your Aiven MySQL URI) │"
  echo "   │  GOOGLE_CLIENT_ID      │  739741002165-...                  │"
  echo "   │  MAPTILER_API_KEY      │  lVmuDa5TM799B6e3lu3o              │"
  echo "   │  JWT_SECRET            │  (generate a random string)        │"
  echo "   │  GEMINI_API_KEY        │  (optional for chatbot)            │"
  echo "   └─────────────────────────────────────────────────────────────┘"
  echo ""
else
  # Get Render service ID
  read -p "Enter your Render Service ID (from dashboard URL): " RENDER_SERVICE_ID

  echo "→ Setting GOOGLE_CLIENT_ID..."
  curl -s -X PUT "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "envVars": [
        {"key": "GOOGLE_CLIENT_ID", "value": "739741002165-6t4c64ucbr1re1n4a0gslc86gh52gdoc.apps.googleusercontent.com"},
        {"key": "MAPTILER_API_KEY", "value": "lVmuDa5TM799B6e3lu3o"}
      ]
    }' > /dev/null

  echo "→ Triggering redeploy..."
  curl -s -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
    -H "Authorization: Bearer $RENDER_API_KEY" > /dev/null

  echo "✅ Render env vars configured! Redeploy triggered."
fi

echo ""
echo "============================================"
echo "  ✅ Setup complete!"
echo "============================================"
echo ""
echo "📋 Still need to do manually:"
echo "  1. Set up Aiven MySQL:    https://console.aiven.io"
echo "  2. Run schema.sql against your Aiven DB"
echo "  3. Set DATABASE_URL on Render"
echo "  4. Add your Vercel domain to Google Cloud Console"
echo "     → https://console.cloud.google.com/apis/credentials"
echo ""
