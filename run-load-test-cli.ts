import { run500UserLoadTest } from './server/loadTest.js';

async function main() {
  console.log('--- STARTING REAL 500 VIRTUAL USER LOAD TEST BENCHMARK ---');
  try {
    const metric = await run500UserLoadTest(500);
    console.log('--- LOAD TEST FINISHED SUCCESSFULLY ---');
    console.log('Virtual Users:', metric.virtual_users);
    console.log('Total Requests:', metric.total_requests);
    console.log('Successful Requests:', metric.successful_requests);
    console.log('Failed Requests:', metric.failed_requests);
    console.log('Error Rate:', metric.error_rate_pct + '%');
    console.log('Total Duration:', metric.total_duration_ms + 'ms');
    console.log('Throughput:', metric.throughput_req_per_sec + ' req/sec');
    console.log('Latency avg:', metric.latency_avg_ms + 'ms');
    console.log('Latency p50:', metric.latency_p50_ms + 'ms');
    console.log('Latency p95:', metric.latency_p95_ms + 'ms');
    console.log('Latency p99:', metric.latency_p99_ms + 'ms');
    console.log('Memory Used:', metric.memory_used_mb + 'MB');
    process.exit(0);
  } catch (err) {
    console.error('Load test failed:', err);
    process.exit(1);
  }
}

main();
