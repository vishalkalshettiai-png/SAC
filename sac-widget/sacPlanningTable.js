/**
 * SAP Analytics Cloud custom widget: editable planning table.
 * Uses the native SAC Builder panel (rows / columns / measures feeds).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.ComVishalSacPlanningTable = api;
  }
  if (typeof customElements !== "undefined") {
    api.register();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function mergeProps(target, source) {
    source = source || {};
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
    return target;
  }

  function memberLabel(cell) {
    if (!cell) return "";
    return cell.label || cell.description || cell.id || "";
  }

  function memberId(cell) {
    if (!cell) return "";
    return cell.id || cell.label || "";
  }

  function unique(list) {
    var seen = {};
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (!seen[list[i]]) {
        seen[list[i]] = true;
        out.push(list[i]);
      }
    }
    return out;
  }

  function discoverKeys(row, prefix) {
    var keys = [];
    if (!row) return keys;
    for (var key in row) {
      if (key.indexOf(prefix) === 0) keys.push(key);
    }
    keys.sort();
    return keys;
  }

  function feedKeys(metadata, feedId, fallbackPrefix, sampleRow) {
    var feeds = metadata && metadata.feeds ? metadata.feeds : {};
    var feed = feeds[feedId];
    if (feed && feed.values && feed.values.length) {
      return feed.values.slice();
    }
    return discoverKeys(sampleRow, fallbackPrefix);
  }

  function dimensionMeta(metadata, alias) {
    var dims = metadata && metadata.dimensions ? metadata.dimensions : {};
    return dims[alias] || { id: alias, description: alias };
  }

  function measureMeta(metadata, alias) {
    var measures = metadata && metadata.mainStructureMembers ? metadata.mainStructureMembers : {};
    return measures[alias] || { id: alias, label: alias };
  }

  function joinMembers(row, keys, field) {
    var parts = [];
    for (var i = 0; i < keys.length; i++) {
      var cell = row[keys[i]];
      parts.push(field === "id" ? memberId(cell) : memberLabel(cell));
    }
    return parts.filter(Boolean).join(" / ");
  }

  function cellKey(rowId, colId, measureAlias) {
    return rowId + "||" + colId + "||" + measureAlias;
  }

  function parseBinding(binding) {
    binding = binding || {};
    var data = binding.data || [];
    var metadata = binding.metadata || {};
    var sample = data[0] || {};

    var rowKeys = feedKeys(metadata, "rows", "rows_", sample);
    var colKeys = feedKeys(metadata, "columns", "columns_", sample);
    var measureKeys = feedKeys(metadata, "measures", "measures_", sample);

    if (!rowKeys.length && !colKeys.length) {
      var dimKeys = feedKeys(metadata, "dimensions", "dimensions_", sample);
      rowKeys = dimKeys.slice(0, 1);
      colKeys = dimKeys.slice(1);
    }
    if (!measureKeys.length) {
      measureKeys = discoverKeys(sample, "measures_");
    }
    if (!measureKeys.length) {
      measureKeys = ["measures_0"];
    }

    var rowMembers = [];
    var colMembers = [];
    var measures = measureKeys.map(function (alias) {
      return mergeProps({ alias: alias }, measureMeta(metadata, alias));
    });
    var cells = {};

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var rowLabel = joinMembers(row, rowKeys, "label") || "Row";
      var rowMemberId = joinMembers(row, rowKeys, "id") || rowLabel;
      var colLabel = joinMembers(row, colKeys, "label") || "Value";
      var colMemberId = joinMembers(row, colKeys, "id") || colLabel;

      rowMembers.push({ id: rowMemberId, label: rowLabel });
      colMembers.push({ id: colMemberId, label: colLabel });

      for (var m = 0; m < measureKeys.length; m++) {
        var measureAlias = measureKeys[m];
        var measureCell = row[measureAlias] || {};
        var raw = typeof measureCell.raw === "number" ? measureCell.raw : Number(measureCell.raw);
        var key = cellKey(rowMemberId, colMemberId, measureAlias);
        cells[key] = {
          raw: isNaN(raw) ? null : raw,
          formatted: measureCell.formatted || measureCell.formattedValue || (isNaN(raw) ? "" : String(raw)),
          unit: measureCell.unit || measureCell.unitOfMeasure || "",
          rowId: rowMemberId,
          rowLabel: rowLabel,
          colId: colMemberId,
          colLabel: colLabel,
          measureAlias: measureAlias,
          measure: measureMeta(metadata, measureAlias),
          row: row
        };
      }
    }

    var uniqueRows = unique(rowMembers.map(function (r) { return r.id; })).map(function (id) {
      return rowMembers.filter(function (r) { return r.id === id; })[0];
    });
    var uniqueCols = unique(colMembers.map(function (c) { return c.id; })).map(function (id) {
      return colMembers.filter(function (c) { return c.id === id; })[0];
    });

    var tableRows = [];
    for (var r = 0; r < uniqueRows.length; r++) {
      if (measures.length <= 1) {
        tableRows.push({
          id: uniqueRows[r].id,
          label: uniqueRows[r].label,
          measureAlias: measures[0].alias,
          measureLabel: measures[0].label || measures[0].id
        });
      } else {
        for (var mi = 0; mi < measures.length; mi++) {
          tableRows.push({
            id: uniqueRows[r].id + "||" + measures[mi].alias,
            label: uniqueRows[r].label,
            measureAlias: measures[mi].alias,
            measureLabel: measures[mi].label || measures[mi].id,
            showMeasureLabel: true
          });
        }
      }
    }

    return {
      metadata: metadata,
      rowKeys: rowKeys,
      colKeys: colKeys,
      measureKeys: measureKeys,
      rows: uniqueRows,
      columns: uniqueCols,
      measures: measures,
      tableRows: tableRows,
      cells: cells
    };
  }

  function buildSelection(model, rowId, colId, measureAlias) {
    var selection = {};
    var key = cellKey(rowId, colId, measureAlias);
    var cell = model.cells[key];
    var row = cell && cell.row ? cell.row : {};
    var i;

    for (i = 0; i < model.rowKeys.length; i++) {
      var rowAlias = model.rowKeys[i];
      var dim = dimensionMeta(model.metadata, rowAlias);
      selection[dim.id] = memberId(row[rowAlias]);
    }
    for (i = 0; i < model.colKeys.length; i++) {
      var colAlias = model.colKeys[i];
      var colDim = dimensionMeta(model.metadata, colAlias);
      selection[colDim.id] = memberId(row[colAlias]);
    }

    var measure = measureMeta(model.metadata, measureAlias);
    if (measure && measure.id) {
      selection[measure.id] = measure.id;
    }
    return selection;
  }

  function applyCellEdit(model, rowId, colId, measureAlias, rawValue) {
    var key = cellKey(rowId, colId, measureAlias);
    if (!model.cells[key]) {
      model.cells[key] = {
        rowId: rowId,
        colId: colId,
        measureAlias: measureAlias
      };
    }
    model.cells[key].raw = rawValue;
    model.cells[key].formatted = rawValue === null || rawValue === undefined ? "" : String(rawValue);
    return model.cells[key];
  }

  function columnTotals(model) {
    var totals = {};
    for (var c = 0; c < model.columns.length; c++) {
      var col = model.columns[c];
      totals[col.id] = 0;
      var hasValue = false;
      for (var r = 0; r < model.tableRows.length; r++) {
        var tableRow = model.tableRows[r];
        var key = cellKey(tableRow.id.split("||")[0], col.id, tableRow.measureAlias);
        var cell = model.cells[key];
        if (cell && typeof cell.raw === "number" && !isNaN(cell.raw)) {
          totals[col.id] += cell.raw;
          hasValue = true;
        }
      }
      if (!hasValue) totals[col.id] = null;
    }
    return totals;
  }

  var templateHtml = `
    <style>
      :host { display: block; width: 100%; height: 100%; }
      .wrap {
        display: flex; flex-direction: column;
        width: 100%; height: 100%; box-sizing: border-box;
        font-family: var(--sapFontFamily, "72", Arial, sans-serif);
        color: #32363a; background: var(--bg, #fff);
      }
      .header {
        display: flex; align-items: center; justify-content: space-between;
        gap: 8px; padding: 8px 12px; border-bottom: 1px solid #d9d9d9;
        background: #f5f6f7; flex-shrink: 0;
      }
      .title { font-size: 14px; font-weight: 700; color: #32363a; }
      .actions { display: flex; gap: 8px; align-items: center; }
      button {
        font: inherit; font-size: 12px; font-weight: 600;
        padding: 5px 12px; border-radius: 4px; cursor: pointer;
        border: 1px solid var(--accent, #0854a0);
        background: var(--accent, #0854a0); color: #fff;
      }
      button.secondary { background: #fff; color: var(--accent, #0854a0); }
      button:disabled { opacity: 0.45; cursor: default; }
      .status { font-size: 12px; color: #6a6d70; min-width: 80px; text-align: right; }
      .status.error { color: #bb0000; }
      .status.ok { color: #107e3e; }
      .table-pane { flex: 1; min-height: 0; overflow: auto; }
      .wrap.compact td, .wrap.compact th { padding: 2px 6px; }
      table {
        border-collapse: separate; border-spacing: 0;
        width: 100%; font-size: 12px; background: #fff;
      }
      th, td {
        border-right: 1px solid #e5e5e5;
        border-bottom: 1px solid #e5e5e5;
        padding: 6px 8px; white-space: nowrap;
      }
      th {
        background: #f5f6f7; font-weight: 600; color: #32363a;
        position: sticky; top: 0; z-index: 2;
        border-top: 1px solid #e5e5e5;
      }
      th:first-child, td:first-child { border-left: 1px solid #e5e5e5; }
      th.corner {
        left: 0; z-index: 3; min-width: 140px;
        border-right: 2px solid #d9d9d9;
      }
      td.row-head {
        position: sticky; left: 0; z-index: 1;
        background: #fafafa; font-weight: 600;
        border-right: 2px solid #d9d9d9;
      }
      td.measure-label { color: #6a6d70; font-weight: 500; font-size: 11px; padding-left: 16px; }
      td.numeric { text-align: right; font-variant-numeric: tabular-nums; }
      td.dirty { background: #fff4d6 !important; }
      td.readonly { color: #6a6d70; }
      tr.totals td {
        font-weight: 700; background: #eef2f5;
        border-top: 2px solid #d9d9d9;
      }
      tr:nth-child(even) td:not(.row-head):not(.dirty) { background: #fbfcfd; }
      input.cell {
        width: 100%; min-width: 64px; box-sizing: border-box;
        border: 0; background: transparent; font: inherit;
        text-align: right; padding: 0;
      }
      input.cell:focus {
        outline: 2px solid var(--accent, #0854a0);
        background: #fff; border-radius: 2px;
      }
      .empty {
        display: flex; align-items: center; justify-content: center;
        height: 100%; color: #6a6d70; padding: 24px; text-align: center;
        line-height: 1.5; max-width: 520px; margin: 0 auto;
      }
    </style>
    <div class="wrap" id="wrap">
      <div class="header" id="header">
        <div class="title" id="title"></div>
        <div class="actions">
          <span class="status" id="status"></span>
          <button class="secondary" id="revertBtn" type="button">Revert</button>
          <button id="submitBtn" type="button">Submit</button>
        </div>
      </div>
      <div class="table-pane" id="tablePane"></div>
    </div>
  `;

  function register() {
    if (customElements.get("com-vishal-sac-planningtable")) return;

    class PlanningTableWidget extends HTMLElement {
      constructor() {
        super();
        this._shadowRoot = this.attachShadow({ mode: "open" });
        this._shadowRoot.innerHTML = templateHtml;
        this._props = {
          title: "Planning Table",
          showTitle: true,
          editable: true,
          showTotals: false,
          compactMode: false,
          primaryColor: "#0854a0",
          backgroundColor: "#ffffff"
        };
        this._model = null;
        this._pending = [];
        this._lastEvent = {};
        this._externalDataSource = null;

        var self = this;
        this._shadowRoot.getElementById("submitBtn").addEventListener("click", function () {
          self._submitPlanningData();
        });
        this._shadowRoot.getElementById("revertBtn").addEventListener("click", function () {
          self._revertPlanningData();
        });
      }

      connectedCallback() {
        this._render();
      }

      onCustomWidgetBeforeUpdate(changedProperties) {
        mergeProps(this._props, changedProperties);
      }

      onCustomWidgetAfterUpdate() {
        this._render();
      }

      get title() { return this._props.title; }
      set title(v) { this._props.title = v; this._renderChrome(); }
      get showTitle() { return this._props.showTitle; }
      set showTitle(v) { this._props.showTitle = v; this._renderChrome(); }
      get editable() { return this._props.editable; }
      set editable(v) { this._props.editable = v; this._render(); }
      get showTotals() { return this._props.showTotals; }
      set showTotals(v) { this._props.showTotals = v; this._render(); }
      get compactMode() { return this._props.compactMode; }
      set compactMode(v) { this._props.compactMode = v; this._renderChrome(); }
      get primaryColor() { return this._props.primaryColor; }
      set primaryColor(v) { this._props.primaryColor = v; this._renderChrome(); }
      get backgroundColor() { return this._props.backgroundColor; }
      set backgroundColor(v) { this._props.backgroundColor = v; this._renderChrome(); }

      _getBinding() {
        if (this.planningData && this.planningData.data) return this.planningData;
        if (this.dataBindings && typeof this.dataBindings.getDataBinding === "function") {
          return this.dataBindings.getDataBinding("planningData");
        }
        return null;
      }

      _setDataSource(dataSource) {
        this._externalDataSource = dataSource;
      }

      _getDataSource() {
        if (this._externalDataSource) return this._externalDataSource;
        try {
          var binding = this.dataBindings && this.dataBindings.getDataBinding
            ? this.dataBindings.getDataBinding("planningData")
            : null;
          if (binding && typeof binding.getDataSource === "function") {
            return binding.getDataSource();
          }
        } catch (e) {
          /* optional until wired from SAC script */
        }
        return null;
      }

      _setStatus(text, kind) {
        var el = this._shadowRoot.getElementById("status");
        el.textContent = text || "";
        el.className = "status" + (kind ? " " + kind : "");
      }

      _renderChrome() {
        var wrap = this._shadowRoot.getElementById("wrap");
        wrap.style.setProperty("--bg", this._props.backgroundColor || "#fff");
        wrap.style.setProperty("--accent", this._props.primaryColor || "#0854a0");
        wrap.classList.toggle("compact", !!this._props.compactMode);
        this._shadowRoot.getElementById("title").textContent = this._props.showTitle === false
          ? ""
          : (this._props.title || "");
        var editable = this._props.editable !== false;
        this._shadowRoot.getElementById("submitBtn").style.display = editable ? "" : "none";
        this._shadowRoot.getElementById("revertBtn").style.display = editable ? "" : "none";
      }

      _render() {
        this._renderChrome();
        var binding = this._getBinding();
        var tablePane = this._shadowRoot.getElementById("tablePane");
        if (!binding || !binding.data || !binding.data.length) {
          tablePane.innerHTML = [
            "<div class='empty'>",
            "<strong>Connect a planning model</strong><br>",
            "Open the <strong>Builder</strong> panel, choose your planning model, then assign:<br>",
            "• <strong>Rows</strong> — row dimensions (e.g. Country, Product)<br>",
            "• <strong>Columns</strong> — column dimensions (e.g. Year, Version)<br>",
            "• <strong>Measures</strong> — accounts or measures to plan",
            "</div>"
          ].join("");
          return;
        }
        this._model = parseBinding(binding);
        this._renderTable();
      }

      _renderTable() {
        var model = this._model;
        var editable = this._props.editable !== false;
        var showMeasureColumn = model.measures.length > 1;
        var html = ["<table><thead><tr><th class='corner'>"];
        html.push(escapeHtml(model.rowKeys.length ? dimensionMeta(model.metadata, model.rowKeys[0]).description || "Rows" : "Rows"));
        html.push("</th>");
        if (showMeasureColumn) {
          html.push("<th>Measure</th>");
        }
        for (var c = 0; c < model.columns.length; c++) {
          html.push("<th>" + escapeHtml(model.columns[c].label) + "</th>");
        }
        html.push("</tr></thead><tbody>");

        for (var r = 0; r < model.tableRows.length; r++) {
          var tableRow = model.tableRows[r];
          var baseRowId = tableRow.id.split("||")[0];
          html.push("<tr>");
          html.push("<td class='row-head'>" + escapeHtml(tableRow.label) + "</td>");
          if (showMeasureColumn) {
            html.push("<td class='measure-label'>" + escapeHtml(tableRow.measureLabel) + "</td>");
          }
          for (c = 0; c < model.columns.length; c++) {
            var col = model.columns[c];
            var key = cellKey(baseRowId, col.id, tableRow.measureAlias);
            var cell = model.cells[key];
            var dirty = this._isPending(baseRowId, col.id, tableRow.measureAlias);
            var value = cell && cell.raw !== null && cell.raw !== undefined ? cell.raw : "";
            var display = cell && cell.formatted ? cell.formatted : String(value);
            html.push("<td class='numeric" + (dirty ? " dirty" : "") + (editable ? "" : " readonly") + "'>");
            if (editable) {
              html.push(
                "<input class='cell' data-row='" + escapeAttr(baseRowId) +
                "' data-col='" + escapeAttr(col.id) +
                "' data-measure='" + escapeAttr(tableRow.measureAlias) +
                "' value='" + escapeAttr(String(value)) +
                "' title='" + escapeAttr(display) + "' />"
              );
            } else {
              html.push(escapeHtml(display));
            }
            html.push("</td>");
          }
          html.push("</tr>");
        }

        if (this._props.showTotals) {
          var totals = columnTotals(model);
          html.push("<tr class='totals'><td class='row-head'>Total</td>");
          if (showMeasureColumn) html.push("<td></td>");
          for (c = 0; c < model.columns.length; c++) {
            var total = totals[model.columns[c].id];
            html.push("<td class='numeric'>" + escapeHtml(total === null ? "-" : formatNumber(total)) + "</td>");
          }
          html.push("</tr>");
        }

        html.push("</tbody></table>");
        var pane = this._shadowRoot.getElementById("tablePane");
        pane.innerHTML = html.join("");
        if (!editable) return;

        var inputs = pane.querySelectorAll("input.cell");
        var self = this;
        for (var i = 0; i < inputs.length; i++) {
          inputs[i].addEventListener("change", function (ev) {
            self._onCellEdited(ev.target);
          });
          inputs[i].addEventListener("focus", function (ev) {
            self._onCellSelected(ev.target);
          });
        }
      }

      _isPending(rowId, colId, measureAlias) {
        for (var i = 0; i < this._pending.length; i++) {
          var item = this._pending[i];
          if (item.rowId === rowId && item.colId === colId && item.measureAlias === measureAlias) {
            return true;
          }
        }
        return false;
      }

      _onCellSelected(input) {
        var rowId = input.getAttribute("data-row");
        var colId = input.getAttribute("data-col");
        var measureAlias = input.getAttribute("data-measure");
        this._lastEvent = {
          rowId: rowId,
          colId: colId,
          measureAlias: measureAlias,
          selection: this._model ? buildSelection(this._model, rowId, colId, measureAlias) : {}
        };
        this.dispatchEvent(new Event("onSelect"));
      }

      _onCellEdited(input) {
        var rowId = input.getAttribute("data-row");
        var colId = input.getAttribute("data-col");
        var measureAlias = input.getAttribute("data-measure");
        var text = input.value.trim();
        var raw = text === "" ? null : Number(text.replace(/,/g, ""));
        if (text !== "" && isNaN(raw)) {
          this._setStatus("Enter a numeric value", "error");
          return;
        }
        applyCellEdit(this._model, rowId, colId, measureAlias, raw);
        var selection = buildSelection(this._model, rowId, colId, measureAlias);
        this._queuePending({ rowId: rowId, colId: colId, measureAlias: measureAlias, value: raw, selection: selection });
        this._lastEvent = { rowId: rowId, colId: colId, measureAlias: measureAlias, value: raw, selection: selection };
        this.dispatchEvent(new Event("onCellChange"));
        this._writeUserInput(selection, raw);
        this._setStatus(this._pending.length + " unsaved change(s)");
        this._renderTable();
      }

      _queuePending(entry) {
        this._pending = this._pending.filter(function (item) {
          return !(item.rowId === entry.rowId && item.colId === entry.colId && item.measureAlias === entry.measureAlias);
        });
        this._pending.push(entry);
      }

      _writeUserInput(selection, value) {
        var ds = this._getDataSource();
        if (!ds || typeof ds.setUserInput !== "function") return false;
        try {
          ds.setUserInput(selection, value === null ? "" : String(value));
          return true;
        } catch (e) {
          this._setStatus("Write-back failed: " + (e && e.message ? e.message : e), "error");
          return false;
        }
      }

      _submitPlanningData() {
        var ds = this._getDataSource();
        var i;
        if (ds && typeof ds.setUserInput === "function") {
          for (i = 0; i < this._pending.length; i++) {
            this._writeUserInput(this._pending[i].selection, this._pending[i].value);
          }
        }
        var success = true;
        if (ds && typeof ds.submitData === "function") {
          try {
            success = ds.submitData() !== false;
          } catch (e) {
            success = false;
            this._setStatus("Submit failed: " + (e && e.message ? e.message : e), "error");
          }
        } else if (!ds) {
          this._setStatus("No planning DataSource. In SAC script call setDataSource(thisWidget.getDataSource()).", "error");
          success = false;
        }
        if (success) {
          this._pending = [];
          this._setStatus("Submitted to planning model", "ok");
          this.dispatchEvent(new Event("onSubmit"));
          this._renderTable();
        }
        return success;
      }

      _revertPlanningData() {
        var ds = this._getDataSource();
        try {
          if (ds && typeof ds.getPlanningVersion === "function") {
            var version = ds.getPlanningVersion();
            if (version && typeof version.revert === "function") version.revert();
          }
        } catch (e) {
          /* local revert still applies */
        }
        this._pending = [];
        this._render();
        this._setStatus("Edits reverted");
      }

      _getEventInfoJson() {
        try {
          return JSON.stringify(this._lastEvent || {});
        } catch (e) {
          return "{}";
        }
      }

      _getPendingEditsCount() {
        return this._pending.length;
      }
    }

    customElements.define("com-vishal-sac-planningtable", PlanningTableWidget);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }

  function formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) return "-";
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  return {
    parseBinding: parseBinding,
    buildSelection: buildSelection,
    applyCellEdit: applyCellEdit,
    cellKey: cellKey,
    columnTotals: columnTotals,
    register: register
  };
});
