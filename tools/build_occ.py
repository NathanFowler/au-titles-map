#!/usr/bin/env python3
"""Rebuild slim occ.json from the harvest. Harvest is read-only."""
from __future__ import annotations

import json
import os
import re
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone

HARVEST = "/workspace/national-geoscience"
APP = "/workspace/au-titles-map"
OUT = os.path.join(APP, "data", "occ.json")
MANIFEST = os.path.join(APP, "data", "overlay_manifest.json")
OLD = OUT

# [st, lon, lat, name, comm, kind, status, demo, field, work, host, style, size, prod, sid, url, pri]
COLS = [
    "st", "lon", "lat", "name", "comm", "kind", "status", "demo",
    "field", "work", "host", "style", "size", "prod", "sid", "url", "pri",
]

CLIP = 90
MINOR_PLUS = {
    "MINOR", "SML", "SMALL", "MED", "MEDIUM", "INTERMEDIATE",
    "MAJOR", "LGE", "LARGE", "VLG", "VERY LARGE", "VERYLARGE", "GIANT",
}
UNKNOWN_SIZE = {"UNK", "UNKNOWN"}

UNNAMED_RE = re.compile(
    r"^(unnamed|unknown|n/?a|none|null|-|unallocated)([\s_\-]|$|\d)",
    re.I,
)


def clip(s, n=CLIP):
    t = " ".join(str(s or "").split())
    if len(t) <= n:
        return t
    return t[: n - 1].rstrip() + "…"


def blank(v):
    if v is None:
        return True
    s = str(v).strip()
    return s == "" or s in ("None", "null", "NULL", "-", " ", ".", "n/a", "N/A", "NA")


def txt(*vals):
    parts = []
    for v in vals:
        if blank(v):
            continue
        s = " ".join(str(v).split()).strip(" ;,")
        if s and s not in parts:
            parts.append(s)
    return clip(", ".join(parts), 80) if parts else ""


def real_name(s):
    t = " ".join(str(s or "").split()).strip(" ;,")
    if not t:
        return False
    if UNNAMED_RE.match(t):
        return False
    return True


def clean_name(s):
    t = " ".join(str(s or "").split()).strip(" ;,")
    return t if real_name(t) else ""


def size_key(s):
    return re.sub(r"[^A-Z0-9]+", "", str(s or "").upper())


def size_is_minor_plus(s):
    k = size_key(s)
    return k in {re.sub(r"[^A-Z0-9]+", "", x) for x in MINOR_PLUS}


def size_is_unknown(s):
    k = size_key(s)
    return k in {re.sub(r"[^A-Z0-9]+", "", x) for x in UNKNOWN_SIZE}


def is_num_ok(v):
    if v is None:
        return False
    if isinstance(v, (int, float)):
        if v in (-999, -1, 0):
            return False
        return v > 0
    s = str(v).strip().strip(";")
    if not s or s in ("-999", "-1", "0", "0.0"):
        return False
    try:
        n = float(s.replace(",", ""))
        return n > 0 and n not in (-999, -1)
    except ValueError:
        return bool(re.search(r"[1-9]", s))


def vic_prod(p):
    raw = p.get("prod")
    units = p.get("prod_units")
    if not blank(raw):
        num = str(raw).replace(";", " ").strip()
        unit = str(units or "").replace(";", " ").strip()
        # drop placeholder zeros
        nums = re.findall(r"\d+(?:\.\d+)?", num.replace(",", ""))
        if nums and any(float(x) > 0 for x in nums):
            out = clip((num + (" " + unit if unit else "")).strip(), 40)
            return out
    g = p.get("gold_p_gms")
    if is_num_ok(g):
        try:
            gv = float(g)
            if gv > 0 and gv != -999:
                return clip(str(int(gv) if gv == int(gv) else gv) + " g", 40)
        except (TypeError, ValueError):
            pass
    return ""


def nsw_prod(s):
    if blank(s):
        return ""
    t = " ".join(str(s).split())
    nums = []
    for m in re.finditer(r"\d+(?:\.\d+)?(?:e[+-]?\d+)?", t.replace(",", ""), re.I):
        try:
            nums.append(float(m.group(0)))
        except ValueError:
            pass
    if not nums or max(nums) <= 0:
        return ""
    if "?" in t and max(nums) < 1e-6:
        return ""
    return clip(t, 100)


def harvest_url(s):
    t = str(s or "").strip()
    if t.startswith("https://") or t.startswith("http://"):
        return t
    return ""


