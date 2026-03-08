import fastifyGracefulShutdown from "fastify-graceful-shutdown";

import tradeFeed from "./apis/tradeFeed";
import tradeEngine from "./tradeEngine";
import leaderboardBroadcaster from "./leaderboard/leaderboardBroadcaster";
import { buildApp } from "./app";

const start = async () => {
  const f = await buildApp();

  try {
    await tradeFeed.start();
    await tradeEngine.start();
    leaderboardBroadcaster.start();

    await f.register(fastifyGracefulShutdown);

    f.after(() => {
      f.gracefulShutdown((signal) => {
        f.log.info(`Shutting down: ${signal}`);
        tradeFeed.stop();
        leaderboardBroadcaster.stop();
      });
    });

    await f.ready();

    await f.listen({ host: "0.0.0.0", port: 3000 });
  } catch (err) {
    f.log.error(err);
    process.exit(1);
  }
};

void start();
