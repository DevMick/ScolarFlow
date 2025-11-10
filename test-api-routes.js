/**
 * Test file to validate all API routes including root route
 * Run with: node test-api-routes.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRoute(method, path, expectedStatus = 200, description = '') {
  testResults.total++;
  const url = `${BASE_URL}${path}`;
  
  try {
    log(`\n[TEST ${testResults.total}] Testing ${method} ${path}`, 'cyan');
    if (description) {
      log(`  Description: ${description}`, 'blue');
    }
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const duration = Date.now() - startTime;
    
    const status = response.status;
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }
    
    if (status === expectedStatus) {
      testResults.passed++;
      log(`  ✅ PASSED (${status}) - ${duration}ms`, 'green');
      if (data && typeof data === 'object') {
        log(`  Response: ${JSON.stringify(data, null, 2)}`, 'blue');
      } else if (data) {
        log(`  Response: ${data}`, 'blue');
      }
      return { success: true, status, data, duration };
    } else {
      testResults.failed++;
      log(`  ❌ FAILED - Expected ${expectedStatus}, got ${status}`, 'red');
      log(`  Response: ${JSON.stringify(data, null, 2)}`, 'yellow');
      return { success: false, status, data, duration };
    }
  } catch (error) {
    testResults.failed++;
    log(`  ❌ ERROR - ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🚀 Starting API Route Tests', 'cyan');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log('='.repeat(60), 'cyan');
  
  // Test 1: Root route
  await testRoute('GET', '/', 200, 'Root route should return API status');
  
  // Test 2: API hello route
  await testRoute('GET', '/api/hello', 200, 'API hello route should work');
  
  // Test 3: Health check
  await testRoute('GET', '/api/health', 200, 'Health check endpoint');
  
  // Test 4: Non-existent route (should return 404)
  await testRoute('GET', '/api/nonexistent', 404, 'Non-existent route should return 404');
  
  // Test 5: Root route with POST (should return 405 or 404)
  await testRoute('POST', '/', 404, 'Root route with POST should return 404 or 405');
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log(`Total Tests: ${testResults.total}`, 'blue');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log('='.repeat(60), 'cyan');
  
  if (testResults.failed === 0) {
    log('\n🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  log('❌ Error: fetch is not available. Please use Node.js 18+ or install node-fetch', 'red');
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

