/**
 * SAP Analytics Cloud custom widget: editable planning table + ECharts line race.
 * Adapted from https://echarts.apache.org/examples/en/editor.html?c=line-race
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.ComVishalSacPlanningLineRace = api;
  }
  if (typeof customElements !== "undefined") {
    api.register();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var ECHARTS_CDN = "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js";

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
      var value = list[i];
      if (!seen[value]) {
        seen[value] = true;
        out.push(value);
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

    var series = [];
    var times = [];
    var cells = {};
    var measureAlias = measureKeys[0] || "measures_0";

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var seriesLabel = joinMembers(row, rowKeys, "label") || "Series";
      var seriesMemberId = joinMembers(row, rowKeys, "id") || seriesLabel;
      var timeLabel = joinMembers(row, colKeys, "label") || "Value";
      var timeMemberId = joinMembers(row, colKeys, "id") || timeLabel;
      var measureCell = row[measureAlias] || {};
      var raw = typeof measureCell.raw === "number" ? measureCell.raw : Number(measureCell.raw);

      series.push({ id: seriesMemberId, label: seriesLabel });
      times.push({ id: timeMemberId, label: timeLabel });

      var key = seriesMemberId + "||" + timeMemberId;
      cells[key] = {
        raw: isNaN(raw) ? null : raw,
        formatted: measureCell.formatted || measureCell.formattedValue || (isNaN(raw) ? "" : String(raw)),
        unit: measureCell.unit || measureCell.unitOfMeasure || "",
        seriesId: seriesMemberId,
        seriesLabel: seriesLabel,
        timeId: timeMemberId,
        timeLabel: timeLabel,
        row: row
      };
    }

    var uniqueSeries = unique(series.map(function (s) { return s.id; })).map(function (id) {
      var found = series.filter(function (s) { return s.id === id; })[0];
      return found;
    });
    var uniqueTimes = unique(times.map(function (t) { return t.id; })).map(function (id) {
      var found = times.filter(function (t) { return t.id === id; })[0];
      return found;
    });

    return {
      metadata: metadata,
      rowKeys: rowKeys,
      colKeys: colKeys,
      measureKeys: measureKeys,
      measureAlias: measureAlias,
      series: uniqueSeries,
      times: uniqueTimes,
      cells: cells,
      measure: measureMeta(metadata, measureAlias)
    };
  }

  function toLineRaceDataset(model) {
    var header = ["Income", "Country", "Year"];
    var source = [header];
    for (var s = 0; s < model.series.length; s++) {
      var series = model.series[s];
      for (var t = 0; t < model.times.length; t++) {
        var time = model.times[t];
        var cell = model.cells[series.id + "||" + time.id];
        source.push([
          cell && cell.raw !== null && cell.raw !== undefined ? cell.raw : null,
          series.label,
          time.label
        ]);
      }
    }
    return source;
  }

  function buildLineRaceOption(model, settings) {
    settings = settings || {};
    var source = toLineRaceDataset(model);
    var countries = model.series.map(function (s) { return s.label; });
    var datasetWithFilters = [];
    var seriesList = [];
    var measureName = model.measure.label || model.measure.id || "Value";

    for (var i = 0; i < countries.length; i++) {
      var country = countries[i];
      var datasetId = "dataset_" + i;
      datasetWithFilters.push({
        id: datasetId,
        fromDatasetId: "dataset_raw",
        transform: {
          type: "filter",
          config: {
            and: [{ dimension: "Country", "=": country }]
          }
        }
      });
      seriesList.push({
        type: "line",
        datasetId: datasetId,
        showSymbol: false,
        name: country,
        endLabel: {
          show: true,
          formatter: function (params) {
            var value = params.value || [];
            return (value[1] || "") + ": " + (value[0] === null || value[0] === undefined ? "-" : value[0]);
          }
        },
        labelLayout: { moveOverlap: "shiftY" },
        emphasis: { focus: "series" },
        encode: {
          x: "Year",
          y: "Income",
          label: ["Country", "Income"],
          itemName: "Year",
          tooltip: ["Income"]
        }
      });
    }

    return {
      animationDuration: settings.animationDuration || 10000,
      dataset: [{ id: "dataset_raw", source: source }].concat(datasetWithFilters),
      title: { text: settings.title || measureName, left: 8, textStyle: { fontSize: 13 } },
      tooltip: { order: "valueDesc", trigger: "axis" },
      legend: { show: countries.length > 1, type: "scroll", top: 28 },
      xAxis: { type: "category", nameLocation: "middle", nameGap: 28, name: "Time" },
      yAxis: { name: measureName },
      grid: { left: 56, right: 140, top: 64, bottom: 40 },
      series: seriesList,
      color: settings.primaryColor ? [settings.primaryColor] : undefined
    };
  }

  function buildSelection(model, seriesId, timeId) {
    var selection = {};
    var sampleKey = seriesId + "||" + timeId;
    var cell = model.cells[sampleKey];
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
    if (model.measure && model.measure.id) {
      selection[model.measure.id] = model.measure.id;
    }
    return selection;
  }

  function applyCellEdit(model, seriesId, timeId, rawValue) {
    var key = seriesId + "||" + timeId;
    if (!model.cells[key]) {
      model.cells[key] = {
        seriesId: seriesId,
        timeId: timeId,
        seriesLabel: seriesId,
        timeLabel: timeId
      };
    }
    model.cells[key].raw = rawValue;
    model.cells[key].formatted = rawValue === null || rawValue === undefined ? "" : String(rawValue);
    return model.cells[key];
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
        gap: 8px; padding: 8px 10px; border-bottom: 1px solid #e5e5e5;
      }
      .title { font-size: 14px; font-weight: 700; }
      .actions { display: flex; gap: 6px; align-items: center; }
      button {
        font: inherit; font-size: 12px; padding: 5px 10px; border-radius: 4px;
        border: 1px solid #0854a0; background: #0854a0; color: #fff; cursor: pointer;
      }
      button.secondary { background: #fff; color: #0854a0; }
      button:disabled { opacity: 0.45; cursor: default; }
      .status { font-size: 12px; color: #6a6d70; }
      .status.error { color: #bb0000; }
      .status.ok { color: #107e3e; }
      .body { flex: 1; min-height: 0; display: flex; flex-direction: column; }
      .table-pane { flex: 1; min-height: 0; overflow: auto; }
      .chart-pane { flex: 1; min-height: 180px; }
      .wrap.mode-table .chart-pane { display: none; }
      .wrap.mode-chart .table-pane { display: none; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; }
      th, td { border: 1px solid #d9d9d9; padding: 4px 6px; white-space: nowrap; }
      th { background: #f5f6f7; position: sticky; top: 0; z-index: 1; }
      th.row-head { left: 0; z-index: 2; }
      td.row-head { position: sticky; left: 0; background: #fafafa; font-weight: 600; }
      td.numeric { text-align: right; }
      td.dirty { background: #fff4d6; }
      input.cell {
        width: 100%; box-sizing: border-box; border: 0; background: transparent;
        font: inherit; text-align: right; padding: 0;
      }
      input.cell:focus { outline: 2px solid #0854a0; background: #fff; }
      .empty { display: flex; align-items: center; justify-content: center; height: 100%;
        color: #6a6d70; padding: 16px; text-align: center; }
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
      <div class="body">
        <div class="table-pane" id="tablePane"></div>
        <div class="chart-pane" id="chartPane"></div>
      </div>
    </div>
  `;

  function register() {
    if (customElements.get("com-vishal-sac-planninglinerace")) return;

    class PlanningLineRaceWidget extends HTMLElement {
      constructor() {
        super();
        this._shadowRoot = this.attachShadow({ mode: "open" });
        this._shadowRoot.innerHTML = templateHtml;
        this._props = {
          title: "Planning Line Race",
          showTitle: true,
          viewMode: "split",
          editable: true,
          animationDuration: 10000,
          primaryColor: "#0854a0",
          backgroundColor: "#ffffff"
        };
        this._chart = null;
        this._model = null;
        this._pending = [];
        this._lastEvent = {};
        this._externalDataSource = null;
        this._resizeTimer = null;
        this._echartsLoading = null;

        var self = this;
        this._shadowRoot.getElementById("submitBtn").addEventListener("click", function () {
          self._submitPlanningData();
        });
        this._shadowRoot.getElementById("revertBtn").addEventListener("click", function () {
          self._revertPlanningData();
        });
      }

      connectedCallback() {
        this._ensureECharts();
        this._render();
      }

      onCustomWidgetBeforeUpdate(changedProperties) {
        mergeProps(this._props, changedProperties);
      }

      onCustomWidgetAfterUpdate() {
        this._render();
      }

      onCustomWidgetResize() {
        var self = this;
        clearTimeout(this._resizeTimer);
        this._resizeTimer = setTimeout(function () {
          if (self._chart) self._chart.resize();
        }, 80);
      }

      onCustomWidgetDestroy() {
        clearTimeout(this._resizeTimer);
        if (this._chart) {
          this._chart.dispose();
          this._chart = null;
        }
      }

      get title() { return this._props.title; }
      set title(v) { this._props.title = v; this._renderChrome(); }
      get showTitle() { return this._props.showTitle; }
      set showTitle(v) { this._props.showTitle = v; this._renderChrome(); }
      get viewMode() { return this._props.viewMode; }
      set viewMode(v) { this._props.viewMode = v; this._renderChrome(); }
      get editable() { return this._props.editable; }
      set editable(v) { this._props.editable = v; this._render(); }
      get animationDuration() { return this._props.animationDuration; }
      set animationDuration(v) { this._props.animationDuration = v; this._renderChart(); }
      get primaryColor() { return this._props.primaryColor; }
      set primaryColor(v) { this._props.primaryColor = v; this._render(); }
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
          /* DataSource is optional until wired from SAC script */
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
        var mode = this._props.viewMode || "split";
        wrap.classList.remove("mode-table", "mode-chart", "mode-split");
        wrap.classList.add("mode-" + mode);
        wrap.style.setProperty("--bg", this._props.backgroundColor || "#fff");
        this._shadowRoot.getElementById("title").textContent = this._props.showTitle === false
          ? ""
          : (this._props.title || "");
        var editable = this._props.editable !== false;
        this._shadowRoot.getElementById("submitBtn").style.display = editable ? "" : "none";
        this._shadowRoot.getElementById("revertBtn").style.display = editable ? "" : "none";
        if (this._chart) this._chart.resize();
      }

      _render() {
        this._renderChrome();
        var binding = this._getBinding();
        var tablePane = this._shadowRoot.getElementById("tablePane");
        if (!binding || !binding.data || !binding.data.length) {
          if (this._chart) {
            this._chart.dispose();
            this._chart = null;
          }
          tablePane.innerHTML = '<div class="empty">Bind a planning model in the Builder panel and add dimensions to Rows and Columns, plus at least one measure.</div>';
          return;
        }
        this._model = parseBinding(binding);
        this._renderTable();
        this._renderChart();
      }

      _renderTable() {
        var model = this._model;
        var editable = this._props.editable !== false;
        var html = ["<table><thead><tr><th class='row-head'></th>"];
        var t, s, cell, key, dirty;
        for (t = 0; t < model.times.length; t++) {
          html.push("<th>" + escapeHtml(model.times[t].label) + "</th>");
        }
        html.push("</tr></thead><tbody>");
        for (s = 0; s < model.series.length; s++) {
          html.push("<tr><td class='row-head'>" + escapeHtml(model.series[s].label) + "</td>");
          for (t = 0; t < model.times.length; t++) {
            key = model.series[s].id + "||" + model.times[t].id;
            cell = model.cells[key];
            dirty = this._isPending(model.series[s].id, model.times[t].id);
            var value = cell && cell.raw !== null && cell.raw !== undefined ? cell.raw : "";
            html.push("<td class='numeric" + (dirty ? " dirty" : "") + "'>");
            if (editable) {
              html.push("<input class='cell' data-series='" + escapeAttr(model.series[s].id) +
                "' data-time='" + escapeAttr(model.times[t].id) + "' value='" + escapeAttr(String(value)) + "' />");
            } else {
              html.push(escapeHtml(cell && cell.formatted ? cell.formatted : String(value)));
            }
            html.push("</td>");
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

      _isPending(seriesId, timeId) {
        for (var i = 0; i < this._pending.length; i++) {
          if (this._pending[i].seriesId === seriesId && this._pending[i].timeId === timeId) return true;
        }
        return false;
      }

      _onCellSelected(input) {
        var seriesId = input.getAttribute("data-series");
        var timeId = input.getAttribute("data-time");
        this._lastEvent = {
          seriesId: seriesId,
          timeId: timeId,
          selection: this._model ? buildSelection(this._model, seriesId, timeId) : {}
        };
        this.dispatchEvent(new Event("onSelect"));
      }

      _onCellEdited(input) {
        var seriesId = input.getAttribute("data-series");
        var timeId = input.getAttribute("data-time");
        var text = input.value.trim();
        var raw = text === "" ? null : Number(text.replace(/,/g, ""));
        if (text !== "" && isNaN(raw)) {
          this._setStatus("Enter a numeric value", "error");
          return;
        }
        applyCellEdit(this._model, seriesId, timeId, raw);
        var selection = buildSelection(this._model, seriesId, timeId);
        this._queuePending({ seriesId: seriesId, timeId: timeId, value: raw, selection: selection });
        this._lastEvent = { seriesId: seriesId, timeId: timeId, value: raw, selection: selection };
        this.dispatchEvent(new Event("onCellChange"));
        this._writeUserInput(selection, raw);
        this._setStatus(this._pending.length + " unsaved change(s)");
        this._renderTable();
        this._renderChart();
      }

      _queuePending(entry) {
        this._pending = this._pending.filter(function (item) {
          return !(item.seriesId === entry.seriesId && item.timeId === entry.timeId);
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

      async _ensureECharts() {
        if (typeof echarts !== "undefined") return;
        if (this._echartsLoading) return this._echartsLoading;
        var self = this;
        this._echartsLoading = new Promise(function (resolve, reject) {
          var script = document.createElement("script");
          script.src = ECHARTS_CDN;
          script.onload = function () { resolve(); };
          script.onerror = function () {
            self._setStatus("Could not load ECharts", "error");
            reject(new Error("ECharts load failed"));
          };
          document.head.appendChild(script);
        });
        return this._echartsLoading;
      }

      async _renderChart() {
        if (!this._model) return;
        try {
          await this._ensureECharts();
        } catch (e) {
          return;
        }
        if (typeof echarts === "undefined") return;
        var pane = this._shadowRoot.getElementById("chartPane");
        if (!this._chart) {
          this._chart = echarts.init(pane);
        }
        var option = buildLineRaceOption(this._model, {
          title: this._props.title,
          animationDuration: this._props.animationDuration,
          primaryColor: this._props.primaryColor
        });
        this._chart.setOption(option, true);
        var self = this;
        this._chart.off("click");
        this._chart.on("click", function (params) {
          self._lastEvent = { seriesName: params.seriesName, name: params.name, value: params.value };
          self.dispatchEvent(new Event("onSelect"));
        });
      }
    }

    customElements.define("com-vishal-sac-planninglinerace", PlanningLineRaceWidget);
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

  return {
    parseBinding: parseBinding,
    toLineRaceDataset: toLineRaceDataset,
    buildLineRaceOption: buildLineRaceOption,
    buildSelection: buildSelection,
    applyCellEdit: applyCellEdit,
    register: register
  };
});
