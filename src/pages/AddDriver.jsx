import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { listStates } from "../utils/practiceStates";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Field, Input, Select } from "../components/ui/Form";
import FileDrop from "../components/ui/FileDrop";
import Button from "../components/ui/Button";
import { SampleDataNotice } from "../components/ui/States";

const driverFields = [
  { name: "firstName", label: "First name", required: true },
  { name: "lastName", label: "Last name", required: true },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone number", type: "tel" },
  { name: "state", label: "State of residence", select: true },
  { name: "password", label: "Password", type: "password" },
];

const guarantorFields = [
  { name: "guarantorName", label: "Full name" },
  { name: "guarantorPhone", label: "Phone number", type: "tel" },
  { name: "guarantorEmail", label: "Email", type: "email" },
  { name: "guarantorState", label: "State of residence", select: true },
  { name: "guarantorAddress", label: "Address", wide: true },
];

const AddDriver = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ bike: "yes" });
  const [errors, setErrors] = useState({});
  const [image, setImage] = useState(null);

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const renderField = (f) => (
    <Field key={f.name} label={f.label} htmlFor={f.name} error={errors[f.name]} required={f.required} className={f.wide ? "sm:col-span-2" : ""}>
      {f.select ? (
        <Select id={f.name} value={form[f.name] || ""} onChange={(e) => set(f.name, e.target.value)}>
          <option value="">Select a state</option>
          {listStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </Select>
      ) : (
        <Input id={f.name} type={f.type || "text"} value={form[f.name] || ""} onChange={(e) => set(f.name, e.target.value)} error={errors[f.name]} />
      )}
    </Field>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = {};
    if (!form.firstName?.trim()) found.firstName = "Enter a first name.";
    if (!form.lastName?.trim()) found.lastName = "Enter a last name.";
    setErrors(found);
    if (Object.keys(found).length) return;
    toast.info("Nothing was saved: adding drivers needs a backend fix first.");
  };

  return (
    <>
      <PageHeader title="Add driver" back={{ to: "/admin/drivers", label: "All drivers" }} />
      <SampleDataNotice>This form can't be connected yet: the server's "create driver" action currently creates the profile for whoever is signed in (you) instead of the person you enter. It needs a backend fix first.</SampleDataNotice>
      <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Driver" />
            <div className="grid gap-5 p-6 sm:grid-cols-2">{driverFields.map(renderField)}</div>
          </Card>
          <Card>
            <CardHeader title="Guarantor" />
            <div className="grid gap-5 p-6 sm:grid-cols-2">{guarantorFields.map(renderField)}</div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Vehicle" />
            <div className="space-y-5 p-6">
              <Field label="Owns a bike?">
                <div className="flex gap-2">
                  {["yes", "no"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={form.bike === value}
                      onClick={() => set("bike", value)}
                      className={`h-10 flex-1 rounded-lg text-sm font-medium capitalize ring-1 ring-inset transition ${
                        form.bike === value ? "bg-brand-900 text-white ring-brand-900" : "bg-white text-stone-600 ring-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </Field>
              {form.bike === "yes" && (
                <>
                  <Field label="Number of bikes" htmlFor="bikeCount">
                    <Input id="bikeCount" type="number" min="1" max="20" value={form.bikeCount || ""} onChange={(e) => set("bikeCount", e.target.value)} />
                  </Field>
                  <Field label="Bike make" htmlFor="bikeMake">
                    <Input id="bikeMake" placeholder="e.g. Qlink" value={form.bikeMake || ""} onChange={(e) => set("bikeMake", e.target.value)} />
                  </Field>
                </>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="Photo" description="Optional" />
            <div className="p-6">
              <FileDrop file={image} onChange={setImage} />
            </div>
          </Card>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => navigate("/admin/drivers")}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add driver
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};

export default AddDriver;
