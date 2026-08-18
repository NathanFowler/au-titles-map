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

  const KINDS = [
    { id: "granite", label: "granite", color: "#f4b6c2" },
    { id: "felsic_volcanic", label: "felsic volcanic", color: "#f2c14e" },
    { id: "mafic_volcanic", label: "mafic volcanic", color: "#c44e52" },
    { id: "mafic_intrusive", label: "mafic intrusive", color: "#7b5ea7" },
    { id: "ultramafic", label: "ultramafic", color: "#1b7f4e" },
    { id: "sandstone", label: "sandstone", color: "#d4b483" },
    { id: "mudstone", label: "mudstone", color: "#8c7b6b" },
    { id: "carbonate", label: "carbonate", color: "#7ec8c0" },
    { id: "metamorphic", label: "metamorphic", color: "#c47ac0" },
    { id: "alluvium", label: "alluvium", color: "#ffe08a" },
    { id: "other_regolith", label: "other regolith", color: "#c9b896" },
    { id: "mixed", label: "mixed", color: "#7a9e7e" },
    { id: "other", label: "other", color: "#9aa0a6" }
  ];

  const statusEl = document.getElementById("status");
  const liveBox = document.getElementById("live-toggles");
  const deadBox = document.getElementById("dead-toggles");
  const deadMaster = document.getElementById("dead-master");
  const osmToggle = document.getElementById("osm");
  const gaToggle = document.getElementById("ga-geol");
  const kindsMaster = document.getElementById("geo-kinds");
  const kindBox = document.getElementById("kind-toggles");
  const geoSearch = document.getElementById("geo-search");
  const kindsAll = document.getElementById("kinds-all");
  const kindsNone = document.getElementById("kinds-none");

  let manifest = null;
  const layerMeta = {};
  let geoLoaded = false;
  let geoLoading = false;

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

  function geoPopupHtml(props) {
    const rows = [
      ["State", props.state],
      ["Kind", props.kind],
      ["Unit", props.name],
      ["Source", props.source]
    ].filter((r) => r[1] != null && String(r[1]).trim() !== "");
    return (
      '<div class="popup-title">' +
      escapeHtml(String(props.name || props.kind || "Geology")) +
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

  function gaPopupHtml(props) {
    const pick = [
      ["Name", props.NAME || props.NAMEU || props.UNITNAME || props.STRATNAME || props.name],
      ["Lithology", props.LITHNAME || props.LITHDESC || props.LITHOLOGY],
      ["Age", props.AGE || props.AGE_NAME || props.MAXAGE],
      ["Symbol", props.MAPSYMBOL || props.SYMBOL || props.GLCODE],
      ["Layer", props.layer || props.LAYER]
    ].filter((r) => r[1] != null && String(r[1]).trim() !== "");
    const extra = Object.keys(props || {}).filter(function (k) {
      return pick.every(function (r) { return r[0] !== k; }) && props[k] != null && String(props[k]).trim() !== "";
    }).slice(0, 6);
    const rows = pick.concat(extra.map(function (k) { return [k, props[k]]; }));
    return (
      '<div class="popup-title">GA surface geology</div>' +
      rows
        .map(function (r) {
          return (
            '<div class="popup-row"><span>' +
            escapeHtml(String(r[0])) +
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

  function firstTitleLayerId() {
    const layers = map.getStyle().layers || [];
    for (let i = 0; i < layers.length; i++) {
      const id = layers[i].id;
      if (id !== "geo-fill" && id !== "geo-line" && id.endsWith("-fill")) return id;
      if (id !== "geo-line" && id.endsWith("-line") && id.indexOf("geo") !== 0) return id;
    }
    return undefined;
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

  function buildKindToggles() {
    KINDS.forEach(function (k) {
      const lab = document.createElement("label");
      lab.className = "row";
      lab.innerHTML =
        '<input type="checkbox" checked data-kind="' +
        k.id +
        '" />' +
        '<span class="swatch" style="background:' +
        k.color +
        '"></span>' +
        "<span>" +
        k.label +
        "</span>";
      kindBox.appendChild(lab);
    });
    kindBox.addEventListener("change", applyGeoFilter);
  }

  function selectedKinds() {
    return Array.prototype.slice
      .call(kindBox.querySelectorAll('input[type="checkbox"]'))
      .filter(function (inp) { return inp.checked; })
      .map(function (inp) { return inp.getAttribute("data-kind"); });
  }

  function applyGeoFilter() {
    if (!map.getLayer("geo-fill")) return;
    const kinds = selectedKinds();
    const q = (geoSearch.value || "").trim().toLowerCase();
    let filter;
    if (!kindsMaster.checked || kinds.length === 0) {
      filter = ["==", ["get", "kind"], "__none__"];
    } else {
      filter = ["in", ["get", "kind"], ["literal", kinds]];
      if (q) {
        filter = ["all", filter, ["in", q, ["downcase", ["get", "name"]]]];
      }
    }
    map.setFilter("geo-fill", filter);
    map.setFilter("geo-line", filter);
  }

  function kindColorExpr() {
    const expr = ["match", ["get", "kind"]];
    KINDS.forEach(function (k) {
      expr.push(k.id, k.color);
    });
    expr.push("#9aa0a6");
    return expr;
  }

  function loadGeologyKinds() {
    if (geoLoaded) {
      applyGeoFilter();
      return Promise.resolve();
    }
    if (geoLoading) return Promise.resolve();
    geoLoading = true;
    log("Loading geology kinds…");
    return fetch("data/geology_kinds.geojson")
      .then(function (r) {
        if (!r.ok) throw new Error("geology_kinds.geojson HTTP " + r.status);
        return r.json();
      })
      .then(function (gj) {
        if (map.getSource("geo-kinds")) {
          map.getSource("geo-kinds").setData(gj);
        } else {
          map.addSource("geo-kinds", { type: "geojson", data: gj, generateId: true });
          const before = firstTitleLayerId();
          map.addLayer(
            {
              id: "geo-fill",
              type: "fill",
              source: "geo-kinds",
              paint: {
                "fill-color": kindColorExpr(),
                "fill-opacity": 0.42
              }
            },
            before
          );
          map.addLayer(
            {
              id: "geo-line",
              type: "line",
              source: "geo-kinds",
              paint: {
                "line-color": kindColorExpr(),
                "line-width": 0.6,
                "line-opacity": 0.7
              }
            },
            firstTitleLayerId()
          );
          map.on("mouseenter", "geo-fill", function () {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "geo-fill", function () {
            map.getCanvas().style.cursor = "";
          });
        }
        geoLoaded = true;
        geoLoading = false;
        applyGeoFilter();
        log("Geology kinds loaded (" + ((gj.features || []).length).toLocaleString() + " units). Filter by kind or name.");
      })
      .catch(function (err) {
        geoLoading = false;
        kindsMaster.checked = false;
        log("Failed geology kinds: " + err.message);
      });
  }

  function ensureGa(on) {
    if (on) {
      if (!map.getSource("ga-geol")) {
        map.addSource("ga-geol", {
          type: "raster",
          tiles: [
            "https://services.ga.gov.au/gis/rest/services/GA_Surface_Geology/MapServer/WMTS/tile/1.0.0/GA_Surface_Geology/default/GoogleMapsCompatible/{z}/{y}/{x}.png"
          ],
          tileSize: 256,
          attribution: "© Geoscience Australia CC BY 4.0"
        });
        const before = map.getLayer("geo-fill")
          ? "geo-fill"
          : firstTitleLayerId();
        map.addLayer(
          {
            id: "ga-geol",
            type: "raster",
            source: "ga-geol",
            paint: { "raster-opacity": 0.72 }
          },
          before
        );
      } else {
        map.setLayoutProperty("ga-geol", "visibility", "visible");
      }
    } else if (map.getLayer("ga-geol")) {
      map.setLayoutProperty("ga-geol", "visibility", "none");
    }
  }

  function identifyGa(lngLat) {
    const d = 0.03;
    const bbox = [lngLat.lat - d, lngLat.lng - d, lngLat.lat + d, lngLat.lng + d].join(",");
    const url =
      "https://services.ga.gov.au/gis/services/GA_Surface_Geology/MapServer/WmsServer?" +
      "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo" +
      "&LAYERS=AUS_GA_2500k_GUPoly_Lithostratigraphy,AUS_GA_1M_GUPoly_Lithostratigraphy" +
      "&QUERY_LAYERS=AUS_GA_2500k_GUPoly_Lithostratigraphy,AUS_GA_1M_GUPoly_Lithostratigraphy" +
      "&CRS=EPSG:4326&BBOX=" +
      bbox +
      "&WIDTH=101&HEIGHT=101&I=50&J=50&FEATURE_COUNT=1&INFO_FORMAT=application/geojson";
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("GetFeatureInfo " + r.status);
        return r.json();
      })
      .then(function (gj) {
        const f = (gj.features || [])[0];
        if (!f) {
          log("GA identify: no unit at click");
          return;
        }
        popup.setLngLat(lngLat).setHTML(gaPopupHtml(f.properties || {})).addTo(map);
      })
      .catch(function (err) {
        log("GA identify failed: " + err.message);
      });
  }

  function titleFillIds() {
    const ids = [];
    STATES.forEach(function (s) {
      ["live", "dead"].forEach(function (life) {
        const id = layerId(s.id, life) + "-fill";
        if (map.getLayer(id)) ids.push(id);
      });
    });
    return ids;
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

  gaToggle.addEventListener("change", function () {
    ensureGa(gaToggle.checked);
  });

  kindsMaster.addEventListener("change", function () {
    if (kindsMaster.checked) {
      kindBox.classList.remove("disabled");
      loadGeologyKinds();
    } else {
      kindBox.classList.add("disabled");
      applyGeoFilter();
    }
  });

  geoSearch.addEventListener("input", function () {
    if (!kindsMaster.checked) {
      kindsMaster.checked = true;
      kindBox.classList.remove("disabled");
    }
    if (!geoLoaded) loadGeologyKinds();
    else applyGeoFilter();
  });

  kindsAll.addEventListener("click", function () {
    kindBox.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
      inp.checked = true;
    });
    applyGeoFilter();
  });
  kindsNone.addEventListener("click", function () {
    kindBox.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
      inp.checked = false;
    });
    applyGeoFilter();
  });

  map.on("click", function (e) {
    const tLayers = titleFillIds();
    if (tLayers.length) {
      const titles = map.queryRenderedFeatures(e.point, { layers: tLayers });
      if (titles.length) {
        popup.setLngLat(e.lngLat).setHTML(popupHtml(titles[0].properties || {})).addTo(map);
        return;
      }
    }
    if (map.getLayer("geo-fill") && kindsMaster.checked) {
      const geos = map.queryRenderedFeatures(e.point, { layers: ["geo-fill"] });
      if (geos.length) {
        popup.setLngLat(e.lngLat).setHTML(geoPopupHtml(geos[0].properties || {})).addTo(map);
        return;
      }
    }
    if (gaToggle.checked) {
      identifyGa(e.lngLat);
    }
  });

  map.on("load", function () {
    buildKindToggles();
    if (osmToggle.checked) ensureOsm(true);
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
              "\nTurn on Geology kinds to filter granite, sandstone, etc.\nClick a polygon for attributes."
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
