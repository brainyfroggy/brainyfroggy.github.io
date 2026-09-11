document.getElementById("year").textContent = new Date().getFullYear();
const fusionVideo = document.getElementById("fusion-video");
if (fusionVideo) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = navigator.connection?.saveData;
  // Keep the still poster for reduced motion, data saving, or blocked autoplay.
  if (!reducedMotion.matches && !saveData) {
    fusionVideo.muted = true;
    fusionVideo.play().catch(() => {});
  }
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) fusionVideo.pause();
  });
}
