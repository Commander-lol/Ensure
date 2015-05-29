(function () {
    'use strict';
    var Promise,
        Defer;

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
                    defer: defer
                });
            }

            if (rejectCall) {
                this.rejectCalls.push({
                    func: rejectCall,
                    defer: defer
                });
            }

            if (this.status === 'resolved') {
                this.callback({
                    func: resolveCall,
                    defer: defer
                }, this.data);
            } else if (this.status === 'rejected') {
                this.callback({
                    func: rejectCall,
                    defer: defer
                }, this.error);
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
                var res = callbackDef.func(result);
                if (res instanceof Promise) {
                    callbackDef.defer.bind(res);
                } else {
                    callbackDef.defer.resolve(res);
                }
            }, 0);
        }
    };

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

    window.E = function (data) {
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
    window.E.defer = Defer;
}());
