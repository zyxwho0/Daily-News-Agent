const state = { data: null, category: "All", visible: 10 };

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = "") => {
  const node = document.createElement("span");
  node.textContent = value;
  return node.innerHTML;
};

function relativeTime(date) {
  const seconds = Math.max(0, (Date.now() - new Date(date)) / 1000);
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function meta(article) {
  return `<div class="story-meta"><span class="category">${escapeHtml(article.category)}</span><span>${escapeHtml(article.source)}</span><span>${relativeTime(article.published_at)}</span></div>`;
}

function renderLead(articles) {
  const [lead, second, third] = articles;
  if (!lead) {
    $("#leadGrid").innerHTML = `<div class="error-state">No stories match this view.</div>`;
    return;
  }
  const image = lead.image
    ? `<img src="${escapeHtml(lead.image)}" alt="" loading="eager" onerror="this.remove()">`
    : "";
  const side = [second, third].filter(Boolean).map(article => `
    <a class="secondary-story" href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">
      ${meta(article)}
      <h3>${escapeHtml(article.title)}</h3>
    </a>`).join("");
  $("#leadGrid").innerHTML = `
    <a class="lead-story" href="${escapeHtml(lead.url)}" target="_blank" rel="noopener noreferrer">
      ${image}
      <div class="lead-content">
        ${meta(lead)}
        <h3>${escapeHtml(lead.title)}</h3>
        <p>${escapeHtml(lead.summary)}</p>
      </div>
    </a>
    <div class="secondary-stack">${side}</div>`;
}

function renderRows(articles) {
  const list = $("#storyList");
  list.innerHTML = "";
  articles.slice(3, state.visible).forEach((article, index) => {
    const row = $("#storyRowTemplate").content.cloneNode(true);
    row.querySelector(".story-number").textContent = String(index + 4).padStart(2, "0");
    row.querySelector(".category").textContent = article.category;
    row.querySelector(".source").textContent = article.source;
    row.querySelector(".time").textContent = relativeTime(article.published_at);
    const link = row.querySelector("h3 a");
    link.textContent = article.title;
    link.href = article.url;
    row.querySelector(".story-copy > p").textContent = article.summary;
    list.appendChild(row);
  });
  $("#loadMore").hidden = state.visible >= articles.length;
}

function filteredArticles() {
  return state.category === "All"
    ? state.data.articles
    : state.data.articles.filter(article => article.category === state.category);
}

function renderStories() {
  const articles = filteredArticles();
  renderLead(articles);
  renderRows(articles);
}

function renderFilters() {
  const categories = ["All", ...new Set(state.data.articles.map(item => item.category))];
  $("#filters").innerHTML = categories.map(category =>
    `<button class="filter ${category === state.category ? "active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`
  ).join("");
  $("#filters").addEventListener("click", event => {
    const button = event.target.closest(".filter");
    if (!button) return;
    state.category = button.dataset.category;
    state.visible = 10;
    renderFilters();
    renderStories();
  }, { once: true });
}

function render(data) {
  state.data = data;
  const generated = new Date(data.generated_at);
  $("#todayLabel").textContent = generated.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric"
  });
  const briefingItems = data.briefing_items?.length
    ? data.briefing_items
    : [{ headline: "Today’s briefing", summary: data.briefing }];
  $("#briefingList").innerHTML = briefingItems.map(item => `
    <li>
      <strong>${escapeHtml(item.headline)}</strong>
      <span>${escapeHtml(item.summary)}</span>
    </li>
  `).join("");
  $("#storyCount").textContent = `${data.articles.length} stories reviewed`;
  $("#updatedAt").textContent = `${data.stale ? "Cached" : "Updated"} ${relativeTime(data.generated_at)}`;
  $("#sourceNote").textContent = `Reporting from ${data.sources.join(", ")}.`;
  $("#topicCloud").innerHTML = (data.topics.length ? data.topics : [
    { name: "World", count: "—" }, { name: "Business", count: "—" }, { name: "Technology", count: "—" }
  ]).map(topic => `<span class="topic">${escapeHtml(topic.name)} <sup>${topic.count}</sup></span>`).join("");
  renderFilters();
  renderStories();
}

async function loadNews(force = false) {
  const button = $("#refreshButton");
  button.classList.add("loading");
  button.disabled = true;
  try {
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const endpoint = isLocal
      ? `/api/news${force ? "?refresh=1" : ""}`
      : `./data/news.json${force ? `?refresh=${Date.now()}` : ""}`;
    const response = await fetch(endpoint, { cache: force ? "no-store" : "default" });
    if (!response.ok) throw new Error("News service unavailable");
    const data = await response.json();
    render(data);
  } catch (error) {
    $("#leadGrid").innerHTML = `<div class="error-state"><div><strong>We couldn’t reach the newsroom.</strong><br>Check your connection, then try refresh.</div></div>`;
  } finally {
    button.classList.remove("loading");
    button.disabled = false;
  }
}

$("#refreshButton").addEventListener("click", () => loadNews(true));
$("#loadMore").addEventListener("click", () => {
  state.visible += 10;
  renderRows(filteredArticles());
});
loadNews();
