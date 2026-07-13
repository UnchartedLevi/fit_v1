export type InstagramSpotlight = {
  id: string;
  number: string;
  title: string;
  text: string;
  href: string;
  image?: string;
  type?: string;
  date?: string;
};

type InstagramMedia = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp?: string;
};

type InstagramMediaResponse = {
  data?: InstagramMedia[];
};

const fallbackSpotlights: InstagramSpotlight[] = [
  {
    id: "fallback-1",
    number: "01",
    title: "Matchday uniform",
    text: "A closer look at the pieces built for the walk-in, the stands, and the streets after full time.",
    href: "https://www.instagram.com/fits4l/",
  },
  {
    id: "fallback-2",
    number: "02",
    title: "FITS for life",
    text: "Campaign moments, styling notes, and the culture around the next drop.",
    href: "https://www.instagram.com/fits4l/",
  },
];

function titleFromCaption(caption = "FITS spotlight") {
  const firstLine = caption.split("\n").find(Boolean)?.trim() || "FITS spotlight";
  return firstLine.replace(/#\S+/g, "").trim().slice(0, 58) || "FITS spotlight";
}

function textFromCaption(caption = "") {
  const clean = caption.replace(/#\S+/g, "").replace(/\s+/g, " ").trim();
  return clean.slice(0, 220) || "Open the original Instagram post from FITS.";
}

function dateFromTimestamp(timestamp?: string) {
  if (!timestamp) return "Latest";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

export async function getInstagramSpotlights(limit = 4): Promise<InstagramSpotlight[]> {
  const userId = process.env.INSTAGRAM_USER_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const version = process.env.INSTAGRAM_GRAPH_API_VERSION || "v23.0";

  if (!userId || !accessToken) return fallbackSpotlights;

  const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";
  const url = new URL(`https://graph.facebook.com/${version}/${userId}/media`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", accessToken);

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return fallbackSpotlights;

    const payload = (await response.json()) as InstagramMediaResponse;
    const posts = payload.data ?? [];

    if (!posts.length) return fallbackSpotlights;

    return posts
      .filter((post) => post.permalink)
      .map((post, index) => ({
        id: post.id,
        number: String(index + 1).padStart(2, "0"),
        title: titleFromCaption(post.caption),
        text: textFromCaption(post.caption),
        href: post.permalink || "https://www.instagram.com/fits4l/",
        image: post.thumbnail_url || post.media_url,
        type: post.media_type,
        date: dateFromTimestamp(post.timestamp),
      }));
  } catch {
    return fallbackSpotlights;
  }
}
