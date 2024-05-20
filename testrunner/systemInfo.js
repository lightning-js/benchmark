import os from 'os'

// gets CPU model, CPU cores and memory
export const getSystemInfo = () => {
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCores = cpus.length;

    // get total memory in GB
    const memory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

    return {
        cpuModel,
        cpuCores,
        memory
    }
}

export const getOSInfo = () => {
    return {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch()
    }
}