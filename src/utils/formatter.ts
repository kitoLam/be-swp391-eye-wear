import moment from "moment";

export const formatDateToString = (date: Date, format = "HH:mm:ss DD/MM/YYYY"): string => {
  return moment(date).format(format);
}
export const formatNumberToVND = (number: number) => {
  return number.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}