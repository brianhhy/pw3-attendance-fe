// 전화번호 포맷팅: 숫자만 추출하고 하이픈 자동 추가
// 예: 01012345678 -> 010-1234-5678
export const formatPhoneNumber = (value: string): string => {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, '');
  
  // 길이에 따라 하이픈 삽입
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
};

// 전화번호 입력 핸들러 (onChange 이벤트용)
export const handlePhoneNumberChange = (
  value: string,
  onChange: (formattedValue: string) => void
): void => {
  const formatted = formatPhoneNumber(value);
  onChange(formatted);
};

