#!/bin/bash

# Test script for Vercel deployment
# Usage: ./test-vercel-deployment.sh [API_URL]

API_URL="${1:-https://scolar-flow-api.vercel.app}"
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_CYAN='\033[0;36m'
COLOR_RESET='\033[0m'

PASSED=0
FAILED=0

log() {
    echo -e "${COLOR_CYAN}$1${COLOR_RESET}"
}

success() {
    echo -e "${COLOR_GREEN}✅ $1${COLOR_RESET}"
    ((PASSED++))
}

fail() {
    echo -e "${COLOR_RED}❌ $1${COLOR_RESET}"
    ((FAILED++))
}

test_route() {
    local method=$1
    local path=$2
    local expected_status=$3
    local description=$4
    
    local url="${API_URL}${path}"
    log "\n[TEST] ${method} ${path}"
    if [ -n "$description" ]; then
        log "  Description: $description"
    fi
    
    local response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" 2>&1)
    
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" -eq "$expected_status" ]; then
        success "PASSED (${status})"
        if [ -n "$body" ]; then
            echo "$body" | jq . 2>/dev/null || echo "$body"
        fi
        return 0
    else
        fail "FAILED - Expected ${expected_status}, got ${status}"
        echo "Response: $body"
        return 1
    fi
}

log "🚀 Starting Vercel Deployment Tests"
log "API URL: $API_URL"
log "============================================================"

# Test 1: Root route
test_route "GET" "/" 200 "Root route should return API status"

# Test 2: API hello route
test_route "GET" "/api/hello" 200 "API hello route should work"

# Test 3: Health check
test_route "GET" "/api/health" 200 "Health check endpoint"

# Test 4: Non-existent route (should return 404)
test_route "GET" "/api/nonexistent" 404 "Non-existent route should return 404"

# Summary
log "\n============================================================"
log "📊 TEST SUMMARY"
log "Total Tests: $((PASSED + FAILED))"
log "✅ Passed: $PASSED"
log "❌ Failed: $FAILED"
log "============================================================"

if [ $FAILED -eq 0 ]; then
    success "\n🎉 All tests passed!"
    exit 0
else
    fail "\n⚠️  Some tests failed. Please review the errors above."
    exit 1
fi

