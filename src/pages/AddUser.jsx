import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { PiEye, PiEyeSlash } from "react-icons/pi";
import { adminCreateUser } from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Field, Input } from "../components/ui/Form";
import Button from "../components/ui/Button";

const emptyForm = { firstName: "", lastName: "", email: "", phoneNumber: "", dateOfBirth: "", password: "" };

// Same rule the app enforces at sign-up
const strongPassword = (p) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/.test(p);

// Stored in international format, matching accounts created in the app
const toE164 = (phone) => {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  return `+234${digits}`;
};

const validate = (form) => {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "Enter a first name.";
  if (!form.lastName.trim()) errors.lastName = "Enter a last name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (toE164(form.phoneNumber).replace(/\D/g, "").length < 12) errors.phoneNumber = "Enter a valid Nigerian phone number.";
  if (!strongPassword(form.password)) errors.password = "8-20 characters, with an uppercase letter, a lowercase letter and a number.";
  return errors;
};

const AddUser = () => {
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
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setSaving(true);
    try {
      await adminCreateUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: toE164(form.phoneNumber),
        dateOfBirth: form.dateOfBirth || null,
        password: form.password,
      });
      toast.success(`${form.firstName.trim()}'s account is ready. They can sign in to the app with this email and password.`);
      navigate("/admin/users");
    } catch (err) {
      toast.error(typeof err.error === "string" ? err.error : "We couldn't create this account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add user"
        description="Opens a customer account on someone's behalf. It's verified straight away, so they can sign in to the app immediately."
        back={{ to: "/admin/users", label: "All users" }}
      />
      <form onSubmit={handleSubmit} noValidate className="max-w-3xl">
        <Card>
          <CardHeader title="Customer details" />
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName" error={errors.firstName} required>
              <Input autoComplete="off" {...bind("firstName")} />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={errors.lastName} required>
              <Input autoComplete="off" {...bind("lastName")} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email} required>
              <Input type="email" autoComplete="off" {...bind("email")} />
            </Field>
            <Field label="Phone number" htmlFor="phoneNumber" error={errors.phoneNumber} hint="e.g. 0803 000 0000" required>
              <Input type="tel" autoComplete="off" {...bind("phoneNumber")} />
            </Field>
            <Field label="Date of birth" htmlFor="dateOfBirth" hint="Optional">
              <Input type="date" {...bind("dateOfBirth")} />
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              error={errors.password}
              hint="8-20 characters with upper and lower case letters and a number. Share it with them privately."
              required
            >
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
          <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
            <Button variant="secondary" onClick={() => navigate("/admin/users")}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add user
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
};

export default AddUser;
