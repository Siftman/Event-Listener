import { resolve } from "path";


function retry(func, retries = 5, delay = 1000) {
    return async function (...args: any[]) {
        let attempts = 0;
        while (attempts < retries) {
            try {
                return await func(...args);
            }
            catch (error) {
                attempts++;
                if (attempts >= retries ){
                    throw new Error('fail after retries.')
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}