/** Bail bond review state, from the backend's approved/rejected/withdrawn flags */
export const bailBondStatus = (bond) => {
  if (bond?.withdrawn) return "Withdrawn";
  if (bond?.approved && !bond?.rejected) return "Approved";
  if (bond?.rejected && !bond?.approved) return "Rejected";
  return "Pending";
};

export const statusTone = { Approved: "success", Rejected: "danger", Pending: "warning", Withdrawn: "neutral" };

/** Account state shown on user lists */
export const accountStatus = (user) => {
  if (user?.accountBlocked) return { label: "Blocked", tone: "danger" };
  if (user?.enabled === false) return { label: "Inactive", tone: "neutral" };
  return { label: "Active", tone: "success" };
};
