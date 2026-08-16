const assert = require("assert");
const api = require("../sac-widget/sacPlanningTable.js");

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
assert.strictEqual(model.rows.length, 2);
assert.strictEqual(model.columns.length, 2);
assert.strictEqual(model.tableRows.length, 2);
assert.strictEqual(model.cells[api.cellKey("[Country].[Finland]", "[Year].[1951]", "measures_0")].raw, 110);

const selection = api.buildSelection(model, "[Country].[France]", "[Year].[1950]", "measures_0");
assert.strictEqual(selection.Country, "[Country].[France]");
assert.strictEqual(selection.Year, "[Year].[1950]");
assert.strictEqual(selection["[Account].[Income]"], "[Account].[Income]");

api.applyCellEdit(model, "[Country].[France]", "[Year].[1950]", "measures_0", 999);
assert.strictEqual(model.cells[api.cellKey("[Country].[France]", "[Year].[1950]", "measures_0")].raw, 999);

const multiMeasureBinding = {
  data: [
    {
      rows_0: { id: "A", label: "Alpha" },
      columns_0: { id: "2020", label: "2020" },
      measures_0: { raw: 10, formatted: "10" },
      measures_1: { raw: 20, formatted: "20" }
    }
  ],
  metadata: {
    feeds: {
      rows: { values: ["rows_0"], type: "dimension" },
      columns: { values: ["columns_0"], type: "dimension" },
      measures: { values: ["measures_0", "measures_1"], type: "mainStructureMember" }
    },
    dimensions: {
      rows_0: { id: "Entity", description: "Entity" },
      columns_0: { id: "Year", description: "Year" }
    },
    mainStructureMembers: {
      measures_0: { id: "Income", label: "Income" },
      measures_1: { id: "Expense", label: "Expense" }
    }
  }
};

const multi = api.parseBinding(multiMeasureBinding);
assert.strictEqual(multi.tableRows.length, 2);
assert.strictEqual(multi.tableRows[0].measureLabel, "Income");
assert.strictEqual(multi.tableRows[1].measureLabel, "Expense");

const totals = api.columnTotals(multi);
assert.strictEqual(totals["2020"], 30);

console.log("planning table tests passed");
