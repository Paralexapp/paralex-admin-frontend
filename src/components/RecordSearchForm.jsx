import { useState } from 'react';
import { PiMagnifyingGlass } from 'react-icons/pi';
import { Card } from './ui/Card';
import { Field, Input, Select } from './ui/Form';
import Button from './ui/Button';

/**
 * Search form for the external record systems. `fields`: [{ name, label, placeholder, options? }].
 * Calls onSearch with only the filled-in criteria; at least one is required.
 */
export default function RecordSearchForm({ fields, initial = {}, onSearch, loading }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const criteria = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v ?? '').trim()]).filter(([, v]) => v));
    if (!Object.keys(criteria).length) {
      setError('Fill in at least one field to search.');
      return;
    }
    setError('');
    onSearch(criteria);
  };

  const clear = () => {
    setValues({});
    setError('');
  };

  return (
    <Card className="mb-6">
      <form onSubmit={submit} noValidate className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <Field key={f.name} label={f.label} htmlFor={`search-${f.name}`}>
              {f.options ? (
                <Select id={`search-${f.name}`} value={values[f.name] || ''} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
                  <option value="">Any</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  id={`search-${f.name}`}
                  placeholder={f.placeholder}
                  value={values[f.name] || ''}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                />
              )}
            </Field>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className={`text-sm ${error ? 'text-accent-600' : 'text-stone-500'}`}>
            {error || 'Fill in one or more fields. Results must match every field you fill in.'}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={clear}>
              Clear
            </Button>
            <Button type="submit" icon={PiMagnifyingGlass} loading={loading}>
              Search
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
