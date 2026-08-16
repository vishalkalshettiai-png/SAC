/**
 * Styling panel for Planning Line Race Table (SAC custom widget).
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
      input[type="text"], input[type="number"], select {
        width: 100%;
        box-sizing: border-box;
        padding: 6px 8px;
        border: 1px solid #bfbfbf;
        border-radius: 3px;
        font: inherit;
      }
      .row { display: flex; align-items: center; gap: 8px; }
      .hint { font-size: 11px; color: #6a6d70; margin-top: 4px; line-height: 1.35; }
    </style>
    <div class="section-title">General</div>
    <div class="form-group">
      <label for="title">Title</label>
      <input id="title" type="text" />
    </div>
    <div class="form-group row">
      <input id="showTitle" type="checkbox" />
      <label for="showTitle">Show title</label>
    </div>
    <div class="form-group">
      <label for="viewMode">View</label>
      <select id="viewMode">
        <option value="split">Table + line race</option>
        <option value="table">Planning table only</option>
        <option value="chart">Line race only</option>
      </select>
    </div>
    <div class="form-group row">
      <input id="editable" type="checkbox" />
      <label for="editable">Editable planning cells</label>
    </div>
    <div class="section-title">Chart</div>
    <div class="form-group">
      <label for="animationDuration">Race animation (ms)</label>
      <input id="animationDuration" type="number" min="0" step="500" />
    </div>
    <div class="form-group">
      <label for="primaryColor">Accent color</label>
      <input id="primaryColor" type="color" />
    </div>
    <div class="form-group">
      <label for="backgroundColor">Background</label>
      <input id="backgroundColor" type="color" />
    </div>
    <p class="hint">Assign a planning model and place dimensions/measures on Rows, Columns, and Measures in the Builder panel.</p>
  `;

  class PlanningLineRaceStyling extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(template.content.cloneNode(true));
      this._props = {};
      this._bind();
    }

    _bind() {
      const panel = this;
      this._shadowRoot.getElementById("title").addEventListener("change", function (e) {
        panel._update("title", e.target.value);
      });
      this._shadowRoot.getElementById("showTitle").addEventListener("change", function (e) {
        panel._update("showTitle", e.target.checked);
      });
      this._shadowRoot.getElementById("viewMode").addEventListener("change", function (e) {
        panel._update("viewMode", e.target.value);
      });
      this._shadowRoot.getElementById("editable").addEventListener("change", function (e) {
        panel._update("editable", e.target.checked);
      });
      this._shadowRoot.getElementById("animationDuration").addEventListener("change", function (e) {
        panel._update("animationDuration", parseInt(e.target.value, 10) || 0);
      });
      this._shadowRoot.getElementById("primaryColor").addEventListener("input", function (e) {
        panel._update("primaryColor", e.target.value);
      });
      this._shadowRoot.getElementById("backgroundColor").addEventListener("input", function (e) {
        panel._update("backgroundColor", e.target.value);
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
      if (p.title !== undefined) this._shadowRoot.getElementById("title").value = p.title;
      if (p.showTitle !== undefined) this._shadowRoot.getElementById("showTitle").checked = !!p.showTitle;
      if (p.viewMode) this._shadowRoot.getElementById("viewMode").value = p.viewMode;
      if (p.editable !== undefined) this._shadowRoot.getElementById("editable").checked = !!p.editable;
      if (p.animationDuration !== undefined) {
        this._shadowRoot.getElementById("animationDuration").value = p.animationDuration;
      }
      if (p.primaryColor) this._shadowRoot.getElementById("primaryColor").value = p.primaryColor;
      if (p.backgroundColor) this._shadowRoot.getElementById("backgroundColor").value = p.backgroundColor;
    }
  }

  customElements.define("com-vishal-sac-planninglinerace-styling", PlanningLineRaceStyling);
})();
