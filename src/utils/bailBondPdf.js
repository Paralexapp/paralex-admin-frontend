import { jsPDF } from "jspdf";
import logoUrl from "../assets/favicon.png";
import { bailBondSections, CONSENT, DECLARATION } from "./bailBondSections";
import { formatDate, formatNaira } from "./format";
import { bailBondStatus } from "./status";
import { bailBondCharges } from "./bailBondCharges";

// A4 portrait, millimetres
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const COL_GAP = 8;
const COL_W = (CONTENT_W - COL_GAP) / 2;
const BOTTOM = PAGE_H - 22; // keep clear of the footer

const C = {
  brand: [64, 9, 69],
  brandSoft: [244, 231, 244],
  ink: [28, 25, 23],
  muted: [120, 113, 108],
  faint: [168, 162, 158],
  line: [231, 229, 228],
  panel: [250, 250, 249],
};

const STATUS = {
  Pending: { fill: [254, 243, 199], text: [146, 64, 14] },
  Approved: { fill: [209, 250, 229], text: [4, 120, 87] },
  Rejected: { fill: [255, 228, 230], text: [190, 18, 60] },
  Withdrawn: { fill: [231, 229, 228], text: [68, 64, 60] },
};

// The built-in PDF fonts only cover Latin-1/WinAnsi: spell out the naira sign and replace
// anything else they can't draw, rather than printing garbage.
const safe = (value) =>
  String(value ?? "")
    .replace(/₦\s?/g, "NGN ")
    .replace(/[^\x20-\x7e\xa0-\xff‘’“”–—•…\n]/g, "?");

const money = (amount) => safe(formatNaira(amount));

const loadImage = (url) =>
  fetch(url)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    )
    .catch(() => null);

