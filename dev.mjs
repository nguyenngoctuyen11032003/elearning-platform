import { spawn } from 'child_process';
import { createServer } from 'net';

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

async function main() {
  let port = 3000;
  const portAvailable = await isPortAvailable(port);
  
  if (!portAvailable) {
    console.log(`\n⚠️  Port ${port} is in use, switching to port 3001...\n`);
    port = 3001;
  } else {
    console.log(`\n✅ Starting development server on port ${port}...\n`);
  }
  
  const proc = spawn('next', ['dev', '-H', '0.0.0.0', '-p', port.toString()], {
    stdio: 'inherit',
    shell: true
  });
  
  process.on('SIGINT', () => {
    proc.kill();
    process.exit();
  });
}

main().catch(console.error);
