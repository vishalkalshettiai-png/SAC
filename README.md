# SAC Planning Widgets

Custom widgets for SAP Analytics Cloud that connect to **existing planning models** and let planners enter data with write-back — using the **native SAC Builder panel** (Rows / Columns / Measures), the same workflow as built-in SAC tables.

## Widgets

### Planning Table

Editable planning grid — no chart, focused on SAC table-style planning.

| File | Role |
| --- | --- |
| `sac-widget/com.vishal.sac.planningtable.json` | Widget metadata (upload this to SAC) |
| `sac-widget/sacPlanningTable.js` | Main widget |
| `sac-widget/sacPlanningTable_styling.js` | Styling panel |
| `preview/planning-table.html` | Browser preview |
| `tests/sacPlanningTable.test.js` | Transform and selection tests |

### Planning Line Race Table

Editable planning table plus an Apache ECharts **line race** chart ([line-race example](https://echarts.apache.org/examples/en/editor.html?c=line-race)).

| File | Role |
| --- | --- |
| `sac-widget/com.vishal.sac.planninglinerace.json` | Widget metadata (upload this to SAC) |
| `sac-widget/planningTable.js` | Main widget (table + ECharts) |
| `sac-widget/planningTable_styling.js` | Styling panel |
| `preview/index.html` | Browser preview |
| `tests/planningTransform.test.js` | Result-set → line-race transform tests |

## Native Builder panel (like SAC tables)

Neither widget ships a custom Builder panel. SAC auto-generates the Builder from `dataBindings` feeds:

- **Rows** — row dimensions (e.g. Country, Product)
- **Columns** — column dimensions (e.g. Year, Version)
- **Measures** — accounts or measures to plan

In an Optimized Story: add the widget → open **Builder** → select your **planning model** → assign dimensions and measures. This matches how SAC built-in tables are configured.

> Do **not** add a custom Builder web component — SAC replaces the generated data-binding Builder if you ship your own panel.

## Upload to SAC

### Planning Table

1. Package resources:

   ```bash
   bash scripts/pack-widget.sh
   ```

   This creates `planning-table-resources.zip`.

2. In SAC: **Stories / Analytic Applications → Custom Widgets → Create** and upload `com.vishal.sac.planningtable.json`.
3. Upload `planning-table-resources.zip` when prompted.

### Planning Line Race Table

1. Package resources (same script creates both zips):

   ```bash
   bash scripts/pack-widget.sh
   ```

2. Upload `com.vishal.sac.planninglinerace.json` and `planning-line-race-resources.zip`.

For both widgets, JSON `url` fields use SAC-hosted paths (`/sacPlanningTable.js`, `/planningTable.js`). Keep those when uploading the zip to SAC.

## Story setup

1. Add **Planning Table** (or **Planning Line Race Table**) to an Optimized Story.
2. Open the **Builder** panel.
3. Select a **planning model**.
4. Put row dimensions (e.g. Country or Product) on **Rows**.
5. Put column dimensions (e.g. Date or Year) on **Columns**.
6. Put accounts/measures to plan on **Measures**.
7. Use flat members (hierarchies are not supported on custom-widget data binding).

### Planning write-back

The widget resolves the planning DataSource from its data binding automatically. If Submit shows **No planning DataSource**, add this story script on `onInitialization`:

```javascript
PlanningTable_1.setDataSource(PlanningTable_1.getDataSource());
```

For the Line Race widget, use `PlanningLineRace_1` instead.

**Requirements for write-back to succeed:**

1. The bound model must be a **planning model** with input-enabled cells.
2. Use **flat members** on Rows and Columns (hierarchies are not supported).
3. The cell must already exist in the model (unbooked cells cannot be planned via `setUserInput`).

If Submit fails with **setUserInput rejected**, the selection coordinates may not match the model. Check that dimension IDs in the Builder panel match the planning model structure.

Handle cell edits if you want extra logic:

```javascript
PlanningTable_1.onCellChange = function () {
  var info = PlanningTable_1.getEventInfo();
  // info is JSON: selection, value, rowId, colId, measureAlias
};
```

Users type in a cell, then **Submit**. **Revert** clears local edits and calls `getPlanningVersion().revert()` when available.

## Local preview

| Widget | Preview file |
| --- | --- |
| Planning Table | `preview/planning-table.html` |
| Planning Line Race | `preview/index.html` (needs network for ECharts CDN) |

```bash
node tests/sacPlanningTable.test.js
node tests/planningTransform.test.js
```
