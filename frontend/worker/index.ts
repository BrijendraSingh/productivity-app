interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  BACKEND_URL?: string;
}

function isApiRequest(pathname: string): boolean {
  return pathname === '/health' || pathname.startsWith('/api');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (isApiRequest(url.pathname)) {
      const backend = env.BACKEND_URL?.replace(/\/$/, '');
      if (!backend) {
        return Response.json(
          {
            success: false,
            message:
              'BACKEND_URL is not configured. Set it in Cloudflare → Workers & Pages → Settings → Variables.',
          },
          { status: 503 }
        );
      }

      const target = new URL(`${url.pathname}${url.search}`, backend);
      return fetch(
        new Request(target.toString(), {
          method: request.method,
          headers: request.headers,
          body: request.body,
          redirect: 'follow',
        })
      );
    }

    return env.ASSETS.fetch(request);
  },
};
