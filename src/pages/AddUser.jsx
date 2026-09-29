import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { listStates } from "../utils/practiceStates";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Field, Input, Select } from "../components/ui/Form";
import Button from "../components/ui/Button";
import { SampleDataNotice } from "../components/ui/States";

const fields = [
  { name: "firstName", label: "First name", placeholder: "e.g. Kelechi" },
  { name: "lastName", label: "Last name", placeholder: "e.g. Obi" },
  { name: "email", label: "Email", type: "email", placeholder: "name@example.com" },
  { name: "phone", label: "Phone number", type: "tel", placeholder: "0803 000 0000" },
  { name: "address", label: "Address", placeholder: "Street, city", wide: true },
  { name: "password", label: "Password", type: "password", placeholder: "At least 8 characters" },
];

const AddUser = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = {};
    [...fields.map((f) => f.name), "state"].forEach((name) => {
      if (!String(form[name] ?? "").trim()) found[name] = "This field is required.";
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    toast.info("Nothing was saved: adding users isn't connected to the API yet.");
  };

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  return (
    <>
      <PageHeader title="Add user" back={{ to: "/admin/users", label: "All users" }} />
      <SampleDataNotice>This form doesn't create accounts yet. It will once the backend endpoint is connected.</SampleDataNotice>
      <form onSubmit={handleSubmit} noValidate className="max-w-3xl">
        <Card>
          <CardHeader title="User details" />
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {fields.map((f) => (
              <Field key={f.name} label={f.label} htmlFor={f.name} error={errors[f.name]} required className={f.wide ? "sm:col-span-2" : ""}>
                <Input id={f.name} type={f.type || "text"} placeholder={f.placeholder} value={form[f.name] || ""} onChange={(e) => set(f.name, e.target.value)} error={errors[f.name]} />
              </Field>
            ))}
            <Field label="State" htmlFor="state" error={errors.state} required>
              <Select id="state" value={form.state || ""} onChange={(e) => set("state", e.target.value)} error={errors.state}>
                <option value="">Select a state</option>
                {listStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
            <Button variant="secondary" onClick={() => navigate("/admin/users")}>
              Cancel
            </Button>
            <Button type="submit">Add user</Button>
          </div>
        </Card>
      </form>
    </>
  );
};

export default AddUser;
