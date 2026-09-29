// Made-up LCIS/BIMS records used only when the dashboard is built with VITE_RECORDS_DEMO=1,
// so the screens can be reviewed before the real APIs are connected. No real people.

// Field names follow the real LCIS response (its mixed casing included)
const inmate = (id, lcis, first, other, last, gender, dob, state, offence, arrested, place, court, magCourt, prison, admitted, next) => ({
  id, lcis_number: lcis, first_name: first, othername: other, last_name: last, full_name: [first, other, last].filter(Boolean).join(" "),
  gender, date_of_birth: dob, country_of_orign: "Nigeria", state_of_origin: state, tribe: "", religion: "", address_of_defendant: "",
  height_scale: "0.00", weight_scale: "0.00", colour_of_eyes: "Black", colour_of_hair: "Black", tribal_marks: "", Disability: "",
  OffenceCode: "OTHERS", Offence: offence, Charge_no: "", Date_Defendant_Arrested: arrested, Location_offence_committed: place,
  Name_of_IPO: "", Location_of_IPO: "", Police_File_Reference: "", Trial_Court: court, Magistrate_Court_Name_No: magCourt,
  High_Court_Name_No: "", Last_adjourned_date: null, next_hearing_date: next, Prison_name: prison, inmate_category: null,
  Date_admission: admitted, Prisoner_No: null, prison_yard: null, Photograph: null, date_stamp: `${arrested} 09:00:00`,
});

export const demoInmates = [
  inmate(90451, "LCIS/0926/1000451", "TUNDE", "", "ADEWALE", "Male", "1990-03-12", "Oyo", "Stealing", "2026-08-14", "Oshodi", "Magistrate Court", "MAG CT 2 OSHODI", "Ikoyi Custodial Centre", "2026-08-15", "2026-10-06"),
  inmate(90452, "LCIS/0926/1000452", "CHIDI", "EMEKA", "NWOSU", "Male", "1987-11-02", "Anambra", "Assault", "2026-07-02", "Yaba", "Magistrate Court", "MAG CT 1 YABA", null, null, null),
  inmate(90453, "LCIS/0926/1000453", "FATIMA", "", "BELLO", "Female", "1995-06-21", "Kwara", "Fraud", "2026-09-01", "Ikeja", "High Court", "", "Female Custodial Centre, Kirikiri", "2026-09-02", "2026-10-14"),
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

const lcisFields = { full_name: ["first_name", "othername", "last_name"], lcis_number: ["lcis_number"], address: ["address_of_defendant"], offense: ["Offence"] };
const bimsFields = { full_name: ["full_name"], phone_number: ["phone"], address: ["current_address"], bail_status: ["status"], offense: ["defendant_offense"] };

const reply = (key, list) => new Promise((resolve) => setTimeout(() => resolve({ status: "success", data: { [key]: list, total: list.length } }), 350));

export const demoApi = {
  searchLcis: (criteria) => reply("inmates", demoInmates.filter((r) => matches(r, criteria, lcisFields))),
  getLcis: (lcis) => reply("inmate", demoInmates.find((r) => r.lcis_number === lcis) || null).then((r) => ({ data: r.data.inmate })),
  searchBims: (criteria) => reply("sureties", demoBims.filter((r) => matches(r, criteria, bimsFields))),
  getBims: (id) => reply("surety", demoBims.find((r) => r.id === String(id)) || null).then((r) => ({ data: r.data.surety })),
};
