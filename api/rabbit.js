import amqp from "amqplib";

let channel;

export async function connectRabbit() {
  const conn = await amqp.connect("amqp://admin:admin123@localhost:5672");
  console.log("rabbit mq connected....")
  channel = await conn.createChannel();
  await channel.assertQueue("notifications");
}


export function sendToQueue(data) {
  channel.sendToQueue(
    "notifications",
    Buffer.from(JSON.stringify(data))
  );
}
