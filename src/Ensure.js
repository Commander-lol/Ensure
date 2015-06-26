(function (target) {
    'use strict';
    var Promise,
        Defer,
        exports;

    Promise = function () {
        this.resolveCalls = [];
        this.rejectCalls = [];
    };

    Promise.prototype = {
        resolveCalls: null,
        rejectCalls: null,
        status: 'pending',
        error: null,

        /**
         * Add things that should happen when the promise is
         * resolved, similar to event listeners for "resolved"
         * and "rejected" events respectively
         * @param   {Function} resolveCall Will be called if the
         *                               promise is resolved
         * @param   {Function} rejectCall  Will be called if the
         *                               promise is rejected
         * @returns {Promise}    A new Promise object that allows
         *                       chaining of async calls
         */
        then: function (resolveCall, rejectCall) {
            var defer = new Defer();

            if (resolveCall) {
                this.resolveCalls.push({
                    func: resolveCall,
                    defer: defer,
                    multiparam: false
                });
            }

            if (rejectCall) {
                this.rejectCalls.push({
                    func: rejectCall,
                    defer: defer,
                    multiparam: false
                });
            }

            if (this.status === 'resolved') {
                this.callback({
                    func: resolveCall,
                    defer: defer,
                    multiparam: false
                }, this.data);
            } else if (this.status === 'rejected') {
                this.callback({
                    func: rejectCall,
                    defer: defer,
                    multiparam: false
                }, this.error);
            }

            return defer.promise;
        },

        /**
         * Tells the callback to treat the result being passed to it
         * as an array of parameters instead of a single argument. Doesn't
         * support rejection callbacks, as it would make no sense - only the
         * error is passed to rejections.
         * @param   {Function} resolveCall The callback that will do things with multiple
         *                               parameters. One parameter will need to be declared
         *                               for each expected element in the resolved array.
         * @returns {Promise}  A Promise object for chaining
         */
        spread: function (resolveCall) {
            var defer = new Defer();

            this.resolveCalls.push({
                func: resolveCall,
                defer: defer,
                multiparam: true
            });

            if (this.status === 'resolved') {
                this.callback({
                    func: resolveCall,
                    defer: defer,
                    multiparam: true
                }, this.data);
            }

            return defer.promise;
        },

        /**
         * Performs callback functions, either by binding
         * a returned promise to the callback's defer, or
         * by resolving the callback with the return value
         * @param {Object} callbackDef The callback definition, as created by .then()
         * @param {Any}    result      The data to pass to the callback function
         */
        callback: function (callbackDef, result) {
            window.setTimeout(function () {
                var res = callbackDef.multiparam ? callbackDef.func.apply(callbackDef.func, result) : callbackDef.func.call(callbackDef.func, result);
                if (res instanceof Promise) {
                    callbackDef.defer.bind(res);
                } else {
                    callbackDef.defer.resolve(res);
                }
            }, 0);
        }
    };

    /**
     * Creates a wrapper for a promise that allows it to be resolved at a later point
     */
    Defer = function () {
        this.promise = new Promise();
    };

    Defer.prototype = {
        promise: null,
        /**
         * Resolves the deffered promise with the given value, triggering
         * the sequence of resolve callbacks
         * @param {Any} data The data that will be passed to all resolve callbacks
         */
        resolve: function (data) {
            var promise = this.promise;
            promise.data = data;
            promise.status = 'resolved';
            promise.resolveCalls.forEach(function (callbackDef) {
                promise.callback(callbackDef, data);
            });
        },

        /**
         * Rejects the deffered promise with the given error, triggering
         * the sequence of reject callbacks
         * @param {Error} error The error that will be passed to all reject callbacks
         */
        reject: function (error) {
            var promise = this.promise;
            promise.error = error;
            promise.status = 'rejected';
            promise.rejectCalls.forEach(function (callbackDef) {
                promise.callback(callbackDef, error);
            });
        },

        /**
         * Causes this Defer to act like the target promise, resolving
         * when the target resolves and rejecting when the target rejects
         * @param {Promise} promise The target promise
         */
        bind: function (promise) {
            var that = this;
            promise.then(function (res) {
                that.resolve(res);
            }, function (err) {
                that.reject(err);
            });
        }
    };


    /**
     * The exports function is the public interface to Ensure. The function
     * itself creates a promise that is automatically resolved/rejected with
     * the passed parameter
     * @param   {Any}     data The data or error to apply to the promise. If
     *                       data is an Error, p will be a rejection, whereas
     *                       it will be a resolution if data is any other object.
     *                       If data is not provided, this function will return
     *                       a raw promise that has not been modified from its
     *                       default state.
     * @returns {Promise} A new Promise object that has had the given data applied
     *                    to it, or an undecided Promise if no data was provided.
     */
    exports = function (data) {
        var p = new Promise();
        if (data !== null && typeof (data) !== 'undefined') {
            if (data.name && data.name.indexOf("Error") > -1) {
                p.error = data;
                p.status = 'rejected';
            } else {
                p.data = data;
                p.status = 'resolved';
            }
        }

        return p;
    };
    exports.defer = Defer;

    target.E = exports;
}(window.EnsureTarget || window));
