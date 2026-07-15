import React, { forwardRef } from 'react';
interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}
const CONTROL_CLASS = [
'w-full appearance-none rounded-xl border bg-canvas px-3.5 py-2.5 text-sm text-ink',
'outline-none transition-all duration-200 placeholder:text-ink/35',
'focus:bg-white focus:ring-4 focus:ring-maroon/10'].
join(' ');
export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  icon,
  children
}: FieldProps) {
  return (
    <div className="w-full">
      <label
        htmlFor={htmlFor}
        className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink/70">
        
        {icon && <span className="text-maroon">{icon}</span>}
        {label}
        {required && <span className="text-maroon">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink/45">{hint}</p>}
      {error &&
      <p className="mt-1.5 text-xs font-semibold text-red-600" role="alert">
          {error}
        </p>
      }
    </div>);

}
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ hasError, className = '', ...props }, ref) {
    return (
      <input
        ref={ref}
        className={[
        CONTROL_CLASS,
        hasError ?
        'border-red-300 focus:border-red-400 focus:ring-red-100' :
        'border-black/5 focus:border-maroon/40',
        className].
        join(' ')}
        {...props} />);


  }
);
interface SelectInputProps extends
  React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}
export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  function SelectInput({ hasError, className = '', children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={[
          CONTROL_CLASS,
          'pr-10',
          hasError ?
          'border-red-300 focus:border-red-400 focus:ring-red-100' :
          'border-black/5 focus:border-maroon/40',
          className].
          join(' ')}
          {...props}>
          
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true">
          
          <path
            d="m4 6 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round" />
          
        </svg>
      </div>);

  }
);
