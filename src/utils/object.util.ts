export const sortObject = (obj: Record<string, any>) => {
  let sorted: any = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key)) {
          str.push(encodeURIComponent(key)); // Lấy danh sách các key
        }
    }
    str.sort(); // Sắp xếp danh sách key theo alphabet
    for (key = 0; key < str.length; key++) {
        // Build lại object mới dựa trên danh sách key đã sắp xếp
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}