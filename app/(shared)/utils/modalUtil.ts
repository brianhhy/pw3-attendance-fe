export const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
};

export const handlePhoneNumberChange = (
  value: string,
  onChange: (formattedValue: string) => void
): void => {
  const formatted = formatPhoneNumber(value);
  onChange(formatted);
};