/** Builds the application as a real (text, not screenshot) PDF and downloads it */
export async function downloadBailBondPdf(bond) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadImage(logoUrl);
  const status = bailBondStatus(bond);
  const ref = String(bond.id || "").slice(-8).toUpperCase();
  const name = safe(bond.fullName || "Unnamed applicant");
  let y = MARGIN;

  doc.setProperties({ title: `Bail bond application - ${name}`, author: "Paralex Admin", subject: `Reference ${ref}` });

  const font = (size, style = "normal", color = C.ink) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  // Continuation pages carry a slim running header so loose pages stay identifiable
  const newPage = () => {
    doc.addPage();
    font(7.5, "normal", C.muted);
    doc.text(`Bail bond application  •  ${name}  •  Ref. ${ref}`, MARGIN, MARGIN);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, MARGIN + 2.5, PAGE_W - MARGIN, MARGIN + 2.5);
    y = MARGIN + 9;
  };

  const ensure = (height) => {
    if (y + height > BOTTOM) {
      newPage();
      return true;
    }
    return false;
  };

  // ---- Letterhead
  if (logo) doc.addImage(logo, "PNG", MARGIN, MARGIN - 2, 40, 11.65);
  font(7.5, "bold", C.brand);
  doc.text("BAIL BOND APPLICATION", PAGE_W - MARGIN, MARGIN + 1, { align: "right", charSpace: 0.5 });
  font(9, "normal", C.ink);
  doc.text(`Ref. ${ref}`, PAGE_W - MARGIN, MARGIN + 6, { align: "right" });
  font(8, "normal", C.muted);
  doc.text(`Submitted ${safe(formatDate(bond.time))}`, PAGE_W - MARGIN, MARGIN + 10.5, { align: "right" });
  doc.setDrawColor(...C.brand);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, MARGIN + 14, PAGE_W - MARGIN, MARGIN + 14);
  y = MARGIN + 25;

  // ---- Applicant name + status pill
  font(17, "bold", C.ink);
  doc.text(name, MARGIN, y);
  const pill = STATUS[status];
  font(8, "bold", pill.text);
  const pillW = doc.getTextWidth(status.toUpperCase()) + 7;
  doc.setFillColor(...pill.fill);
  doc.roundedRect(PAGE_W - MARGIN - pillW, y - 5, pillW, 6.5, 3.2, 3.2, "F");
  doc.text(status.toUpperCase(), PAGE_W - MARGIN - pillW / 2, y - 0.6, { align: "center", charSpace: 0.3 });
  y += 7;

  // ---- Summary boxes
  const charges = bailBondCharges(bond);
  const boxes = [
    ["Bail amount", money(charges.bail)],
    ["Total to pay (fee + VAT)", money(charges.total)],
    ["Payment", bond.paid ? "Paid" : "Not paid"],
    ["Arresting agency", safe(bond.arrestingAgency || "—")],
  ];
  const boxW = (CONTENT_W - 3 * 4) / 4;
  boxes.forEach(([label, value], i) => {
    const x = MARGIN + i * (boxW + 4);
    doc.setFillColor(...C.panel);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, boxW, 17, 2, 2, "FD");
    font(7, "normal", C.muted);
    doc.text(label, x + 3.5, y + 5.5);
    const lines = (() => {
      font(10.5, "bold", C.ink);
      const oneLine = doc.splitTextToSize(value, boxW - 7);
      if (oneLine.length === 1) return oneLine;
      font(8.5, "bold", C.ink);
      return doc.splitTextToSize(value, boxW - 7).slice(0, 2);
    })();
    doc.text(lines, x + 3.5, lines.length === 1 ? y + 12.5 : y + 10.5);
  });
  y += 21;

  // ---- How the total is made up
  font(8, "normal", C.muted);
  doc.text(`Paralex fee (10% of bail) ${money(charges.fee)} + VAT (7.5% of fee) ${money(charges.vat)} = ${money(charges.total)}. The bail amount itself is not paid to Paralex.`, MARGIN, y, { maxWidth: CONTENT_W });
  y += 8;

  // ---- Declaration
  font(8.5, "normal", C.muted);
  const declaration = doc.splitTextToSize(`${DECLARATION} ${money(charges.bail)}.`, CONTENT_W);
  doc.text(declaration, MARGIN, y);
  y += declaration.length * 3.9 + 6;

  // ---- Sections
  const sectionTitle = (title) => {
    doc.setFillColor(...C.brandSoft);
    doc.rect(MARGIN, y, CONTENT_W, 7, "F");
    font(8, "bold", C.brand);
    doc.text(title.toUpperCase(), MARGIN + 3, y + 4.8, { charSpace: 0.4 });
    y += 10;
  };

  const cellLines = (item, width) => {
    font(9.5, "normal");
    return item.value === null || item.value === undefined || item.value === "" ? null : doc.splitTextToSize(safe(item.value), width);
  };

  const drawCell = (item, lines, x) => {
    font(7, "normal", C.muted);
    doc.text(item.label, x, y + 2.6);
    if (lines) {
      font(9.5, "normal", C.ink);
      doc.text(lines, x, y + 6.8);
    } else {
      font(9.5, "normal", C.faint);
      doc.text("—", x, y + 6.8);
    }
  };

  const rowsOf = (items) => {
    // Pair items into two-column rows; wide items take a full row
    const rows = [];
    items.forEach((item) => {
      const last = rows[rows.length - 1];
      if (!item.wide && last && last.length === 1 && !last[0].wide) last.push(item);
      else rows.push([item]);
    });
    return rows;
  };
  const linesOf = (row) => {
    const wide = row.length === 1 && row[0].wide;
    return row.map((item) => cellLines(item, wide ? CONTENT_W : COL_W));
  };
  const rowHeight = (lines) => 5.2 + Math.max(...lines.map((l) => (l ? l.length : 1))) * 4 + 1.6;
  const sectionHeight = (section) =>
    10 + 5 + section.groups.reduce((sum, group) => sum + (group.heading ? 5 : 0) + rowsOf(group.items).reduce((h, row) => h + rowHeight(linesOf(row)) + 1.2, 0), 0);

  bailBondSections(bond).forEach((section) => {
    // Short sections are never split (a lone row on the next page reads badly); long ones may
    // continue on the next page but keep their title with the first two rows.
    const height = sectionHeight(section);
    if (height <= 60) ensure(height);
    else ensure(36);
    sectionTitle(section.title);

    section.groups.forEach((group) => {
      if (group.heading) {
        ensure(14);
        font(8, "bold", C.muted);
        doc.text(group.heading, MARGIN, y + 2);
        y += 5;
      }

      rowsOf(group.items).forEach((row) => {
        const lines = linesOf(row);
        const height = rowHeight(lines);
        if (ensure(height)) {
          sectionTitle(`${section.title} (continued)`);
        }
        row.forEach((item, i) => drawCell(item, lines[i], MARGIN + i * (COL_W + COL_GAP)));
        y += height;
        doc.setDrawColor(...C.line);
        doc.setLineWidth(0.15);
        doc.line(MARGIN, y - 1, PAGE_W - MARGIN, y - 1);
        y += 1.2;
      });
    });
    y += 5;
  });

  // ---- Consent and signatures
  const consent = (() => {
    font(8.5, "normal");
    return doc.splitTextToSize(CONSENT, CONTENT_W);
  })();
  ensure(consent.length * 3.9 + 58);
  sectionTitle("Declaration and consent");
  font(8.5, "normal", C.ink);
  doc.text(consent, MARGIN, y + 1);
  y += consent.length * 3.9 + 5;

  const agreed = bond.iAgreeToTermsAndConditions === true;
  doc.setDrawColor(...C.muted);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y - 3, 3.6, 3.6);
  if (agreed) {
    doc.setDrawColor(...C.brand);
    doc.setLineWidth(0.5);
    doc.line(MARGIN + 0.7, y - 1.3, MARGIN + 1.5, y - 0.3);
    doc.line(MARGIN + 1.5, y - 0.3, MARGIN + 3, y - 2.4);
  }
  font(9, "normal", C.ink);
  doc.text(agreed ? "The applicant agreed to the terms and conditions." : "The applicant has not agreed to the terms and conditions.", MARGIN + 6, y);
  y += 22;

  [
    ["Signature of defendant", "Date"],
    ["For Paralex Logistics Limited", "Date"],
  ].forEach(([who, when], i) => {
    const x = MARGIN + i * (COL_W + COL_GAP);
    doc.setDrawColor(...C.muted);
    doc.setLineWidth(0.25);
    doc.line(x, y, x + COL_W * 0.62, y);
    doc.line(x + COL_W * 0.7, y, x + COL_W, y);
    font(7.5, "normal", C.muted);
    doc.text(who, x, y + 4);
    doc.text(when, x + COL_W * 0.7, y + 4);
  });

  // ---- Footer on every page
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
    font(7, "normal", C.muted);
    doc.text("Paralex Logistics Limited  •  Confidential: contains personal data", MARGIN, PAGE_H - 9.5);
    doc.text(`Page ${page} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 9.5, { align: "right" });
  }

  const slug = (bond.fullName || "applicant").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  doc.save(`bail-bond-${slug}-${ref.toLowerCase()}.pdf`);
}
