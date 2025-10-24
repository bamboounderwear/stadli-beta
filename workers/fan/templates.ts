import type { Content, Post, Sponsor } from "../types";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] as string));

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const truncate = (s: string, length: number) => (s.length > length ? `${s.slice(0, length - 1)}…` : s);

export const FanViews = {
  home({
    content,
    posts,
    sponsors,
    hero,
  }: {
    content: Content | null;
    posts: Post[];
    sponsors: Sponsor[];
    hero: { headline: string; subheadline: string; backgroundUrl: string | null };
  }) {
    const heroBg = hero.backgroundUrl ? ` style="background-image:url('${esc(hero.backgroundUrl)}');"` : "";
    const heroOverlay = hero.backgroundUrl ? '<div class="hero__overlay"></div>' : "";
    const heroSection = `
      <section class="hero${hero.backgroundUrl ? " hero--with-image" : ""}"${heroBg}>
        ${heroOverlay}
        <div class="container hero__content">
          <h1>${esc(hero.headline)}</h1>
          <p>${esc(hero.subheadline)}</p>
        </div>
      </section>
    `;

    const newsCards = posts
      .map((post) => {
        const source = post.excerpt?.trim() ? post.excerpt.trim() : stripHtml(post.body);
        const summary = truncate(source, 160);
        const date = (post.published_at ?? post.created_at ?? "").split("T")[0];
        return `
          <article class="card news-card">
            <div class="news-card__meta">${esc(date)}</div>
            <h3>${esc(post.title)}</h3>
            <p>${esc(summary)}</p>
          </article>
        `;
      })
      .join("");

    const newsSection = posts.length
      ? `
        <section class="home-section">
          <div class="section-header">
            <h2>Latest News</h2>
          </div>
          <div class="news-grid">
            ${newsCards}
          </div>
        </section>
      `
      : "";

    const contentSection = content
      ? `
        <section class="home-section">
          <div class="section-header">
            <h2>${esc(content.title)}</h2>
          </div>
          <article class="card">
            <div>${content.body}</div>
          </article>
        </section>
      `
      : `
        <section class="home-section">
          <article class="card">
            <h2>Welcome</h2>
            <p>Content is coming soon.</p>
          </article>
        </section>
      `;

    const sponsorCards = sponsors
      .map((sponsor) => {
        const logo = sponsor.logo_key
          ? `<img src="/media/${esc(sponsor.logo_key)}" alt="${esc(sponsor.name)} logo" loading="lazy"/>`
          : `<div class="sponsor-card__placeholder">${esc(sponsor.name.charAt(0).toUpperCase())}</div>`;
        const inner = `
          ${logo}
          <span>${esc(sponsor.name)}</span>
        `;
        if (sponsor.website_url) {
          return `<a class="sponsor-card" href="${esc(sponsor.website_url)}" target="_blank" rel="noopener">${inner}</a>`;
        }
        return `<div class="sponsor-card">${inner}</div>`;
      })
      .join("");

    const sponsorsSection = sponsors.length
      ? `
        <section class="home-section">
          <div class="section-header">
            <h2>Featured Sponsors</h2>
          </div>
          <div class="sponsors-grid">
            ${sponsorCards}
          </div>
        </section>
      `
      : "";

    return `
      ${heroSection}
      <div class="container home-content">
        ${newsSection}
        ${contentSection}
        ${sponsorsSection}
      </div>
    `;
  }
};
