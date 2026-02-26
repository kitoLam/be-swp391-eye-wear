export const sortObject = (obj: Record<string, any>) => {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();

    keys.forEach((key) => {
        if (obj[key] !== "" && obj[key] !== undefined && obj[key] !== null) {
            sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
        }
    });

    return sorted;
};