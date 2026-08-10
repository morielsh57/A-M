import { Select } from 'antd';
import './AppSelect.scss';

export interface IAppSelectOption {
  value: string | number;
  label: string;
  subtitle?: string;
  searchLabel?: string;
  disabled?: boolean;
}

interface AppSelectProps {
  id?: string;
  value?: string | number | null;
  options: IAppSelectOption[];
  placeholder?: string;
  className?: string;
  popupClassName?: string;
  searchSelect?: boolean;
  disabled?: boolean;
  onChange: (value: string | number) => void;
  onSearch?: (value: string) => void;
  onBlur?: () => void;
}

const AppSelect = ({
  id,
  value,
  options,
  placeholder,
  className,
  popupClassName,
  searchSelect = false,
  disabled = false,
  onChange,
  onSearch,
  onBlur,
}: AppSelectProps) => {
  const normalizedOptions = options.map((option) => ({
    value: option.value,
    disabled: option.disabled,
    searchLabel: option.searchLabel ?? `${option.label}`,
    selectLabel: option.label,
    label: (
      <div className="app-select-option">
        <span className="app-select-option-title">{option.label}</span>
        {option.subtitle ? (
          <span className="app-select-option-subtitle">{option.subtitle}</span>
        ) : null}
      </div>
    ),
  }));

  const mergedClassName = ['app-select', className].filter(Boolean).join(' ');
  const mergedPopupClassName = ['app-select-dropdown', popupClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <Select
      id={id}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      className={mergedClassName}
      popupClassName={mergedPopupClassName}
      options={normalizedOptions}
      showSearch={searchSelect}
      optionFilterProp={searchSelect ? 'searchLabel' : undefined}
      optionLabelProp="selectLabel"
      onSearch={searchSelect ? onSearch : undefined}
      onChange={(nextValue) => onChange(nextValue as string | number)}
      onBlur={onBlur}
      getPopupContainer={(triggerNode) => triggerNode.parentElement ?? document.body}
    />
  );
};

export default AppSelect;
