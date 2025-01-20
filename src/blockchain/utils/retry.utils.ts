
export const retry = async <T>(func: () => Promise<T>, max_retries = 5, delay = 1000): Promise<T> => {
    let retries = 0;
    while (retries < max_retries) {
        try {
            console.log('...IT DOES WORK...')
            return await func();
        }
        catch (error) {
            retries++;
            if (retries === max_retries) {
                throw new Error('retried exceeded limit!')
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}