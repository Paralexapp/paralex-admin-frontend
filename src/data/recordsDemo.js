// Made-up LCIS/BIMS records used only when the dashboard is built with VITE_RECORDS_DEMO=1,
// so the screens can be reviewed before the real APIs are connected. No real people.

export const demoInmates = [
  { lcis_number: "LCIS/0926/1000451", first_name: "TUNDE", othername: "", last_name: "ADEWALE", gender: "Male", phone_number: "08031110001", address: "7 Market Road, Oshodi, Lagos", offense: "Stealing", court: "Magistrate Court", court_name: "MAG CT 2 OSHODI", charge_no: "MO/S/41/26", prison: "Ikoyi Custodial Centre", status: "Awaiting Trial", date_admitted: "2026-08-14 10:22:00", photograph: null },
  { lcis_number: "LCIS/0926/1000452", first_name: "CHIDI", othername: "EMEKA", last_name: "NWOSU", gender: "Male", phone_number: "08031110002", address: "15 Bode Thomas Street, Surulere, Lagos", offense: "Assault", court: "Magistrate Court", court_name: "MAG CT 1 YABA", charge_no: "MY/A/88/26", prison: "Medium Security Custodial Centre", status: "Released on Bail", date_admitted: "2026-07-02 09:05:00", photograph: null },
  { lcis_number: "LCIS/0926/1000453", first_name: "FATIMA", othername: "", last_name: "BELLO", gender: "Female", phone_number: "08031110003", address: "3 Unity Close, Ikeja, Lagos", offense: "Fraud", court: "High Court", court_name: "HC 4 IKEJA", charge_no: "ID/F/12/26", prison: "Female Custodial Centre, Kirikiri", status: "Awaiting Trial", date_admitted: "2026-09-01 14:40:00", photograph: null },
];

export const demoBims = [
  { id: "90001", uuid: "BIMS1790000001", defendant_lcis_number: "LCIS/0926/1000452", defendant_first_name: "CHIDI", defendant_last_name: "NWOSU", defendant_offense: "Assault", defendant_court: "Magistrate Court", defendant_court_magname: "MAG CT 1 YABA", defendant_location: "MEDIUM SECURITY CUSTODIAL CENTER", defendant_status: "Released on Bail", charge_no: "MY/A/88/26", court: "Magistrate Court", title: "Mrs", first_name: "GRACE", surname: "NWOSU", phone: "08031119002", current_address: "15 Bode Thomas Street, Surulere, Lagos", id_type: "nin", id_number: "00000000002", status: "Approved", payment_status: "Success", nin_status: "Found", created_at: "2026-07-10 11:30:00", full_name: "CHIDI NWOSU", surety_full_name: "GRACE NWOSU" },
  { id: "90002", uuid: "BIMS1790000002", defendant_lcis_number: "LCIS/0926/1000451", defendant_first_name: "TUNDE", defendant_last_name: "ADEWALE", defendant_offense: "Stealing", defendant_court: "Magistrate Court", defendant_court_magname: "MAG CT 2 OSHODI", defendant_location: "IKOYI CUSTODIAL CENTER", defendant_status: "Awaiting Trial", charge_no: "MO/S/41/26", court: "Magistrate Court", id_type: "nin", id_number: "00000000001", status: "Pending", payment_status: "Pending", nin_status: "Found", created_at: "2026-09-20 16:05:00", full_name: "TUNDE ADEWALE", surety_full_name: "" },
];

const matches = (record, criteria, fields) =>
  Object.entries(criteria).every(([key, value]) => {
    if (!value || key === "limit" || key === "offset") return true;
    const haystack = (fields[key] || [key]).map((f) => String(record[f] ?? "")).join(" ").toLowerCase();
    return haystack.includes(String(value).toLowerCase());
  });

const lcisFields = { full_name: ["first_name", "othername", "last_name"], phone_number: ["phone_number"], lcis_number: ["lcis_number"] };
const bimsFields = { full_name: ["full_name"], phone_number: ["phone"], address: ["current_address"], bail_status: ["status"], offense: ["defendant_offense"] };

const reply = (key, list) => new Promise((resolve) => setTimeout(() => resolve({ status: "success", data: { [key]: list, total: list.length } }), 350));

export const demoApi = {
  searchLcis: (criteria) => reply("inmates", demoInmates.filter((r) => matches(r, criteria, lcisFields))),
  getLcis: (lcis) => reply("inmate", demoInmates.find((r) => r.lcis_number === lcis) || null).then((r) => ({ data: r.data.inmate })),
  searchBims: (criteria) => reply("sureties", demoBims.filter((r) => matches(r, criteria, bimsFields))),
  getBims: (id) => reply("surety", demoBims.find((r) => r.id === String(id)) || null).then((r) => ({ data: r.data.surety })),
};
