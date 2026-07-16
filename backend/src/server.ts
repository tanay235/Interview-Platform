import { createServer } from "node:http";
import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { attachSignalingServer } from "./realtime/signaling";

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    const server = createServer(app);
    attachSignalingServer(server);
    server.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void startServer();
