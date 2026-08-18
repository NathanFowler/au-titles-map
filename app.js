(function () {
  const STATES = [
    { id: "nsw", name: "NSW", color: "#e4572e" },
    { id: "vic", name: "VIC", color: "#76b041" },
    { id: "qld", name: "QLD", color: "#4c78a8" },
    { id: "wa",  name: "WA",  color: "#f58518" },
    { id: "sa",  name: "SA",  color: "#b279a2" },
    { id: "tas", name: "TAS", color: "#54a24b" },
    { id: "nt",  name: "NT",  color: "#ff9da7" }
  ];

  const statusEl = document.getElementById("status");
  const liveBox = document.getElementById("live-toggles");
  const deadBox = document.getElementById("dead-toggles");
  const deadMaster = document.getElementById("dead-master");
  const osmToggle = document.getElementById("osm");

  let manifest = null;
  const layerMeta = {}; // key -> {features, bytes}

  function log(msg) {
    statusEl.textContent = msg;
  }

  function layerId(state, life) {
    return state + "-" + life;
  }

  function sourceId(state, life) {
    return "src-" + state + "-" + life;
  }

  const baseStyle = {
    version: 8,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": "#0b1220" }
      }
    ]
  };

  const map = new maplibregl.Map({
    container: "map",
    style: baseStyle,
    center: [134.0, -26.5],
    zoom: 4.1,
    maxZoom: 14,
    attributionControl: true
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
  map.addControl(new maplibregl.ScaleControl({ unit: "metric" }));

  const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: "340px" });

  function popupHtml(props) {
    const rows = [
      ["State", props.state],
      ["Tenure", props.tenure],
      ["Status", props.status],
      ["Name", props.name],
      ["Holder", props.holder],
      ["Grant", props.grant],
      ["Expiry", props.expiry]
    ].filter((r) => r[1] != null && String(r[1]).trim() !== "");
    const title = props.name || props.tenure || "Title";
    return (
      '<div class="popup-title">' +
      escapeHtml(String(title)) +
      "</div>" +
      rows
        .map(function (r) {
          return (
            '<div class="popup-row"><span>' +
            escapeHtml(r[0]) +
            "</span><span>" +
            escapeHtml(String(r[1])) +
            "</span></div>"
          );
        })
        .join("")
    );
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function addStateLayers(state, life, color) {
    const sid = sourceId(state, life);
    const fill = layerId(state, life) + "-fill";
    const line = layerId(state, life) + "-line";
    const url = "data/" + state + "_" + life + ".geojson";

    if (map.getSource(sid)) return Promise.resolve(true);

    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error(url + " HTTP " + r.status);
        return r.json();
      })
      .then(function (gj) {
        const n = (gj.features || []).length;
        if (n === 0) return false;
        map.addSource(sid, { type: "geojson", data: gj, generateId: true });
        const opacityFill = life === "live" ? 0.28 : 0.12;
        const opacityLine = life === "live" ? 0.9 : 0.55;
        map.addLayer({
          id: fill,
          type: "fill",
          source: sid,
          paint: {
            "fill-color": color,
            "fill-opacity": opacityFill
          }
        });
        map.addLayer({
          id: line,
          type: "line",
          source: sid,
          paint: {
            "line-color": color,
            "line-width": life === "live" ? 1.1 : 0.7,
            "line-opacity": opacityLine
          }
        });
        map.on("click", fill, function (e) {
          if (!e.features || !e.features.length) return;
          const f = e.features[0];
          popup.setLngLat(e.lngLat).setHTML(popupHtml(f.properties || {})).addTo(map);
        });
        map.on("mouseenter", fill, function () {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", fill, function () {
          map.getCanvas().style.cursor = "";
        });
        return true;
      });
  }

  function setVisible(state, life, visible) {
    const fill = layerId(state, life) + "-fill";
    const line = layerId(state, life) + "-line";
    if (!map.getLayer(fill)) return;
    const v = visible ? "visible" : "none";
    map.setLayoutProperty(fill, "visibility", v);
    map.setLayoutProperty(line, "visibility", v);
  }

  function buildToggles() {
    STATES.forEach(function (s) {
      const liveMeta = layerMeta[s.id + "_live"] || { features: 0 };
      const deadMeta = layerMeta[s.id + "_dead"] || { features: 0 };

      const liveLabel = document.createElement("label");
      liveLabel.className = "row";
      liveLabel.innerHTML =
        '<input type="checkbox" checked data-state="' +
        s.id +
        '" data-life="live" ' +
        (liveMeta.features ? "" : "disabled") +
        ' />' +
        '<span class="swatch" style="background:' +
        s.color +
        '"></span>' +
        "<span>" +
        s.name +
        " live (" +
        (liveMeta.features || 0).toLocaleString() +
        ")</span>";
      liveBox.appendChild(liveLabel);

      const deadLabel = document.createElement("label");
      deadLabel.className = "row";
      deadLabel.innerHTML =
        '<input type="checkbox" data-state="' +
        s.id +
        '" data-life="dead" ' +
        (deadMeta.features ? "" : "disabled") +
        ' />' +
        '<span class="swatch" style="background:' +
        s.color +
        ';opacity:0.45"></span>' +
        "<span>" +
        s.name +
        " dead (" +
        (deadMeta.features || 0).toLocaleString() +
        ")</span>";
      deadBox.appendChild(deadLabel);
    });

    liveBox.addEventListener("change", onToggle);
    deadBox.addEventListener("change", onToggle);
  }

  function onToggle(ev) {
    const t = ev.target;
    if (t.tagName !== "INPUT") return;
    const state = t.getAttribute("data-state");
    const life = t.getAttribute("data-life");
    const st = STATES.find(function (x) {
      return x.id === state;
    });
    if (!st) return;

    if (t.checked) {
      log("Loading " + state.toUpperCase() + " " + life + "…");
      addStateLayers(state, life, st.color)
        .then(function (ok) {
          if (!ok) {
            t.checked = false;
            log(state.toUpperCase() + " " + life + ": no features");
            return;
          }
          setVisible(state, life, true);
          log(state.toUpperCase() + " " + life + " visible");
        })
        .catch(function (err) {
          t.checked = false;
          log("Failed " + state + " " + life + ": " + err.message + "\nIf you opened index.html via file://, start a local server (see README).");
        });
    } else {
      setVisible(state, life, false);
    }
  }

  deadMaster.addEventListener("change", function () {
    if (deadMaster.checked) {
      deadBox.classList.remove("disabled");
    } else {
      deadBox.classList.add("disabled");
      deadBox.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
        if (inp.checked) {
          inp.checked = false;
          setVisible(inp.getAttribute("data-state"), "dead", false);
        }
      });
    }
  });

  function ensureOsm(on) {
    if (on) {
      if (!map.getSource("osm")) {
        map.addSource("osm", {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap"
        });
        map.addLayer(
          {
            id: "osm",
            type: "raster",
            source: "osm",
            paint: { "raster-opacity": 0.55 }
          },
          map.getStyle().layers[0] && map.getStyle().layers.length > 1
            ? map.getStyle().layers[1].id
            : undefined
        );
        // place OSM just above background
        if (map.getLayer("osm") && map.getLayer("background")) {
          try {
            map.moveLayer("osm", map.getStyle().layers.find(function (l) {
              return l.id !== "background" && l.id !== "osm";
            })?.id);
          } catch (e) {}
        }
      } else {
        map.setLayoutProperty("osm", "visibility", "visible");
      }
    } else if (map.getLayer("osm")) {
      map.setLayoutProperty("osm", "visibility", "none");
    }
  }

  osmToggle.addEventListener("change", function () {
    ensureOsm(osmToggle.checked);
  });

  map.on("load", function () {
    fetch("data/manifest.json")
      .then(function (r) {
        if (!r.ok) throw new Error("manifest.json HTTP " + r.status);
        return r.json();
      })
      .then(function (m) {
        manifest = m;
        (m.layers || []).forEach(function (L) {
          layerMeta[L.state.toLowerCase() + "_" + L.life] = {
            features: L.features,
            bytes: L.bytes
          };
        });
        buildToggles();
        // Load all live layers by default
        const jobs = STATES.map(function (s) {
          const meta = layerMeta[s.id + "_live"];
          if (!meta || !meta.features) return Promise.resolve();
          return addStateLayers(s.id, "live", s.color).then(function () {
            setVisible(s.id, "live", true);
          });
        });
        log("Loading live titles…");
        return Promise.all(jobs).then(function () {
          const live = STATES.reduce(function (a, s) {
            return a + ((layerMeta[s.id + "_live"] || {}).features || 0);
          }, 0);
          const dead = STATES.reduce(function (a, s) {
            return a + ((layerMeta[s.id + "_dead"] || {}).features || 0);
          }, 0);
          log(
            "Ready.\nLive features: " +
              live.toLocaleString() +
              "\nDead available: " +
              dead.toLocaleString() +
              "\nClick a polygon for attributes."
          );
        });
      })
      .catch(function (err) {
        log(
          "Could not load data: " +
            err.message +
            "\n\nChrome blocks fetch() from file://.\nFrom this folder run:\n  python3 -m http.server 8765\nThen open http://127.0.0.1:8765/ (local only)."
        );
      });
  });
})();
