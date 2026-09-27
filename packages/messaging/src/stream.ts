export type InboundSession = {
  read(): Promise<void>;
  close(): Promise<void>;
};

export async function keepStream(
  initial: InboundSession,
  open: () => Promise<InboundSession>,
  wait: (attempt: number) => Promise<void>,
  stopped: () => boolean,
  onDisconnect: (error: unknown | null) => void,
): Promise<void> {
  let session = initial;
  while (!stopped()) {
    let failure: unknown | null = null;
    try {
      await session.read();
    } catch (error) {
      failure = error;
    }
    if (stopped()) return;
    onDisconnect(failure);
    try {
      await session.close();
    } catch (error) {
      onDisconnect(error);
    }
    let attempt = 0;
    while (!stopped()) {
      await wait(attempt);
      if (stopped()) return;
      try {
        session = await open();
        break;
      } catch (error) {
        onDisconnect(error);
        attempt += 1;
      }
    }
  }
}
