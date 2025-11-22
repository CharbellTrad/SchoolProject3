export const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  
  const parts = dateOfBirth.split('-');
  if (parts.length !== 3) return 0;
  
  const [day, month, year] = parts.map(Number);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};
