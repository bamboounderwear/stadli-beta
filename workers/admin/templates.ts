import type { Content, Fan, Media, Post, Sponsor, User } from "../types";

type Metric = { label: string; value: string; change?: string; trend?: "up" | "down" | "flat" };

type Narrative = { title: string; summary: string; link: string };

type Card = { title: string; eyebrow?: string; body?: string; action?: { label: string; href: string } };

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] as string));

const fmtNumber = (value: number) => value.toLocaleString("en-US");

const fmtPercent = (value: number, fractionDigits = 1) => {
  if (!Number.isFinite(value)) return "0%";
  const symbol = value > 0 ? "+" : value < 0 ? "" : "±";
  return `${symbol}${Math.abs(value).toFixed(fractionDigits)}%`;
};

function renderMetrics(metrics: Metric[]) {
  return metrics
    .map((metric) => {
      const trendIcon =
        metric.trend === "up"
          ? "<span style=\"color:#c6f0a1;font-size:0.85rem;margin-right:0.25rem;\">▲</span>"
          : metric.trend === "down"
          ? "<span style=\"color:#ff9b9b;font-size:0.85rem;margin-right:0.25rem;\">▼</span>"
          : "";
      const change = metric.change ? `<div class="metric-tile__change">${trendIcon}${esc(metric.change)}</div>` : "";
      return `
        <div class="metric-tile">
          <div class="metric-tile__label">${esc(metric.label)}</div>
          <div class="metric-tile__value">${esc(metric.value)}</div>
          ${change}
        </div>
      `;
    })
    .join("");
}

function renderCards(cards: Card[]) {
  return cards
    .map((card) => {
      const eyebrow = card.eyebrow ? `<div class=\"section-eyebrow\">${esc(card.eyebrow)}</div>` : "";
      const body = card.body ? `<p class=\"section-subcopy\">${esc(card.body)}</p>` : "";
      const action = card.action ? `<a class=\"btn btn-ghost\" href=\"${esc(card.action.href)}\">${esc(card.action.label)}</a>` : "";
      return `
        <div class="card">
          ${eyebrow}
          <h3 class="section-heading" style="margin:0;">${esc(card.title)}</h3>
          ${body}
          ${action}
        </div>
      `;
    })
    .join("");
}

