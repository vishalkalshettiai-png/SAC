/**
 * SAP Analytics Cloud custom widget: Export Story to PDF button.
 * Triggers SAC's built-in Export to PDF component (ExportPdf.exportView()).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.ComVishalSacExportPdf = api;
  }
  if (typeof customElements !== "undefined") {
    api.register();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var SETUP_HINT = "Add SAC Export to PDF component (ExportPdf_1) and run onInitialization: ExportPdfButton_1.setExportPdf(ExportPdf_1);";

  function mergeProps(target, source) {
    source = source || {};
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
    return target;
  }

  function normalizeOrientation(value) {
    var text = String(value || "Portrait");
    return text.toLowerCase() === "landscape" ? "Landscape" : "Portrait";
  }

  function applyExportSettings(exportPdf, props) {
    if (!exportPdf) return;
    if (props.fileName && typeof exportPdf.setFileName === "function") {
      exportPdf.setFileName(props.fileName);
    }
    if (typeof exportPdf.setPageOrientation === "function") {
      exportPdf.setPageOrientation(normalizeOrientation(props.pageOrientation));
    }
    if (typeof exportPdf.setCommentsVisible === "function") {
      exportPdf.setCommentsVisible(!!props.includeComments);
    }
    if (typeof exportPdf.setExportInBackgroundEnabled === "function") {
      exportPdf.setExportInBackgroundEnabled(props.exportInBackground !== false);
    }
  }

  function runExport(exportPdf, props) {
    if (!exportPdf || typeof exportPdf.exportView !== "function") {
      return { ok: false, message: "Export PDF component not connected. " + SETUP_HINT };
    }
    try {
      applyExportSettings(exportPdf, props);
      var ok = exportPdf.exportView() !== false;
      return {
        ok: ok,
        message: ok ? "PDF export started." : "PDF export was rejected by SAC."
      };
    } catch (e) {
      return {
        ok: false,
        message: "PDF export failed: " + (e && e.message ? e.message : e)
      };
    }
  }

  var templateHtml = `
    <style>
      :host { display: block; width: 100%; height: 100%; }
      .wrap {
        display: flex; align-items: center; justify-content: center;
        width: 100%; height: 100%; box-sizing: border-box;
        font-family: var(--sapFontFamily, "72", Arial, sans-serif);
      }
      button {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        min-width: 140px; height: 36px; padding: 0 16px;
        border: 1px solid var(--accent, #bb0000); border-radius: 4px;
        background: var(--accent, #bb0000); color: #fff;
        font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
      }
      button:disabled { opacity: 0.55; cursor: default; }
      button svg { width: 16px; height: 16px; fill: currentColor; flex-shrink: 0; }
      .status {
        margin-top: 6px; font-size: 11px; color: #6a6d70; text-align: center;
        line-height: 1.35; max-width: 260px;
      }
      .status.error { color: #bb0000; }
      .status.ok { color: #107e3e; }
      .stack {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 100%; height: 100%;
      }
    </style>
    <div class="wrap">
      <div class="stack">
        <button id="exportBtn" type="button">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 1H3v14h10V5H9V1zm1 1.5L12.5 6H10V2.5zM5 8h6v1H5V8zm0 2h4v1H5v-1z"/></svg>
          <span id="label"></span>
        </button>
        <div class="status" id="status"></div>
      </div>
    </div>
  `;

  function register() {
    if (customElements.get("com-vishal-sac-exportpdf")) return;

    class ExportPdfButtonWidget extends HTMLElement {
      constructor() {
        super();
        this._shadowRoot = this.attachShadow({ mode: "open" });
        this._shadowRoot.innerHTML = templateHtml;
        this._props = {
          buttonLabel: "Export to PDF",
          fileName: "Story Export",
          pageOrientation: "Portrait",
          includeComments: false,
          exportInBackground: true,
          primaryColor: "#bb0000"
        };
        this._exportPdf = null;
        this._lastStatus = "";
        this._busy = false;

        var self = this;
        this._shadowRoot.getElementById("exportBtn").addEventListener("click", function () {
          self.exportStoryToPdf();
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

      get buttonLabel() { return this._props.buttonLabel; }
      set buttonLabel(v) { this._props.buttonLabel = v; this._render(); }
      get fileName() { return this._props.fileName; }
      set fileName(v) { this._props.fileName = v; }
      get pageOrientation() { return this._props.pageOrientation; }
      set pageOrientation(v) { this._props.pageOrientation = v; }
      get includeComments() { return this._props.includeComments; }
      set includeComments(v) { this._props.includeComments = !!v; }
      get exportInBackground() { return this._props.exportInBackground; }
      set exportInBackground(v) { this._props.exportInBackground = !!v; }
      get primaryColor() { return this._props.primaryColor; }
      set primaryColor(v) { this._props.primaryColor = v; this._render(); }

      setExportPdf(exportPdf) {
        this._exportPdf = exportPdf || null;
        this._setStatus(this._exportPdf ? "Ready to export." : "", "ok");
      }

      getLastExportStatus() {
        return this._lastStatus || "";
      }

      exportStoryToPdf() {
        if (this._busy) return false;
        this._busy = true;
        this._render();
        var result = runExport(this._exportPdf, this._props);
        this._lastStatus = result.message;
        this._busy = false;
        if (!this._exportPdf) {
          this.dispatchEvent(new Event("onExportRequest"));
        }
        if (result.ok) {
          this._setStatus(result.message, "ok");
          this.dispatchEvent(new Event("onExportComplete"));
        } else {
          this._setStatus(result.message, "error");
          this.dispatchEvent(new Event("onExportError"));
        }
        this._render();
        return result.ok;
      }

      async serializeCustomWidgetToImage() {
        var node = this._shadowRoot.querySelector(".stack");
        if (!node) return "";
        try {
          if (typeof html2canvas !== "undefined") {
            var canvas = await html2canvas(node, { backgroundColor: "#ffffff", scale: 2 });
            return canvas.toDataURL("image/png");
          }
        } catch (e) {
          /* fallback below */
        }
        return "";
      }

      _setStatus(text, kind) {
        var el = this._shadowRoot.getElementById("status");
        el.textContent = text || "";
        el.className = "status" + (kind ? " " + kind : "");
      }

      _render() {
        var wrap = this._shadowRoot.querySelector(".wrap");
        wrap.style.setProperty("--accent", this._props.primaryColor || "#bb0000");
        this._shadowRoot.getElementById("label").textContent = this._props.buttonLabel || "Export to PDF";
        this._shadowRoot.getElementById("exportBtn").disabled = !!this._busy;
      }
    }

    customElements.define("com-vishal-sac-exportpdf", ExportPdfButtonWidget);
  }

  return {
    normalizeOrientation: normalizeOrientation,
    applyExportSettings: applyExportSettings,
    runExport: runExport,
    register: register
  };
});
