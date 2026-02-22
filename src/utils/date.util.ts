import moment from "moment";

export const compareDate = (date1: Date, date2: Date) => {
  let res = 0;
  if(moment(date1).startOf('date').isBefore(moment(date2).startOf('date').toDate())){
    res = -1;
  }
  else if(moment(date1).startOf('date').isAfter(moment(date2).endOf('date').toDate())){
    res = 1;
  }
  return res;
};