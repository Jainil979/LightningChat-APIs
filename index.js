// index.js
// Minimal entry point – loads environment variables FIRST,
// then starts the server. Guarantees all other modules see
// the fully populated process.env.

process.loadEnvFile();

// Dynamic import starts AFTER the env is ready.
// No other imports above this line to avoid hoisting issues.
const { start } = await import('./server.js');
start();