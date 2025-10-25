import type { Content, Env, Fan, Media, Post, Sponsor, User } from "../types";
import { layout, redirect } from "../utils/html";
import { AdminViews } from "./templates";
import { settingsMap, insertFan } from "../db/queries";

type Metric = { label: string; value: string; change?: string; trend?: "up" | "down" | "flat" };
type Narrative = { title: string; summary: string; link: string };

const SECTION_NAV: Record<string, { id: string; label: string; href: string }[]> = {
  home: [],
  web: [
    { id: "pages", label: "Pages", href: "/web/pages" },
    { id: "blocks", label: "Blocks", href: "/web/blocks" },
    { id: "offers", label: "Offer Surfaces", href: "/web/offers-surfaces" },
    { id: "sponsors", label: "Sponsor Surfaces", href: "/web/sponsor-surfaces" },
    { id: "push", label: "Push Entrypoints", href: "/web/push-entrypoints" },
    { id: "media", label: "Media", href: "/web/media" }
  ],
  crm: [
    { id: "fans", label: "Fans", href: "/crm/fans" },
    { id: "segments", label: "Segments", href: "/crm/segments" }
  ],
  campaigns: [
    { id: "list", label: "Campaigns", href: "/campaigns/list" },
    { id: "calendar", label: "Calendar", href: "/campaigns/calendar" },
    { id: "builder", label: "Builder", href: "/campaigns/new" },
    { id: "playbooks", label: "Playbooks", href: "/campaigns/playbooks" },
    { id: "recommendations", label: "Recommendations", href: "/campaigns/recommendations" },
    { id: "automations", label: "Automations", href: "/campaigns/automations" }
  ],
  analytics: [
    { id: "narratives", label: "Narratives", href: "/analytics/narratives" },
    { id: "overview", label: "Overview", href: "/analytics/overview" },
    { id: "attribution", label: "Attribution", href: "/analytics/attribution" },
    { id: "funnel", label: "Funnel", href: "/analytics/funnel" },
    { id: "segments", label: "Segments", href: "/analytics/segments" },
    { id: "web-tag", label: "Web Tag", href: "/analytics/web-tag" }
  ],
  commerce: [
    { id: "tickets", label: "Tickets", href: "/commerce/catalog/tickets" },
    { id: "products", label: "Products", href: "/commerce/catalog/products" },
    { id: "offers", label: "Offers", href: "/commerce/catalog/offers" },
    { id: "orders", label: "Orders", href: "/commerce/orders" },
    { id: "promotions", label: "Promotions", href: "/commerce/promotions" },
    { id: "checkout", label: "Checkout", href: "/commerce/checkout" },
    { id: "reconciliation", label: "Reconciliation", href: "/commerce/reconciliation" }
  ],
  settings: [
    { id: "users", label: "Users & Roles", href: "/settings/users" },
    { id: "integrations", label: "Integrations", href: "/settings/integrations" },
    { id: "privacy", label: "Privacy", href: "/settings/privacy" },
    { id: "customization", label: "Customization", href: "/settings/customization" },
    { id: "environments", label: "Environments", href: "/settings/environments" }
  ]
};

const QUICK_ACTIONS = [
  { label: "Create campaign", href: "/campaigns/new" },
  { label: "View segments", href: "/crm/segments" },
  { label: "Check orders", href: "/commerce/orders" }
];

const COMMANDS = [
  {
    cmd: "/new campaign",
    target: "/campaigns/new",
    description: "Open the campaign builder with AI assist"
  },
  {
    cmd: "/add segment rule",
    target: "/crm/segments/new",
    description: "Jump into segment creation with recommended filters"
  },
  {
    cmd: "/issue refund",
    target: "/commerce/orders",
    description: "Go straight to orders to manage refunds"
  }
];

const PUSH_IDEAS = [
  { title: "Game-day roster drop", description: "Ping opted-in fans with the starting lineup 30 minutes pre-game." },
  { title: "Season ticket renewals", description: "Remind expiring members with a direct upgrade link and auto-filled checkout." },
  { title: "Merch restock", description: "Alert fans browsing last week’s sold-out jersey that it’s back online." }
];

const PRIVACY_TOGGLES = [
  { key: "limit_data_retention", label: "Limit data retention", description: "Automatically purge fan event data after 18 months." },
  { key: "honor_dnt", label: "Honor Do Not Track", description: "Respect browser DNT signals across all web properties." },
  { key: "anonymize_exports", label: "Anonymize exports", description: "Remove PII from CSV exports by default." }
];

function requireUser(user: User | null): User {
  if (!user) throw redirect("/login", "Please sign in");
  return user;
}

async function renderWorkspace(env: Env, user: User, module: string, sectionId: string | null, opts: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: { label: string; href: string; variant?: "primary" | "ghost" | "default" }[];
  body: string;
  searchQuery?: string;
}): Promise<Response> {
  const settings = await settingsMap(env.DB);
  const sectionNav = SECTION_NAV[module]?.map((item) => ({ ...item, active: item.id === sectionId })) ?? [];
  return layout({
    siteName: env.SITE_NAME,
    user,
    settings,
    workspace: {
      module: module as keyof typeof SECTION_NAV,
      eyebrow: opts.eyebrow,
      title: opts.title,
      description: opts.description,
      actions: opts.actions,
      sectionNav,
      searchQuery: opts.searchQuery
    },
    body: opts.body
  });
}

