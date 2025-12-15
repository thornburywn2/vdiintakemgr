import { createApp } from './app.js';

const PORT = parseInt(process.env.API_PORT || '4010', 10);
const HOST = process.env.API_HOST || '0.0.0.0';

async function main() {
  const app = await createApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`🚀 AVD Manager API running at http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
