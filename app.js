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
  const findInput = document.getElementById("find");
  const findResults = document.getElementById("find-results");
  const statusLine = document.getElementById("status-line");
  const legendLive = document.getElementById("legend-live");

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
  let findQuery = "";
  let occIndexed = false;
  let holesIndexed = false;
  let gchemIndexed = false;
  let findUserPicked = false;
  const findHexKinds = { holes: false, gchem: false };
  const findIndex = [];
  const FIND_LIST_CAP = { title: 30, occ: 20, holes: 12, gchem: 12 };
  const DEMO_NA = "DEMO — n/a";
  const DEMO_HOLDERS = [
    "DEMO Acme Gold Pty Ltd",
    "DEMO Southern Cross Minerals Pty Ltd",
    "DEMO Outback Exploration Pty Ltd",
    "DEMO Ironbark Resources Ltd",
    "DEMO Nullarbor Metals Pty Ltd",
    "DEMO Copperhead Mining Pty Ltd",
    "DEMO Red Earth Prospecting Pty Ltd"
  ];

  function log(msg) {
    if (statusEl) statusEl.textContent = msg;
    if (statusLine) {
      const first = String(msg || "").split("\n")[0];
      statusLine.textContent = first;
    }
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

  function isBlank(v) {
    return v == null || String(v).trim() === "";
  }

  function demoHolder(seed) {
    const s = String(seed || "x");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return DEMO_HOLDERS[h % DEMO_HOLDERS.length];
  }

  function fillField(v, fallback) {
    if (!isBlank(v)) return String(v);
    return fallback;
  }

  function popupRowsHtml(rows) {
    return rows
      .map(function (r) {
        const demo = String(r[1]).indexOf("DEMO") === 0;
        return (
          '<div class="popup-row"><span>' +
          escapeHtml(r[0]) +
          "</span><span" +
          (demo ? ' class="popup-demo"' : "") +
          ">" +
          escapeHtml(String(r[1])) +
          "</span></div>"
        );
      })
      .join("");
  }

  function popupWrap(kicker, title, rows) {
    return (
      (kicker ? '<div class="popup-kicker">' + escapeHtml(kicker) + "</div>" : "") +
      '<div class="popup-title">' +
      escapeHtml(String(title)) +
      "</div>" +
      popupRowsHtml(rows)
    );
  }

  function popupHtml(props) {
    const seed = props.name || props.tenure || props.state || "";
    const name = fillField(props.name, "DEMO unnamed title");
    const rows = [
      ["State", fillField(props.state, DEMO_NA)],
      ["Tenure", fillField(props.tenure, DEMO_NA)],
      ["Status", fillField(props.status, "DEMO current")],
      ["Name", name],
      ["Holder", fillField(props.holder, demoHolder(seed))],
      ["Grant", fillField(props.grant, DEMO_NA)],
      ["Expiry", fillField(props.expiry, DEMO_NA)]
    ];
    return popupWrap("Title", name, rows);
  }

  function geoPopupHtml(props) {
    const name = fillField(props.name, "DEMO unnamed unit");
    const rows = [
      ["State", fillField(props.state, DEMO_NA)],
      ["Kind", fillField(props.kind, DEMO_NA)],
      ["Unit", name],
      ["Source", fillField(props.source, DEMO_NA)]
    ];
    return popupWrap("Geology", name, rows);
  }

  function gaPopupHtml(props) {
    const pick = [
      ["Name", fillField(props.NAME || props.NAMEU || props.UNITNAME || props.STRATNAME || props.name, "DEMO unnamed unit")],
      ["Lithology", fillField(props.LITHNAME || props.LITHDESC || props.LITHOLOGY, DEMO_NA)],
      ["Age", fillField(props.AGE || props.AGE_NAME || props.MAXAGE, DEMO_NA)],
      ["Symbol", fillField(props.MAPSYMBOL || props.SYMBOL || props.GLCODE, DEMO_NA)],
      ["Layer", fillField(props.layer || props.LAYER, DEMO_NA)]
    ];
    const extra = Object.keys(props || {}).filter(function (k) {
      return pick.every(function (r) { return r[0] !== k; }) && props[k] != null && String(props[k]).trim() !== "";
    }).slice(0, 6);
    const rows = pick.concat(extra.map(function (k) { return [k, props[k]]; }));
    return popupWrap("Geology", "GA surface geology", rows);
  }

  function occPopupHtml(props) {
    const demo = props.demo === true || props.demo === "true" || props.demo === 1;
    const name = fillField(props.name, "DEMO unnamed occurrence");
    const rows = [
      ["State", fillField(props.state, DEMO_NA)],
      ["Commodity", fillField(props.comm, DEMO_NA)],
      ["Type", fillField(props.kind, "DEMO prospect")],
      ["Status", fillField(props.status, DEMO_NA)],
      ["Licence", props.state === "wa" ? "WA MINEDEX CC BY-NC 4.0" : fillField("", DEMO_NA)]
    ];
    if (demo) rows.push(["Note", "DEMO — not a real occurrence"]);
    return popupWrap("Occurrence", name, rows);
  }

  function hexPopupHtml(props, label) {
    const demo = props.demo === true || props.demo === "true" || props.demo === 1;
    const nStr = props.n != null ? Number(props.n).toLocaleString() : DEMO_NA;
    const st = props.state ? String(props.state).toUpperCase() : DEMO_NA;
    const unit = label === "Holes" ? "holes" : "samples";
    const title = (demo ? "DEMO " : "") + nStr + " " + unit + " · " + st + " · ~20 km cell";
    let depth = "";
    if (props.depth_min != null && props.depth_max != null) {
      depth = Number(props.depth_min) + "–" + Number(props.depth_max) + " m";
      if (props.depth_med != null) depth += " (median " + Number(props.depth_med) + ")";
    }
    let years = "";
    if (props.year_min != null && props.year_max != null) {
      years = String(props.year_min) + "–" + String(props.year_max);
    } else if (props.year_min != null) {
      years = String(props.year_min);
    }
    const ids = props.sample_hole_ids || props.sample_ids || "";
    const rows = [
      ["Depth", fillField(depth, DEMO_NA)],
      ["Drilled", fillField(years, DEMO_NA)],
      ["Types", fillField(props.top_types, DEMO_NA)],
      ["Operators", fillField(props.top_operators, DEMO_NA)],
      [label === "Holes" ? "Targets" : "Elements", fillField(props.top_commodities, DEMO_NA)],
      ["Examples", fillField(ids, DEMO_NA)]
    ];
    if (demo) rows.push(["Note", "DEMO — not real harvest density"]);
    return popupWrap(label, title, rows);
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }


  function geomCenter(geom) {
    if (!geom) return null;
    if (geom.type === "Point") return geom.coordinates;
    let xs = 0, ys = 0, n = 0;
    function walk(c) {
      if (typeof c[0] === "number") { xs += c[0]; ys += c[1]; n++; }
      else c.forEach(walk);
    }
    walk(geom.coordinates || []);
    return n ? [xs / n, ys / n] : null;
  }

  function isDemoFlag(v) {
    return v === true || v === "true" || v === 1 || v === "1";
  }

  function isDemoString(v) {
    return String(v || "").trim().toUpperCase().indexOf("DEMO") === 0;
  }

  function addSearchText(out, v) {
    const s = String(v == null ? "" : v).trim();
    if (!s || isDemoString(s)) return;
    out.push(s.toLowerCase());
  }

  function findTexts(it) {
    const p = it.props || {};
    const out = [];
    if (it.kind === "title") {
      addSearchText(out, it.name || p.name);
      addSearchText(out, it.tenure || p.tenure);
      addSearchText(out, it.holder || p.holder);
      addSearchText(out, p.licensee);
      addSearchText(out, p.operator);
      addSearchText(out, p.company);
    } else if (it.kind === "occ") {
      addSearchText(out, it.name || p.name);
      addSearchText(out, it.comm || p.comm);
      addSearchText(out, p.company);
      addSearchText(out, p.operator);
      addSearchText(out, p.owner);
    } else {
      addSearchText(out, p.top_operators || it.operator);
      addSearchText(out, p.company);
      addSearchText(out, p.operator);
    }
    return out;
  }

  function itemIsDemo(it) {
    const p = it.props || {};
    return isDemoFlag(it.demo) || isDemoFlag(p.demo);
  }

  function itemMatches(it, q) {
    if (!q || itemIsDemo(it)) return false;
    const texts = findTexts(it);
    for (let i = 0; i < texts.length; i++) {
      if (texts[i].indexOf(q) !== -1) return true;
    }
    return false;
  }

  function occRowMatches(r, q) {
    if (!q) return true;
    if (isDemoFlag(r[7])) return false;
    const texts = [];
    addSearchText(texts, r[3]);
    addSearchText(texts, r[4]);
    addSearchText(texts, r.company);
    addSearchText(texts, r.operator);
    addSearchText(texts, r.owner);
    for (let i = 0; i < texts.length; i++) {
      if (texts[i].indexOf(q) !== -1) return true;
    }
    return false;
  }

  function titleSearchFilter(q) {
    return [
      "any",
      ["in", q, ["downcase", ["to-string", ["get", "name"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "holder"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "tenure"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "licensee"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "operator"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "company"]]]]
    ];
  }

  function hexCompanyFilter(q) {
    return [
      "any",
      ["in", q, ["downcase", ["to-string", ["get", "top_operators"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "company"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "operator"]]]]
    ];
  }

  function indexTitleFeatures(state, life, gj) {
    (gj.features || []).forEach(function (f) {
      const p = f.properties || {};
      if (isDemoFlag(p.demo)) return;
      const c = geomCenter(f.geometry);
      if (!c) return;
      findIndex.push({
        kind: "title",
        state: state,
        life: life,
        name: p.name || "",
        holder: p.holder || "",
        tenure: p.tenure || "",
        lng: c[0],
        lat: c[1],
        demo: isDemoFlag(p.demo),
        props: p
      });
    });
  }

  function indexOccurrences(pack) {
    if (occIndexed) return;
    occIndexed = true;
    (pack.rows || []).forEach(function (r) {
      const demo = isDemoFlag(r[7]);
      findIndex.push({
        kind: "occ",
        state: r[0],
        name: r[3] || "",
        comm: r[4] || "",
        lng: r[1],
        lat: r[2],
        demo: demo,
        props: {
          state: r[0],
          name: r[3] || "",
          comm: r[4] || "",
          kind: r[5] || "",
          status: r[6] || "",
          demo: demo
        }
      });
    });
  }

  function indexHexFeatures(kind, gj) {
    if (kind === "holes" && holesIndexed) return;
    if (kind === "gchem" && gchemIndexed) return;
    if (kind === "holes") holesIndexed = true;
    else gchemIndexed = true;
    (gj.features || []).forEach(function (f) {
      const p = f.properties || {};
      if (isDemoFlag(p.demo)) return;
      let lng = p.lon;
      let lat = p.lat;
      if (lng == null || lat == null) {
        const c = geomCenter(f.geometry);
        if (!c) return;
        lng = c[0];
        lat = c[1];
      }
      findIndex.push({
        kind: kind,
        state: p.state || "",
        name: (p.n != null ? Number(p.n).toLocaleString() + " " : "") + (kind === "holes" ? "holes" : "samples"),
        operator: p.top_operators || "",
        lng: lng,
        lat: lat,
        demo: isDemoFlag(p.demo),
        props: p
      });
    });
  }

  function ensureOccurrencesOn() {
    if (occMaster && !occMaster.checked) occMaster.checked = true;
    if (occBox) occBox.classList.remove("disabled");
    loadOccurrences();
    updateLegend();
  }

  function applyTitleSearch(q) {
    STATES.forEach(function (s) {
      ["live", "dead"].forEach(function (life) {
        const fill = layerId(s.id, life) + "-fill";
        const line = layerId(s.id, life) + "-line";
        if (!map.getLayer(fill)) return;
        if (!q) {
          map.setFilter(fill, null);
          map.setFilter(line, null);
          return;
        }
        const f = titleSearchFilter(q);
        map.setFilter(fill, f);
        map.setFilter(line, f);
      });
    });
  }

  function fitFindHits(hits) {
    const pts = [];
    for (let i = 0; i < hits.length; i++) {
      const it = hits[i];
      if (it && it.lng != null && it.lat != null) pts.push(it);
    }
    if (!pts.length) return;
    if (pts.length === 1) {
      map.easeTo({ center: [pts[0].lng, pts[0].lat], zoom: Math.max(map.getZoom(), 8) });
      return;
    }
    let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
    const cap = 1200;
    const step = pts.length > cap ? Math.ceil(pts.length / cap) : 1;
    for (let i = 0; i < pts.length; i += step) {
      const lng = Number(pts[i].lng);
      const lat = Number(pts[i].lat);
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
    if (minLng === maxLng) { minLng -= 0.2; maxLng += 0.2; }
    if (minLat === maxLat) { minLat -= 0.2; maxLat += 0.2; }
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
      padding: 48,
      maxZoom: 9,
      duration: 700
    });
  }

  function ensureLiveTitleOn(stateId) {
    if (!liveBox) return;
    const inp = liveBox.querySelector('input[data-state="' + stateId + '"][data-life="live"]');
    if (!inp || inp.disabled || inp.checked) return;
    inp.checked = true;
    const st = STATES.find(function (x) { return x.id === stateId; });
    if (!st) return;
    addStateLayers(stateId, "live", st.color).then(function (ok) {
      if (!ok) return;
      setVisible(stateId, "live", true);
      if (findQuery) applyTitleSearch(findQuery);
      updateLegend();
    });
  }

  function ensureOverlayStateOn(box, kind, stateId) {
    if (!box) return;
    const inp = box.querySelector('input[data-ov="' + kind + '"][data-state="' + stateId + '"]');
    if (inp && !inp.disabled) inp.checked = true;
  }

  function enableHexLayer(kind) {
    const master = kind === "holes" ? holesMaster : gchemMaster;
    const box = kind === "holes" ? holesBox : gchemBox;
    const legend = kind === "holes" ? holesLegend : gchemLegend;
    if (master && !master.checked) {
      master.checked = true;
      if (box) box.classList.remove("disabled");
      if (legend) legend.hidden = false;
      const more = document.getElementById("more-group");
      if (more) more.open = true;
    }
    const loaded = kind === "holes" ? holesLoaded : gchemLoaded;
    if (loaded) applyHexFilter(kind);
    else loadHex(kind);
    updateLegend();
  }

  function enableOccLayer() {
    if (occMaster && !occMaster.checked) {
      occMaster.checked = true;
      if (occBox) occBox.classList.remove("disabled");
    }
    if (occLoaded) applyOccFilter();
    else loadOccurrences();
    updateLegend();
  }

  function hitPopupHtml(it) {
    if (it.kind === "occ") return occPopupHtml(it.props || {});
    if (it.kind === "holes") return hexPopupHtml(it.props || {}, "Holes");
    if (it.kind === "gchem") return hexPopupHtml(it.props || {}, "Samples");
    return popupHtml(it.props || {});
  }

  function hitLabel(it) {
    if (it.kind === "occ") return it.name || it.comm || "Occurrence";
    if (it.kind === "holes") return it.name || "Hole cell";
    if (it.kind === "gchem") return it.name || "Sample cell";
    return it.tenure || it.name || "Title";
  }

  function hitSub(it) {
    const st = (it.state || "").toUpperCase();
    if (it.kind === "occ") return st + " · " + (it.comm || "occurrence");
    if (it.kind === "holes") return st + " hole cell · " + (it.operator || it.props && it.props.top_operators || "");
    if (it.kind === "gchem") return st + " sample cell · " + (it.operator || it.props && it.props.top_operators || "");
    const life = it.life === "dead" ? " dead" : "";
    return st + life + " title · " + (it.holder || it.name || "");
  }

  function pickListHits(byKind) {
    const order = ["title", "occ", "holes", "gchem"];
    const shown = [];
    order.forEach(function (k) {
      const cap = FIND_LIST_CAP[k] || 10;
      const arr = byKind[k] || [];
      for (let i = 0; i < arr.length && i < cap; i++) shown.push(arr[i]);
    });
    return shown;
  }

  function runFind(q) {
    const next = String(q || "").trim().toLowerCase();
    if (next !== findQuery) findUserPicked = false;
    findQuery = next;
    if (!findResults) return;
    if (!findQuery) {
      findHexKinds.holes = false;
      findHexKinds.gchem = false;
      findResults.hidden = true;
      findResults.innerHTML = "";
      applyTitleSearch("");
      applyOccFilter();
      applyHexFilter("holes");
      applyHexFilter("gchem");
      return;
    }
    if (!occLoaded && !occLoading) loadOccurrences();
    if (!holesLoaded && !holesLoading) loadHex("holes");
    if (!gchemLoaded && !gchemLoading) loadHex("gchem");

    const byKind = { title: [], occ: [], holes: [], gchem: [] };
    for (let i = 0; i < findIndex.length; i++) {
      const it = findIndex[i];
      if (!itemMatches(it, findQuery)) continue;
      if (byKind[it.kind]) byKind[it.kind].push(it);
    }
    const titleN = byKind.title.length;
    const occN = byKind.occ.length;
    const holeN = byKind.holes.length;
    const gchemN = byKind.gchem.length;
    const total = titleN + occN + holeN + gchemN;
    const allHits = byKind.title.concat(byKind.occ, byKind.holes, byKind.gchem);

    findHexKinds.holes = holeN > 0;
    findHexKinds.gchem = gchemN > 0;

    const titleStates = {};
    byKind.title.forEach(function (it) {
      if (it.life !== "dead" && it.state) titleStates[it.state] = true;
    });
    Object.keys(titleStates).forEach(ensureLiveTitleOn);

    if (occN) {
      byKind.occ.forEach(function (it) { ensureOverlayStateOn(occBox, "occ", it.state); });
      enableOccLayer();
    }
    if (holeN) {
      byKind.holes.forEach(function (it) { ensureOverlayStateOn(holesBox, "holes", it.state); });
      enableHexLayer("holes");
    }
    if (gchemN) {
      byKind.gchem.forEach(function (it) { ensureOverlayStateOn(gchemBox, "gchem", it.state); });
      enableHexLayer("gchem");
    }

    const shown = pickListHits(byKind);
    findResults.hidden = false;
    const pending = !occLoaded || !holesLoaded || !gchemLoaded;
    if (!total) {
      findResults.innerHTML = pending
        ? '<p class="note">No matches yet — still loading layers…</p>'
        : '<p class="note">No matches in loaded layers.</p>';
    } else {
      const parts = [];
      parts.push(titleN.toLocaleString() + " title" + (titleN === 1 ? "" : "s"));
      parts.push(occN.toLocaleString() + " occurrence" + (occN === 1 ? "" : "s"));
      parts.push(holeN.toLocaleString() + " hole cell" + (holeN === 1 ? "" : "s"));
      parts.push(gchemN.toLocaleString() + " sample cell" + (gchemN === 1 ? "" : "s"));
      const extra = shown.length < total
        ? '<p class="note">Showing ' + shown.length.toLocaleString() + " of " + total.toLocaleString() + ". Map plots matching features.</p>"
        : "";
      findResults.innerHTML =
        '<div class="find-summary"><strong>' +
        total.toLocaleString() +
        " match" + (total === 1 ? "" : "es") +
        "</strong> · " +
        escapeHtml(parts.join(" · ")) +
        "</div>" +
        extra +
        shown.map(function (it, i) {
          return (
            '<button type="button" class="find-hit" data-i="' + i + '"><strong>' +
            escapeHtml(String(hitLabel(it))) +
            "</strong><span>" +
            escapeHtml(String(hitSub(it))) +
            "</span></button>"
          );
        }).join("");
      findResults.querySelectorAll(".find-hit").forEach(function (btn, i) {
        btn.addEventListener("click", function () {
          const it = shown[i];
          if (!it || it.lng == null) return;
          findUserPicked = true;
          map.easeTo({ center: [it.lng, it.lat], zoom: Math.max(map.getZoom(), 9) });
          popup.setLngLat([it.lng, it.lat]).setHTML(hitPopupHtml(it)).addTo(map);
        });
      });
      if (!findUserPicked) fitFindHits(allHits);
    }
    applyTitleSearch(findQuery);
    applyOccFilter();
    if (holesLoaded) applyHexFilter("holes");
    if (gchemLoaded) applyHexFilter("gchem");
  }

  function updateLegend() {
    if (!legendLive) return;
    const rows = [];
    STATES.forEach(function (s) {
      const inp = liveBox ? liveBox.querySelector('input[data-state="' + s.id + '"][data-life="live"]') : null;
      if (inp && inp.checked && !inp.disabled) {
        rows.push(
          '<div class="legend-row"><span class="swatch" style="background:' +
            s.color +
            '"></span><span>' +
            s.name +
            " title</span></div>"
        );
      }
    });
    if (occMaster && occMaster.checked) {
      rows.push(
        '<div class="legend-row"><span class="swatch round" style="background:#f2c14e"></span><span>Occurrence / mine</span></div>'
      );
    }
    if (kindsMaster && kindsMaster.checked) {
      rows.push('<div class="legend-row"><span class="swatch" style="background:#7a9e7e"></span><span>Geology kinds</span></div>');
    }
    if (gaToggle && gaToggle.checked) {
      rows.push('<div class="legend-row"><span class="swatch" style="background:#8c7b6b"></span><span>GA geology</span></div>');
    }
    if (holesMaster && holesMaster.checked) {
      rows.push('<div class="legend-row"><span class="ramp holes" style="width:36px;height:8px;border-radius:4px"></span><span>Hole density</span></div>');
    }
    if (gchemMaster && gchemMaster.checked) {
      rows.push('<div class="legend-row"><span class="ramp gchem" style="width:36px;height:8px;border-radius:4px"></span><span>Geochem density</span></div>');
    }
    legendLive.innerHTML = rows.length ? rows.join("") : '<p class="legend-empty">Nothing on yet.</p>';
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
        indexTitleFeatures(state, life, gj);
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
        (liveMeta.features ? " · " + Number(liveMeta.features).toLocaleString() : "") +
        "</span>";
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
        " dead" +
        (deadMeta.features ? " · " + Number(deadMeta.features).toLocaleString() : "") +
        "</span>";
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
    mineralBox.addEventListener("change", function () {
      ensureOccurrencesOn();
    });
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
      if (findQuery) {
        if (!occRowMatches(r, findQuery)) return;
      } else {
        const types = r._mins || mineralIdsFromComm(r[4]);
        let ok = false;
        for (let i = 0; i < types.length; i++) {
          if (allowMin[types[i]]) { ok = true; break; }
        }
        if (!ok) return;
      }
      feats.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [r[1], r[2]] },
        properties: {
          state: r[0],
          name: r[3] || "",
          comm: r[4] || "",
          kind: r[5] || "",
          status: r[6] || "",
          demo: r[7] === true || r[7] === 1
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
      return;
    }
    let filter = ["in", ["get", "state"], ["literal", states]];
    if (findQuery && findHexKinds[kind]) {
      filter = ["all", filter, ["!=", ["get", "demo"], true], hexCompanyFilter(findQuery)];
    }
    map.setFilter(layer, filter);
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
        indexOccurrences(pack);
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
        log("Occurrences loaded (" + n.toLocaleString() + ")");
        if (findQuery && findInput) runFind(findInput.value);
        updateLegend();
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
        indexHexFeatures(kind, gj);
        applyHexFilter(kind);
        log(kind + " density loaded (" + ((gj.features || []).length).toLocaleString() + " hexes).");
        if (findQuery && findInput) runFind(findInput.value);
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

    updateLegend();
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

  if (findInput) {
    let findTimer = null;
    findInput.addEventListener("input", function () {
      clearTimeout(findTimer);
      findTimer = setTimeout(function () { runFind(findInput.value); }, 160);
    });
  }

  osmToggle.addEventListener("change", function () {
    ensureOsm(osmToggle.checked);
    updateLegend();
  });

  gaToggle.addEventListener("change", function () {
    ensureGa(gaToggle.checked);
    updateLegend();
  });

  kindsMaster.addEventListener("change", function () {
    if (kindsMaster.checked) {
      kindBox.classList.remove("disabled");
      loadGeologyKinds();
    } else {
      kindBox.classList.add("disabled");
      applyGeoFilter();
    }
    updateLegend();
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
    ensureOccurrencesOn();
  });
  minsNone.addEventListener("click", function () {
    mineralBox.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
      inp.checked = false;
    });
    ensureOccurrencesOn();
  });

  occMaster.addEventListener("change", function () {
    if (occMaster.checked) {
      occBox.classList.remove("disabled");
      loadOccurrences();
    } else {
      occBox.classList.add("disabled");
      applyOccFilter();
    }
    updateLegend();
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
    updateLegend();
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
    updateLegend();
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
        if (occMaster && occMaster.checked) {
          occBox.classList.remove("disabled");
          loadOccurrences();
        }
        updateLegend();
      })
      .catch(function () {
        buildStateMini(occBox, "occ", {});
        buildStateMini(holesBox, "holes", {});
        buildStateMini(gchemBox, "gchem", {});
        if (occMaster && occMaster.checked) loadOccurrences();
        updateLegend();
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
          log("Ready · " + live.toLocaleString() + " live titles");
          if (findQuery && findInput) runFind(findInput.value);
          updateLegend();
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
