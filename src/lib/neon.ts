import postgres from 'postgres';

type Sql = ReturnType<typeof postgres>;

let client: Sql | null | undefined;

function databaseUrl(): string {
  return (
    import.meta.env.DATABASE_URL ||
    import.meta.env.POSTGRES_URL ||
    ''
  );
}

export function getSql(): Sql | null {
  if (client !== undefined) return client;
  const url = databaseUrl();
  if (!url) {
    client = null;
    return null;
  }
  client = postgres(url, {
    ssl: 'require',
    max: 1,
    idle_timeout: 20,
    connect_timeout: 8,
  });
  return client;
}

export async function withSqlTimeout<T>(
  work: Promise<T>,
  ms = 6000,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
