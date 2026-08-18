# AU titles map

National live mining and exploration titles, stitched from official state feeds.

Live: https://nathanfowler.github.io/au-titles-map/

## Geology

- **Geology (GA)** — Geoscience Australia Surface Geology WMTS raster (all states, including WA/ACT). Click identify via WMS GetFeatureInfo when the raster is on and no title/kind polygon is under the cursor.
- **Kind polygons** — dissolved, simplified state geology (`data/geology_kinds.geojson`, ~14.7 MB). Filter by kind and search unit/formation name.

Filterable kinds: granite, felsic_volcanic, mafic_volcanic, mafic_intrusive, ultramafic, sandstone, mudstone, carbonate, metamorphic, alluvium, other_regolith, mixed, other.

Coverage: NSW, QLD, VIC, TAS, NT, SA. **WA and ACT** have no kind polygons (GA raster only). NSW uses the simplified 1:1.5M rock-units pack, not the 1.7 GB detailed dump.

Popup fields: state, kind, unit name, source field.

Geology draws under titles so title clicks stay first.
