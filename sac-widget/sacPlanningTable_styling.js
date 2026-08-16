/**
 * Styling panel for SAC Planning Table custom widget.
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
    <div class="section-title">General</div>
    <div class="form-group">
      <label for="title">Title</label>
      <input id="title" type="text" />
    </div>
    <div class="form-group row">
      <input id="showTitle" type="checkbox" />
      <label for="showTitle">Show title</label>
    </div>
    <div class="form-group row">
      <input id="editable" type="checkbox" />
      <label for="editable">Editable planning cells</label>
    </div>
    <div class="form-group row">
      <input id="showTotals" type="checkbox" />
      <label for="showTotals">Show totals row</label>
    </div>
    <div class="form-group row">
      <input id="compactMode" type="checkbox" />
      <label for="compactMode">Compact rows</label>
    </div>
    <div class="section-title">Appearance</div>
    <div class="form-group">
      <label for="primaryColor">Accent color</label>
      <input id="primaryColor" type="color" />
    </div>
    <div class="form-group">
      <label for="backgroundColor">Background</label>
      <input id="backgroundColor" type="color" />
    </div>
    <p class="hint">
      Use the <strong>Builder</strong> panel (not this styling tab) to pick a planning model and assign
      dimensions to <strong>Rows</strong> and <strong>Columns</strong>, plus accounts/measures to
      <strong>Measures</strong> — the same workflow as SAC built-in tables.
    </p>
  `;

  class PlanningTableStyling extends HTMLElement {
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
        ["title", "change", (el) => el.value],
        ["showTitle", "change", (el) => el.checked],
        ["editable", "change", (el) => el.checked],
        ["showTotals", "change", (el) => el.checked],
        ["compactMode", "change", (el) => el.checked],
        ["primaryColor", "input", (el) => el.value],
        ["backgroundColor", "input", (el) => el.value]
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
      if (p.title !== undefined) this._shadowRoot.getElementById("title").value = p.title;
      if (p.showTitle !== undefined) this._shadowRoot.getElementById("showTitle").checked = !!p.showTitle;
      if (p.editable !== undefined) this._shadowRoot.getElementById("editable").checked = !!p.editable;
      if (p.showTotals !== undefined) this._shadowRoot.getElementById("showTotals").checked = !!p.showTotals;
      if (p.compactMode !== undefined) this._shadowRoot.getElementById("compactMode").checked = !!p.compactMode;
      if (p.primaryColor) this._shadowRoot.getElementById("primaryColor").value = p.primaryColor;
      if (p.backgroundColor) this._shadowRoot.getElementById("backgroundColor").value = p.backgroundColor;
    }
  }

  customElements.define("com-vishal-sac-planningtable-styling", PlanningTableStyling);
})();
