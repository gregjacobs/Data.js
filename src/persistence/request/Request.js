/*global define */
define( [
	'jquery',
	'lodash',
	'Class'
], function( jQuery, _, Class ) {
	
	/**
	 * @abstract
	 * @class data.persistence.request.Request
	 * 
	 * Represents a request for a {@link data.persistence.proxy.Proxy} to carry out. This class represents any CRUD request 
	 * to be performed, passes along any options needed for that request, and accepts any data/state as a result of the 
	 * request from the proxy.
	 * 
	 * Besides this class being a container for a Request's data, it is also a Deferred object, which is how 
	 * {@link data.persistence.proxy.Proxy proxies} interact with it. The {@link #resolve} method should be called when a 
	 * Proxy has completed a Request, or the {@link #reject} method should be called if an error has occurred.
	 * 
	 * Note: This class does not (necessarily) represent an HTTP request. It represents a request to a 
	 * {@link data.persistence.proxy.Proxy Proxy}, which will in turn create/read/update/destroy the model(s) wherever the 
	 * Proxy is written/configured to do so. This may be a server, local storage, etc.
	 * 
	 * ## Subclasses
	 * 
	 * Request's subclasses are split into two distinct implementations:
	 * 
	 * - {@link data.persistence.request.Read}: Represents an Request to read (load) data from persistence storage.
	 * - {@link data.persistence.request.Write}: Represents an Request to write (store) data to persistence storage.
	 *   This includes destroying (deleting) models as well.
	 * 
	 * This class is mainly used internally by the framework for making requests to {@link data.persistence.proxy.Proxy Proxies},
	 * but is provided to client callbacks for when {@link data.Model Model}/{@link data.Collection Collection} requests 
	 * complete, so information can be obtained about the request that took place. The request(s) are available from the 
	 * {@link data.persistence.operation.Operation Operation} object that represents a high level load/save operation
	 * for a {@link data.Model Model}/{@link data.Collection Collection}.
	 */
	var Request = Class.create( {
		abstractClass : true,
		
		
		/**
		 * @cfg {Object} params
		 * 
		 * A map of any parameters to pass along for the Request. These parameters will be interpreted by the
		 * particular {@link data.persistence.proxy.Proxy} that is being used. For example, the 
		 * {@link data.persistence.proxy.Ajax Ajax} proxy appends them as URL parameters for the request.
		 * 
		 * Example:
		 * 
		 *     params : {
		 *         param1: "value1",
		 *         param2: "value2
		 *     }
		 */
		
		
		/**
		 * @private
		 * @property {String} uuid
		 * 
		 * The unique identifier for this Request. This is created lazily upon request. Retrieve with 
		 * {@link #getUuid}.
		 */
		
		/**
		 * @protected
		 * @property {data.persistence.ResultSet} resultSet
		 * 
		 * A ResultSet object which contains any data read by the Request. This object contains any 
		 * returned data, as well as any metadata (such as the total number of records in a paged data set).
		 * This object is provided to the {@link #resolve} method by a {@link data.persistence.proxy.Proxy} when it 
		 * finishes its persistence operation, and can be retrieved via {@link #getResultSet}. Some notes:
		 * 
		 * - For cases of read requests, this object will contain the data that is read by the request.
		 * - For cases of write requests, this object will contain any "update" data that is returned to the
		 *   Proxy when it completes its operation. For example, if a REST server returns the updated
		 *   attributes of a model after it is saved (say, with some computed attributes, or a generated 
		 *   id attribute), then the ResultSet will contain this data.
		 */
		
		/**
		 * @protected
		 * @property {String/Object} error
		 * 
		 * An object or string describing the error that occurred. Set when {@link #reject}
		 * is called.
		 */
		
		
		/**
		 * @protected
		 * @property {jQuery.Deferred} deferred
		 * 
		 * The Deferred object for this Request. This is resolved from the {@link #resolve} method, or rejected
		 * from the {@link #reject} method. 
		 */
		
		
		/**
		 * @constructor
		 * @param {Object} [cfg] Any of the configuration options for this class, in an Object (map).
		 */
		constructor : function( cfg ) {
			_.assign( this, cfg );
			
			this.deferred = new jQuery.Deferred();
		},
		
		
		/**
		 * Retrieves the {@link #uuid unique identifier} for this Request.
		 * 
		 * @return {String} The unique identifier for this Request.
		 */
		getUuid : function() {
			return this.uuid || ( this.uuid = _.uniqueId() );  // Create the uuid lazily if one has not yet been created
		},
		
		
		/**
		 * Retrieves the {@link #params} for this Request. Returns an empty
		 * object if no params were provided.
		 * 
		 * @return {Object}
		 */
		getParams : function() {
			return ( this.params || (this.params = {}) );
		},
		
		
		/**
		 * Retrieves the CRUD action name for the Request.
		 * 
		 * @protected
		 * @abstract
		 * @return {String} One of: 'create', 'read', 'update', 'destroy'
		 */
		getAction : Class.abstractMethod,
		
		
		/**
		 * Resolves the Request as successful. This should be called by the {@link data.persistence.proxy.Proxy Proxy}
		 * that the Request is passed to when the underlying persistence operation has completed successfully.
		 * 
		 * If there is any return data, the Request should be resolved with a {@link data.persistence.ResultSet ResultSet}
		 * which holds it. This object is usually created by a Reader's {@link data.persistence.reader.Reader#read read}
		 * method, which transforms any raw data and prepares it for a Model. This object may be omitted if there is no
		 * return data.
		 * 
		 * @param {data.persistence.ResultSet} [resultSet] A ResultSet object which holds any return data from the Proxy.
		 */
		resolve : function( resultSet ) {
			this.resultSet = resultSet;
			this.deferred.resolve( resultSet );
		},
		
		
		/**
		 * Rejects the Request as errored. This should be called by the {@link data.persistence.proxy.Proxy Proxy}
		 * that the Request is passed to when the underlying persistence operation has failed to complete successfully.
		 * 
		 * If there is an error message or object, it can be provided as the first argument to this method, and will be 
		 * available to clients of the Request.
		 * 
		 * @param {String/Object} [error] An object or string describing the error that occurred.
		 */
		reject : function( error ) {
			this.error = error;
			this.deferred.reject( error );
		},
		
		
		/**
		 * Calls {@link #progress} handlers of the Request.
		 */
		notify : function() {
			this.deferred.notify();
		},
		
		
		/**
		 * Retrieves the {@link data.persistence.ResultSet} containing any data and metadata read by the 
		 * Request. This is set by a {@link data.persistence.proxy.Proxy} when it finishes its routine.  
		 * 
		 * - For cases of read requests, this object will contain the data that is read by the request.
		 * - For cases of write requests, this object will contain any "update" data that is returned to the
		 *   Proxy when it completes its routine. For example, if a REST server returns the updated
		 *   attributes of a model after it is saved (say, with some computed attributes, or a generated 
		 *   id attribute), then the ResultSet will contain that data.
		 * 
		 * @return {data.persistence.ResultSet} The ResultSet read by the Proxy, or `undefined` if one has not 
		 *   been set.
		 */
		getResultSet : function() {
			return this.resultSet;
		},
		
		
		/**
		 * Retrieves any {@link #error} object attached for an errored Request (via 
		 * {@link #reject}).
		 * 
		 * @return {String/Object} The {@link #error} object or string which describes
		 *   the error that occurred for an errored Request. Returns `undefined` if no error
		 *   object has been set.
		 */
		getError : function() {
			return this.error;
		},
		
		
		/**
		 * Determines if the Request completed successfully.
		 * 
		 * @return {Boolean}
		 */
		wasSuccessful : function() {
			return ( this.deferred.state() === 'resolved' );
		},
		
		
		/**
		 * Determines if the Request failed to complete successfully.
		 * 
		 * @return {Boolean}
		 */
		hasErrored : function() {
			return ( this.deferred.state() === 'rejected' );
		},
		
		
		/**
		 * Determines if the Request is complete.
		 * 
		 * @return {Boolean}
		 */
		isComplete : function() {
			return ( this.deferred.state() !== 'pending' );
		},
		
		
		// -----------------------------------
		
		// Promise interface

		/**
		 * Returns the Operation itself (this object). 
		 * 
		 * This method is purely for compatibility with jQuery's Promise API, and is also for methods like 
		 * `jQuery.when()`, which uses the existence of this method as a duck-type check in order to 
		 * determine if a Deferred or Promise object has been passed to it.  
		 * 
		 * @return {data.persistence.operation.Operation} This Operation object.
		 */
		promise : function() {
			return this;
		},
		
		
		/**
		 * Determines the state of the Operation's {@link #deferred} object. This method is here for compatibility with 
		 * jQuery's Deferred/Promise interface.
		 * 
		 * This method will return one of the following values:
		 * - **"pending"**: The OperationDeferred object is not yet in a completed state (neither "rejected", "resolved", nor 
		 *   "aborted").
		 * - **"resolved"**: The OperationDeferred object is in its 'resolved' state, when the Operation has completed
		 *   {@link #wasSuccessful successfully}.
		 * - **"rejected"**: The OperationDeferred object is in its 'rejected' state, when the Operation has 
		 *   {@link #hasErrored errored}.
		 * - **"aborted"**: The OperationDeferred object is in its 'aborted' state, when the Operation has been
		 *   {@link #wasAborted aborted}.
		 * 
		 * @return {String} See return values, above.
		 */
		state : function() {
			return this.deferred.state();
		},
		
		
		/**
		 * Adds a handler for when the Operation has made progress. Progress is defined as one of the Operation's
		 * {@link #requests} having been completed successfully. 
		 * 
		 * Note that the Operation shouldn't necessarily be considered "complete" if all of its {@link #requests} have completed 
		 * successfully. The Operation may still be in an "in progress" state if its {@link #dataComponent} ({@link data.Model Model} 
		 * or {@link data.Collection Collection}) has not yet processed the Operation's results. (For instance, the 
		 * {@link #dataComponent} may be waiting for other Operations to complete alongside this one, before it will process the 
		 * result.) Therefore, do not rely on the completion of all {@link #requests} in order to consider the Operation "complete."
		 * 
		 * 
		 * Handlers are called with the following arguments when the Operation has been notified of progress (i.e. one
		 * of its requests has been completed):
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		progress : function( handlerFn ) {
			this.deferred.progress( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for when the Operation has completed successfully.
		 * 
		 * Handlers are called with the following two arguments when the Operation completes successfully:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that the Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		done : function( handlerFn ) {
			this.deferred.done( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for if the Operation fails to complete successfully.
		 * 
		 * Handlers are called with the following two arguments when the Operation fails to complete successfully:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that the Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		fail : function( handlerFn ) {
			this.deferred.fail( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for if the Operation has been {@link #aborted}.
		 * 
		 * Handlers are called with the following two arguments when the Operation has been aborted (canceled):
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that the Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		cancel : function( handlerFn ) {
			this.deferred.cancel( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds handler functions for if the Operation completes successfully, fails to complete successfully, and when notified
		 * that progress has been made.
		 * 
		 * Note: This method does *not* support jQuery's "filtering" functionality.
		 * 
		 * Handlers are called with the following two arguments when the Operation has completed successfully or has failed:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that the Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 * 
		 * @param {Function} successHandlerFn
		 * @param {Function} [failureHandlerFn]
		 * @param {Function} [progressHandlerFn]
		 * @chainable
		 */
		then : function( successHandlerFn, failureHandlerFn, progressHandlerFn ) {
			this.deferred.then( successHandlerFn, failureHandlerFn, progressHandlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for when the Operation completes, regardless of success or failure.
		 * 
		 * Handlers are called with the following two arguments when the Operation has completed successfully, has failed,
		 * or has been aborted (canceled):
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that the Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		always : function( handlerFn ) {
			this.deferred.always( handlerFn );
			return this;
		}
		
	} );
	
	return Request;
	
} );