def lonlat(geom, lon=None, lat=None):
    if lon is not None and lat is not None:
        try:
            x, y = float(lon), float(lat)
            if -180 <= x <= 180 and -90 <= y <= 90:
                return round(x, 4), round(y, 4)
        except (TypeError, ValueError):
            pass
    if not geom:
        return None
    if geom.get("type") == "Point":
        c = geom.get("coordinates") or []
        if len(c) >= 2:
            return round(float(c[0]), 4), round(float(c[1]), 4)
    return None


def classify_pri(name, size, prod, demo=False):
    # Production or MINOR+ size always primary.
    # UNKNOWN size (VIC historic pits) stays secondary even when named.
    # Named sites with a known or blank size (WA/NSW OCC) are primary.
    if prod:
        return 1
    if size_is_minor_plus(size):
        return 1
    if size_is_unknown(size):
        return 0
    if real_name(name):
        return 1
    return 0


def row(st, lon, lat, name, comm, kind, status, demo=False, field="", work="",
        host="", style="", size="", prod="", sid="", url="", pri=None):
    name = clean_name(name) if not demo else " ".join(str(name or "").split())
    comm = txt(comm)
    kind = clip(kind, 40)
    status = clip(status, 40)
    field = clip(field, 70)
    work = clip(work, CLIP)
    host = clip(host, CLIP)
    style = clip(style, 70)
    size = clip(size, 40)
    prod = clip(prod, 80)
    sid = clip(str(sid), 24) if not blank(sid) else ""
    url = harvest_url(url)
    if pri is None:
        pri = classify_pri(name, size, prod, demo)
    return [
        st, lon, lat, name, comm, kind, status,
        True if demo else 0,
        field, work, host, style, size, prod, sid, url, int(pri),
    ]


def load_gj(path):
    with open(path) as f:
        return json.load(f)


def iter_gj(path):
    data = load_gj(path)
    for ft in data.get("features") or []:
        yield ft


def from_shp_zip(zippath):
    import shapefile
    tmp = "/tmp/occ_shp_" + os.path.basename(zippath).replace(".", "_")
    os.makedirs(tmp, exist_ok=True)
    with zipfile.ZipFile(zippath) as zf:
        zf.extractall(tmp)
    out = []
    for n in os.listdir(tmp):
        if not n.lower().endswith(".shp"):
            continue
        r = shapefile.Reader(os.path.join(tmp, n), encoding='latin-1', encodingErrors='replace')
        names = [f[0] for f in r.fields[1:]]
        for sr in r.iterShapeRecords():
            props = dict(zip(names, sr.record))
            pts = sr.shape.points
            if not pts:
                continue
            geom = {"type": "Point", "coordinates": [pts[0][0], pts[0][1]]}
            out.append((props, geom))
    return out


def nsw_rows():
    path = os.path.join(HARVEST, "data/nsw/mineral_occurrence.geojson")
    rows = []
    for ft in iter_gj(path):
        p = ft.get("properties") or {}
        ll = lonlat(ft.get("geometry"), p.get("longda94"), p.get("latgda94"))
        if not ll:
            continue
        name = p.get("deposit_name") or p.get("all_names")
        comm = txt(p.get("major_comm"), p.get("minor_comm"))
        size = p.get("size_code") or ""
        rows.append(row(
            "nsw", ll[0], ll[1], name, comm,
            size or "OCC", "",
            field="" if str(p.get("metal_dist") or "").strip().lower() in ("", "not assigned", "unassigned") else (p.get("metal_dist") or ""),
            work=p.get("work_desc") or "",
            host=p.get("hostrocks") or "",
            style=txt(p.get("gen_model"), p.get("msn_style"), p.get("nsw_class")),
            size=size,
            prod=nsw_prod(p.get("production")),
            sid=p.get("occurrence_id") or p.get("metal_no") or "",
        ))
    return rows


def vic_rows():
    path = os.path.join(HARVEST, "data/vic/minsite.geojson")
    rows = []
    for ft in iter_gj(path):
        p = ft.get("properties") or {}
        ll = lonlat(ft.get("geometry"), p.get("longitude"), p.get("latitude"))
        if not ll:
            continue
        comm = txt(p.get("pri_comm"), p.get("min_ass"))
        size = str(p.get("size_cat") or "").strip()
        rows.append(row(
            "vic", ll[0], ll[1], p.get("mine_name"), comm,
            p.get("site_type") or p.get("mine_type") or "MINE",
            "",
            field=p.get("field_name") or p.get("project") or "",
            work=txt(p.get("miningmeth"), p.get("mine_type")),
            host=p.get("host_lith") or "",
            style=txt(p.get("dep_ty_gen"), p.get("dep_ty_sp")),
            size=size,
            prod=vic_prod(p),
            sid=p.get("siteid") or "",
        ))
    return rows


