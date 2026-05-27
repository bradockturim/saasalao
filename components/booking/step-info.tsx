"use client";

interface ClientInfo {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface Props {
  value: ClientInfo;
  onChange: (info: ClientInfo) => void;
}

function Field({
  label, id, required, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          placeholder:text-gray-400"
        {...props}
      />
    </div>
  );
}

export function StepInfo({ value, onChange }: Props) {
  function set(key: keyof ClientInfo, val: string) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="space-y-4">
      <Field
        id="name" label="Nome completo" required
        placeholder="Maria Silva"
        value={value.name}
        onChange={(e) => set("name", e.target.value)}
      />
      <Field
        id="phone" label="WhatsApp / Telefone" required
        type="tel"
        placeholder="(11) 99999-9999"
        value={value.phone}
        onChange={(e) => set("phone", e.target.value)}
      />
      <Field
        id="email" label="Email"
        type="email"
        placeholder="seu@email.com (opcional)"
        value={value.email}
        onChange={(e) => set("email", e.target.value)}
      />
      <div className="space-y-1">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Observações
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Alguma preferência ou informação importante..."
          value={value.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            placeholder:text-gray-400 resize-none"
        />
      </div>
    </div>
  );
}
