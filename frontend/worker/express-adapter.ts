import type { Context } from 'hono';
import type { Request, Response, NextFunction } from 'express';

type ExpressHandler = (req: Request, res: Response, next: NextFunction) => unknown;

function createMockResponse(c: Context, onDone: () => void): Response {
  let statusCode = 200;
  const headers = new Headers();

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return res;
    },
    json(body: unknown) {
      headers.set('content-type', 'application/json; charset=utf-8');
      c.res = new Response(JSON.stringify(body), { status: statusCode, headers });
      onDone();
      return res;
    },
    send(body?: unknown) {
      if (typeof body === 'object' && body !== null) {
        return res.json(body);
      }
      c.res = new Response(body == null ? '' : String(body), { status: statusCode, headers });
      onDone();
      return res;
    },
    end() {
      if (!c.res) {
        c.res = new Response(null, { status: statusCode, headers });
      }
      onDone();
      return res;
    },
  } as unknown as Response;

  return res;
}

async function createMockRequest(c: Context): Promise<Request> {
  const url = new URL(c.req.url);
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let body: unknown = {};
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD' && c.req.method !== 'DELETE') {
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
  }

  const req = {
    method: c.req.method,
    url: url.pathname + url.search,
    originalUrl: url.pathname + url.search,
    path: url.pathname,
    headers,
    header(name: string) {
      return headers[name.toLowerCase()] ?? headers[name];
    },
    get(name: string) {
      return headers[name.toLowerCase()] ?? headers[name];
    },
    query: Object.fromEntries(url.searchParams.entries()),
    params: c.req.param(),
    body,
    user: undefined as unknown,
  } as unknown as Request;

  return req;
}

function errorResponse(err: unknown): Response {
  const error = err as Error & { statusCode?: number; code?: string };
  const statusCode =
    error.statusCode ?? (error.message?.includes('UNIQUE constraint failed') ? 409 : 500);
  const code =
    error.code ?? (error.message?.includes('UNIQUE constraint failed') ? 'CONFLICT' : undefined);

  return new Response(
    JSON.stringify({
      success: false,
      message: error.message || 'Internal server error.',
      ...(code ? { code } : {}),
    }),
    {
      status: statusCode,
      headers: { 'content-type': 'application/json' },
    }
  );
}

/**
 * Runs one or more Express-style handlers in sequence (middleware chain).
 */
export function fromExpress(...handlers: ExpressHandler[]) {
  return async (c: Context) => {
    const req = await createMockRequest(c);

    return new Promise<Response>((resolve) => {
      const res = createMockResponse(c, () => {
        resolve(c.res ?? new Response(null, { status: 204 }));
      });

      let index = 0;

      const next: NextFunction = (err?: unknown) => {
        if (err) {
          resolve(errorResponse(err));
          return;
        }

        index += 1;
        if (index >= handlers.length) {
          if (!c.res) {
            resolve(new Response(null, { status: 204 }));
          }
          return;
        }

        runHandler(handlers[index]!);
      };

      const runHandler = (handler: ExpressHandler) => {
        try {
          const result = handler(req, res, next);
          if (result && typeof (result as Promise<unknown>).then === 'function') {
            (result as Promise<unknown>).catch((err) => next(err));
          }
        } catch (err) {
          next(err);
        }
      };

      runHandler(handlers[0]!);
    });
  };
}