def qld_rows():
    base = os.path.join(HARVEST, "data/qld/mining_resources")
    files = [
        "MiningResources_12.geojson",
        "MiningResources_2.geojson",
        "MiningResources_101.geojson",
        "MiningResources_102.geojson",
        "MiningResources_103.geojson",
        "MiningResources_104.geojson",
        "MiningResources_105.geojson",
        "MiningResources_19.geojson",
    ]
    seen = set()
    rows = []
    sources = Counter()
    for fn in files:
        path = os.path.join(base, fn)
        if not os.path.exists(path):
            continue
        for ft in iter_gj(path):
            p = ft.get("properties") or {}
            sid = p.get("site_no") or p.get("objectid")
            key = ("qld", sid)
            if key in seen:
                continue
            seen.add(key)
            ll = lonlat(ft.get("geometry"), p.get("longitude"), p.get("latitude"))
            if not ll:
                continue
            kind = p.get("exposure_type") or p.get("site_type") or ""
            if kind and "MINERAL OCCURRENCE" in str(kind).upper() and p.get("exposure_type"):
                kind = p.get("exposure_type")
            rows.append(row(
                "qld", ll[0], ll[1], p.get("occur_name"),
                p.get("main_commodity") or p.get("all_commodities") or "",
                kind, p.get("mine_status") or "",
                field=p.get("site_locality") or p.get("group_name") or "",
                work=txt(p.get("work_extent"), p.get("work_extent_comments")),
                host="",
                style="" if "GEOLOGICAL DATA ADDITIONAL" in str(p.get("site_type") or "").upper() else (p.get("site_type") or ""),
                size=p.get("deposit_size") or p.get("main_occur_size") or "",
                prod="",
                sid=sid or "",
            ))
            sources[fn] += 1
    return rows, sources


def wa_rows():
    path = os.path.join(HARVEST, "data/wa/Industry_and_Mining_0.geojson")
    rows = []
    for ft in iter_gj(path):
        p = ft.get("properties") or {}
        ll = lonlat(ft.get("geometry"), p.get("longitude"), p.get("latitude"))
        if not ll:
            continue
        name = p.get("short_name") or p.get("site_title")
        comm = p.get("site_commo") or p.get("target_com") or p.get("commodity") or ""
        rows.append(row(
            "wa", ll[0], ll[1], name, comm,
            p.get("site_type_") or "",
            p.get("site_stage") or "",
            field=p.get("proj_title") or "",
            work=p.get("site_sub_t") or "",
            host="",
            style="",
            size="",
            prod="",
            sid=p.get("site_code") or "",
            url=p.get("web_link") or "",
        ))
    return rows


def tas_rows():
    path = os.path.join(HARVEST, "data/tas/Mineral_Occurrences_Shapefile.zip")
    rows = []
    for p, geom in from_shp_zip(path):
        ll = lonlat(geom)
        if not ll:
            continue
        size = p.get("DEP_SIZE") or ""
        # "Very large: greater than 10 000 000 t" → keep short token + clip
        size_short = size
        if size:
            head = size.split(":")[0].strip()
            size_short = head or size
        rows.append(row(
            "tas", ll[0], ll[1], p.get("NAME") or p.get("ALIAS"),
            p.get("COMMODITYS") or "",
            p.get("TYPE") or "",
            p.get("STATUS") or "",
            field=p.get("LOCALITY") or "",
            work=p.get("DESCRIPT") or "",
            host=txt(p.get("LITHOLOGY"), p.get("LITHOSTRAT")),
            style=txt(p.get("FORM"), p.get("GENETIC")),
            size=size_short,
            prod="",
            sid=p.get("DEPOSIT_ID") or p.get("GID") or "",
        ))
    return rows


def nt_rows():
    files = [
        os.path.join(HARVEST, "data/nt/MINERALOCCURRENCES_shp.zip"),
        os.path.join(HARVEST, "data/nt/MINESITES_shp.zip"),
    ]
    seen = set()
    rows = []
    for path in files:
        for p, geom in from_shp_zip(path):
            sid = p.get("MODAT_ID")
            if sid in seen:
                continue
            seen.add(sid)
            ll = lonlat(geom)
            if not ll:
                continue
            comm = txt(p.get("COM_MAJOR"), p.get("COM_MINOR"))
            rows.append(row(
                "nt", ll[0], ll[1], p.get("NAME"), comm,
                p.get("MIN_CATGRY") or "",
                p.get("STATUS") or "",
                field=p.get("MIN_FIELD") or p.get("GEOLREGION") or "",
                work=txt(p.get("MIN_METHOD"), p.get("COMMENTS1")),
                host="",
                style=txt(p.get("MODEL"), p.get("MINSTYLE1")),
                size=p.get("OCCUR_SIZE") or "",
                prod="",
                sid=sid or "",
            ))
    return rows


