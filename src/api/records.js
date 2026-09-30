import { adminRequest } from "./api";
import { demoApi } from "../data/recordsDemo";

/**
 * LCIS (inmate records) and BIMS (bail records) are external systems. The dashboard never calls
 * them directly: their API keys must stay server-side, so Paralex's backend exposes a relay under
 * /admin/records/* that adds the key, checks the admin's login, and logs who looked up whom.
 *
 * Until that relay exists, a build with VITE_RECORDS_DEMO=1 uses made-up sample records instead.
 */
export const RECORDS_DEMO = import.meta.env.VITE_RECORDS_DEMO === "1";

/** LCIS search. Criteria: full_name | first_name + last_name | phone_number | address | lcis_number | offense */
export const searchLcis = (criteria) =>
  RECORDS_DEMO ? demoApi.searchLcis(criteria) : adminRequest("POST", "admin/records/lcis/search", { limit: 50, offset: 0, ...criteria });

/** One inmate by LCIS number (e.g. "LCIS/0226/4587026") */
export const getLcisInmate = (lcisNumber) =>
  RECORDS_DEMO ? demoApi.getLcis(lcisNumber) : adminRequest("GET", "admin/records/lcis/inmate", null, { lcis: lcisNumber });

/** BIMS search. Criteria: full_name | phone_number | address | id_number | offense | bail_status */
export const searchBims = (criteria) =>
  RECORDS_DEMO ? demoApi.searchBims(criteria) : adminRequest("POST", "admin/records/bims/search", { limit: 50, offset: 0, ...criteria });

/** One BIMS bail record by its record id */
export const getBimsRecord = (id) =>
  RECORDS_DEMO ? demoApi.getBims(id) : adminRequest("GET", `admin/records/bims/${encodeURIComponent(id)}`);

/** Server-run background check on a bail bond application: searches LCIS/BIMS and saves an audit record */
export const runRecordCheck = (bailBondId) =>
  adminRequest("POST", `admin/bail-bonds/${encodeURIComponent(bailBondId)}/record-checks`);

/** Past background checks on an application, newest first */
export const getRecordChecks = (bailBondId) =>
  adminRequest("GET", `admin/bail-bonds/${encodeURIComponent(bailBondId)}/record-checks`);
