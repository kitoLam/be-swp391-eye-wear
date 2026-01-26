const numberStr = "0123456789";
export const generateOrderCode = () => {
  let OD = "OD_";
  for (let i = 0; i < 6; i++) {
    OD += numberStr[Math.floor(Math.random() * numberStr.length)];
  }
  OD += new Date().getTime();
  return OD;
};
export const generateInvoiceCode = () => {
  let OD = "HD_";
  for (let i = 0; i < 6; i++) {
    OD += numberStr[Math.floor(Math.random() * numberStr.length)];
  }
  OD += new Date().getTime();
  return OD;
};
export const generateSessionId = () => {
  let SID = "SID";
  for (let i = 0; i < 6; i++) {
    SID += numberStr[Math.floor(Math.random() * numberStr.length)];
  }
  SID += new Date().getTime();
  return SID;
}