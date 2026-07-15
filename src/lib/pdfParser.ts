// Parser do PDF "Semáforos" — portado do BNI Performance Tool (mesma lógica validada).
import pdfParse from "pdf-parse";

export type ParsedRecord = {
  name: string;
  p: number;
  a: number;
  pts_a: number;
  l: number;
  pts_l: number;
  m: number;
  s: number;
  rd: number;
  pts_rd: number;
  rr: number;
  one_to_one: number;
  pts_121: number;
  c: number;
  pts_c: number;
  t: number;
  pts_t: number;
  f: number;
  pts_f: number;
  onf: number;
  pts_onf: number;
  pts_total: number;
};

export function toTitleCase(str: string): string {
  const lower = ["de", "da", "do", "das", "dos", "e"];
  return str
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && lower.includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export async function parseSemaforosPdf(buffer: Buffer): Promise<ParsedRecord[]> {
  // Extrai texto com coordenadas, agrupa por linha (Y) e ordena por X
  function render_page(pageData: any) {
    return pageData
      .getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
      .then(function (textContent: any) {
        const items = textContent.items;
        const lines: any[] = [];
        for (const item of items) {
          if (item.str.trim() === "") continue;
          const x = item.transform[4];
          const y = item.transform[5];
          let line = lines.find((l) => Math.abs(l.y - y) < 5);
          if (!line) {
            line = { y, items: [] };
            lines.push(line);
          }
          line.items.push({ x, str: item.str });
        }
        lines.sort((a, b) => b.y - a.y);
        let text = "";
        for (const line of lines) {
          line.items.sort((a: any, b: any) => a.x - b.x);
          text += line.items.map((i: any) => i.str).join(" ") + "\n";
        }
        return text;
      });
  }

  const pdfData = await pdfParse(buffer, { pagerender: render_page } as any);
  const lines = pdfData.text.split("\n");
  let records: ParsedRecord[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (line.includes("Total") || line === "") continue;

    const tokens = line.split(/\s+/);
    if (tokens.length < 22) continue;
    if (!/^\d+$/.test(tokens[0])) continue;

    const nameTokens: string[] = [];
    const dataTokens: string[] = [];
    let foundNumbers = false;

    for (let j = 1; j < tokens.length; j++) {
      if (!foundNumbers && /^-?[\d.,]+$/.test(tokens[j])) foundNumbers = true;
      if (foundNumbers) dataTokens.push(tokens[j]);
      else nameTokens.push(tokens[j]);
    }

    let cleanName = nameTokens
      .join(" ")
      .replace(/\s+[l«\*hi]+(?:\s+[l«\*hi]+)*$/i, "")
      .trim();
    cleanName = toTitleCase(cleanName);

    const numericTokens = dataTokens.filter((t) => /^-?[\d.,]+$/.test(t));

    if (numericTokens.length >= 21) {
      records.push({
        name: cleanName,
        p: parseInt(numericTokens[0]),
        a: parseInt(numericTokens[1]),
        pts_a: parseInt(numericTokens[2]),
        l: parseInt(numericTokens[3]),
        pts_l: parseInt(numericTokens[4]),
        m: parseInt(numericTokens[5]),
        s: parseInt(numericTokens[6]),
        rd: parseInt(numericTokens[7]),
        pts_rd: parseInt(numericTokens[8]),
        rr: parseInt(numericTokens[9]),
        one_to_one: parseInt(numericTokens[10]),
        pts_121: parseInt(numericTokens[11]),
        c: parseInt(numericTokens[12]),
        pts_c: parseInt(numericTokens[13]),
        t: parseInt(numericTokens[14]),
        pts_t: parseInt(numericTokens[15]),
        f: parseInt(numericTokens[16]),
        pts_f: parseInt(numericTokens[17]),
        onf: parseFloat(numericTokens[18].replace(/\./g, "").replace(",", ".")),
        pts_onf: parseInt(numericTokens[19]),
        pts_total: parseInt(numericTokens[20]),
      });
    }
  }

  // Remove duplicados por nome
  const unique: ParsedRecord[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    const key = r.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }
  return unique;
}
