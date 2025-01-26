

export const fillGaps = (dataStart: number, loading: { name: string, start: number, finish: number }[]) => {
  let timeLScale = [] as { loaded: boolean, name: string, start: number, finish: number }[]
  // заполним пропуски
  // let dataStart = 0;
  for (let index = 0; index < loading.length; index++) {
    const element = loading[index];
    if (dataStart < element.start) {
      timeLScale.push({ loaded: false, name: "", start: dataStart, finish: element.start - 1 })
      dataStart = element.start;
      timeLScale.push({ loaded: true, name: element.name, start: dataStart, finish: element.finish })
      dataStart = element.finish + 1;
    } else if (dataStart = element.start) {
      timeLScale.push({ loaded: true, name: "", start: dataStart, finish: element.finish })
      dataStart = element.finish + 1;
    } else if (dataStart > element.start) {
      // Колизия
      timeLScale.push({ loaded: true, name: "Конфликт:" + element.name, start: dataStart, finish: element.finish })
      dataStart = element.finish + 1;
    }

  }
  return timeLScale;
}

export const ISOStringToLocalDateTime = (isoDate: string) => {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const localDateTimeToISOString = (localDateTime: string) => {
  const [datePart, timePart] = localDateTime.split('T');
  const [year, month, day] = datePart.split('-');
  const [hours, minutes] = timePart.split(':');
  const localDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}`);
  return localDate.toISOString();

};

export function formatDateTime(date: Date) {
  // if {!date} return "";
  if (date instanceof Date && !isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0, поэтому добавляем 1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } else { return "" }

}

export function formatDate(date: Date) {
  if (date instanceof Date && !isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0, поэтому добавляем 1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } else { return "" }
}

export function padNumberToFourDigits(number: number): string {
  return number.toString().padStart(4, '0');
}

