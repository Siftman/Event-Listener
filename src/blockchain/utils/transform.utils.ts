// I may change this part later -- I don't like recursive and implicit code!!
export function transformBlockchainData(data: any): any {
    if (data === null || data === undefined) {
        return data;
    }
    if (typeof data === 'bigint') {
        return data.toString();
    }
    if (Array.isArray(data)) {
        return data.map(item => transformBlockchainData(item));
    }
    if(typeof data === 'object') {
        const transformed: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                transformed[key] = transformBlockchainData(data[key]);
            }
        }
        return transformed;
    }
    return data;
}