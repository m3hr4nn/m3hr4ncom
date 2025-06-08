---
title: "AI News Feed"
date: 2025-05-31T12:00:00Z
draft: false
---

<div id="news-feed" style="max-width: 900px; margin: 2rem auto; font-family: Arial, sans-serif;">

  <!-- NewsAPI Section -->
  <h3 style="margin-bottom: 1rem; text-align: center;">NewsAPI</h3>
  <table style="width: 100%; border-collapse: separate; border-spacing: 1rem;" id="newsapi"></table>
  <div style="text-align: center; margin-bottom: 2rem;">
    <button onclick="loadMoreNewsAPI()" style="padding: 0.5rem 1rem; border: none; border-radius: 4px; background-color: #007acc; color: white; cursor: pointer;">+ More NewsAPI</button>
  </div>

  <!-- GNews Section -->
  <h3 style="margin-top: 3rem; margin-bottom: 1rem; text-align: center;">GNews</h3>
  <table style="width: 100%; border-collapse: separate; border-spacing: 1rem;" id="gnews"></table>
  <div style="text-align: center;">
    <button onclick="loadMoreGNews()" style="padding: 0.5rem 1rem; border: none; border-radius: 4px; background-color: #007acc; color: white; cursor: pointer;">+ More GNews</button>
  </div>

</div>

<style>
  .news-image {
    width: 90px;
    height: 90px;
    object-fit: cover;
    border-radius: 6px;
  }

  .news-title {
    font-weight: bold;
    font-size: 0.95rem;
    color: var(--link-color, #007acc);
    text-decoration: none;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .news-description {
    font-size: 0.85rem;
    color: var(--text-color, #444);
    margin-top: 0.3rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  @media (prefers-color-scheme: dark) {
    .news-description {
      color: #bbb;
    }
    .news-title {
      color: #4fc3f7;
    }
  }
</style>

<script>
  let newsApiPage = 1;
  let gnewsPage = 1;
  const pageSize = 3;
  const backendBase = "http://127.0.0.1:5000";

  async function loadMoreNewsAPI() {
    const url = `${backendBase}/api/newsapi?page=${newsApiPage}&pageSize=${pageSize}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const html = data.articles.map(article => `
        <tr>
          <td style="width: 100px; vertical-align: top;">
            <img src="${article.urlToImage || 'https://via.placeholder.com/90'}" alt="News Image" class="news-image" onerror="this.src='https://via.placeholder.com/90';">
          </td>
          <td>
            <a href="${article.url}" class="news-title" target="_blank">${article.title}</a>
            <div class="news-description">${article.description || ''}</div>
          </td>
        </tr>
      `).join('');
      document.getElementById('newsapi').insertAdjacentHTML('beforeend', html);
      newsApiPage++;
    } catch (err) {
      console.error("NewsAPI fetch error:", err);
    }
  }

  async function loadMoreGNews() {
    const url = `${backendBase}/api/gnews?page=${gnewsPage}&max=${pageSize}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const html = data.articles.map(article => `
        <tr>
          <td style="width: 100px; vertical-align: top;">
            <img src="${article.image || 'https://via.placeholder.com/90'}" alt="News Image" class="news-image" onerror="this.src='https://via.placeholder.com/90';">
          </td>
          <td>
            <a href="${article.url}" class="news-title" target="_blank">${article.title}</a>
            <div class="news-description">${article.description || ''}</div>
          </td>
        </tr>
      `).join('');
      document.getElementById('gnews').insertAdjacentHTML('beforeend', html);
      gnewsPage++;
    } catch (err) {
      console.error("GNews fetch error:", err);
    }
  }

  // Initial Load
  loadMoreNewsAPI();
  loadMoreGNews();
</script>

