import { connect, NatsConnection } from "nats";

export async function createNats(url?: string): Promise<NatsConnection> {
  return await connect({ servers: url });
}