def sa_demo_rows():
    """Keep the existing DEMO SA set; harvest SA is not treated as live hits."""
    if not os.path.exists(OLD):
        return []
    pack = json.load(open(OLD))
    out = []
    for r in pack.get("rows") or []:
        if r[0] != "sa":
            continue
        demo = len(r) > 7 and r[7] in (True, 1)
        out.append(row(
            "sa", r[1], r[2], r[3], r[4], r[5], r[6],
            demo=True,
            pri=1 if real_name(r[3]) else 0,
        ))
    return out


def goldish(comm):
    s = str(comm or "").lower()
    if "gold" in s:
        return True
    parts = re.split(r"[,;/|+&]+", s)
    for p in parts:
        t = p.strip()
        if t == "au" or t.startswith("au ") or t.endswith(" au"):
            return True
    return False


def main():
    stats = {}
    all_rows = []

    print("NSW…")
    nsw = nsw_rows()
    stats["nsw"] = len(nsw)
    all_rows.extend(nsw)
    print("  ", len(nsw))

    print("VIC…")
    vic = vic_rows()
    stats["vic"] = len(vic)
    all_rows.extend(vic)
    print("  ", len(vic))

    print("QLD…")
    qld, qld_src = qld_rows()
    stats["qld"] = len(qld)
    all_rows.extend(qld)
    print("  ", len(qld), dict(qld_src))

    print("WA…")
    wa = wa_rows()
    stats["wa"] = len(wa)
    all_rows.extend(wa)
    print("  ", len(wa))

    print("TAS…")
    tas = tas_rows()
    stats["tas"] = len(tas)
    all_rows.extend(tas)
    print("  ", len(tas))

    print("NT…")
    nt = nt_rows()
    stats["nt"] = len(nt)
    all_rows.extend(nt)
    print("  ", len(nt))

    print("SA DEMO…")
    sa = sa_demo_rows()
    stats["sa"] = len(sa)
    all_rows.extend(sa)
    print("  ", len(sa))

    gold = [r for r in all_rows if goldish(r[4])]
    gold_pri = sum(1 for r in gold if r[16] == 1)
    gold_sec = len(gold) - gold_pri
    pri = sum(1 for r in all_rows if r[16] == 1)
    demo_n = sum(1 for r in all_rows if r[7] in (True, 1))

    brandy = [r for r in all_rows if r[0] == "vic" and str(r[3]).lower() == "brandy creek"]

    pack = {
        "type": "occ-v2",
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "note": (
            "Slimmed mineral occurrences / mines with harvest extras. "
            "WA MINEDEX is CC BY-NC 4.0. QLD from GSQ MiningResources MINOCC + coal + petroleum. "
            "SA harvest is not used as live hits; a small DEMO set is tagged demo=true. "
            "pri=1 named / size MINOR+ / real production; pri=0 unnamed or UNKNOWN historic workings."
        ),
        "cols": COLS,
        "counts": stats,
        "skipped": {},
        "qld_sources": dict(qld_src),
        "stats": {
            "total": len(all_rows),
            "primary": pri,
            "secondary": len(all_rows) - pri,
            "gold": len(gold),
            "gold_primary": gold_pri,
            "gold_secondary": gold_sec,
            "demo": demo_n,
        },
        "rows": all_rows,
    }

    tmp = OUT + ".tmp"
    with open(tmp, "w") as f:
        json.dump(pack, f, separators=(",", ":"), ensure_ascii=False)
    os.replace(tmp, OUT)
    nbytes = os.path.getsize(OUT)

    if os.path.exists(MANIFEST):
        man = json.load(open(MANIFEST))
    else:
        man = {}
    man.setdefault("occurrences", {})
    man["occurrences"].update({
        "bytes": nbytes,
        "features": len(all_rows),
        "counts": stats,
        "qld_sources": dict(qld_src),
        "demo": {"sa": stats.get("sa", 0), "note": "Preview-only SA points; not from harvest."},
        "fields": COLS,
        "primary": pri,
        "secondary": len(all_rows) - pri,
        "gold": {"total": len(gold), "primary": gold_pri, "secondary": gold_sec},
    })
    man["generated"] = pack["generated"]
    with open(MANIFEST, "w") as f:
        json.dump(man, f, indent=2)
        f.write("\n")

    print("wrote", OUT, "bytes", nbytes, "MB", round(nbytes / 1e6, 2))
    print("counts", stats)
    print("pri/sec", pri, len(all_rows) - pri, "gold", len(gold), "gold pri/sec", gold_pri, gold_sec)
    print("brandy", brandy[:2])


if __name__ == "__main__":
    main()
