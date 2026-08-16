const assert = require("assert");
const api = require("../sac-widget/exportPdfButton.js");

assert.strictEqual(api.normalizeOrientation("landscape"), "Landscape");
assert.strictEqual(api.normalizeOrientation("Portrait"), "Portrait");

var calls = [];
var mockExportPdf = {
  setFileName: function (name) { calls.push(["setFileName", name]); },
  setPageOrientation: function (orientation) { calls.push(["setPageOrientation", orientation]); },
  setCommentsVisible: function (visible) { calls.push(["setCommentsVisible", visible]); },
  setExportInBackgroundEnabled: function (enabled) { calls.push(["setExportInBackgroundEnabled", enabled]); },
  exportView: function () { calls.push(["exportView"]); return true; }
};

api.applyExportSettings(mockExportPdf, {
  fileName: "Quarterly Report",
  pageOrientation: "Landscape",
  includeComments: true,
  exportInBackground: false
});

assert.deepStrictEqual(calls, [
  ["setFileName", "Quarterly Report"],
  ["setPageOrientation", "Landscape"],
  ["setCommentsVisible", true],
  ["setExportInBackgroundEnabled", false]
]);

var ok = api.runExport(mockExportPdf, { fileName: "Test" });
assert.strictEqual(ok.ok, true);

var missing = api.runExport(null, {});
assert.strictEqual(missing.ok, false);

console.log("export pdf button tests passed");
