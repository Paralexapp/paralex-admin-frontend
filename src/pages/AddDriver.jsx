import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { PiEye, PiEyeSlash } from "react-icons/pi";
import { adminCreateDriver } from "../api/api";
import { listStates } from "../utils/practiceStates";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Field, Input, Select } from "../components/ui/Form";
import Button from "../components/ui/Button";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  stateOfResidence: "",
  password: "",
  hasBike: true,
  hasRiderCard: false,
  bikeType: "",
  bikeCapacity: "",
  chassisNumber: "",
  guarantorClass: "",
  guarantorPhoneNumber: "",
  guarantorEmail: "",
  guarantorStateOfResidence: "",
  guarantorResidentialAddress: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  bvn: "",
  nin: "",
};

// Firebase (which holds rider logins) only accepts international format: 0803… -> +234803…
const toE164 = (phone) => {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  return `+234${digits}`;
};

const validate = (form) => {
  const errors = {};
  const required = {
    firstName: "Enter a first name.",
    lastName: "Enter a last name.",
    email: "Enter an email address.",
    phoneNumber: "Enter a phone number.",
    stateOfResidence: "Choose a state.",
    password: "Set a password.",
  };
  Object.entries(required).forEach(([key, message]) => {
    if (!String(form[key] ?? "").trim()) errors[key] = message;
  });
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";
  if (form.phoneNumber && toE164(form.phoneNumber).replace(/\D/g, "").length < 12) errors.phoneNumber = "Enter a valid Nigerian phone number.";
  if (form.password && form.password.length < 8) errors.password = "Use at least 8 characters.";
  if (form.guarantorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guarantorEmail)) errors.guarantorEmail = "Enter a valid email address.";
  if (form.accountNumber && !/^\d{10}$/.test(form.accountNumber)) errors.accountNumber = "Account numbers are 10 digits.";
  if (form.bvn && !/^\d{11}$/.test(form.bvn)) errors.bvn = "BVN is 11 digits.";
  if (form.nin && !/^\d{11}$/.test(form.nin)) errors.nin = "NIN is 11 digits.";
  return errors;
};

const StateSelect = (props) => (
  <Select {...props}>
    <option value="">Select a state</option>
    {listStates.map((state) => (
      <option key={state} value={state}>
        {state}
      </option>
    ))}
  </Select>
);

function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[true, false].map((option) => (
        <button
          key={String(option)}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`h-10 flex-1 rounded-lg text-sm font-medium ring-1 ring-inset transition ${
            value === option ? "bg-brand-900 text-white ring-brand-900" : "bg-white text-stone-600 ring-stone-200 hover:bg-stone-50"
          }`}
        >
          {option ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

const AddDriver = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };
  const bind = (key) => ({ id: key, name: key, value: form[key], onChange: (e) => set(key, e.target.value), error: errors[key] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Please fix the highlighted fields.");
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    setSaving(true);
    try {
      // Blank optional fields are sent as null rather than empty strings
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === "string" ? v.trim() || null : v]));
      await adminCreateDriver({ ...payload, email: form.email.trim().toLowerCase(), phoneNumber: toE164(form.phoneNumber) });
      toast.success(`${form.firstName} ${form.lastName} was added as a driver. Enable them from their profile when they're ready to take jobs.`);
      navigate("/admin/drivers");
    } catch (err) {
      toast.error(typeof err.error === "string" ? err.error : "We couldn't add this driver. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add driver"
        description="Creates the rider's app account (or links an existing one with the same email or phone) and their driver profile."
        back={{ to: "/admin/drivers", label: "All drivers" }}
      />
      <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Rider" />
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <Field label="First name" htmlFor="firstName" error={errors.firstName} required>
                <Input {...bind("firstName")} />
              </Field>
              <Field label="Last name" htmlFor="lastName" error={errors.lastName} required>
                <Input {...bind("lastName")} />
              </Field>
              <Field label="Email" htmlFor="email" error={errors.email} required>
                <Input type="email" autoComplete="off" {...bind("email")} />
              </Field>
              <Field label="Phone number" htmlFor="phoneNumber" error={errors.phoneNumber} hint="e.g. 0803 000 0000" required>
                <Input type="tel" autoComplete="off" {...bind("phoneNumber")} />
              </Field>
              <Field label="State of residence" htmlFor="stateOfResidence" error={errors.stateOfResidence} required className="sm:col-span-2">
                <StateSelect {...bind("stateOfResidence")} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Guarantor" description="Optional" />
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <Field label="Guarantor type" htmlFor="guarantorClass" hint="e.g. Family, Employer">
                <Input {...bind("guarantorClass")} />
              </Field>
              <Field label="Phone number" htmlFor="guarantorPhoneNumber">
                <Input type="tel" {...bind("guarantorPhoneNumber")} />
              </Field>
              <Field label="Email" htmlFor="guarantorEmail" error={errors.guarantorEmail}>
                <Input type="email" {...bind("guarantorEmail")} />
              </Field>
              <Field label="State of residence" htmlFor="guarantorStateOfResidence">
                <StateSelect {...bind("guarantorStateOfResidence")} />
              </Field>
              <Field label="Address" htmlFor="guarantorResidentialAddress" className="sm:col-span-2">
                <Input {...bind("guarantorResidentialAddress")} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Bank and identity" description="Optional. Used for rider payouts and verification." />
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <Field label="Bank" htmlFor="bankName">
                <Input {...bind("bankName")} />
              </Field>
              <Field label="Account number" htmlFor="accountNumber" error={errors.accountNumber}>
                <Input inputMode="numeric" {...bind("accountNumber")} />
              </Field>
              <Field label="Account name" htmlFor="accountName" className="sm:col-span-2">
                <Input {...bind("accountName")} />
              </Field>
              <Field label="BVN" htmlFor="bvn" error={errors.bvn}>
                <Input inputMode="numeric" {...bind("bvn")} />
              </Field>
              <Field label="NIN" htmlFor="nin" error={errors.nin}>
                <Input inputMode="numeric" {...bind("nin")} />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Vehicle" />
            <div className="space-y-5 p-6">
              <Field label="Owns a bike?">
                <YesNo value={form.hasBike} onChange={(v) => set("hasBike", v)} />
              </Field>
              {form.hasBike && (
                <>
                  <Field label="Bike type" htmlFor="bikeType" hint="e.g. Qlink 150">
                    <Input {...bind("bikeType")} />
                  </Field>
                  <Field label="Bike capacity" htmlFor="bikeCapacity" hint="e.g. 150cc">
                    <Input {...bind("bikeCapacity")} />
                  </Field>
                  <Field label="Chassis number" htmlFor="chassisNumber">
                    <Input {...bind("chassisNumber")} />
                  </Field>
                </>
              )}
              <Field label="Has a rider card?">
                <YesNo value={form.hasRiderCard} onChange={(v) => set("hasRiderCard", v)} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="App sign-in" />
            <div className="p-6">
              <Field label="Password" htmlFor="password" error={errors.password} hint="The rider uses this to sign in to the app. Share it privately." required>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} autoComplete="new-password" className="pr-10" {...bind("password")} />
                  <button
                    type="button"
                    onClick={() => setShowPassword((show) => !show)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <PiEyeSlash className="size-4" /> : <PiEye className="size-4" />}
                  </button>
                </div>
              </Field>
            </div>
          </Card>

          <p className="rounded-xl bg-stone-100 px-4 py-3 text-xs text-stone-600">
            New drivers start <span className="font-medium">disabled</span>. Enable them from their profile once their documents are checked.
          </p>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => navigate("/admin/drivers")}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={saving}>
              Add driver
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};

export default AddDriver;
