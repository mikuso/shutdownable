const SHUTDOWN_WAIT_SET = Symbol("SHUTDOWN_WAIT_SET");
const SHUTDOWN_WAIT_FLAG = Symbol("SHUTDOWN_WAIT_FLAG");

class ShuttingDownError extends Error {};

const noop = function() {};

function shutdownable(clas, methods) {
    const proto = clas.prototype;
    const waitSet = new Set();

    for (const methodName of methods) {
        const oldMethod = proto[methodName];
        proto[methodName] = async function(...args) {
            if (this[SHUTDOWN_WAIT_FLAG]) {
                throw new ShuttingDownError("Shutting down");
            }
            if (!this[SHUTDOWN_WAIT_SET]) {
                this[SHUTDOWN_WAIT_SET] = new Set();
            }
            const promise = oldMethod.call(this, ...args);
            this[SHUTDOWN_WAIT_SET].add(promise);
            promise.finally(() => this[SHUTDOWN_WAIT_SET].delete(promise));
            return promise;
        };
    }

    const oldShutdown = proto.shutdown ?? noop;
    proto.shutdown = async function(...args) {
        this[SHUTDOWN_WAIT_FLAG] = true;
        if (this[SHUTDOWN_WAIT_SET]) {
            await Promise.all(Array.from(this[SHUTDOWN_WAIT_SET].values()));
            this[SHUTDOWN_WAIT_SET] = null;
        }
        return await oldShutdown.call(this, ...args);
    }
}

shutdownable.ShuttingDownError = ShuttingDownError;

module.exports = shutdownable;
