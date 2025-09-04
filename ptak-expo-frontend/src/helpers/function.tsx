  // Funkcja mapująca circleColor na circleTextColor
  export const textColorPicker = (circleColor: string): string => {
    switch (circleColor.toLowerCase()) {
      case '#6f87f6':
        return '#FFFFFF'; // biały tekst na #6F87F6
      case '#89f4c9':
        return '#2E2E38'; // ciemny tekst na #89F4C9
      case '#fc8a06':
        return '#FFFFFF'; // biały tekst na #FC8A06
      default:
        return '#000000'; // domyślny kolor tekstu (czarny)
    }
  };


  export function getColorForEvent(eventId: string): string {
  const colors = ["#6f87f6", "#89f4c9", "#fc8a06"];
  const hash = eventId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
 }

 export function getShortListColorForEvent(value: number): string {
  switch (value) {
    case 1:
      return "#6f87f6"; // pierwszy kolor
    case 2:
      return "#89f4c9"; // drugi kolor
    default:
      return "#fc8a06"; // trzeci kolor (dla wszystkich innych wartości)
  }
}

export const getDaysBetweenDates = (startDate: string, endDate: string): string[] => {
  
  const dates = [];
  let currentDate = new Date(startDate);
  const lastDate = new Date(endDate);
  
  // reset time to midnight for consistency (optional)
  currentDate.setHours(0,0,0,0);
  lastDate.setHours(0,0,0,0);

  while (currentDate <= lastDate) {
    // push ISO string or formatted date as needed
    dates.push(currentDate.toISOString().split("T")[0]); 
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};