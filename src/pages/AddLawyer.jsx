import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { PiEye, PiEyeSlash } from "react-icons/pi";
import { adminAddLawyer } from "../api/api";
import { practiceAreas } from "../utils/practiceAreas";
import { listStates } from "../utils/practiceStates";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Field, Input, Select, Textarea } from "../components/ui/Form";
import ChipSelect from "../components/ui/ChipSelect";
import FileDrop from "../components/ui/FileDrop";
import Button from "../components/ui/Button";

const emptyForm = {
  email: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  stateOfResidence: "",
  photoUrl: "",
  password: "",
  stateOfPractice: "",
  aboutMe: "",
  nbabranchAffiliation: "",
  supremeCourtNumber: "",
  practiceAreas: [],
  latitude: 0,
  longitude: 0,
};

const validate = (form) => {
  const errors = {};
  const required = {
    firstName: "Enter a first name.",
    lastName: "Enter a last name.",
    email: "Enter an email address.",
    phoneNumber: "Enter a phone number.",
    stateOfResidence: "Choose a state of residence.",
    stateOfPractice: "Choose a state of practice.",
    supremeCourtNumber: "Enter the Supreme Court number.",
    nbabranchAffiliation: "Enter the NBA branch.",
    aboutMe: "Add a short description.",
    password: "Set a default password.",
  };
  Object.entries(required).forEach(([key, message]) => {
    if (!String(form[key] ?? "").trim()) errors[key] = message;
  });
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";
  if (form.phoneNumber && form.phoneNumber.replace(/\D/g, "").length < 10) errors.phoneNumber = "Enter a valid phone number.";
  if (form.password && form.password.length < 8) errors.password = "Use at least 8 characters.";
  if (!form.practiceAreas.length) errors.practiceAreas = "Pick at least one practice area.";
  return errors;
};

function FormSection({ title, description, children }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="grid gap-5 p-6 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

const AddLawyer = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [image, setImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };
  const bind = (key) => ({ id: key, name: key, value: form[key], onChange: (event) => set(key, event.target.value), error: errors[key] });

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Please fix the highlighted fields.");
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    setLoading(true);
    try {
      await adminAddLawyer({ ...form, email: form.email.trim() });
      toast.success(`${form.firstName} ${form.lastName} was added as a lawyer.`);
      navigate("/admin/lawyers");
    } catch (error) {
      toast.error(error.error || "We couldn't add this lawyer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Add lawyer" description="Create an account and lawyer profile in one step." back={{ to: "/admin/lawyers", label: "All lawyers" }} />

      <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FormSection title="Personal details">
            <Field label="First name" htmlFor="firstName" error={errors.firstName} required>
              <Input placeholder="e.g. Adaeze" autoComplete="off" {...bind("firstName")} />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={errors.lastName} required>
              <Input placeholder="e.g. Nwankwo" autoComplete="off" {...bind("lastName")} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email} required>
              <Input type="email" placeholder="name@example.com" autoComplete="off" {...bind("email")} />
            </Field>
            <Field label="Phone number" htmlFor="phoneNumber" error={errors.phoneNumber} required>
              <Input type="tel" placeholder="0803 000 0000" autoComplete="off" {...bind("phoneNumber")} />
            </Field>
            <Field label="State of residence" htmlFor="stateOfResidence" error={errors.stateOfResidence} required className="sm:col-span-2">
              <Select {...bind("stateOfResidence")}>
                <option value="">Select a state</option>
                {listStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Select>
            </Field>
          </FormSection>

          <FormSection title="Practice" description="What clients see when they look this lawyer up.">
            <Field label="Supreme Court number" htmlFor="supremeCourtNumber" error={errors.supremeCourtNumber} required>
              <Input placeholder="SCN000000" {...bind("supremeCourtNumber")} />
            </Field>
            <Field label="State of practice" htmlFor="stateOfPractice" error={errors.stateOfPractice} required>
              <Select {...bind("stateOfPractice")}>
                <option value="">Select a state</option>
                {listStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="NBA branch" htmlFor="nbabranchAffiliation" error={errors.nbabranchAffiliation} required className="sm:col-span-2">
              <Input placeholder="e.g. Ikeja branch" {...bind("nbabranchAffiliation")} />
            </Field>
            <Field
              label="About"
              htmlFor="aboutMe"
              error={errors.aboutMe}
              hint={`${form.aboutMe.length}/500`}
              required
              className="sm:col-span-2"
            >
              <Textarea maxLength={500} placeholder="Experience, focus areas and anything clients should know." {...bind("aboutMe")} />
            </Field>
            <Field
              label="Practice areas"
              error={errors.practiceAreas}
              hint={form.practiceAreas.length ? `${form.practiceAreas.length} selected` : "Pick all that apply."}
              required
              className="sm:col-span-2"
            >
              <ChipSelect options={practiceAreas} value={form.practiceAreas} onChange={(value) => set("practiceAreas", value)} error={errors.practiceAreas} />
            </Field>
          </FormSection>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Profile photo" description="Optional" />
            <div className="p-6">
              <FileDrop file={image} onChange={setImage} hint="PNG or JPG. Photo upload isn't connected yet." />
            </div>
          </Card>

          <Card>
            <CardHeader title="Account" />
            <div className="space-y-5 p-6">
              <Field label="Default password" htmlFor="password" error={errors.password} hint="Share it with the lawyer securely. At least 8 characters." required>
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

          <div className="flex gap-2 lg:sticky lg:top-24">
            <Button variant="secondary" className="flex-1" onClick={() => navigate("/admin/lawyers")}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Add lawyer
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};

export default AddLawyer;
