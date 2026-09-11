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

const exploreBrain = document.getElementById("explore-brain");
if (exploreBrain) {
  const plot = document.getElementById("brain-plot");
  const poster = document.getElementById("brain-poster");
  const controls = document.getElementById("brain-controls");
  const status = document.getElementById("brain-status");
  let ready = false;
  let meshes = [];
  let libraryPromise;
  const cameras = {
    left: { eye: { x: -2.2, y: 0, z: 0.15 } },
    posterior: { eye: { x: 0, y: -2.2, z: 0.15 } },
    right: { eye: { x: 2.2, y: 0, z: 0.15 } },
    reset: { eye: { x: 1.5, y: -1.7, z: 0.7 } }
  };
  function loadPlotly() {
    if (window.Plotly) return Promise.resolve();
    if (!libraryPromise) {
      libraryPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "vendor/plotly.min.js";
        script.onload = resolve;
        script.onerror = () => { libraryPromise = null; script.remove(); reject(new Error("Library unavailable")); };
        document.head.append(script);
      });
    }
    return libraryPromise;
  }
  exploreBrain.addEventListener("click", async () => {
    if (ready) {
      const show = plot.hidden;
      plot.hidden = controls.hidden = !show;
      poster.hidden = show;
      exploreBrain.textContent = show ? "Show overview" : "Explore in 3D ↗";
      exploreBrain.setAttribute("aria-expanded", String(show));
      if (show) window.Plotly.Plots.resize(plot);
      return;
    }
    exploreBrain.disabled = true;
    status.textContent = "Loading the 3D visualization…";
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) throw new Error("WebGL unavailable");
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      const [, data] = await Promise.all([
        loadPlotly(),
        fetch("media/scene-emotion-meshes.json").then(response => {
          if (!response.ok) throw new Error("Mesh data unavailable");
          return response.json();
        })
      ]);
      // Keep the source geometry and colors; adjust only display transparency.
      meshes = data.filter(trace => trace.type === "mesh3d").map(trace => ({
        ...trace, opacity: trace.name.startsWith("Brain ") ? 0.12 : 0.9,
        showlegend: false, hoverinfo: trace.name.startsWith("Brain ") ? "skip" : "name"
      }));
      plot.hidden = false;
      await window.Plotly.newPlot(plot, meshes, {
        autosize: true, margin: { l: 0, r: 0, t: 0, b: 0 }, showlegend: false,
        paper_bgcolor: "white", scene: {
          xaxis: { visible: false }, yaxis: { visible: false }, zaxis: { visible: false },
          bgcolor: "white", aspectmode: "data", dragmode: "orbit", camera: cameras.reset
        }
      }, { responsive: true, displayModeBar: false, scrollZoom: false, displaylogo: false });
      ready = true;
      poster.hidden = true;
      controls.hidden = false;
      exploreBrain.textContent = "Show overview";
      exploreBrain.setAttribute("aria-expanded", "true");
      status.textContent = "";
    } catch (error) {
      plot.hidden = true;
      poster.hidden = false;
      status.textContent = "The 3D view couldn’t load in this browser. You can still explore the three views above, or try again.";
    } finally {
      exploreBrain.disabled = false;
    }
  });
  controls.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
    window.Plotly.relayout(plot, { "scene.camera": cameras[button.dataset.view] });
  }));
  controls.querySelectorAll("[data-layer]").forEach(input => input.addEventListener("change", () => {
    const index = meshes.findIndex(trace => trace.name === input.dataset.layer);
    if (index >= 0) window.Plotly.restyle(plot, { visible: input.checked }, [index]);
  }));
}
