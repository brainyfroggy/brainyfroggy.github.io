// Fill in verified links when content is provided. Empty links stay visibly pending.
const portfolio = {
  githubUrl: "https://github.com/0042sc"
};

document.getElementById("year").textContent = new Date().getFullYear();
if (portfolio.githubUrl) {
  const url = new URL(portfolio.githubUrl);
  if (url.protocol === "https:" && url.hostname === "github.com") {
    const link = document.createElement("a");
    link.href = url.href;
    link.className = "active-link";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append("GitHub ");
    const arrow = document.createElement("span");
    arrow.textContent = "↗";
    arrow.setAttribute("aria-hidden", "true");
    link.append(arrow);
    document.getElementById("github-link").replaceWith(link);
  }
}
