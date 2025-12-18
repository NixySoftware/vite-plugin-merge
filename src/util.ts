import fs from 'node:fs/promises';

export const exists = async (path: string): Promise<boolean> => {
    try {
        await fs.access(path, fs.constants.F_OK);
        return true;
    } catch (err) {
        if (err !== null && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
            return false;
        }

        throw err;
    }
};
