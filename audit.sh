#!/bin/bash

echo "=========================================="
echo "🔍 PRODUCTION AUDIT - Dev-Agent Phase 2"
echo "=========================================="
echo ""

# 1. TypeScript Check
echo "1️⃣ Checking TypeScript..."
pnpm check 2>&1 | tail -20
echo ""

# 2. Build Check
echo "2️⃣ Building Project..."
pnpm build 2>&1 | tail -20
echo ""

# 3. Test Check
echo "3️⃣ Running Tests..."
pnpm test 2>&1 | tail -20
echo ""

echo "=========================================="
echo "✅ Audit Complete"
echo "=========================================="
