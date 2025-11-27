export const products = [
  {
    title: "🤖 How to Create Your AI Model",
    description: "Step-by-step guide to designing and launching your own AI influencer that works 24/7 without showing your face.",
    links: [
      { label: "Watch Video 1", url: "https://youtu.be/ss5bEkEKM3U?si=A4FXzuqbus6n8Hdj" },
      { label: "Watch Video 2", url: "https://youtu.be/fCH4C2VfjN0?si=-53jsXZW2pJKmgH-" }
    ]
  },
  {
    title: "📱 AI Faceless Theme Page Course",
    description: "Learn how to build viral theme pages on TikTok, Instagram & YouTube that grow fast and monetize with digital products.",
    links: [
      { label: "View Blueprint 1", url: "https://www.canva.com/design/DAGz2LhEgoQ/yVrKw0Gpsnohe7lgkCtbcA/view?utm_content=DAGz2LhEgoQ&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview" },
      { label: "View Blueprint 2", url: "https://www.canva.com/design/DAGz8kFfxMg/dxp_5qZZLHbyrkkEilpkAQ/view?utm_content=DAGz8kFfxMg&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview" }
    ]
  },
  {
    title: "🔥 OnlyFans Blueprint",
    description: "The proven system to launch and scale a profitable OnlyFans business (with or without showing your face).",
    links: [
      { label: "Get the Blueprint", url: "https://www.canva.com/design/DAGz0PVQxaw/zn8PdhapmxU_mzYYkNin5Q/edit?utm_content=DAGz0PVQxaw&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton" }
    ]
  },
  {
    title: "⚡ Fanvue Blueprint",
    description: "A full playbook for building your faceless or AI influencer empire on Fanvue — the new wave platform for creators.",
    links: []
  },
  {
    title: "👣 Viral Feet Play Blueprint",
    description: "The exact strategy to grow a faceless, niche page in the “feet economy” and monetize through viral marketing + subscribers.",
    links: [
      { label: "Get the Blueprint", url: "https://www.canva.com/design/DAG0Y-kfRhM/15jYAdXD8xKKX1MbV48FSg/edit?utm_content=DAG0Y-kfRhM&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton" }
    ]
  },
  {
    title: "🌶️ Spicy AI Influencer",
    description: "Advanced strategies for the spicy niche.",
    links: [
      { label: "View Design 1", url: "https://www.canva.com/design/DAG3bNUYAF0/Y3TC1s5L1h54jktp72QVlQ/view?utm_content=DAG3bNUYAF0&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=haf3d320798" },
      { label: "View Design 2", url: "https://www.canva.com/design/DAG3bE_KGVI/6Ls7i_SXCpIYEfqxbskTsA/view?utm_content=DAG3bE_KGVI&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hb1de16f6d0" }
    ]
  }
];

export function renderDashboard(container) {
  container.innerHTML = `
    <header class="hero">
      <h1>KPS Business -N- The Box 🔥</h1>
      <p class="subtitle">Your complete roadmap to building scalable digital businesses that print cash flow.</p>
    </header>
    
    <main class="grid-container">
      ${products.map(product => `
        <article class="card">
          <div>
            <h2>${product.title}</h2>
            <p>${product.description}</p>
          </div>
          <div class="card-actions">
            ${product.links.map(link => `
              <a href="${link.url}" target="_blank" class="btn btn-primary">${link.label}</a>
            `).join('')}
            ${product.links.length === 0 ? '<span style="color:var(--text-secondary); font-size:0.9rem;">Coming Soon</span>' : ''}
          </div>
        </article>
      `).join('')}
    </main>
    
     <footer style="text-align: center; padding: 4rem 0; color: var(--text-secondary);">
       <p>&copy; ${new Date().getFullYear()} KPS Business. All rights reserved.</p>
     </footer>
  `;


}
