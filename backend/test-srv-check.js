/**
 * Test SRV DNS Resolution
 * Run: node test-srv-check.js
 */

const dns = require('dns');

console.log('🔍 DNS SRV Record Check');
console.log('=======================\n');

// Try to resolve the SRV record
const domain = '_mongodb._tcp.citycarecluster.vvfcze1.mongodb.net';

console.log('📋 Checking DNS SRV record for:', domain);
console.log('');

dns.resolveSrv(domain, (err, addresses) => {
  if (err) {
    console.error('❌ SRV Lookup FAILED:', err.message);
    console.log('');
    console.log('This means the DNS SRV record does not exist.');
    console.log('Possible causes:');
    console.log('  1. The cluster hostname is incorrect');
    console.log('  2. MongoDB Atlas is having DNS issues');
    console.log('  3. Your network blocks DNS SRV lookups');
    console.log('');
    console.log('🔧 SOLUTION:');
    console.log('   Try using a direct connection string instead of SRV.');
    console.log('   Or verify the cluster name in MongoDB Atlas.');
    process.exit(1);
  } else {
    console.log('✅ SRV Lookup SUCCESS:');
    addresses.forEach(addr => {
      console.log(`   ${addr.name}:${addr.port} (priority: ${addr.priority}, weight: ${addr.weight})`);
    });
    process.exit(0);
  }
});
