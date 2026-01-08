import amqp from "amqplib";

export async function startConsumer(onMessage) {
  const conn = await amqp.connect("amqp://admin:admin123@localhost:5672");
  const channel = await conn.createChannel();
  await channel.assertQueue("notifications");

  channel.consume("notifications", async (msg) => {
    const job = JSON.parse(msg.content.toString());
    job.retry = job.retry ?? 0;
    await onMessage(job, channel, msg);
  });
}
