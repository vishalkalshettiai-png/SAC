# SAC Planning Line Race Table

Custom widget for SAP Analytics Cloud: an **editable planning table** plus an Apache ECharts **line race** chart (based on [line-race](https://echarts.apache.org/examples/en/editor.html?c=line-race)).

## What you get

- Standard SAC custom widget JSON + main web component + styling panel
- Data binding feeds for **Rows**, **Columns**, and **Measures** (native Builder panel)
- Transformation of the SAC result set into the ECharts line-race dataset (`Income` / `Country` / `Year` columns, filter-per-series, `endLabel` race animation)
- Editable numeric cells that call planning `setUserInput` and `submitData`

A custom Builder panel is **not** included on purpose. SAC replaces the generated data-binding Builder if you ship your own panel. The generated Builder is what lets you pick the planning model and put dimensions/measures on rows and columns.

## Files

| File | Role |
| --- | --- |
| `sac-widget/com.vishal.sac.planninglinerace.json` | Widget metadata (upload this to SAC) |
| `sac-widget/planningTable.js` | Main widget (table + ECharts) |
| `sac-widget/planningTable_styling.js` | Styling panel |
| `preview/index.html` | Browser preview with mock SAC data |
| `tests/planningTransform.test.js` | Result-set → line-race transform tests |

## Upload to SAC

1. Zip **only the resource files** (no subfolders), max 10 MB:

   ```bash
   cd sac-widget
   zip -j ../planning-line-race-resources.zip planningTable.js planningTable_styling.js
   ```

2. In SAC: **Stories / Analytic Applications → Custom Widgets → Create** and upload `com.vishal.sac.planninglinerace.json`.
3. Upload `planning-line-race-resources.zip` when prompted.
4. If you host files yourself instead of SAC, change the `url` fields in the JSON to HTTPS URLs.

The JSON uses SAC-hosted paths (`/planningTable.js`). Keep those if you upload the zip to SAC.

## Story setup

1. Add **Planning Line Race Table** to an Optimized Story.
2. Open the **Builder** panel.
3. Select a **planning model**.
4. Put dimensions on **Dimensions**: series first (Country, Product, …), then time (Year, Date, …).
5. Put the account/measure on **Measures**.
6. Use flat members (hierarchies are not supported on custom-widget data binding).

### Planning write-back

Use the widget **Submit** / **Revert** buttons, or story script:

```javascript
PlanningLineRace_1.submitPlanningData();
PlanningLineRace_1.revertPlanningData();
```

A data-bound widget also exposes `getDataSource()` from SAC. Handle cell edits with:

```javascript
PlanningLineRace_1.onCellChange = function () {
  var info = PlanningLineRace_1.getEventInfo();
  // info is JSON: selection, value, seriesId, timeId
};
```

Users type in a cell, then **Submit**. **Revert** clears local edits and calls `getPlanningVersion().revert()` when available.

## If the widget is blank after upload

Uploading the JSON only registers the widget. You still need the resource zip **and** a bound model.

1. Upload `planning-line-race-resources.zip` on the same custom widget (JSON URLs are `/planningTable.js`). Without the zip the widget is an empty box.
2. Use an **Optimized Story** (data-bound custom widgets do not work in classic stories).
3. Select the widget, open **Builder**, add a **planning model**.
4. Drag a dimension onto **Rows**, a time dimension onto **Columns**, and a measure onto **Measures**. Binding the model without filling those feeds returns 0 rows.
5. Use a public/actual planning version and check story filters. The widget now shows a message such as “No data binding” or “0 rows” instead of a blank canvas.
6. The table can still work if the ECharts CDN is blocked; only the line-race chart needs `cdn.jsdelivr.net` or `unpkg.com`.

Re-upload widget version **1.0.3** (JSON + zip). After it loads you should see a grey status line:
`v1.0.3 | binding=yes/no | rows=N | keys=...`
That line confirms the new script is running and whether SAC sent rows.

## Local preview

Open `preview/index.html` in a browser (needs network access for the ECharts CDN).

```bash
node tests/planningTransform.test.js
```
