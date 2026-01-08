import { createClient } from "redis"


const redisClient = createClient(
    // url:"redis://localhost:6379"
)

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", console.error);


await redisClient.connect()



export default redisClient
