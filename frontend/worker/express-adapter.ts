import type { Context } from 'hono';
import type { Request, Response, NextFunction } from 'express';

type ExpressHandler = (req: Request, res: Response, next: NextFunction) => unknown;

declare module 'hono' {
  interface ContextVariableMap {
    expressReq: Request;
  }
}

function createMockResponse(c: Context, onRespond: () => void): Response {
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
      onRespond();
      return res;
    },
    send(body?: unknown) {
      if (typeof body === 'object' && body !== null) {
        return res.json(body);
      }
      c.res = new Response(body == null ? '' : String(body), { status: statusCode, headers });
      onRespond();
      return res;
    },
    end() {
      if (!c.res) {
        c.res = new Response(null, { status: statusCode, headers });
      }
      onRespond();
      return res;
    },
  } as unknown as Response;

  return res;
}

async function readBody(c: Context): Promise<unknown> {
  if (c.req.method === 'GET' || c.req.method === 'HEAD' || c.req.method === 'DELETE') {
    return {};
  }
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}

async function getOrCreateRequest(c: Context): Promise<Request> {
  const url = new URL(c.req.url);
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const existing = c.get('expressReq');
  if (existing) {
    const mutable = existing as Request & {
      method: string;
      url: string;
      originalUrl: string;
      path: string;
      headers: Record<string, string>;
      query: Record<string, string>;
      params: Record<string, string>;
      body: unknown;
    };
    mutable.method = c.req.method;
    mutable.url = url.pathname + url.search;
    mutable.originalUrl = url.pathname + url.search;
    mutable.path = url.pathname;
    mutable.headers = headers;
    mutable.query = Object.fromEntries(url.searchParams.entries());
    mutable.params = c.req.param();
    mutable.body = await readBody(c);
    return existing;
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
    body: await readBody(c),
    user: undefined as unknown,
  } as unknown as Request;

  c.set('expressReq', req);
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

function runExpressHandlers(
  req: Request,
  c: Context,
  handlers: ExpressHandler[]
): Promise<Response | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: Response | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const res = createMockResponse(c, () => {
      finish(c.res as Response);
    });

    let index = 0;

    const expressNext: NextFunction = (err?: unknown) => {
      if (err) {
        finish(errorResponse(err));
        return;
      }

      index += 1;
      if (index >= handlers.length) {
        finish(null);
        return;
      }

      runHandler(handlers[index]!);
    };

    const runHandler = (handler: ExpressHandler) => {
      try {
        const result = handler(req, res, expressNext);
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          (result as Promise<unknown>).catch(expressNext);
        }
      } catch (err) {
        expressNext(err);
      }
    };

    runHandler(handlers[0]!);
  });
}

/**
 * Runs one or more Express-style handlers in sequence.
 * When the chain finishes without writing a response, continues the Hono middleware chain.
 */
export function fromExpress(...handlers: ExpressHandler[]) {
  return async (c: Context, honoNext?: () => Promise<void>) => {
    const req = await getOrCreateRequest(c);
    const response = await runExpressHandlers(req, c, handlers);

    if (response) {
      return response;
    }

    if (honoNext) {
      await honoNext();
      return;
    }

    return c.res ?? new Response(null, { status: 204 });
  };
}
