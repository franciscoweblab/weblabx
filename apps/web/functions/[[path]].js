export async function onRequest(context) {

  const asset = await context.env.ASSETS.fetch(context.request);

  if (asset.status === 404) {

    return context.env.ASSETS.fetch(
      new Request(new URL("/404.html", context.request.url)),
      { status: 404 }
    );
  }

  return asset;
}
