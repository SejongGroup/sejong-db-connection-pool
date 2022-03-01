class ProcessQueue {
    constructor(concurrent = 50) {
        this.queue = [];
        this.queproc = [];
        this.conCurrent = 0;
        this.autoRepairCount = 0;
        this.autoRepaired = null;
        this.init(concurrent);
    }

    init(size) {
        for (let i = 0; i < size; i++) {
            this.queproc[i] = true;
        }
    }

    push(active) {
        this.queue.push(active);
        this.start();
    }

    start() {
        for (let i = 0; i < this.queproc.length; i++) {
            if (this.queproc[i] == true) {
                this.queproc[i] = false;
                return this.process(i);
            }
        }
    }

    process(idx) {
        return new Promise(async (resolve) => {
            while (true) {
                if (this.queue.length > 0) {
                    let func = this.queue.shift();
                    await func(idx);
                } else {
                    this.queproc[idx] = true;
                    return resolve();
                }
            }
        });
    }
}

module.exports.ProcessQueue = ProcessQueue;
