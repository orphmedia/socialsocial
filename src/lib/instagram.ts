// Instagram Graph API integration
// Requires Meta Developer App with Instagram Graph API permissions

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export interface InstagramAccount {
  id: string;
  username: string;
  name: string;
  profile_picture_url: string;
  followers_count: number;
  media_count: number;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; user_id: string }> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params}`);
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function getLongLivedToken(shortToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortToken,
  });

  const res = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params}`);
  if (!res.ok) throw new Error(`Long-lived token failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

export async function getInstagramAccounts(
  accessToken: string
): Promise<InstagramAccount[]> {
  // Get Facebook pages
  const pagesRes = await fetch(
    `${GRAPH_API_BASE}/me/accounts?access_token=${accessToken}`
  );
  if (!pagesRes.ok) throw new Error(`Failed to get pages: ${await pagesRes.text()}`);
  const pages = await pagesRes.json();

  const accounts: InstagramAccount[] = [];

  for (const page of pages.data || []) {
    // Get Instagram business account linked to this page
    const igRes = await fetch(
      `${GRAPH_API_BASE}/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
    );
    if (!igRes.ok) continue;
    const igData = await igRes.json();

    if (igData.instagram_business_account) {
      const igId = igData.instagram_business_account.id;
      const profileRes = await fetch(
        `${GRAPH_API_BASE}/${igId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${accessToken}`
      );
      if (profileRes.ok) {
        accounts.push(await profileRes.json());
      }
    }
  }

  return accounts;
}

export async function publishCarouselPost(
  igAccountId: string,
  accessToken: string,
  imageUrls: string[],
  caption: string
): Promise<string> {
  // Step 1: Create item containers for each image
  const containerIds: string[] = [];
  for (const url of imageUrls) {
    const res = await fetch(`${GRAPH_API_BASE}/${igAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: url,
        is_carousel_item: true,
        access_token: accessToken,
      }),
    });
    if (!res.ok) throw new Error(`Failed to create carousel item: ${await res.text()}`);
    const data = await res.json();
    containerIds.push(data.id);
  }

  // Step 2: Create carousel container
  const carouselRes = await fetch(`${GRAPH_API_BASE}/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "CAROUSEL",
      children: containerIds.join(","),
      caption,
      access_token: accessToken,
    }),
  });
  if (!carouselRes.ok) throw new Error(`Failed to create carousel: ${await carouselRes.text()}`);
  const carouselData = await carouselRes.json();

  // Step 3: Publish
  const publishRes = await fetch(
    `${GRAPH_API_BASE}/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: carouselData.id,
        access_token: accessToken,
      }),
    }
  );
  if (!publishRes.ok) throw new Error(`Failed to publish: ${await publishRes.text()}`);
  const publishData = await publishRes.json();
  return publishData.id;
}

export async function publishReelPost(
  igAccountId: string,
  accessToken: string,
  videoUrl: string,
  caption: string,
  coverUrl?: string
): Promise<string> {
  // Step 1: Create video container
  const containerRes = await fetch(`${GRAPH_API_BASE}/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: videoUrl,
      caption,
      ...(coverUrl && { cover_url: coverUrl }),
      access_token: accessToken,
    }),
  });
  if (!containerRes.ok) throw new Error(`Failed to create reel container: ${await containerRes.text()}`);
  const containerData = await containerRes.json();

  // Step 2: Wait for processing then publish
  // In production, poll the container status before publishing
  await new Promise((resolve) => setTimeout(resolve, 10000));

  const publishRes = await fetch(
    `${GRAPH_API_BASE}/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken,
      }),
    }
  );
  if (!publishRes.ok) throw new Error(`Failed to publish reel: ${await publishRes.text()}`);
  const publishData = await publishRes.json();
  return publishData.id;
}

export function getOAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: redirectUri,
    scope:
      "instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement",
    response_type: "code",
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}
