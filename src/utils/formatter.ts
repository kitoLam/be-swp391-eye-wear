import moment from "moment-timezone";

export const formatDateToString = (date: Date, format = "HH:mm:ss DD/MM/YYYY"): string => {
  return moment(date).tz("Asia/Ho_Chi_Minh").format(format);
}
export const formatNumberToVND = (number: number) => {
  return number.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}