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


  // Mineral types from occ.json comm tokens (not invented). Titles have no commodity field.
  const MINERALS = [
    { id: "gold", label: "gold", color: "#f2c14e" },
    { id: "copper", label: "copper", color: "#e07a3d" },
    { id: "silver", label: "silver", color: "#c9d1d9" },
    { id: "iron", label: "iron", color: "#c44e52" },
    { id: "lead", label: "lead", color: "#7a8490" },
    { id: "zinc", label: "zinc", color: "#5dade2" },
    { id: "tin", label: "tin", color: "#8fa38a" },
    { id: "nickel", label: "nickel", color: "#2a9d8f" },
    { id: "coal", label: "coal", color: "#5c5346" },
    { id: "lithium", label: "lithium", color: "#9b5de5" },
    { id: "uranium", label: "uranium", color: "#8bc34a" },
    { id: "manganese", label: "manganese", color: "#c47ac0" },
    { id: "tungsten", label: "tungsten", color: "#5c6bc0" },
    { id: "diamond", label: "diamond", color: "#80deea" },
    { id: "construction", label: "construction", color: "#d4b483" },
    { id: "other", label: "other", color: "#9aa0a6" }
  ];

  const MINERAL_EXACT = {
    au: "gold", gold: "gold",
    cu: "copper", copper: "copper",
    ag: "silver", silver: "silver",
    fe: "iron", iron: "iron", "iron ore": "iron", mag: "iron", magnetite: "iron",
    feore: "iron", fe2o3: "iron", "iron oxides - magnetite": "iron", "iron oxides": "iron",
    pb: "lead", lead: "lead",
    zn: "zinc", zinc: "zinc",
    sn: "tin", tin: "tin", sno2: "tin",
    ni: "nickel", nickel: "nickel",
    coal: "coal", "coal -general": "coal", "coal - general": "coal",
    "thermal coal": "coal", "coal-general": "coal",
    li: "lithium", lithium: "lithium",
    u: "uranium", uranium: "uranium",
    mn: "manganese", manganese: "manganese",
    w: "tungsten", tungsten: "tungsten",
    dmd: "diamond", diamond: "diamond", "diamond - gem": "diamond",
    "unprocessed construction materials": "construction",
    "gravel - aggregate": "construction", gvl: "construction", sd: "construction",
    sand: "construction", "sand - construction": "construction",
    "sand and gravel": "construction", gravel: "construction",
    "gravel - undifferentiated": "construction",
    "coarse aggregate - hard rock": "construction",
    "coarse aggregate - river gravel": "construction",
    "coarse aggregate": "construction",
    "coarse aggregate - armour stone": "construction",
    "coarse aggregate - sandstone": "construction",
    agg: "construction", aggc: "construction",
    gv: "construction", qr: "construction", aggreg: "construction",
    "quarry rock": "construction", "building stone": "construction",
    "foundry sand": "construction", "silica sand": "construction",
    cnc: "coal"
  };

  const MINERAL_PHRASES = [
    ["gold", ["gold"]],
    ["copper", ["copper"]],
    ["silver", ["silver"]],
    ["iron", ["iron", "magnetite"]],
    ["lead", ["lead"]],
    ["zinc", ["zinc"]],
    ["tin", ["tin"]],
    ["nickel", ["nickel"]],
    ["coal", ["coal"]],
    ["lithium", ["lithium"]],
    ["uranium", ["uranium"]],
    ["manganese", ["manganese"]],
    ["tungsten", ["tungsten"]],
    ["diamond", ["diamond"]],
    ["construction", ["construction", "aggregate", "gravel"]]
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
  const mineralBox = document.getElementById("mineral-toggles");
  const minsAll = document.getElementById("mins-all");
  const minsNone = document.getElementById("mins-none");
  const occMaster = document.getElementById("occ-master");
  const occBox = document.getElementById("occ-toggles");
  const holesMaster = document.getElementById("holes-master");
  const holesBox = document.getElementById("holes-toggles");
  const holesLegend = document.getElementById("holes-legend");
  const gchemMaster = document.getElementById("gchem-master");
  const gchemBox = document.getElementById("gchem-toggles");
  const gchemLegend = document.getElementById("gchem-legend");

  let manifest = null;
  const layerMeta = {};
  let geoLoaded = false;
  let geoLoading = false;
  let overlayManifest = null;
  let occPack = null;
  let occLoaded = false;
  let occLoading = false;
  let holesLoaded = false;
  let holesLoading = false;
  let gchemLoaded = false;
  let gchemLoading = false;

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

  function occPopupHtml(props) {
    const rows = [
      ["State", props.state],
      ["Commodity", props.comm],
      ["Type", props.kind],
      ["Status", props.status],
      ["Licence", props.state === "wa" ? "WA MINEDEX CC BY-NC 4.0" : ""]
    ].filter(function (r) { return r[1] != null && String(r[1]).trim() !== ""; });
    const title = props.name || props.comm || "Occurrence";
    return (
      '<div class="popup-title">' +
      escapeHtml(String(title)) +
      "</div>" +
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

  function hexPopupHtml(props, label) {
    const rows = [
      ["State", props.state ? String(props.state).toUpperCase() : ""],
      [label, props.n != null ? Number(props.n).toLocaleString() : ""],
      ["Cell", "~20 km hex (aggregated)"]
    ].filter(function (r) { return r[1] != null && String(r[1]).trim() !== ""; });
    return (
      '<div class="popup-title">' +
      escapeHtml(label + " density") +
      "</div>" +
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

  function buildMineralToggles() {
    MINERALS.forEach(function (m) {
      const lab = document.createElement("label");
      lab.className = "row";
      lab.innerHTML =
        '<input type="checkbox" checked data-mineral="' +
        m.id +
        '" />' +
        '<span class="swatch" style="background:' +
        m.color +
        '"></span>' +
        "<span>" +
        m.label +
        "</span>";
      mineralBox.appendChild(lab);
    });
    mineralBox.addEventListener("change", applyOccFilter);
  }

  function selectedMinerals() {
    return Array.prototype.slice
      .call(mineralBox.querySelectorAll('input[type="checkbox"]'))
      .filter(function (inp) { return inp.checked; })
      .map(function (inp) { return inp.getAttribute("data-mineral"); });
  }

  function normMineralToken(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\u2026/g, "")
      .replace(/[.;:]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function lookupMineral(token) {
    if (MINERAL_EXACT[token]) return MINERAL_EXACT[token];
    if (token === "sand" || token.indexOf("sand -") === 0 || token.indexOf("sand and") === 0) {
      if (token.indexOf("mineral") === -1) return "construction";
    }
    if (token.indexOf("unprocess") === 0) return "construction";
    if (token.indexOf("coarse aggregate") === 0) return "construction";
    for (let i = 0; i < MINERAL_PHRASES.length; i++) {
      const mid = MINERAL_PHRASES[i][0];
      const phrases = MINERAL_PHRASES[i][1];
      for (let j = 0; j < phrases.length; j++) {
        if (token.indexOf(phrases[j]) !== -1) {
          if (mid === "construction" && token.indexOf("mineral sand") !== -1) continue;
          return mid;
        }
      }
    }
    return null;
  }

  function mineralIdsFromComm(comm) {
    const raw = String(comm || "").trim();
    const n = normMineralToken(raw);
    if (!raw || n === "unknown" || n === "un" || n === "unk") return ["other"];
    const parts = raw.split(/[,;/|+&]+|\band\b/i);
    const ids = {};
    for (let i = 0; i < parts.length; i++) {
      const t = normMineralToken(parts[i]);
      if (!t) continue;
      const mid = lookupMineral(t);
      if (mid) ids[mid] = true;
    }
    const keys = Object.keys(ids);
    return keys.length ? keys : ["other"];
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

  function overlayCounts(kind) {
    const o = overlayManifest || {};
    if (kind === "occ") return ((o.occurrences || {}).counts) || {};
    if (kind === "holes") return ((o.holes || {}).raw) || {};
    if (kind === "gchem") return ((o.geochem || {}).raw) || {};
    return {};
  }

  function buildStateMini(box, kind, counts) {
    box.innerHTML = "";
    STATES.forEach(function (s) {
      const n = counts[s.id] || 0;
      const lab = document.createElement("label");
      lab.className = "row";
      lab.innerHTML =
        '<input type="checkbox" checked data-ov="' +
        kind +
        '" data-state="' +
        s.id +
        '" ' +
        (n ? "" : "disabled") +
        " />" +
        '<span class="swatch' +
        (kind === "occ" ? " round" : "") +
        '" style="background:' +
        s.color +
        '"></span>' +
        "<span>" +
        s.name +
        (n ? " (" + Number(n).toLocaleString() + ")" : "") +
        "</span>";
      box.appendChild(lab);
    });
    box.addEventListener("change", function () {
      if (kind === "occ") applyOccFilter();
      else if (kind === "holes") applyHexFilter("holes");
      else applyHexFilter("gchem");
    });
  }

  function selectedOverlayStates(box) {
    return Array.prototype.slice
      .call(box.querySelectorAll('input[type="checkbox"]'))
      .filter(function (inp) { return inp.checked && !inp.disabled; })
      .map(function (inp) { return inp.getAttribute("data-state"); });
  }

  function occToGJ(pack, states) {
    const allow = {};
    (states || []).forEach(function (s) { allow[s] = true; });
    const allowMin = {};
    selectedMinerals().forEach(function (m) { allowMin[m] = true; });
    const feats = [];
    (pack.rows || []).forEach(function (r) {
      if (!allow[r[0]]) return;
      const types = r._mins || mineralIdsFromComm(r[4]);
      let ok = false;
      for (let i = 0; i < types.length; i++) {
        if (allowMin[types[i]]) { ok = true; break; }
      }
      if (!ok) return;
      feats.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [r[1], r[2]] },
        properties: {
          state: r[0],
          name: r[3] || "",
          comm: r[4] || "",
          kind: r[5] || "",
          status: r[6] || ""
        }
      });
    });
    return { type: "FeatureCollection", features: feats };
  }

  function stateColorExpr() {
    const expr = ["match", ["get", "state"]];
    STATES.forEach(function (s) {
      expr.push(s.id, s.color);
    });
    expr.push("#d4d4d8");
    return expr;
  }

  function hexColorExpr(kind) {
    if (kind === "gchem") {
      return [
        "interpolate", ["linear"], ["log10", ["max", 1, ["get", "n"]]],
        0, "#3c096c",
        1, "#7b2cbf",
        2, "#c77dff",
        3, "#e0aaff",
        4, "#ff9e00",
        5, "#ff6d00"
      ];
    }
    return [
      "interpolate", ["linear"], ["log10", ["max", 1, ["get", "n"]]],
      0, "#1b4d6e",
      1, "#2a9d8f",
      2, "#e9c46a",
      3, "#f4a261",
      4, "#e76f51",
      5, "#9b2226"
    ];
  }

  function underTitlesId() {
    return firstTitleLayerId();
  }

  function applyHexFilter(kind) {
    const layer = kind === "holes" ? "holes-hex" : "gchem-hex";
    const master = kind === "holes" ? holesMaster : gchemMaster;
    const box = kind === "holes" ? holesBox : gchemBox;
    if (!map.getLayer(layer)) return;
    if (!master.checked) {
      map.setLayoutProperty(layer, "visibility", "none");
      return;
    }
    const states = selectedOverlayStates(box);
    map.setLayoutProperty(layer, "visibility", "visible");
    if (!states.length) {
      map.setFilter(layer, ["==", ["get", "state"], "__none__"]);
    } else {
      map.setFilter(layer, ["in", ["get", "state"], ["literal", states]]);
    }
  }

  function applyOccFilter() {
    if (!occPack || !map.getSource("occ")) return;
    if (!occMaster.checked) {
      ["occ-clusters", "occ-cluster-count", "occ-point"].forEach(function (id) {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
      });
      return;
    }
    const gj = occToGJ(occPack, selectedOverlayStates(occBox));
    map.getSource("occ").setData(gj);
    ["occ-clusters", "occ-cluster-count", "occ-point"].forEach(function (id) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "visible");
    });
  }

  function loadOccurrences() {
    if (occLoaded) {
      applyOccFilter();
      return Promise.resolve();
    }
    if (occLoading) return Promise.resolve();
    occLoading = true;
    log("Loading occurrences…");
    return fetch("data/occ.json")
      .then(function (r) {
        if (!r.ok) throw new Error("occ.json HTTP " + r.status);
        return r.json();
      })
      .then(function (pack) {
        occPack = pack;
        (pack.rows || []).forEach(function (r) {
          r._mins = mineralIdsFromComm(r[4]);
        });
        const gj = occToGJ(pack, selectedOverlayStates(occBox));
        if (!map.getSource("occ")) {
          map.addSource("occ", {
            type: "geojson",
            data: gj,
            cluster: true,
            clusterMaxZoom: 10,
            clusterRadius: 42,
            attribution: "Occurrences: GSNSW / GSQ / GSV / MRT / NTGS; WA MINEDEX CC BY-NC 4.0"
          });
          map.addLayer({
            id: "occ-clusters",
            type: "circle",
            source: "occ",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#f2c14e",
              "circle-radius": ["step", ["get", "point_count"], 12, 25, 16, 100, 20, 500, 26],
              "circle-opacity": 0.82,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#1b2430"
            }
          });
          map.addLayer({
            id: "occ-cluster-count",
            type: "symbol",
            source: "occ",
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 11
            },
            paint: { "text-color": "#1b2430" }
          });
          map.addLayer({
            id: "occ-point",
            type: "circle",
            source: "occ",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": stateColorExpr(),
              "circle-radius": 4.2,
              "circle-opacity": 0.9,
              "circle-stroke-width": 0.8,
              "circle-stroke-color": "#0b1220"
            }
          });
          map.on("mouseenter", "occ-point", function () {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "occ-point", function () {
            map.getCanvas().style.cursor = "";
          });
          map.on("click", "occ-clusters", function (e) {
            const f = (e.features || [])[0];
            if (!f) return;
            map.getSource("occ").getClusterExpansionZoom(f.properties.cluster_id).then(function (z) {
              map.easeTo({ center: f.geometry.coordinates, zoom: z });
            });
          });
        } else {
          map.getSource("occ").setData(gj);
        }
        occLoaded = true;
        occLoading = false;
        applyOccFilter();
        const n = ((pack.rows || []).length);
        log("Occurrences loaded (" + n.toLocaleString() + "). WA MINEDEX is CC BY-NC.");
      })
      .catch(function (err) {
        occLoading = false;
        occMaster.checked = false;
        log("Failed occurrences: " + err.message);
      });
  }

  function loadHex(kind) {
    const loaded = kind === "holes" ? holesLoaded : gchemLoaded;
    const loading = kind === "holes" ? holesLoading : gchemLoading;
    if (loaded) {
      applyHexFilter(kind);
      return Promise.resolve();
    }
    if (loading) return Promise.resolve();
    if (kind === "holes") holesLoading = true;
    else gchemLoading = true;
    const file = kind === "holes" ? "data/holes_hex.geojson" : "data/geochem_hex.geojson";
    const sid = kind === "holes" ? "holes-hex" : "gchem-hex";
    const lid = sid;
    log("Loading " + kind + " density…");
    return fetch(file)
      .then(function (r) {
        if (!r.ok) throw new Error(file + " HTTP " + r.status);
        return r.json();
      })
      .then(function (gj) {
        if (!map.getSource(sid)) {
          map.addSource(sid, { type: "geojson", data: gj, attribution: kind === "holes" ? "Drillhole density from state open-file collars (aggregated)" : "Geochem sample density from state open data (aggregated)" });
          map.addLayer(
            {
              id: lid,
              type: "fill",
              source: sid,
              paint: {
                "fill-color": hexColorExpr(kind),
                "fill-opacity": 0.45,
                "fill-outline-color": "rgba(255,255,255,0.18)"
              }
            },
            underTitlesId()
          );
          map.on("mouseenter", lid, function () {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", lid, function () {
            map.getCanvas().style.cursor = "";
          });
        } else {
          map.getSource(sid).setData(gj);
        }
        if (kind === "holes") {
          holesLoaded = true;
          holesLoading = false;
        } else {
          gchemLoaded = true;
          gchemLoading = false;
        }
        applyHexFilter(kind);
        log(kind + " density loaded (" + ((gj.features || []).length).toLocaleString() + " hexes).");
      })
      .catch(function (err) {
        if (kind === "holes") {
          holesLoading = false;
          holesMaster.checked = false;
        } else {
          gchemLoading = false;
          gchemMaster.checked = false;
        }
        log("Failed " + kind + ": " + err.message);
      });
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

  minsAll.addEventListener("click", function () {
    mineralBox.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
      inp.checked = true;
    });
    applyOccFilter();
  });
  minsNone.addEventListener("click", function () {
    mineralBox.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
      inp.checked = false;
    });
    applyOccFilter();
  });

  occMaster.addEventListener("change", function () {
    if (occMaster.checked) {
      occBox.classList.remove("disabled");
      loadOccurrences();
    } else {
      occBox.classList.add("disabled");
      applyOccFilter();
    }
  });
  holesMaster.addEventListener("change", function () {
    if (holesMaster.checked) {
      holesBox.classList.remove("disabled");
      if (holesLegend) holesLegend.hidden = false;
      loadHex("holes");
    } else {
      holesBox.classList.add("disabled");
      if (holesLegend) holesLegend.hidden = true;
      applyHexFilter("holes");
    }
  });
  gchemMaster.addEventListener("change", function () {
    if (gchemMaster.checked) {
      gchemBox.classList.remove("disabled");
      if (gchemLegend) gchemLegend.hidden = false;
      loadHex("gchem");
    } else {
      gchemBox.classList.add("disabled");
      if (gchemLegend) gchemLegend.hidden = true;
      applyHexFilter("gchem");
    }
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
    if (map.getLayer("occ-point") && occMaster.checked) {
      const occs = map.queryRenderedFeatures(e.point, { layers: ["occ-point"] });
      if (occs.length) {
        popup.setLngLat(e.lngLat).setHTML(occPopupHtml(occs[0].properties || {})).addTo(map);
        return;
      }
    }
    if (map.getLayer("holes-hex") && holesMaster.checked) {
      const hx = map.queryRenderedFeatures(e.point, { layers: ["holes-hex"] });
      if (hx.length) {
        popup.setLngLat(e.lngLat).setHTML(hexPopupHtml(hx[0].properties || {}, "Holes")).addTo(map);
        return;
      }
    }
    if (map.getLayer("gchem-hex") && gchemMaster.checked) {
      const gx = map.queryRenderedFeatures(e.point, { layers: ["gchem-hex"] });
      if (gx.length) {
        popup.setLngLat(e.lngLat).setHTML(hexPopupHtml(gx[0].properties || {}, "Samples")).addTo(map);
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
    buildMineralToggles();
    if (osmToggle.checked) ensureOsm(true);
    fetch("data/overlay_manifest.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (o) {
        overlayManifest = o || {};
        buildStateMini(occBox, "occ", overlayCounts("occ"));
        buildStateMini(holesBox, "holes", overlayCounts("holes"));
        buildStateMini(gchemBox, "gchem", overlayCounts("gchem"));
      })
      .catch(function () {
        buildStateMini(occBox, "occ", {});
        buildStateMini(holesBox, "holes", {});
        buildStateMini(gchemBox, "gchem", {});
      });
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
              "\nOverlays: occurrences, drillhole density, geochem density.\nGeology/holes draw under titles; title clicks win."
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
