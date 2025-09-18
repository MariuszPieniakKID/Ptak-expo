const pad = (num: number) => num.toString().padStart(2, "0");

export function formatDateRange({
  endDate,
  startDate,
}: {
  startDate: string;
  endDate: string;
}): {
  date: string;
  hours: string;
} {
  const validStartDate = new Date(startDate);
  const validEndDate = new Date(endDate);

  const day = pad(validStartDate.getDate());
  const month = pad(validStartDate.getMonth() + 1);
  const year = validStartDate.getFullYear();

  const startHours = pad(validStartDate.getHours());
  const startMinutes = pad(validStartDate.getMinutes());

  const endHours = pad(validEndDate.getHours());
  const endMinutes = pad(validEndDate.getMinutes());

  return {
    date: `${day}.${month}.${year}`,
    hours: `${startHours}:${startMinutes} - ${endHours}:${endMinutes}`,
  };
}

export function formatDateRangeDays({
  endDate,
  startDate,
}: {
  startDate: string;
  endDate: string;
}): string {
  const validStartDate = new Date(startDate);
  const validEndDate = new Date(endDate);

  const day = (d: Date) => d.getDate();
  const month = (d: Date) => d.getMonth() + 1;
  const year = (d: Date) => d.getFullYear();

  return `${day(validStartDate)}.${month(validStartDate)}.${year(
    validStartDate
  )} - ${day(validEndDate)}.${month(validEndDate)}.${year(validEndDate)}`;
}

export function formatDateForDisplay({date}: {date: string}): {
  day: string;
  month: string;
} {
  const validDate = new Date(date);

  const day = validDate.getDate().toString();
  const month = validDate.toLocaleString("pl-PL", {month: "short"});

  return {day, month};
}
