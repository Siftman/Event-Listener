
export const retry = async <T>(
    func: () => Promise<T>,
    max_retry = 5,
    default_delay = 1000,
): Promise<T> => {
    let retries = 0;
    let delay = default_delay;

    while (true) {
        try {
            const result = await func();
            return result;
        }
        catch(error) {
            console.log('----here in retry----')
            retries++;
            if(retries >= max_retry) {
                throw new Error(`operation failed after ${max_retry}`)
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

}