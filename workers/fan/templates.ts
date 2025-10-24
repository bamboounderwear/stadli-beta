import type { Content } from "../types";

export const FanViews = {
  home({ content }: { content: Content | null }) {
    if (!content) {
      return `
        <h1>Welcome</h1>
        <p>Content is coming soon.</p>
      `;
    }
    return `
      <article class="card">
        <h1>${content.title}</h1>
        <div>${content.body}</div>
      </article>
    `;
  }
};