export const AdminViews = {
  login() {
    return `
      <section class="section-card" style="max-width:420px;margin:0 auto;">
        <div class="section-eyebrow">Secure access</div>
        <h1 class="section-heading" style="margin:0 0 1rem 0;">Stadli Admin</h1>
        <form method="post" action="/login" class="form-grid">
          <div>
            <label>Email</label>
            <input name="email" type="email" autocomplete="username" required />
          </div>
          <div>
            <label>Password</label>
            <input name="password" type="password" autocomplete="current-password" required />
          </div>
          <div class="form-actions" style="grid-column:1/-1;">
            <button class="btn btn-primary" type="submit">Sign in</button>
          </div>
        </form>
      </section>
    `;
  },
  home(data: {
    metrics: Metric[];
    quickActions: { label: string; href: string }[];
    upcoming: { date: string; title: string; status: string }[];
    segments: { name: string; size: string; delta: string }[];
    activity: { meta: string; title: string; body: string }[];
  }) {
    const metrics = renderMetrics(data.metrics);
    const quick = data.quickActions
      .map((action) => `<a class="btn" href="${esc(action.href)}">${esc(action.label)}</a>`)
      .join(" ");
    const upcoming = renderCards(
      data.upcoming.map((item) => ({
        eyebrow: item.date,
        title: item.title,
        body: item.status,
        action: { label: "Open detail", href: "/campaigns/list" },
      }))
    );
    const segments = data.segments
      .map(
        (segment) => `
          <div class="card">
            <div class="section-eyebrow">Segment</div>
            <h3 class="section-heading" style="margin:0;">${esc(segment.name)}</h3>
            <p class="section-subcopy">${esc(segment.size)}</p>
            <span class="badge">${esc(segment.delta)}</span>
            <a class="btn btn-ghost" href="/crm/segments">Inspect</a>
          </div>
        `
      )
      .join("");
    const activity = data.activity
      .map(
        (entry) => `
          <div class="activity-item">
            <div class="activity-item__meta">${esc(entry.meta)}</div>
            <div class="activity-item__title">${esc(entry.title)}</div>
            <div class="section-subcopy">${esc(entry.body)}</div>
          </div>
        `
      )
      .join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Command center</div>
        <h2 class="section-heading">Today’s signals</h2>
        <div class="metric-grid">${metrics}</div>
        <div class="highlight-callout" style="margin-top:1.2rem;">${quick || "Define quick actions in Settings"}</div>
      </section>
      <section class="split-layout">
        <div class="section-card">
          <div class="section-eyebrow">Upcoming</div>
          <h2 class="section-heading">Events & campaigns</h2>
          <div class="list-grid">${upcoming}</div>
        </div>
        <div class="section-card" id="activity">
          <div class="section-eyebrow">Narratives feed</div>
          <h2 class="section-heading">Latest updates</h2>
          <div class="activity-feed">${activity}</div>
        </div>
      </section>
      <section class="split-layout">
        <div class="section-card">
          <div class="section-eyebrow">Audience moves</div>
          <h2 class="section-heading">Segments in motion</h2>
          <div class="list-grid">${segments}</div>
        </div>
        <div class="section-card">
          <div class="section-eyebrow">Quick links</div>
          <h2 class="section-heading">Jump back in</h2>
          <div style="display:flex;flex-direction:column;gap:0.6rem;">${quick}</div>
        </div>
      </section>
    `;
  },
  search(data: {
    query: string;
    fans: Fan[];
    campaigns: { name: string; status: string; audience: string; href: string }[];
    segments: { name: string; size: string; highlight: string; href: string }[];
    orders: { id: string; customer: string; status: string; href: string }[];
    commands: { cmd: string; target: string; description: string }[];
  }) {
    const trimmedQuery = data.query.trim();
    const hasQuery = trimmedQuery.length > 0;
    const totalMatches =
      data.fans.length + data.campaigns.length + data.segments.length + data.orders.length + data.commands.length;
    const queryDisplay = esc(trimmedQuery);
    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\]/g, "\$&");
    const highlight = (value: string) => {
      const safe = esc(value);
      if (!hasQuery) return safe;
      const pattern = escapeRegex(queryDisplay);
      if (!pattern) return safe;
      return safe.replace(new RegExp(pattern, "ig"), (match) => `<mark>${match}</mark>`);
    };
    const emptyState = hasQuery && !totalMatches
      ? `<p class="workspace-search__empty">No matches for <strong>${queryDisplay}</strong>. Try a different term.</p>`
      : "";
    const introCopy = hasQuery
      ? `<p class="section-subcopy">Top matches across the workspace.</p>`
      : `<p class="section-subcopy">Search fans, campaigns, segments, orders, and workspace commands.</p>`;

    const fanItems = data.fans.length
      ? `<ul class="search-list">${data.fans
          .map((fan) => {
            const href = fan.id ? `/crm/fans/${fan.id}` : "/crm/fans";
            const email = fan.email ? highlight(fan.email) : "";
            const team = fan.favorite_team ? ` • ${highlight(fan.favorite_team)}` : "";
            const label = fan.name ? highlight(fan.name) : email || "Fan";
            return `
              <li class="search-item">
                <a href="${esc(href)}">
                  <span class="search-item__label">${label}</span>
                  <span class="search-item__meta">${email}${team}</span>
                </a>
              </li>
            `;
          })
          .join("")}</ul>`
      : `<p class="search-empty">${hasQuery ? `No fan profiles match <strong>${queryDisplay}</strong>.` : "No fans yet."}</p>`;

    const campaignItems = data.campaigns.length
      ? `<ul class="search-list">${data.campaigns
          .map((campaign) => `
            <li class="search-item">
              <a href="${esc(campaign.href)}">
                <span class="search-item__label">${highlight(campaign.name)}</span>
                <span class="search-item__meta">${esc(campaign.status)} • ${highlight(campaign.audience)}</span>
              </a>
            </li>
          `)
          .join("")}</ul>`
      : `<p class="search-empty">${hasQuery ? `No campaigns found for <strong>${queryDisplay}</strong>.` : "Campaigns appear here once created."}</p>`;

    const segmentItems = data.segments.length
      ? `<ul class="search-list">${data.segments
          .map((segment) => `
            <li class="search-item">
              <a href="${esc(segment.href)}">
                <span class="search-item__label">${highlight(segment.name)}</span>
                <span class="search-item__meta">${esc(segment.size)} fans • ${highlight(segment.highlight)}</span>
              </a>
            </li>
          `)
          .join("")}</ul>`
      : `<p class="search-empty">${hasQuery ? `No segments match <strong>${queryDisplay}</strong>.` : "Segments appear after data sync."}</p>`;

    const orderItems = data.orders.length
      ? `<ul class="search-list">${data.orders
          .map((order) => `
            <li class="search-item">
              <a href="${esc(order.href)}">
                <span class="search-item__label">${highlight(order.id)}</span>
                <span class="search-item__meta">${highlight(order.customer)} • ${highlight(order.status)}</span>
              </a>
            </li>
          `)
          .join("")}</ul>`
      : `<p class="search-empty">${hasQuery ? `No orders match <strong>${queryDisplay}</strong>.` : "Orders sync in as commerce goes live."}</p>`;

    const commandItems = data.commands.length
      ? `<ul class="search-list">${data.commands
          .map((command) => `
            <li class="search-item search-item--command">
              <a href="${esc(command.target)}">
                <span class="search-item__label">${highlight(command.cmd)}</span>
                <span class="search-item__meta">${highlight(command.description)} <code class="search-item__pill">${esc(
                  command.target
                )}</code></span>
              </a>
            </li>
          `)
          .join("")}</ul>`
      : `<p class="search-empty">${hasQuery ? `No commands match <strong>${queryDisplay}</strong>.` : "Try typing / to trigger workspace commands."}</p>`;

    return `
      <section class="section-card workspace-search">
        <div class="section-eyebrow">Global search</div>
        <h2 class="section-heading">Quick find</h2>
        ${introCopy}
        <form class="workspace-search__form" method="get" action="/search">
          <div class="workspace-search__field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <circle cx="11" cy="11" r="7" opacity="0.5"></circle>
              <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
            </svg>
            <input type="search" name="q" value="${esc(data.query)}" placeholder="Search the workspace" />
            <button class="btn btn-primary" type="submit">Search</button>
          </div>
        </form>
        ${emptyState}
      </section>
      <div class="workspace-search__results">
        <div class="section-card workspace-search__section">
          <div class="section-eyebrow">Fans</div>
          <h3 class="section-heading" style="margin:0;">Fan profiles</h3>
          ${fanItems}
        </div>
        <div class="section-card workspace-search__section">
          <div class="section-eyebrow">Campaigns</div>
          <h3 class="section-heading" style="margin:0;">Campaign engine</h3>
          ${campaignItems}
        </div>
        <div class="section-card workspace-search__section">
          <div class="section-eyebrow">Segments</div>
          <h3 class="section-heading" style="margin:0;">Audience intelligence</h3>
          ${segmentItems}
        </div>
        <div class="section-card workspace-search__section">
          <div class="section-eyebrow">Orders</div>
          <h3 class="section-heading" style="margin:0;">Commerce</h3>
          ${orderItems}
        </div>
        <div class="section-card workspace-search__section">
          <div class="section-eyebrow">Commands</div>
          <h3 class="section-heading" style="margin:0;">Quick actions</h3>
          ${commandItems}
        </div>
      </div>
    `;
  },
  crmFans(data: { fans: Fan[]; total: number; segments: { name: string; size: number; highlight: string }[] }) {
    const rows = data.fans
      .map((fan) => {
        const joined = fan.created_at ? fan.created_at.split("T")[0] : "";
        return `<tr>
          <td><a href="/crm/fans/${fan.id}">${esc(fan.name)}</a></td>
          <td>${esc(fan.email)}</td>
          <td>${esc(fan.favorite_team ?? "—")}</td>
          <td>${esc(joined)}</td>
        </tr>`;
      })
      .join("");
    const segments = renderCards(
      data.segments.map((segment) => ({
        title: segment.name,
        eyebrow: `${fmtNumber(segment.size)} fans`,
        body: segment.highlight,
        action: { label: "Open segment", href: "/crm/segments" },
      }))
    );
    return `
      <section class="split-layout">
        <div class="section-card">
          <div class="section-eyebrow">Unified fan profile</div>
          <h2 class="section-heading">${fmtNumber(data.total)} fans</h2>
          <p class="section-subcopy">All fan data is searchable, actionable, and synced across campaigns and commerce.</p>
          <form method="post" action="/crm/fans" class="form-grid" style="margin-top:1.2rem;">
            <div>
              <label>Name</label>
              <input name="name" required maxlength="120" />
            </div>
            <div>
              <label>Email</label>
              <input name="email" type="email" required maxlength="160" />
            </div>
            <div>
              <label>Favorite team</label>
              <input name="favorite_team" maxlength="120" />
            </div>
            <div class="form-actions" style="grid-column:1/-1;">
              <button class="btn btn-primary" type="submit">Add fan</button>
            </div>
          </form>
          <div class="table-container" style="margin-top:1.4rem;">
            <table class="table">
              <thead><tr><th>Name</th><th>Email</th><th>Favorite</th><th>Joined</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
        <div class="section-card">
          <div class="section-eyebrow">Segments in spotlight</div>
          <h2 class="section-heading">AI-curated cohorts</h2>
          <div class="list-grid">${segments}</div>
        </div>
      </section>
    `;
  },

  crmFanDetail(data: {
    fan: Fan;
    segments: string[];
    stats: { label: string; value: string }[];
    timeline: { meta: string; title: string; body: string }[];
    recommendations: { title: string; detail: string; href: string }[];
  }) {
    const segments = data.segments
      .map((segment) => `<span class="badge">${esc(segment)}</span>`)
      .join(" ");
    const stats = data.stats
      .map(
        (stat) => `
          <div class="card">
            <div class="section-eyebrow">${esc(stat.label)}</div>
            <h3 class="section-heading" style="margin:0;">${esc(stat.value)}</h3>
          </div>
        `
      )
      .join("");
    const timeline = data.timeline
      .map(
        (entry) => `
          <div class="timeline__item">
            <div class="timeline__meta">${esc(entry.meta)}</div>
            <div class="timeline__title">${esc(entry.title)}</div>
            <div class="section-subcopy">${esc(entry.body)}</div>
          </div>
        `
      )
      .join("");
    const recommendations = renderCards(
      data.recommendations.map((rec) => ({
        title: rec.title,
        body: rec.detail,
        action: { label: "Open flow", href: rec.href },
      }))
    );
    return `
      <section class="split-layout">
        <div class="section-card">
          <div class="section-eyebrow">Fan 360</div>
          <h2 class="section-heading">${esc(data.fan.name)}</h2>
          <p class="section-subcopy">${esc(data.fan.email)} • ${esc(data.fan.favorite_team ?? "Favorite pending")}</p>
          <div style="display:flex;gap:0.6rem;flex-wrap:wrap;margin:1rem 0;">${segments}</div>
          <div class="metric-grid">${stats}</div>
        </div>
        <div class="section-card">
          <div class="section-eyebrow">Next actions</div>
          <h2 class="section-heading">Recommendations</h2>
          <div class="list-grid">${recommendations}</div>
        </div>
      </section>
      <section class="section-card">
        <div class="section-eyebrow">Journey timeline</div>
        <h2 class="section-heading">Key interactions</h2>
        <div class="timeline">${timeline}</div>
      </section>
    `;
  },

  crmSegments(data: {
    segments: { name: string; size: number; growth: number; description: string }[];
    plays: { title: string; detail: string; href: string }[];
  }) {
    const rows = data.segments
      .map(
        (segment) => `
          <tr>
            <td><strong>${esc(segment.name)}</strong><div class="section-subcopy">${esc(segment.description)}</div></td>
            <td>${fmtNumber(segment.size)}</td>
            <td>${fmtPercent(segment.growth)}</td>
            <td><a class="btn btn-ghost" href="/crm/segments/${encodeURIComponent(segment.name)}">Open</a></td>
          </tr>
        `
      )
      .join("");
    const plays = renderCards(
      data.plays.map((play) => ({ title: play.title, body: play.detail, action: { label: "Launch", href: play.href } }))
    );
    return `
      <section class="section-card">
        <div class="section-eyebrow">Segment intelligence</div>
        <h2 class="section-heading">Growth & coverage</h2>
        <div class="table-container">
          <table class="table">
            <thead><tr><th>Segment</th><th>Size</th><th>Δ 7d</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
      <section class="section-card">
        <div class="section-eyebrow">Guided plays</div>
        <h2 class="section-heading">Ready-to-launch flows</h2>
        <div class="list-grid">${plays}</div>
      </section>
    `;
  },
  webPages(data: { pages: Content[] }) {
    const rows = data.pages
      .map(
        (page) => `
          <tr>
            <td><strong>${esc(page.title)}</strong><div class="section-subcopy">/${esc(page.slug)}</div></td>
            <td>${page.published ? "<span class=\\"badge badge--success\\">Published</span>" : "<span class=\\"badge badge--warning\\">Draft</span>"}</td>
            <td>${esc(page.created_at.split("T")[0])}</td>
          </tr>
        `
      )
      .join("");
    return `
      <section class="split-layout">
        <div class="section-card">
          <div class="section-eyebrow">Pages</div>
          <h2 class="section-heading">Site map</h2>
          <div class="table-container" style="margin-top:1.2rem;">
            <table class="table">
              <thead><tr><th>Page</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
        <div class="section-card">
          <div class="section-eyebrow">Create</div>
          <h2 class="section-heading">New CMS page</h2>
          <form method="post" action="/web/pages" class="form-grid">
            <div>
              <label>Slug</label>
              <input name="slug" placeholder="about" required maxlength="80" />
            </div>
            <div>
              <label>Title</label>
              <input name="title" required maxlength="160" />
            </div>
            <div style="grid-column:1/-1;">
              <label>Body (HTML allowed)</label>
              <textarea name="body" rows="6" required></textarea>
            </div>
            <div>
              <label>Status</label>
              <select name="published">
                <option value="1">Published</option>
                <option value="0" selected>Draft</option>
              </select>
            </div>
            <div class="form-actions" style="grid-column:1/-1;">
              <button class="btn btn-primary" type="submit">Save page</button>
            </div>
          </form>
        </div>
      </section>
    `;
  },

  webBlocks(data: { hero: { headline: string; subheadline: string; background?: string | null }; media: Media[]; posts: Post[] }) {
    const mediaOptions = data.media
      .map((asset) => `<option value="${esc(asset.key)}">${esc(asset.filename)}</option>`)
      .join("");
    const posts = renderCards(
      data.posts.map((post) => ({
        eyebrow: post.published ? "Published" : "Draft",
        title: post.title,
        body: post.excerpt ?? post.body.slice(0, 140),
      }))
    );
    const heroPreview = data.hero.background
      ? `<div class="card" style="background-image:url('${esc(data.hero.background)}');background-size:cover;background-position:center;min-height:200px;border:1px solid rgba(255,255,255,0.18);"></div>`
      : "";
    return `
      <section class="split-layout">
        <div class="section-card">
          <div class="section-eyebrow">Hero</div>
          <h2 class="section-heading">Headline & imagery</h2>
          <form method="post" action="/web/blocks" class="form-grid">
            <div style="grid-column:1/-1;">
              <label>Headline</label>
              <input name="hero_headline" value="${esc(data.hero.headline)}" maxlength="160" />
            </div>
            <div style="grid-column:1/-1;">
              <label>Subheadline</label>
              <textarea name="hero_subheadline" rows="3">${esc(data.hero.subheadline)}</textarea>
            </div>
            <div style="grid-column:1/-1;">
              <label>Background image</label>
              <select name="hero_background_key">
                <option value="">None</option>
                ${mediaOptions}
              </select>
            </div>
            <div class="form-actions" style="grid-column:1/-1;">
              <button class="btn btn-primary" type="submit">Save hero</button>
            </div>
          </form>
          ${heroPreview}
        </div>
        <div class="section-card">
          <div class="section-eyebrow">Featured content</div>
          <h2 class="section-heading">Homepage mix</h2>
          <div class="list-grid">${posts}</div>
        </div>
      </section>
    `;
  },

  webOfferSurfaces(data: { offers: { title: string; placement: string; status: string }[] }) {
    return `
      <section class="section-card">
        <div class="section-eyebrow">Offer surfaces</div>
        <h2 class="section-heading">Commerce placements</h2>
        <div class="list-grid">${renderCards(
          data.offers.map((offer) => ({
            title: offer.title,
            eyebrow: offer.placement,
            body: offer.status,
            action: { label: "Manage surface", href: "/web/blocks" },
          }))
        )}</div>
      </section>
    `;
  },

  webSponsorSurfaces(data: { sponsors: Sponsor[]; media: Media[] }) {
    const mediaOptions = data.media
      .map((asset) => `<option value="${esc(asset.key)}">${esc(asset.filename)}</option>`)
      .join("");
    const sponsors = data.sponsors
      .map(
        (sponsor) => `
          <details class="section-card" style="margin:0;">
            <summary style="cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:0.6rem;">
              <span>${esc(sponsor.name)}</span>
              <span class="badge">${sponsor.published ? "Active" : "Hidden"}</span>
            </summary>
            <form method="post" action="/web/sponsor-surfaces" style="margin-top:1rem;" class="form-grid">
              <input type="hidden" name="id" value="${sponsor.id}" />
              <div>
                <label>Name</label>
                <input name="name" value="${esc(sponsor.name)}" required />
              </div>
              <div>
                <label>Website</label>
                <input name="website_url" value="${esc(sponsor.website_url ?? "")}" placeholder="https://" />
              </div>
              <div>
                <label>Sort order</label>
                <input name="sort_order" type="number" value="${sponsor.sort_order}" />
              </div>
              <div>
                <label>Logo</label>
                <select name="logo_key">
                  <option value="">None</option>
                  ${data.media
                    .map((asset) => `<option value="${esc(asset.key)}"${asset.key === sponsor.logo_key ? " selected" : ""}>${esc(asset.filename)}</option>`)
                    .join("")}
                </select>
              </div>
              <div>
                <label>Status</label>
                <select name="published">
                  <option value="1"${sponsor.published ? " selected" : ""}>Visible</option>
                  <option value="0"${sponsor.published ? "" : " selected"}>Hidden</option>
                </select>
              </div>
              <div class="form-actions" style="grid-column:1/-1;">
                <button class="btn btn-primary" type="submit">Save sponsor</button>
              </div>
            </form>
          </details>
        `
      )
      .join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Sponsor library</div>
        <h2 class="section-heading">Placement-ready partners</h2>
        <form method="post" action="/web/sponsor-surfaces" class="form-grid" style="margin-bottom:1.3rem;">
          <input type="hidden" name="id" value="" />
          <div>
            <label>Name</label>
            <input name="name" required />
          </div>
          <div>
            <label>Website</label>
            <input name="website_url" placeholder="https://" />
          </div>
          <div>
            <label>Sort order</label>
            <input name="sort_order" type="number" value="0" />
          </div>
          <div>
            <label>Logo</label>
            <select name="logo_key">
              <option value="">None</option>
              ${mediaOptions}
            </select>
          </div>
          <div>
            <label>Status</label>
            <select name="published">
              <option value="1">Visible</option>
              <option value="0" selected>Hidden</option>
            </select>
          </div>
          <div class="form-actions" style="grid-column:1/-1;">
            <button class="btn btn-primary" type="submit">Add sponsor</button>
          </div>
        </form>
        <div class="list-grid">${sponsors || "<p>No sponsors yet.</p>"}</div>
      </section>
    `;
  },

  webPushEntrypoints(data: { ideas: { title: string; description: string }[] }) {
    const ideas = renderCards(
      data.ideas.map((idea) => ({ title: idea.title, body: idea.description, action: { label: "Attach to campaign", href: "/campaigns/new" } }))
    );
    return `
      <section class="section-card">
        <div class="section-eyebrow">Push entrypoints</div>
        <h2 class="section-heading">Moments worth a ping</h2>
        <div class="list-grid">${ideas}</div>
      </section>
    `;
  },

  webMedia(data: { media: Media[] }) {
    const rows = data.media
      .map(
        (asset) => `
          <tr>
            <td><a href="/media/${esc(asset.key)}" target="_blank">${esc(asset.filename)}</a></td>
            <td>${fmtNumber(asset.size ?? 0)} bytes</td>
            <td>${esc(asset.uploaded_at.split("T")[0])}</td>
          </tr>
        `
      )
      .join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Assets</div>
        <h2 class="section-heading">Media library</h2>
        <form method="post" action="/web/media" enctype="multipart/form-data" class="form-grid" style="margin-bottom:1.2rem;">
          <div style="grid-column:1/-1;">
            <label>Upload</label>
            <input type="file" name="file" required />
          </div>
          <div class="form-actions" style="grid-column:1/-1;">
            <button class="btn btn-primary" type="submit">Upload</button>
          </div>
        </form>
        <div class="table-container">
          <table class="table">
            <thead><tr><th>Filename</th><th>Size</th><th>Uploaded</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  },
  campaignsList(data: { campaigns: { name: string; status: string; audience: string; goal: string; performance: string }[] }) {
    const rows = data.campaigns
      .map(
        (campaign) => `
          <tr>
            <td><strong>${esc(campaign.name)}</strong><div class="section-subcopy">${esc(campaign.audience)}</div></td>
            <td>${esc(campaign.status)}</td>
            <td>${esc(campaign.goal)}</td>
            <td>${esc(campaign.performance)}</td>
            <td><a class="btn btn-ghost" href="/campaigns/${encodeURIComponent(campaign.name)}">Open</a></td>
          </tr>
        `
      )
      .join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Campaign roster</div>
        <h2 class="section-heading">Live & scheduled programs</h2>
        <div class="table-container">
          <table class="table">
            <thead><tr><th>Campaign</th><th>Status</th><th>Goal</th><th>Performance</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  },

  campaignsCalendar(data: { events: { date: string; title: string; channel: string }[] }) {
    const cards = renderCards(
      data.events.map((event) => ({
        eyebrow: event.date,
        title: event.title,
        body: event.channel,
        action: { label: "Duplicate", href: `/campaigns/new?prefill=${encodeURIComponent(event.title)}` },
      }))
    );
    return `
      <section class="section-card">
        <div class="section-eyebrow">Calendar</div>
        <h2 class="section-heading">Send schedule</h2>
        <div class="list-grid">${cards}</div>
      </section>
    `;
  },

  campaignsBuilder(data: {
    segments: { id: string; name: string; size: string }[];
    offers: { id: string; title: string }[];
    safeguards: string[];
  }) {
    const segmentOptions = data.segments
      .map((segment) => `<option value="${esc(segment.id)}">${esc(segment.name)} (${esc(segment.size)})</option>`)
      .join("");
    const offerOptions = data.offers
      .map((offer) => `<option value="${esc(offer.id)}">${esc(offer.title)}</option>`)
      .join("");
    const safeguards = data.safeguards.map((item) => `<li>${esc(item)}</li>`).join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Builder</div>
        <h2 class="section-heading">Compose a campaign</h2>
        <form method="post" action="/campaigns/new" class="form-grid">
          <div style="grid-column:1/-1;">
            <label>Campaign name</label>
            <input name="name" placeholder="Gameday push" required maxlength="160" />
          </div>
          <div>
            <label>Primary channel</label>
            <select name="channel">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push</option>
              <option value="paid">Paid Social</option>
            </select>
          </div>
          <div>
            <label>Audience segment</label>
            <select name="segment_id">${segmentOptions}</select>
          </div>
          <div>
            <label>Offer / block</label>
            <select name="offer_id">${offerOptions}</select>
          </div>
          <div style="grid-column:1/-1;">
            <label>Creative brief</label>
            <textarea name="brief" rows="4" placeholder="Outcome, proof, CTA"></textarea>
          </div>
          <div>
            <label>Send window</label>
            <input name="send_at" type="datetime-local" />
          </div>
          <div>
            <label>Conversion goal</label>
            <input name="goal" placeholder="Increase renewals by 8%" />
          </div>
          <div style="grid-column:1/-1;">
            <label>Safeguards</label>
            <ul style="padding-left:1.2rem;">${safeguards}</ul>
          </div>
          <div class="form-actions" style="grid-column:1/-1;">
            <button class="btn btn-primary" type="submit">Generate launch checklist</button>
          </div>
        </form>
      </section>
    `;
  },

  campaignsPlaybooks(data: { playbooks: { title: string; focus: string; description: string }[] }) {
    const cards = renderCards(
      data.playbooks.map((play) => ({
        title: play.title,
        eyebrow: play.focus,
        body: play.description,
        action: { label: "Launch playbook", href: `/campaigns/new?playbook=${encodeURIComponent(play.title)}` },
      }))
    );
    return `
      <section class="section-card">
        <div class="section-eyebrow">Playbooks</div>
        <h2 class="section-heading">Proven programs</h2>
        <div class="list-grid">${cards}</div>
      </section>
    `;
  },

  campaignsRecommendations(data: { items: { title: string; impact: string; action: string }[] }) {
    const cards = renderCards(
      data.items.map((item) => ({
        title: item.title,
        body: item.impact,
        action: { label: "Accept", href: item.action },
      }))
    );
    return `
      <section class="section-card">
        <div class="section-eyebrow">Recommendations</div>
        <h2 class="section-heading">AI nudges</h2>
        <div class="list-grid">${cards}</div>
      </section>
    `;
  },

  campaignsAutomations(data: { automations: { name: string; trigger: string; status: string }[] }) {
    const rows = data.automations
      .map(
        (automation) => `
          <tr>
            <td>${esc(automation.name)}</td>
            <td>${esc(automation.trigger)}</td>
            <td>${esc(automation.status)}</td>
            <td><a class="btn btn-ghost" href="/campaigns/automations/${encodeURIComponent(automation.name)}">Edit</a></td>
          </tr>
        `
      )
      .join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Automations</div>
        <h2 class="section-heading">Always-on journeys</h2>
        <div class="table-container">
          <table class="table">
            <thead><tr><th>Name</th><th>Trigger</th><th>Status</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  },
  analyticsNarratives(data: { narratives: Narrative[] }) {
    const cards = renderCards(
      data.narratives.map((item) => ({ title: item.title, body: item.summary, action: { label: "View source", href: item.link } }))
    );
    return `
      <section class="section-card">
        <div class="section-eyebrow">Narratives feed</div>
        <h2 class="section-heading">AI summaries</h2>
        <div class="list-grid">${cards}</div>
      </section>
    `;
  },

  analyticsOverview(data: { metrics: Metric[]; highlights: { label: string; detail: string }[] }) {
    const highlights = data.highlights.map((item) => `<li><strong>${esc(item.label)}:</strong> ${esc(item.detail)}</li>`).join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Overview</div>
        <h2 class="section-heading">Pulse check</h2>
        <div class="metric-grid">${renderMetrics(data.metrics)}</div>
        <ul style="padding-left:1.2rem;margin-top:1.4rem;color:var(--text-secondary);">${highlights}</ul>
      </section>
    `;
  },

  analyticsAttribution(data: { rows: { source: string; revenue: string; assist: string; recommended: string }[] }) {
    const rows = data.rows
      .map(
        (row) => `
          <tr>
            <td>${esc(row.source)}</td>
            <td>${esc(row.revenue)}</td>
            <td>${esc(row.assist)}</td>
            <td>${esc(row.recommended)}</td>
          </tr>
        `
      )
      .join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Attribution</div>
        <h2 class="section-heading">Channel influence</h2>
        <div class="table-container">
          <table class="table">
            <thead><tr><th>Source</th><th>Revenue</th><th>Assists</th><th>Recommended play</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  },

  analyticsFunnel(data: { stages: { stage: string; conversion: string; delta: string }[] }) {
    const rows = data.stages
      .map(
        (stage) => `
          <tr>
            <td>${esc(stage.stage)}</td>
            <td>${esc(stage.conversion)}</td>
            <td>${esc(stage.delta)}</td>
          </tr>
        `
      )
      .join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Funnel</div>
        <h2 class="section-heading">Lifecycle performance</h2>
        <div class="table-container">
          <table class="table">
            <thead><tr><th>Stage</th><th>Conversion</th><th>Δ vs last</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  },

  analyticsSegments(data: { segments: { name: string; lift: string; action: string }[] }) {
    const cards = renderCards(
      data.segments.map((segment) => ({ title: segment.name, body: `Lift vs control: ${segment.lift}`, action: { label: "Investigate", href: segment.action } }))
    );
    return `
      <section class="section-card">
        <div class="section-eyebrow">Segments</div>
        <h2 class="section-heading">Performance snapshots</h2>
        <div class="list-grid">${cards}</div>
      </section>
    `;
  },

  analyticsWebTag(data: { status: { label: string; value: string; healthy: boolean }[]; catalog: string[]; roadmap: string[] }) {
    const status = data.status
      .map(
        (item) => `
          <div class="card">
            <h3 class="section-heading" style="margin:0;">${esc(item.label)}</h3>
            <p class="section-subcopy">${esc(item.value)}</p>
            <span class="badge ${item.healthy ? "badge--success" : "badge--warning"}">${item.healthy ? "Healthy" : "Needs review"}</span>
          </div>
        `
      )
      .join("");
    const catalog = data.catalog.map((item) => `<li>${esc(item)}</li>`).join("");
    const roadmap = data.roadmap.map((item) => `<li>${esc(item)}</li>`).join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Web Tag</div>
        <h2 class="section-heading">Diagnostics</h2>
        <div class="list-grid">${status}</div>
        <div class="split-layout" style="margin-top:1.4rem;">
          <div class="card">
            <h3 class="section-heading" style="margin:0;font-size:1.1rem;">Event catalog</h3>
            <ul style="padding-left:1.2rem;">${catalog}</ul>
          </div>
          <div class="card">
            <h3 class="section-heading" style="margin:0;font-size:1.1rem;">Roadmap</h3>
            <ul style="padding-left:1.2rem;">${roadmap}</ul>
          </div>
        </div>
      </section>
    `;
  },
  commerceCatalogTickets(data: { tickets: { name: string; price: string; status: string }[] }) {
    const cards = renderCards(
      data.tickets.map((ticket) => ({ title: ticket.name, eyebrow: ticket.status, body: ticket.price, action: { label: "Edit", href: "/commerce/catalog/tickets" } }))
    );
    return `
      <section class="section-card">
        <div class="section-eyebrow">Tickets & packs</div>
        <h2 class="section-heading">Catalog overview</h2>
        <div class="list-grid">${cards}</div>
      </section>
    `;
  },

  commerceCatalogProducts(data: { products: { name: string; price: string; status: string }[] }) {
    const cards = renderCards(
      data.products.map((product) => ({ title: product.name, eyebrow: product.status, body: product.price, action: { label: "Edit", href: "/commerce/catalog/products" } }))
    );
    return `
      <section class="section-card">
        <div class="section-eyebrow">Products & bundles</div>
        <h2 class="section-heading">Merch mix</h2>
        <div class="list-grid">${cards}</div>
      </section>
    `;
  },

  commerceOffers(data: { offers: { name: string; surface: string; engagement: string }[] }) {
    const rows = data.offers
      .map(
        (offer) => `
          <tr>
            <td>${esc(offer.name)}</td>
            <td>${esc(offer.surface)}</td>
            <td>${esc(offer.engagement)}</td>
            <td><a class="btn btn-ghost" href="/web/offers-surfaces">Optimize</a></td>
          </tr>
        `
      )
      .join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Offers</div>
        <h2 class="section-heading">Placement performance</h2>
        <div class="table-container">
          <table class="table">
            <thead><tr><th>Offer</th><th>Surface</th><th>Engagement</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  },

  commerceOrders(data: { orders: { id: string; customer: string; total: string; status: string }[] }) {
    const rows = data.orders
      .map(
        (order) => `
          <tr>
            <td>${esc(order.id)}</td>
            <td>${esc(order.customer)}</td>
            <td>${esc(order.total)}</td>
            <td>${esc(order.status)}</td>
            <td><a class="btn btn-ghost" href="/commerce/orders/${encodeURIComponent(order.id)}">Open</a></td>
          </tr>
        `
      )
      .join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Orders & refunds</div>
        <h2 class="section-heading">Recent activity</h2>
        <div class="table-container">
          <table class="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  },

  commercePromotions(data: { promotions: { name: string; lift: string; window: string }[] }) {
    const cards = renderCards(
      data.promotions.map((promo) => ({ title: promo.name, eyebrow: promo.window, body: `Lift: ${promo.lift}`, action: { label: "View details", href: "/commerce/promotions" } }))
    );
    return `
      <section class="section-card">
        <div class="section-eyebrow">Promotions</div>
        <h2 class="section-heading">Campaign overlays</h2>
        <div class="list-grid">${cards}</div>
      </section>
    `;
  },

  commerceCheckout(data: { checklist: string[] }) {
    const items = data.checklist.map((item) => `<li>${esc(item)}</li>`).join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Checkout & payments</div>
        <h2 class="section-heading">Operational checklist</h2>
        <ul style="padding-left:1.2rem;">${items}</ul>
      </section>
    `;
  },

  commerceReconciliation(data: { items: { title: string; detail: string; status: string }[] }) {
    const rows = data.items
      .map(
        (item) => `
          <tr>
            <td>${esc(item.title)}</td>
            <td>${esc(item.detail)}</td>
            <td>${esc(item.status)}</td>
          </tr>
        `
      )
      .join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Reconciliation</div>
        <h2 class="section-heading">Integrations health</h2>
        <div class="table-container">
          <table class="table">
            <thead><tr><th>Source</th><th>Detail</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  },
  settingsUsers(data: { users: { email: string; role: string }[] }) {
    const rows = data.users
      .map((user) => `<tr><td>${esc(user.email)}</td><td>${esc(user.role)}</td></tr>`)
      .join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Users & roles</div>
        <h2 class="section-heading">Access control</h2>
        <div class="table-container" style="max-width:540px;">
          <table class="table">
            <thead><tr><th>Email</th><th>Role</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p class="section-subcopy" style="margin-top:1rem;">Role editing flows are coming soon. Contact Stadli support for escalations.</p>
      </section>
    `;
  },

  settingsIntegrations(data: { integrations: { name: string; status: string; description: string; href: string }[] }) {
    const cards = renderCards(
      data.integrations.map((integration) => ({
        title: integration.name,
        eyebrow: integration.status,
        body: integration.description,
        action: { label: "Configure", href: integration.href },
      }))
    );
    return `
      <section class="section-card">
        <div class="section-eyebrow">Integrations</div>
        <h2 class="section-heading">Connected platforms</h2>
        <div class="list-grid">${cards}</div>
      </section>
    `;
  },

  settingsPrivacy(data: { toggles: { key: string; label: string; description: string; enabled: boolean }[] }) {
    const toggles = data.toggles
      .map(
        (toggle) => `
          <form method="post" action="/settings/privacy" class="section-card" style="margin:0;">
            <input type="hidden" name="key" value="${esc(toggle.key)}" />
            <div class="section-eyebrow">Privacy rule</div>
            <h3 class="section-heading" style="margin:0;">${esc(toggle.label)}</h3>
            <p class="section-subcopy">${esc(toggle.description)}</p>
            <div class="form-actions" style="justify-content:flex-start;">
              <button class="btn ${toggle.enabled ? "btn-primary" : "btn-ghost"}" type="submit">${toggle.enabled ? "Disable" : "Enable"}</button>
            </div>
          </form>
        `
      )
      .join("");
    return `
      <section class="list-grid">${toggles}</section>
    `;
  },

  settingsCustomization(data: {
    settings: Record<string, string>;
    media: Media[];
  }) {
    const mediaOptions = data.media
      .map((asset) => `<option value="${esc(asset.key)}">${esc(asset.filename)}</option>`)
      .join("");
    return `
      <section class="section-card">
        <div class="section-eyebrow">Branding</div>
        <h2 class="section-heading">Colors & hero content</h2>
        <form method="post" action="/settings/customization" class="form-grid">
          <div>
            <label>Primary color</label>
            <input name="primary_color" value="${esc(data.settings.primary_color ?? "#0b5fff")}" />
          </div>
          <div>
            <label>Secondary color</label>
            <input name="secondary_color" value="${esc(data.settings.secondary_color ?? "#111827")}" />
          </div>
          <div>
            <label>Logo asset</label>
            <select name="logo_key">
              <option value="">Default</option>
              ${mediaOptions}
            </select>
          </div>
          <div style="grid-column:1/-1;">
            <label>Hero headline</label>
            <input name="hero_headline" value="${esc(data.settings.hero_headline ?? "Welcome to the club")}" />
          </div>
          <div style="grid-column:1/-1;">
            <label>Hero subheadline</label>
            <textarea name="hero_subheadline" rows="3">${esc(data.settings.hero_subheadline ?? "Get the latest updates.")}</textarea>
          </div>
          <div style="grid-column:1/-1;">
            <label>Hero background</label>
            <select name="hero_background_key">
              <option value="">None</option>
              ${mediaOptions}
            </select>
          </div>
          <div class="form-actions" style="grid-column:1/-1;">
            <button class="btn btn-primary" type="submit">Save customization</button>
          </div>
        </form>
      </section>
    `;
  },

  settingsEnvironments(data: { environments: { name: string; status: string; detail: string }[] }) {
    const cards = renderCards(
      data.environments.map((env) => ({ title: env.name, eyebrow: env.status, body: env.detail }))
    );
    return `
      <section class="section-card">
        <div class="section-eyebrow">Environments</div>
        <h2 class="section-heading">Deployment lanes</h2>
        <div class="list-grid">${cards}</div>
      </section>
    `;
  },
};
