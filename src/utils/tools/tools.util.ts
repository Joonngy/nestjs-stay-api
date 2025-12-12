export const promiseDelay = async (t: number) => {
    await new Promise((r) => setTimeout(r, t));
};
