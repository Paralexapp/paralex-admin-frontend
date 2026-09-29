import { formatDate, formatNaira } from "./format";

/**
 * Everything a bail bond application contains, grouped into sections. Shared by the detail page
 * and the PDF so both always show the same fields. Values are plain strings (or null = blank).
 */

export const yesNo = (value) => (value === true ? "Yes" : value === false ? "No" : null);

const isDateArray = (value) => Array.isArray(value) && value.length >= 3 && value.every((n) => typeof n === "number");
const date = (value) => (value ? formatDate(value) : null);

/** camelCase key -> label: "nameOfLandlord" -> "Name of landlord" */
const labelFor = (key) => {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// Bookkeeping fields on nested records that mean nothing to a reviewer
const HIDDEN_KEYS = new Set(["id", "bailBondId", "bailBond", "creatorId", "creator", "time"]);

const recordItems = (record) =>
  Object.entries(record || {})
    .filter(([key, value]) => !HIDDEN_KEYS.has(key) && (value === null || typeof value !== "object" || isDateArray(value)))
    .map(([key, value]) => ({
      label: labelFor(key),
      value: isDateArray(value) ? formatDate(value) : typeof value === "boolean" ? yesNo(value) : value === "" ? null : value,
    }));

/** Nested records (spouse, vehicles…) as one section; several records get "#1", "#2" groups */
const recordSection = (title, records) => {
  const list = (Array.isArray(records) ? records : [records]).filter(Boolean);
  if (!list.length) return null;
  return { title, groups: list.map((record, index) => ({ heading: list.length > 1 ? `#${index + 1}` : null, items: recordItems(record) })) };
};

export const bailBondSections = (bond) =>
  [
    {
      title: "Applicant",
      items: [
        { label: "Full name", value: bond.fullName },
        { label: "Nickname", value: bond.nickName },
        { label: "Phone", value: bond.phoneNumber },
        { label: "Work phone", value: bond.workPhoneNumber },
        { label: "Email", value: bond.email },
        { label: "Current home address", value: bond.currentHomeAddress, wide: true },
        { label: "Residence address", value: bond.residenceAddress, wide: true },
        { label: "Duration of stay", value: bond.durationOfStay },
        { label: "Landlord", value: bond.nameOfLandlord },
        { label: "Time in current state", value: bond.howLongInCurrentState },
        { label: "Time in current city", value: bond.howLongInResidingCity },
        { label: "Former address", value: bond.formerResidentAddress, wide: true },
      ],
    },
    {
      title: "Personal description",
      items: [
        { label: "Date of birth", value: date(bond.dateOfBirth) },
        { label: "Place of birth", value: bond.placeOfBirth },
        { label: "Sex", value: bond.gender },
        { label: "Tribe", value: bond.tribe },
        { label: "Nationality", value: bond.nationality },
        { label: "NIN", value: bond.nin },
        { label: "International passport", value: bond.internationalPassportNumber },
        { label: "Height", value: bond.height },
        { label: "Weight", value: bond.weight },
        { label: "Eye colour", value: bond.eyeColor },
        { label: "Physically challenged", value: yesNo(bond.physicallyChallenged) },
        { label: "Member of a social group", value: yesNo(bond.memberOfSocialGroup) },
        { label: "Marital status", value: bond.maritalStatus },
      ],
    },
    {
      title: "Arrest information",
      items: [
        { label: "Date of current arrest", value: date(bond.dateOfCurrentArrest) },
        { label: "Arresting agency", value: bond.arrestingAgency },
        { label: "Investigating agency", value: bond.investigatingAgency },
        { label: "Detention facility", value: bond.detentionFacilityLocation },
        { label: "Charges", value: bond.charges, wide: true },
        { label: "Charge amount", value: bond.chargeAmount ? formatNaira(bond.chargeAmount) : null },
        { label: "Date of last arrest", value: date(bond.dateOfLastArrest) },
        { label: "Last arresting agency", value: bond.lastArrestingAgency },
        { label: "Last arrest charges", value: bond.lastArrestCharges },
        { label: "Existing bail bond", value: yesNo(bond.existingBailBond) },
        { label: "Pending charges elsewhere", value: bond.pendingChargesInJurisdiction },
        { label: "Ever failed to appear in court", value: yesNo(bond.failedToAppearInCourt) },
        { label: "Had a surety bond before", value: yesNo(bond.enjoyedSuretyBond) },
        { label: "Details of bond", value: bond.detailsOfBond, wide: true },
      ],
    },
    {
      title: "Employment",
      items: [
        { label: "Current employer", value: bond.currentEmployerName },
        { label: "Position", value: bond.position },
        { label: "Time employed", value: bond.durationOfEmployment },
        { label: "Supervisor", value: bond.supervisorName },
        { label: "Supervisor phone", value: bond.supervisorWorkPhone },
        { label: "Former employer", value: bond.formerEmployerName },
        { label: "Former position", value: bond.formerPosition },
        { label: "Time at former employer", value: bond.durationOfFormerEmployment },
        { label: "Former supervisor", value: bond.formerSupervisorName },
        { label: "Former supervisor phone", value: bond.formerSupervisorWorkPhone },
      ],
    },
    recordSection("Spouse", bond.spouseDetails),
    recordSection("Next of kin", bond.nextOfKinDetail),
    recordSection("Legal practitioner", bond.legalPractitioner),
    recordSection("Third-party guarantor", bond.thirdPartyGuarantor),
    recordSection("Travel outside jurisdiction", bond.travelOutsideJurisdiction),
    recordSection("Occupation history", bond.occupationHistories),
    recordSection("Vehicles", bond.vehicleDetails),
    recordSection("Land", bond.landDetail),
    recordSection("Court adjournment dates", bond.adjournmentDates),
  ]
    .filter(Boolean)
    .map((section) => (section.groups ? section : { ...section, groups: [{ heading: null, items: section.items }] }));

export const DECLARATION =
  "You, the undersigned Defendant (“defendant” or “you” includes an accused person or a suspect), hereby represent and warrant that the following declarations made and answers given are true, complete and correct, and are made for the purpose of inducing Paralex Logistics Limited (“surety”) to issue, or cause to be issued, bail bond(s) or undertaking(s) for you (singularly or collectively the “Bond”), in the total amount of";

export const CONSENT =
  "You attest to the fact that all the information provided by you in this bail bond application and agreement has been provided in utmost good faith, and if found to be false may warrant criminal sanctions and withdrawal of the bond, and a notice to the court of the withdrawal of the bond, and shall also cause you to indemnify Paralex Logistics Limited of the cost of applying to the court for a discharge. It shall also cause you to forfeit 10% of your bail bond sum.";
