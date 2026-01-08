import { startConsumer } from "./rabbit.js";
import { Log } from "./mongo.js";

async function sendEmail(email, message) {
  // simulate failure
  if (Math.random() < 0.3) {
    throw new Error("Email failed");
  }
  console.log("Email sent to", email , message);
}

startConsumer(async (job, channel, msg) => {
  try {
    await sendEmail(job.email, job.message);

    const log = await Log.create({
      userId: job.userId,
      email: job.email,
      message: job.message,
      status: "SUCCESS"
    });

    if(!log){
      throw new Error("Oops error occure")
    }
    
    console.log(log)
    channel.ack(msg);
  } catch (err) {
    job.retry++;

    if (job.retry > 3) {
      await Log.create({
        userId: job.userId,
        email: job.email,
        message: job.message,
        status: "FAILED"
      });
      channel.ack(msg);
    } else {
      channel.sendToQueue(
        "notifications",
        Buffer.from(JSON.stringify(job))
      );
      channel.ack(msg);
    }
  }
});
