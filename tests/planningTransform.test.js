const assert = require("assert");
const api = require("../sac-widget/planningTable.js");

const binding = {
  data: [
    {
      rows_0: { id: "[Country].[Finland]", label: "Finland" },
      columns_0: { id: "[Year].[1950]", label: "1950" },
      measures_0: { raw: 100, formatted: "100" }
    },
    {
      rows_0: { id: "[Country].[Finland]", label: "Finland" },
      columns_0: { id: "[Year].[1951]", label: "1951" },
      measures_0: { raw: 110, formatted: "110" }
    },
    {
      rows_0: { id: "[Country].[France]", label: "France" },
      columns_0: { id: "[Year].[1950]", label: "1950" },
      measures_0: { raw: 200, formatted: "200" }
    },
    {
      rows_0: { id: "[Country].[France]", label: "France" },
      columns_0: { id: "[Year].[1951]", label: "1951" },
      measures_0: { raw: 220, formatted: "220" }
    }
  ],
  metadata: {
    feeds: {
      rows: { values: ["rows_0"], type: "dimension" },
      columns: { values: ["columns_0"], type: "dimension" },
      measures: { values: ["measures_0"], type: "mainStructureMember" }
    },
    dimensions: {
      rows_0: { id: "Country", description: "Country" },
      columns_0: { id: "Year", description: "Year" }
    },
    mainStructureMembers: {
      measures_0: { id: "[Account].[Income]", label: "Income" }
    }
  }
};

const model = api.parseBinding(binding);
assert.strictEqual(model.series.length, 2);
assert.strictEqual(model.times.length, 2);
assert.strictEqual(model.cells["[Country].[Finland]||[Year].[1951]"].raw, 110);

const dataset = api.toLineRaceDataset(model);
assert.deepStrictEqual(dataset[0], ["Income", "Country", "Year"]);
assert.strictEqual(dataset.length, 5);
assert.deepStrictEqual(dataset[1], [100, "Finland", "1950"]);

const option = api.buildLineRaceOption(model, { animationDuration: 5000, title: "Race" });
assert.strictEqual(option.animationDuration, 5000);
assert.strictEqual(option.series.length, 2);
assert.strictEqual(option.dataset[0].id, "dataset_raw");
assert.strictEqual(option.series[0].encode.x, "Year");
assert.strictEqual(option.series[0].encode.y, "Income");

const selection = api.buildSelection(model, "[Country].[France]", "[Year].[1950]");
assert.strictEqual(selection.Country, "[Country].[France]");
assert.strictEqual(selection.Year, "[Year].[1950]");
assert.strictEqual(selection["[Account].[Income]"], "[Account].[Income]");

api.applyCellEdit(model, "[Country].[France]", "[Year].[1950]", 999);
assert.strictEqual(model.cells["[Country].[France]||[Year].[1950]"].raw, 999);

const dimOnly = api.parseBinding({
  data: [
    {
      dimensions_0: { id: "A", label: "Alpha" },
      dimensions_1: { id: "Y1", label: "2020" },
      measures_0: { raw: 5 }
    }
  ],
  metadata: {
    feeds: {
      dimensions: { values: ["dimensions_0", "dimensions_1"], type: "dimension" },
      measures: { values: ["measures_0"], type: "mainStructureMember" }
    },
    dimensions: {
      dimensions_0: { id: "Entity", description: "Entity" },
      dimensions_1: { id: "Date", description: "Date" }
    },
    mainStructureMembers: { measures_0: { id: "Amount", label: "Amount" } }
  }
});
assert.strictEqual(dimOnly.series[0].label, "Alpha");
assert.strictEqual(dimOnly.times[0].label, "2020");

const inferred = api.parseBinding({
  data: [
    {
      Product: { id: "P1", label: "Bike" },
      Year: { id: "2024", label: "2024" },
      Amount: { raw: 42, formatted: "42" }
    }
  ]
});
assert.strictEqual(inferred.series[0].label, "Bike");
assert.strictEqual(inferred.times[0].label, "2024");
assert.strictEqual(inferred.cells["P1||2024"].raw, 42);
assert.deepStrictEqual(api.extractRows({ data: [{ a: 1 }] }).length, 1);

console.log("planning transform tests passed");
