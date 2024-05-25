export function isValidURL(str: string) {
  const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}

// Helper function to check if a date is within a range
export function isDateValid(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  return date <= today && today.getFullYear() - date.getFullYear() >= 13;
};


export const adjustDate = (date: string | null | undefined) => {
  if (!date) {
    return "";
  }

  const adjustedDate = new Date(date);

  if (isNaN(adjustedDate.getTime())) {
    return "";
  }

  adjustedDate.setMinutes(adjustedDate.getMinutes() - adjustedDate.getTimezoneOffset());

  const year = adjustedDate.getFullYear();
  const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
  const day = String(adjustedDate.getDate()).padStart(2, '0');
  const hours = String(adjustedDate.getHours()).padStart(2, '0');
  const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
  const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};


