import { Field } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  invalid?: boolean;
  children: ReactNode;
  helperText?: string;
  required?: boolean;
}

export function FormField({
  label,
  error,
  invalid,
  children,
  helperText,
  required,
}: FormFieldProps) {
  return (
    <Field.Root invalid={invalid} required={required}>
      <Field.Label>{label}</Field.Label>
      {children}
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
      {helperText && !error && <Field.HelperText>{helperText}</Field.HelperText>}
    </Field.Root>
  );
}

