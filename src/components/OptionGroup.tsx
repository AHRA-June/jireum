interface Props {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
}

export default function OptionGroup({ label, options, value, onChange }: Props) {
  return (
    <fieldset className="field">
      <legend className="field__label">{label}</legend>
      <div className="options">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`options__chip${value === option ? ' options__chip--selected' : ''}`}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
