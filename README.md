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

### Export Story to PDF

Button widget that triggers SAC's built-in **Export to PDF** component to export the current story or analytic application page.

| File | Role |
| --- | --- |
| `sac-widget/com.vishal.sac.exportpdf.json` | Widget metadata (upload this to SAC) |
| `sac-widget/exportPdfButton.js` | Main widget (export button) |
| `sac-widget/exportPdfButton_styling.js` | Styling panel |
| `preview/export-pdf.html` | Browser preview |
| `tests/exportPdfButton.test.js` | Export settings and run tests |

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

### Export Story to PDF

1. Package resources (same script creates all zips):

   ```bash
   bash scripts/pack-widget.sh
   ```

2. Upload `com.vishal.sac.exportpdf.json` and `export-pdf-resources.zip`.

For all widgets, JSON `url` fields use SAC-hosted paths (e.g. `/exportPdfButton.js`). Keep those when uploading the zip to SAC.

## Story setup

1. Add **Planning Table** (or **Planning Line Race Table**) to an Optimized Story.
2. Open the **Builder** panel.
3. Select a **planning model**.
4. Put row dimensions (e.g. Country or Product) on **Rows**.
5. Put column dimensions (e.g. Date or Year) on **Columns**.
6. Put accounts/measures to plan on **Measures**.
7. Use flat members (hierarchies are not supported on custom-widget data binding).

### Planning write-back (required: hidden SAC Table)

SAC does **not** expose `setUserInput` / `submitData` on a custom widget’s own data binding. You must add a **hidden SAC Table** on the **same planning model** and pass its planning API to the widget.

#### Step 1 — Add hidden planning table

1. Insert a standard **Table** widget (e.g. name it `Table_1`).
2. In Builder, bind the **same planning model** as the custom widget.
3. Assign the same dimensions/measures (Rows, Columns, Measures).
4. Enable **planning** / input on the table if prompted.
5. **Hide** the table (move off canvas or set visibility hidden). It is only used for write-back.

#### Step 2 — Story script (onInitialization)

```javascript
PlanningTable_1.setDataSource(Table_1.getPlanning());
```

For Line Race widget:

```javascript
PlanningLineRace_1.setDataSource(Table_1.getPlanning());
```

> Do **not** use `PlanningTable_1.getDataSource()` — the custom widget binding does not include planning write-back APIs.

#### Step 3 — Submit / Revert buttons

**Submit button → onClick:**

```javascript
var success = PlanningTable_1.submitPlanningData();
if (!success) {
  Application.showMessage(ApplicationMessageType.Error, "Submit failed.");
}
```

**Revert button → onClick:**

```javascript
PlanningTable_1.revertPlanningData();
```

**Requirements for write-back to succeed:**

1. The bound model must be a **planning model** with input-enabled cells.
2. Use **flat members** on Rows and Columns (hierarchies are not supported).
3. The cell must already exist in the model (unbooked cells cannot be planned via `setUserInput`).

If Submit fails with **setUserInput rejected**, the selection coordinates may not match the model. Ensure the hidden table uses the same dimension layout.

Optional widget event handlers:

Users type in a cell, then **Submit**. **Revert** clears local edits and calls `getPlanningVersion().revert()` when available.

### Export Story to PDF (required: SAC Export to PDF component)

SAC custom widgets cannot export a full story page on their own. Add SAC's built-in **Export to PDF** component (you can hide it) and connect it via a story script.

> **Note:** The widget JSON uses the `Widget` type (not `ExportPdf`) for upload compatibility. Pass your `ExportPdf_1` component reference — it works at runtime because Export to PDF is a SAC widget.

#### Step 1 — Add Export to PDF component

1. Insert **Export to PDF** (e.g. name it `ExportPdf_1`).
2. Configure default settings in the component if desired.
3. **Hide** the component if you only want the custom button visible.

#### Step 2 — Story script (onInitialization)

```javascript
ExportPdfButton_1.setExportPdf(ExportPdf_1);
```

#### Step 3 — Export

Click the **Export Story to PDF** button. It calls `ExportPdf_1.exportView()` with your widget settings (file name, orientation, comments, background export).

**Fallback** — handle `onExportRequest` if the component is not connected:

```javascript
// ExportPdfButton_1 onExportRequest
ExportPdf_1.exportView();
```

Optional widget events: `onExportComplete`, `onExportError`.

## Local preview

| Widget | Preview file |
| --- | --- |
| Planning Table | `preview/planning-table.html` |
| Planning Line Race | `preview/index.html` (needs network for ECharts CDN) |
| Export Story to PDF | `preview/export-pdf.html` |

```bash
node tests/sacPlanningTable.test.js
node tests/planningTransform.test.js
node tests/exportPdfButton.test.js
```
