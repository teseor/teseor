/** HTML `<tr><td>` rows from a string matrix, indented for the docs page. */
export function tableRows(rows: string[][]): string {
  return rows
    .map((cells) => `        <tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("\n");
}

/** Wrap a body in a `<section class="t-stack" data-gap="3">` block with an `<h2>` title. */
export function section(title: string, body: string): string {
  return `    <section class="t-stack" data-gap="3">\n      <h2>${title}</h2>\n${body}\n    </section>`;
}

/** Full `<table>` block: `<thead>` headers + `<tbody>` rows. */
export function renderTable(headers: string[], rows: string[][]): string {
  const head = headers.map((h) => `<th>${h}</th>`).join("");
  return [
    `      <table>`,
    `        <thead><tr>${head}</tr></thead>`,
    `        <tbody>`,
    tableRows(rows),
    `        </tbody>`,
    `      </table>`,
  ].join("\n");
}
