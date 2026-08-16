/**
 * Styling panel for Export Story to PDF custom widget.
 */
(function () {
  const template = document.createElement("template");
  template.innerHTML = `
    <style>
      :host {
        display: block;
        font-family: var(--sapFontFamily, "72", Arial, sans-serif);
        font-size: 13px;
        color: var(--sapTextColor, #32363a);
        padding: 12px;
      }
      .section-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: #6a6d70;
        margin: 12px 0 8px;
      }
      .form-group { margin-bottom: 12px; }
      label { display: block; margin-bottom: 4px; color: #6a6d70; }
      input[type="text"], select {
        width: 100%;
        box-sizing: border-box;
        padding: 6px 8px;
        border: 1px solid #bfbfbf;
        border-radius: 3px;
        font: inherit;
      }
      .row { display: flex; align-items: center; gap: 8px; }
      .hint {
        font-size: 11px;
        color: #6a6d70;
        margin-top: 8px;
        line-height: 1.4;
        padding: 8px;
        background: #f5f6f7;
        border-radius: 4px;
      }
    </style>
    <div class="section-title">Button</div>
    <div class="form-group">
      <label for="buttonLabel">Label</label>
      <input id="buttonLabel" type="text" />
    </div>
    <div class="form-group">
      <label for="primaryColor">Button color</label>
      <input id="primaryColor" type="color" />
    </div>
    <div class="section-title">PDF settings</div>
    <div class="form-group">
      <label for="fileName">File name</label>
      <input id="fileName" type="text" />
    </div>
    <div class="form-group">
      <label for="pageOrientation">Orientation</label>
      <select id="pageOrientation">
        <option value="Portrait">Portrait</option>
        <option value="Landscape">Landscape</option>
      </select>
    </div>
    <div class="form-group row">
      <input id="includeComments" type="checkbox" />
      <label for="includeComments">Include comments</label>
    </div>
    <div class="form-group row">
      <input id="exportInBackground" type="checkbox" />
      <label for="exportInBackground">Export in background</label>
    </div>
    <p class="hint">
      Add the SAC <strong>Export to PDF</strong> component to the story (you can hide it),
      then connect it in a story script:
      <code>ExportPdfButton_1.setExportPdf(ExportPdf_1);</code>
    </p>
  `;

  class ExportPdfStyling extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(template.content.cloneNode(true));
      this._props = {};
      this._bind();
    }

    _bind() {
      const panel = this;
      const fields = [
        ["buttonLabel", "change", (el) => el.value],
        ["fileName", "change", (el) => el.value],
        ["pageOrientation", "change", (el) => el.value],
        ["includeComments", "change", (el) => el.checked],
        ["exportInBackground", "change", (el) => el.checked],
        ["primaryColor", "input", (el) => el.value]
      ];
      fields.forEach(([id, eventName, read]) => {
        this._shadowRoot.getElementById(id).addEventListener(eventName, function (e) {
          panel._update(id, read(e.target));
        });
      });
    }

    _update(name, value) {
      this._props[name] = value;
      const properties = {};
      properties[name] = value;
      this.dispatchEvent(new CustomEvent("propertiesChanged", { detail: { properties: properties } }));
    }

    onCustomWidgetBeforeUpdate(changedProperties) {
      changedProperties = changedProperties || {};
      for (const key in changedProperties) {
        if (Object.prototype.hasOwnProperty.call(changedProperties, key)) {
          this._props[key] = changedProperties[key];
        }
      }
    }

    onCustomWidgetAfterUpdate() {
      this._sync();
    }

    _sync() {
      const p = this._props;
      if (p.buttonLabel !== undefined) this._shadowRoot.getElementById("buttonLabel").value = p.buttonLabel;
      if (p.fileName !== undefined) this._shadowRoot.getElementById("fileName").value = p.fileName;
      if (p.pageOrientation) this._shadowRoot.getElementById("pageOrientation").value = p.pageOrientation;
      if (p.includeComments !== undefined) this._shadowRoot.getElementById("includeComments").checked = !!p.includeComments;
      if (p.exportInBackground !== undefined) {
        this._shadowRoot.getElementById("exportInBackground").checked = !!p.exportInBackground;
      }
      if (p.primaryColor) this._shadowRoot.getElementById("primaryColor").value = p.primaryColor;
    }
  }

  customElements.define("com-vishal-sac-exportpdf-styling", ExportPdfStyling);
})();