async function fetchFans(db: D1Database): Promise<Fan[]> {
  try {
    const rs = await db.prepare("SELECT * FROM fans ORDER BY created_at DESC LIMIT 200").all<Fan>();
    return (rs.results as Fan[]) ?? [];
  } catch {
    return [];
  }
}

async function fetchPosts(db: D1Database, limit = 5): Promise<Post[]> {
  try {
    const rs = await db.prepare("SELECT * FROM posts ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?").bind(limit).all<Post>();
    return (rs.results as Post[]) ?? [];
  } catch {
    return [];
  }
}

async function fetchContent(db: D1Database): Promise<Content[]> {
  try {
    const rs = await db.prepare("SELECT * FROM content ORDER BY created_at DESC").all<Content>();
    return (rs.results as Content[]) ?? [];
  } catch {
    return [];
  }
}

async function fetchSponsors(db: D1Database): Promise<Sponsor[]> {
  try {
    const rs = await db.prepare("SELECT * FROM sponsors ORDER BY sort_order ASC, name ASC").all<Sponsor>();
    return (rs.results as Sponsor[]) ?? [];
  } catch {
    return [];
  }
}

async function fetchMedia(db: D1Database): Promise<Media[]> {
  try {
    const rs = await db.prepare("SELECT * FROM media ORDER BY uploaded_at DESC LIMIT 100").all<Media>();
    return (rs.results as Media[]) ?? [];
  } catch {
    return [];
  }
}

async function fetchUsers(db: D1Database): Promise<{ email: string; role: string }[]> {
  try {
    const rs = await db.prepare("SELECT email, role FROM users ORDER BY email ASC").all<{ email: string; role: string }>();
    return (rs.results as { email: string; role: string }[]) ?? [];
  } catch {
    return [];
  }
}

function computeSegments(fans: Fan[]): { name: string; size: number; highlight: string }[] {
  const byTeam: Record<string, number> = {};
  for (const fan of fans) {
    const key = (fan.favorite_team ?? "Unassigned").trim() || "Unassigned";
    byTeam[key] = (byTeam[key] ?? 0) + 1;
  }
  return Object.entries(byTeam)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, size]) => ({ name, size, highlight: size > 20 ? "Prime for campaign" : "Building momentum" }));
}

function fanTimeline(fan: Fan): { meta: string; title: string; body: string }[] {
  return [
    { meta: "Today", title: "Browsed playoff package", body: "Visited commerce catalog from Stadli web experience." },
    { meta: "3 days ago", title: "Opened renewal campaign", body: "Email CTA clicked — added 2 items to cart." },
    { meta: "Last month", title: "Attended home game", body: "Ticket scanned at Gate C — spend scored toward loyalty tier." }
  ];
}

function randomCampaigns(): { name: string; status: string; audience: string; goal: string; performance: string }[] {
  return [
    { name: "Playoffs Hype Week", status: "Scheduled", audience: "VIP Season Ticket Holders", goal: "Sell 400 hospitality seats", performance: "Forecast +18%" },
    { name: "Merch Drop 04", status: "Live", audience: "Recent buyers", goal: "Attach jersey sales", performance: "CTR 9.4%" },
    { name: "Loyalty Reactivation", status: "Completed", audience: "Dormant members", goal: "Win back lapsing fans", performance: "+6% renewals" }
  ];
}

function calendarEvents(): { date: string; title: string; channel: string }[] {
  return [
    { date: "May 12", title: "Game 3 push", channel: "Push • 5:30 PM" },
    { date: "May 14", title: "VIP upgrade email", channel: "Email • 9:00 AM" },
    { date: "May 18", title: "Merch retarget", channel: "Paid social • always-on" }
  ];
}

function sampleOrders(): { id: string; customer: string; total: string; status: string; href: string }[] {
  return [
    {
      id: "ORD-10432",
      customer: "Jamie Brooks",
      total: "$486",
      status: "Paid",
      href: "/commerce/orders#ORD-10432"
    },
    {
      id: "ORD-10412",
      customer: "Alex Chen",
      total: "$189",
      status: "Refund requested",
      href: "/commerce/orders#ORD-10412"
    },
    {
      id: "ORD-10398",
      customer: "Priya Patel",
      total: "$742",
      status: "Pending reconciliation",
      href: "/commerce/reconciliation"
    }
  ];
}

function analyticsMetrics(fans: number, campaigns: number): Metric[] {
  return [
    { label: "Active fans", value: fmtNumber(fans), change: "+4.2% WoW", trend: "up" },
    { label: "Campaigns live", value: String(campaigns), change: "+1 upcoming", trend: "up" },
    { label: "7d revenue", value: "$428K", change: "-2.1% WoW", trend: "down" }
  ];
}

function fmtNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export const AdminRoutes = {
  async home(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const [fans, sponsors] = await Promise.all([fetchFans(env.DB), fetchSponsors(env.DB)]);
    const newFans = fans.filter((fan) => {
      if (!fan.created_at) return false;
      const created = new Date(fan.created_at);
      return Date.now() - created.getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length;
    const metrics: Metric[] = [
      { label: "Total fans", value: fmtNumber(fans.length), change: `${fmtNumber(newFans)} joined this week`, trend: "up" },
      { label: "Active campaigns", value: String(randomCampaigns().length), change: "+1 scheduled", trend: "up" },
      { label: "Featured sponsors", value: String(sponsors.length), change: "Stable", trend: "flat" }
    ];
    const upcoming = calendarEvents().map((item) => ({ date: item.date, title: item.title, status: item.channel }));
    const segments = computeSegments(fans).map((seg) => ({ name: seg.name, size: `${fmtNumber(seg.size)} fans`, delta: seg.highlight }));
    const activity = [
      { meta: "Just now", title: "Campaign ready", body: "AI finished the send checklist for Loyalty Reactivation." },
      { meta: "2h ago", title: "Segment spike", body: "High-intent buyers grew 12% vs last week." },
      { meta: "Yesterday", title: "Sponsor goal met", body: "Courtside Lounge sponsor hit 115% of target impressions." }
    ];
    return renderWorkspace(env, me, "home", null, {
      eyebrow: "Command center",
      title: "Stadli Control Room",
      description: "Cross-team visibility with direct jumps into campaigns, CRM, and commerce.",
      actions: [{ label: "Customize", href: "/settings/customization", variant: "ghost" }],
      body: AdminViews.home({ metrics, quickActions: QUICK_ACTIONS, upcoming, segments, activity })
    });
  },
  async search(env: Env, user: User | null, request: Request): Promise<Response> {
    const me = requireUser(user);
    const url = new URL(request.url);
    const rawQuery = url.searchParams.get("q") ?? "";
    const query = rawQuery.trim();
    const normalized = query.toLowerCase();
    const fansAll = await fetchFans(env.DB);
    const segmentsAll = computeSegments(fansAll);
    const campaignsAll = randomCampaigns();
    const ordersAll = sampleOrders();
    const matchesText = (value: string | null | undefined) => {
      if (!normalized) return true;
      if (!value) return false;
      return value.toLowerCase().includes(normalized);
    };
    const fans = fansAll
      .filter((fan) => matchesText(fan.name) || matchesText(fan.email) || matchesText(fan.favorite_team))
      .slice(0, 6);
    const segments = segmentsAll
      .filter((segment) => matchesText(segment.name) || matchesText(segment.highlight))
      .map((segment) => ({
        name: segment.name,
        size: fmtNumber(segment.size),
        highlight: segment.highlight,
        href: "/crm/segments"
      }))
      .slice(0, 6);
    const campaigns = campaignsAll
      .filter((campaign) => matchesText(campaign.name) || matchesText(campaign.audience) || matchesText(campaign.goal))
      .map((campaign) => ({
        name: campaign.name,
        status: campaign.status,
        audience: campaign.audience,
        href: "/campaigns/list"
      }))
      .slice(0, 6);
    const orders = ordersAll
      .filter((order) => matchesText(order.id) || matchesText(order.customer) || matchesText(order.status))
      .slice(0, 5);
    const commands = COMMANDS.filter(
      (command) => matchesText(command.cmd) || matchesText(command.description) || matchesText(command.target)
    ).slice(0, 5);
    return renderWorkspace(env, me, "home", null, {
      eyebrow: "Search",
      title: "Global workspace search",
      description: "Find fans, campaigns, segments, orders, and quick commands in one place.",
      body: AdminViews.search({ query, fans, campaigns, segments, orders, commands }),
      searchQuery: query
    });
  },
  async crmFans(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const fans = await fetchFans(env.DB);
    const segments = computeSegments(fans);
    return renderWorkspace(env, me, "crm", "fans", {
      eyebrow: "Unified fan profile",
      title: "Fans & households",
      description: "Search, filter, and enrich every fan. Data stays in sync across campaigns and commerce.",
      actions: [{ label: "Export CSV", href: "/crm/fans/export", variant: "ghost" }],
      body: AdminViews.crmFans({ fans, total: fans.length, segments })
    });
  },

  async crmFansCreate(env: Env, user: User | null, request: Request): Promise<Response> {
    requireUser(user);
    const fd = await request.formData();
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const favorite = String(fd.get("favorite_team") ?? "").trim() || null;
    if (!name || !email) return redirect("/crm/fans", "Missing required fields");
    await insertFan(env.DB, { name, email, favoriteTeam: favorite });
    return redirect("/crm/fans", "Fan added");
  },

  async crmFanDetail(env: Env, user: User | null, id: number): Promise<Response> {
    const me = requireUser(user);
    let fan: Fan | null = null;
    try {
      fan = await env.DB.prepare("SELECT * FROM fans WHERE id = ?").bind(id).first<Fan>();
    } catch {
      fan = null;
    }
    if (!fan) return redirect("/crm/fans", "Fan not found");
    const segments = [fan.favorite_team ?? "Unassigned", "Recent buyer", "Push subscriber"];
    const stats = [
      { label: "Lifetime value", value: "$1,240" },
      { label: "Last purchase", value: "31 days" },
      { label: "Engagement score", value: "87" }
    ];
    const recommendations = [
      { title: "Send playoff offer", detail: "Prefill campaign builder with VIP upgrade block.", href: "/campaigns/new?prefill=VIP" },
      { title: "Invite to loyalty program", detail: "Segment shows high spend but no membership — trigger automation.", href: "/campaigns/automations" }
    ];
    return renderWorkspace(env, me, "crm", "fans", {
      eyebrow: "Unified fan profile",
      title: fan.name,
      description: fan.email,
      actions: [{ label: "Open CRM", href: "/crm/fans", variant: "ghost" }],
      body: AdminViews.crmFanDetail({ fan, segments, stats, timeline: fanTimeline(fan), recommendations })
    });
  },

  async crmSegments(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const fans = await fetchFans(env.DB);
    const segments = computeSegments(fans).map((seg) => ({
      name: seg.name,
      size: seg.size,
      growth: seg.size > 0 ? 5.2 : 0,
      description: seg.highlight
    }));
    const plays = [
      { title: "Convert high-intent visitors", detail: "Trigger a 2-step email + push flow to warm prospects.", href: "/campaigns/new?playbook=High Intent" },
      { title: "Reward loyal spenders", detail: "Auto-enroll top buyers into merch credit automation.", href: "/commerce/promotions" }
    ];
    return renderWorkspace(env, me, "crm", "segments", {
      eyebrow: "Segments",
      title: "Audience intelligence",
      description: "AI-cohorting stays fresh so your campaigns always target the right fans.",
      actions: [{ label: "Create segment", href: "/crm/segments/new", variant: "primary" }],
      body: AdminViews.crmSegments({ segments, plays })
    });
  },
  async webPages(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const pages = await fetchContent(env.DB);
    return renderWorkspace(env, me, "web", "pages", {
      eyebrow: "Website",
      title: "Pages & navigation",
      description: "Manage the PWA-first web experience with modular blocks and surface targeting.",
      actions: [{ label: "Preview site", href: env.BASE_URL ?? "/", variant: "ghost" }],
      body: AdminViews.webPages({ pages })
    });
  },

  async webPagesCreate(env: Env, user: User | null, request: Request): Promise<Response> {
    requireUser(user);
    const fd = await request.formData();
    const slug = String(fd.get("slug") ?? "").trim();
    const title = String(fd.get("title") ?? "").trim();
    const body = String(fd.get("body") ?? "").trim();
    const published = Number(fd.get("published") ?? "0") ? 1 : 0;
    if (!slug || !title || !body) return redirect("/web/pages", "Please complete all fields");
    await env.DB.prepare("INSERT INTO content(slug, title, body, published) VALUES(?, ?, ?, ?)").bind(slug, title, body, published).run();
    return redirect("/web/pages", "Page saved");
  },

  async webBlocks(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const settings = await settingsMap(env.DB);
    const hero = {
      headline: settings.hero_headline ?? "Welcome to the club",
      subheadline: settings.hero_subheadline ?? "Get the latest updates, stories, and offers.",
      background: settings.hero_background_key ? `/media/${settings.hero_background_key}` : null
    };
    const media = await fetchMedia(env.DB);
    const posts = await fetchPosts(env.DB, 3);
    return renderWorkspace(env, me, "web", "blocks", {
      eyebrow: "Experience blocks",
      title: "Homepage hero & featured content",
      description: "Control the storytelling spine across hero, news, and sponsor surfaces.",
      actions: [{ label: "Open site", href: "/", variant: "ghost" }],
      body: AdminViews.webBlocks({ hero, media, posts })
    });
  },

  async webBlocksSave(env: Env, user: User | null, request: Request): Promise<Response> {
    requireUser(user);
    const fd = await request.formData();
    const headline = String(fd.get("hero_headline") ?? "").trim();
    const subheadline = String(fd.get("hero_subheadline") ?? "").trim();
    const backgroundKey = String(fd.get("hero_background_key") ?? "").trim();
    if (backgroundKey) {
      const exists = await env.DB.prepare("SELECT 1 FROM media WHERE key = ?").bind(backgroundKey).first();
      if (!exists) return redirect("/web/blocks", "Background asset not found" );
    }
    await env.DB.batch([
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("hero_headline", headline || "Welcome to the club"),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("hero_subheadline", subheadline || "Get the latest updates"),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("hero_background_key", backgroundKey)
    ]);
    return redirect("/web/blocks", "Hero saved");
  },

  async webOfferSurfaces(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const sponsors = await fetchSponsors(env.DB);
    const offers = sponsors.slice(0, 4).map((sponsor) => ({
      title: sponsor.name,
      placement: sponsor.sort_order <= 1 ? "Homepage hero" : "Commerce spotlight",
      status: sponsor.published ? "Active" : "Hidden"
    }));
    if (!offers.length) {
      offers.push({ title: "Add your first sponsor", placement: "Homepage", status: "Pending" });
    }
    return renderWorkspace(env, me, "web", "offers", {
      eyebrow: "Offers",
      title: "Surface orchestration",
      description: "Map products, offers, and partner content to the right slots across Stadli surfaces.",
      actions: [{ label: "Edit catalog", href: "/commerce/catalog/offers", variant: "ghost" }],
      body: AdminViews.webOfferSurfaces({ offers })
    });
  },

  async webSponsorSurfaces(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const [sponsors, media] = await Promise.all([fetchSponsors(env.DB), fetchMedia(env.DB)]);
    return renderWorkspace(env, me, "web", "sponsors", {
      eyebrow: "Sponsors",
      title: "Partner placements",
      description: "Control sponsor visibility and creative across the web experience.",
      body: AdminViews.webSponsorSurfaces({ sponsors, media })
    });
  },

  async webSponsorSurfacesSave(env: Env, user: User | null, request: Request): Promise<Response> {
    requireUser(user);
    const fd = await request.formData();
    const idValue = String(fd.get("id") ?? "").trim();
    const id = idValue ? Number(idValue) : null;
    const name = String(fd.get("name") ?? "").trim();
    const website = String(fd.get("website_url") ?? "").trim() || null;
    let sortOrder = Number(String(fd.get("sort_order") ?? "0"));
    if (Number.isNaN(sortOrder)) sortOrder = 0;
    const logoKey = String(fd.get("logo_key") ?? "").trim() || null;
    const published = Number(fd.get("published") ?? "0") ? 1 : 0;
    if (!name) return redirect("/web/sponsor-surfaces", "Name is required");
    if (logoKey) {
      const exists = await env.DB.prepare("SELECT 1 FROM media WHERE key = ?").bind(logoKey).first();
      if (!exists) return redirect("/web/sponsor-surfaces", "Upload logo first");
    }
    if (id) {
      const exists = await env.DB.prepare("SELECT id FROM sponsors WHERE id = ?").bind(id).first<Sponsor>();
      if (!exists) return redirect("/web/sponsor-surfaces", "Sponsor missing");
      const now = new Date().toISOString();
      await env.DB.prepare(
        "UPDATE sponsors SET name = ?, logo_key = ?, website_url = ?, sort_order = ?, published = ?, updated_at = ? WHERE id = ?"
      )
        .bind(name, logoKey, website, sortOrder, published, now, id)
        .run();
      return redirect("/web/sponsor-surfaces", "Sponsor updated");
    }
    await env.DB.prepare(
      "INSERT INTO sponsors(name, logo_key, website_url, sort_order, published) VALUES(?, ?, ?, ?, ?)"
    )
      .bind(name, logoKey, website, sortOrder, published)
      .run();
    return redirect("/web/sponsor-surfaces", "Sponsor added");
  },

  async webPushEntrypoints(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    return renderWorkspace(env, me, "web", "push", {
      eyebrow: "Push",
      title: "Contextual entrypoints",
      description: "Coordinate how fans receive timely push nudges across the Stadli app.",
      body: AdminViews.webPushEntrypoints({ ideas: PUSH_IDEAS })
    });
  },

  async webMedia(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const media = await fetchMedia(env.DB);
    return renderWorkspace(env, me, "web", "media", {
      eyebrow: "Media",
      title: "Asset library",
      description: "Upload and reuse imagery, video, and sponsor assets across the Stadli experience.",
      body: AdminViews.webMedia({ media })
    });
  },

  async webMediaUpload(env: Env, user: User | null, request: Request): Promise<Response> {
    requireUser(user);
    const fd = await request.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) return redirect("/web/media", "No file selected");
    const array = new Uint8Array(await file.arrayBuffer());
    const now = new Date();
    const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}-${file.name}`;
    await env.MEDIA_BUCKET.put(key, array, { httpMetadata: { contentType: file.type || "application/octet-stream" } });
    await env.DB.prepare("INSERT INTO media(key, filename, content_type, size) VALUES(?, ?, ?, ?)")
      .bind(key, file.name, file.type || null, array.byteLength)
      .run();
    return redirect("/web/media", "Asset uploaded");
  },
  async campaignsList(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    return renderWorkspace(env, me, "campaigns", "list", {
      eyebrow: "Campaign engine",
      title: "Programs in market",
      description: "Monitor live, scheduled, and completed campaigns with quick actions into the builder.",
      actions: [{ label: "New campaign", href: "/campaigns/new", variant: "primary" }],
      body: AdminViews.campaignsList({ campaigns: randomCampaigns() })
    });
  },

  async campaignsCalendar(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    return renderWorkspace(env, me, "campaigns", "calendar", {
      eyebrow: "Scheduling",
      title: "Calendar",
      description: "Blend game-day cadences with evergreen journeys.",
      body: AdminViews.campaignsCalendar({ events: calendarEvents() })
    });
  },

  async campaignsBuilder(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const fans = await fetchFans(env.DB);
    const segments = computeSegments(fans).map((seg, idx) => ({ id: `seg-${idx}`, name: seg.name, size: fmtNumber(seg.size) }));
    const offers = randomCampaigns().map((campaign, idx) => ({ id: `offer-${idx}`, title: campaign.name }));
    const safeguards = ["Respect quiet hours by role", "Exclude recent purchasers", "Cap sends at 3/week per fan"];
    return renderWorkspace(env, me, "campaigns", "builder", {
      eyebrow: "Builder",
      title: "Compose a campaign",
      description: "AI assistants help draft copy, generate audiences, and enforce safeguards.",
      actions: [{ label: "Use playbook", href: "/campaigns/playbooks", variant: "ghost" }],
      body: AdminViews.campaignsBuilder({ segments, offers, safeguards })
    });
  },

  async campaignsCreate(env: Env, user: User | null, request: Request): Promise<Response> {
    requireUser(user);
    const fd = await request.formData();
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return redirect("/campaigns/new", "Name required");
    return redirect("/campaigns/list", `${name} staged with launch checklist`);
  },

  async campaignsPlaybooks(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const playbooks = [
      { title: "Renewal Accelerator", focus: "Revenue", description: "Multi-touch campaign to renew season ticket holders." },
      { title: "Merch Drop Booster", focus: "Engagement", description: "Email + push combo to sell fresh merch drops." },
      { title: "Away Game Watch Party", focus: "Growth", description: "Drive RSVPs to team-hosted watch parties." }
    ];
    return renderWorkspace(env, me, "campaigns", "playbooks", {
      eyebrow: "Playbooks",
      title: "Repeatable wins",
      description: "Curated programs tuned for Stadli teams and fan bases.",
      body: AdminViews.campaignsPlaybooks({ playbooks })
    });
  },

  async campaignsRecommendations(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const items = [
      { title: "Retarget abandoned checkouts", impact: "+12% projected conversions", action: "/campaigns/new?prefill=Checkout" },
      { title: "Upsell VIP hospitality", impact: "High-value fans browsing premium sections", action: "/campaigns/new?prefill=VIP" }
    ];
    return renderWorkspace(env, me, "campaigns", "recommendations", {
      eyebrow: "Recommendations",
      title: "AI nudges",
      description: "Suggested plays based on commerce, attendance, and engagement signals.",
      body: AdminViews.campaignsRecommendations({ items })
    });
  },

  async campaignsAutomations(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const automations = [
      { name: "Post-game recap", trigger: "Game ends", status: "Active" },
      { name: "New fan welcome", trigger: "Fan joins list", status: "Active" },
      { name: "Lapsed buyer rescue", trigger: "30d no purchase", status: "Paused" }
    ];
    return renderWorkspace(env, me, "campaigns", "automations", {
      eyebrow: "Automations",
      title: "Always-on journeys",
      description: "Automate lifecycle moments while keeping human guardrails.",
      body: AdminViews.campaignsAutomations({ automations })
    });
  },
  async analyticsNarratives(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const narratives: Narrative[] = [
      { title: "Renewals trending ahead", summary: "Renewals pacing +6% over last year with high email engagement.", link: "/analytics/overview" },
      { title: "Segment breakout", summary: "Newcomer fans converted 2x faster when offered bundles.", link: "/crm/segments" },
      { title: "Commerce spike", summary: "Merch drop 04 drove $42K in 48 hours after combined push+email send.", link: "/commerce/catalog/offers" }
    ];
    return renderWorkspace(env, me, "analytics", "narratives", {
      eyebrow: "Narratives",
      title: "AI-generated highlights",
      description: "Digest the most important fan, revenue, and campaign signals every morning.",
      body: AdminViews.analyticsNarratives({ narratives })
    });
  },

  async analyticsOverview(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const fans = await fetchFans(env.DB);
    const campaigns = randomCampaigns().length;
    const metrics = analyticsMetrics(fans.length, campaigns);
    const highlights = [
      { label: "Top channel", detail: "Email drove 58% of attributable revenue" },
      { label: "Fastest-growing segment", detail: "Rookie ticket buyers up 14% week-over-week" },
      { label: "Checkout health", detail: "Abandonment rate down 2.6 points after one-click wallet" }
    ];
    return renderWorkspace(env, me, "analytics", "overview", {
      eyebrow: "Overview",
      title: "Narratives & dashboards",
      description: "Single source of truth across fan engagement, revenue, and retention.",
      body: AdminViews.analyticsOverview({ metrics, highlights })
    });
  },

  async analyticsAttribution(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const rows = [
      { source: "Email", revenue: "$210K", assist: "42%", recommended: "Clone Renewal Accelerator" },
      { source: "Push", revenue: "$78K", assist: "19%", recommended: "Launch Game 3 push" },
      { source: "Paid social", revenue: "$54K", assist: "11%", recommended: "Retarget VIP prospects" }
    ];
    return renderWorkspace(env, me, "analytics", "attribution", {
      eyebrow: "Attribution",
      title: "Channel influence",
      description: "Tie campaigns to sales and fan actions with closed-loop attribution.",
      body: AdminViews.analyticsAttribution({ rows })
    });
  },

  async analyticsFunnel(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const stages = [
      { stage: "Awareness", conversion: "34%", delta: "+3 pts" },
      { stage: "Engaged", conversion: "22%", delta: "+1 pt" },
      { stage: "Checkout", conversion: "12%", delta: "-0.4 pt" }
    ];
    return renderWorkspace(env, me, "analytics", "funnel", {
      eyebrow: "Funnel",
      title: "Lifecycle analytics",
      description: "Track how fans progress across awareness, engagement, and conversion.",
      body: AdminViews.analyticsFunnel({ stages })
    });
  },

  async analyticsSegments(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const segments = [
      { name: "Rookie buyers", lift: "+42%", action: "/crm/segments" },
      { name: "VIP hospitality", lift: "+28%", action: "/campaigns/new?prefill=VIP" }
    ];
    return renderWorkspace(env, me, "analytics", "segments", {
      eyebrow: "Segment insights",
      title: "Performance snapshots",
      description: "See which cohorts respond best to campaigns and offers.",
      body: AdminViews.analyticsSegments({ segments })
    });
  },

  async analyticsWebTag(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const status = [
      { label: "Events received", value: "Last event 2m ago", healthy: true },
      { label: "Latency", value: "p95 280ms", healthy: true },
      { label: "Consent coverage", value: "96% sessions", healthy: true },
      { label: "Do Not Track", value: "Compliant", healthy: true }
    ];
    const catalog = ["page", "cta", "checkout", "merch_add_to_cart"];
    const roadmap = ["Custom events", "Payload validator"];
    return renderWorkspace(env, me, "analytics", "web-tag", {
      eyebrow: "Web tag",
      title: "Diagnostics",
      description: "Monitor event flow, consent, and integrations health across the web experience.",
      body: AdminViews.analyticsWebTag({ status, catalog, roadmap })
    });
  },
  async commerceCatalogTickets(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const tickets = [
      { name: "Playoff lower bowl", price: "$189", status: "On sale" },
      { name: "Family pack", price: "$120", status: "Low inventory" }
    ];
    return renderWorkspace(env, me, "commerce", "tickets", {
      eyebrow: "Tickets",
      title: "Ticketing catalog",
      description: "Unify ticket, pack, and premium offerings with Stadli commerce.",
      actions: [{ label: "Add ticket", href: "/commerce/catalog/tickets", variant: "primary" }],
      body: AdminViews.commerceCatalogTickets({ tickets })
    });
  },

  async commerceCatalogProducts(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const products = [
      { name: "City edition jersey", price: "$129", status: "Live" },
      { name: "Warm-up hoodie", price: "$98", status: "Preorder" }
    ];
    return renderWorkspace(env, me, "commerce", "products", {
      eyebrow: "Merch",
      title: "Merch & bundles",
      description: "Manage ecommerce assortments alongside ticketing.",
      body: AdminViews.commerceCatalogProducts({ products })
    });
  },

  async commerceOffers(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const offers = [
      { name: "VIP courtside upgrade", surface: "Homepage hero", engagement: "7.8% CTR" },
      { name: "Merch drop 04", surface: "App stories", engagement: "5.2% CTR" }
    ];
    return renderWorkspace(env, me, "commerce", "offers", {
      eyebrow: "Offers",
      title: "Surface performance",
      description: "See how offers perform across Stadli-managed surfaces.",
      body: AdminViews.commerceOffers({ offers })
    });
  },

  async commerceOrders(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const orders = sampleOrders();
    return renderWorkspace(env, me, "commerce", "orders", {
      eyebrow: "Orders",
      title: "Transactions",
      description: "One place for tickets, merch, and refunds.",
      body: AdminViews.commerceOrders({ orders })
    });
  },

  async commercePromotions(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const promotions = [
      { name: "Playoff push bundle", lift: "+18%", window: "May 3 – May 9" },
      { name: "Founders night", lift: "+11%", window: "Apr 21" }
    ];
    return renderWorkspace(env, me, "commerce", "promotions", {
      eyebrow: "Promotions",
      title: "Campaign overlays",
      description: "Coordinate discounts, bundles, and sponsor offers.",
      body: AdminViews.commercePromotions({ promotions })
    });
  },

  async commerceCheckout(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const checklist = [
      "Apple Pay + Stadli wallet enabled",
      "Fraud monitoring active",
      "Queue ready for high-demand drops"
    ];
    return renderWorkspace(env, me, "commerce", "checkout", {
      eyebrow: "Checkout",
      title: "Payments & compliance",
      description: "Ensure fan-friendly checkout and payment coverage.",
      body: AdminViews.commerceCheckout({ checklist })
    });
  },

  async commerceReconciliation(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const items = [
      { title: "Tixr webhooks", detail: "Last sync 5m ago", status: "Healthy" },
      { title: "Shopify orders", detail: "3 awaiting reconciliation", status: "Attention" }
    ];
    return renderWorkspace(env, me, "commerce", "reconciliation", {
      eyebrow: "Reconciliation",
      title: "Finance & ops",
      description: "Match transactions across Stadli, Tixr, Shopify, and offline sources.",
      body: AdminViews.commerceReconciliation({ items })
    });
  },
  async settingsUsers(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const users = await fetchUsers(env.DB);
    return renderWorkspace(env, me, "settings", "users", {
      eyebrow: "Access",
      title: "Users & roles",
      description: "Manage who can customize Stadli, launch campaigns, and process refunds.",
      body: AdminViews.settingsUsers({ users })
    });
  },

  async settingsIntegrations(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const settings = await settingsMap(env.DB);
    const integrations = [
      { name: "Tixr", status: settings["integration:tixr"] ?? "Connected", description: "Ticketing data sync for orders and fans.", href: "/settings/integrations?tixr" },
      { name: "Shopify", status: settings["integration:shopify"] ?? "Connected", description: "Merch catalog and orders ingestion.", href: "/settings/integrations?shopify" },
      { name: "Email provider", status: settings["integration:email"] ?? "Configured", description: "SMTP + templates for campaign sends.", href: "/settings/integrations?email" },
      { name: "Push provider", status: settings["integration:push"] ?? "In progress", description: "Mobile push and in-app messaging.", href: "/settings/integrations?push" }
    ];
    return renderWorkspace(env, me, "settings", "integrations", {
      eyebrow: "Integrations",
      title: "Connected platforms",
      description: "Keep data flowing between Stadli, ticketing, commerce, and messaging providers.",
      body: AdminViews.settingsIntegrations({ integrations })
    });
  },

  async settingsPrivacy(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const settings = await settingsMap(env.DB);
    const toggles = PRIVACY_TOGGLES.map((toggle) => ({
      key: toggle.key,
      label: toggle.label,
      description: toggle.description,
      enabled: (settings[`privacy:${toggle.key}`] ?? "off") === "on"
    }));
    return renderWorkspace(env, me, "settings", "privacy", {
      eyebrow: "Privacy",
      title: "Data guardrails",
      description: "Control how Stadli honors consent, retention, and export policies.",
      body: AdminViews.settingsPrivacy({ toggles })
    });
  },

  async settingsPrivacyToggle(env: Env, user: User | null, request: Request): Promise<Response> {
    requireUser(user);
    const fd = await request.formData();
    const key = String(fd.get("key") ?? "").trim();
    if (!key) return redirect("/settings/privacy", "Unknown toggle");
    const settings = await settingsMap(env.DB);
    const current = settings[`privacy:${key}`] === "on";
    const next = current ? "off" : "on";
    await env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
      .bind(`privacy:${key}`, next)
      .run();
    return redirect("/settings/privacy", next === "on" ? "Rule enabled" : "Rule disabled");
  },

  async settingsCustomization(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const [settings, media] = await Promise.all([settingsMap(env.DB), fetchMedia(env.DB)]);
    return renderWorkspace(env, me, "settings", "customization", {
      eyebrow: "Branding",
      title: "Colors & hero",
      description: "Update colors, logo, and hero copy used across the fan experience.",
      body: AdminViews.settingsCustomization({ settings, media })
    });
  },

  async settingsCustomizationSave(env: Env, user: User | null, request: Request): Promise<Response> {
    requireUser(user);
    const fd = await request.formData();
    const primary = String(fd.get("primary_color") ?? "#0b5fff").trim();
    const secondary = String(fd.get("secondary_color") ?? "#111827").trim();
    const logoKey = String(fd.get("logo_key") ?? "").trim();
    const heroHeadline = String(fd.get("hero_headline") ?? "").trim() || "Welcome to the club";
    const heroSubheadline = String(fd.get("hero_subheadline") ?? "").trim() || "Get the latest updates.";
    const heroBackground = String(fd.get("hero_background_key") ?? "").trim();
    if (logoKey) {
      const exists = await env.DB.prepare("SELECT 1 FROM media WHERE key = ?").bind(logoKey).first();
      if (!exists) return redirect("/settings/customization", "Upload logo first");
    }
    if (heroBackground) {
      const exists = await env.DB.prepare("SELECT 1 FROM media WHERE key = ?").bind(heroBackground).first();
      if (!exists) return redirect("/settings/customization", "Upload hero background first");
    }
    await env.DB.batch([
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("primary_color", primary),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("secondary_color", secondary),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("logo_key", logoKey),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("hero_headline", heroHeadline),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("hero_subheadline", heroSubheadline),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("hero_background_key", heroBackground)
    ]);
    return redirect("/settings/customization", "Branding saved");
  },

  async settingsEnvironments(env: Env, user: User | null): Promise<Response> {
    const me = requireUser(user);
    const environments = [
      { name: "Production", status: "Live", detail: "Serves all fans at stadli.app" },
      { name: "Staging", status: "Testing", detail: "Preview new campaigns and integrations" },
      { name: "Local", status: "Developer", detail: "Cloudflare Workers dev" }
    ];
    return renderWorkspace(env, me, "settings", "environments", {
      eyebrow: "Environments",
      title: "Deployment lanes",
      description: "Track where features ship and how data flows between environments.",
      body: AdminViews.settingsEnvironments({ environments })
    });
  }
};
