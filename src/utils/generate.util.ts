const numberStr = "0123456789";
export const generateOrderCode = () => {
  let OD = "OD-";
  for (let i = 0; i < 6; i++) {
    OD += numberStr[Math.floor(Math.random() * numberStr.length)];
  }
  OD += "-" + new Date().getTime();
  return OD;
};
