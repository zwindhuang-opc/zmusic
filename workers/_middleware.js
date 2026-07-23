export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/')) {
    return next();
  }
  
  const response = await next();
  
  if (url.pathname.startsWith('/assets/')) {
    return new Response(response.body, {
      ...response,
      headers: {
        ...response.headers,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
  
  return response;
}
