# Xplorr

National live mining and exploration titles, stitched from official state feeds.

Live: https://nathanfowler.github.io/xplorr/

Sidebar is grouped like the state viewers (Find, Titles, Geology, Commodities, More). Search is first-class. Empty popup fields and a few missing layers are clearly marked **DEMO**, not real.

## Geology

- **Geology (GA)** — Geoscience Australia Surface Geology WMTS raster (all states, including WA/ACT). Click identify via WMS GetFeatureInfo when the raster is on and no title/kind polygon is under the cursor.
- **Kind polygons** — dissolved, simplified state geology (`data/geology_kinds.geojson`, ~14.7 MB). Filter by kind and search unit/formation name.

Filterable kinds: granite, felsic_volcanic, mafic_volcanic, mafic_intrusive, ultramafic, sandstone, mudstone, carbonate, metamorphic, alluvium, other_regolith, mixed, other.

Coverage: NSW, QLD, VIC, TAS, NT, SA. **WA and ACT** have no kind polygons (GA raster only). NSW uses the simplified 1:1.5M rock-units pack, not the 1.7 GB detailed dump.

Popup fields: state, kind, unit name, source field.

Geology draws under titles so title clicks stay first.


## Mineral type

Sidebar filter matching the geology-kinds UI (All / None, two-column checkboxes, color swatches). Built from the existing occurrence `comm` field — types were not invented.

Filter list (16): gold, copper, silver, iron, lead, zinc, tin, nickel, coal, lithium, uranium, manganese, tungsten, diamond, construction (sand / gravel / aggregate), other (rare, unknown, industrial).

Applies to **occurrences only**. Ticking a commodity turns occurrences on and loads them. Title polygons have no commodity field. Multi-commodity points stay visible if any selected type matches. All types and occurrences are on by default.

## Occurrences

Clustered mineral occurrences / mines (`data/occ.json`, ~132k real points + 120 DEMO SA points). On by default. **WA MINEDEX is CC BY-NC 4.0.** Empty popup fields show a `DEMO`-prefixed placeholder.

| State | Points | Source |
| --- | ---: | --- |
| NSW | 30,898 | GSNSW `mineral_occurrence` |
| VIC | 18,792 | GSV `minsite` |
| WA | 48,398 | DMIRS MINEDEX (CC BY-NC) |
| TAS | 8,297 | MRT mineral occurrences |
| NT | 3,487 | NTGS occurrences + mine sites |
| QLD | 22,242 | GSQ MiningResources MINOCC + coal + petroleum |
| SA | 120 DEMO | preview-only points (`demo: true`); not harvested |

## Drillholes

~20 km hex density (`data/holes_hex.geojson`, 4,776 cells). Rebuilt from the harvest with real per-cell aggregates: count, depth min/max/median, year range, top types, operators, commodities, example hole IDs. Raw collars stay out of the repo. Click a hex for an identify-style card. Two QLD cells are DEMO.

| State | Raw collars binned |
| --- | ---: |
| WA | 3,436,952 |
| NSW | 529,290 |
| NT | 328,961 |
| SA | 200,213 |
| VIC | 148,290 |
| TAS | 39,760 |
| QLD | 0 harvested (2 DEMO hexes) |

## Geochem

Same hex size (`data/geochem_hex.geojson`, 2,569 cells) with the same style of real aggregates where the harvest has type / company / year / element fields. Raw assay tables omitted. No QLD or WA geochem pack in the harvest.

## Omitted on purpose

- Harvest corpus (~15 GB) is not in this repo.
- NSW 1.7 GB detailed geology, 89 province zips, VIC geol100 / sg 250k, GA 1:2.5M shapefile — kinds + GA WMTS already cover geology.
- WA dead titles (~510k) still omitted.
