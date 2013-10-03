/*global define */
define( [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @class data.persistence.operation.Promise
	 * 
	 * Promise object which is returned to clients to allow them to respond to the completion of an 
	 * {@link data.persistence.operation.Operation Operation}. The Operation is the akin to a jQuery Deferred,
	 * while this object is akin to the Deferred's Promise object.
	 * 
	 * This class is instantiated from a parent {@link data.persistence.operation.Operation Operation} object, and provides
	 * the interface that is available to client code, which is a "view" of the parent Operation. This interface includes 
	 * most of the jQuery Promise interface, which includes: {@link #done}, {@link #fail}, {@link #then}, and {@link #always}.
	 * See http://api.jquery.com/deferred.promise/ for details on these methods.
	 * 
	 * This class also includes an extra method, {@link #abort}, which may be used to abort (cancel) the parent Operation.
	 * Handlers for the Operation being canceled may be added with the {@link #cancel} method.
	 */
	var OperationPromise = Class.create( {
		
		/**
		 * @cfg {data.persistence.operation.Operation} operation
		 * 
		 * The Operation that this Promise is a view of.
		 */
		
		
		/**
		 * Creates an OperationPromise instance.
		 * 
		 * @constructor
		 * @param {Object} [cfg] The configuration options for this class.
		 */
		constructor : function( cfg ) {
			_.assign( this, cfg );
			
			// <debug>
			if( !this.operation ) throw new Error( "`operation` cfg required" );
			// </debug>
		},
		
		
		/**
		 * Aborts the parent Operation of this OperationPromise, if it is still in progress.
		 */
		abort : function() {
			this.operation.abort();
		},
		
		
		// -----------------------------------
		
		// Promise interface

		/**
		 * Determines the state of the Operation. This method is here for compatibility with jQuery's 
		 * Deferred/Promise interface.
		 * 
		 * This method will return one of the following values:
		 * - **"pending"**: The Operation is not yet in a completed state (neither "rejected" nor "resolved").
		 * - **"resolved"**: The Operation is in the resolved state (i.e. the Operation was {@link #wasSuccessful successful}).
		 * - **"rejected"**: The Operation is in the rejected state (i.e. when the Operation has {@link #hasErrored errored}).
		 * 
		 * @return {String} See return values, above.
		 */
		state : function() {
			return this.operation.state();
		},
		
		
		/**
		 * Adds a handler for when the Operation has made some progress.
		 * 
		 * Handlers are called with the following two arguments when the Operation has been notified of progress (i.e. one
		 * of its requests has been completed):
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		progress : function( handlerFn ) {
			this.operation.progress( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for when the Operation has completed successfully.
		 * 
		 * Handlers are called with the following two arguments when the Operation completes successfully:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		done : function( handlerFn ) {
			this.operation.done( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for if the Operation fails to complete successfully.
		 * 
		 * Handlers are called with the following two arguments when the Operation fails to complete successfully:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		fail : function( handlerFn ) {
			this.operation.fail( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for if the Operation has been canceled, via the {@link #abort} method.
		 * 
		 * Handlers are called with the following two arguments when the Operation has been canceled (aborted):
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		cancel : function( handlerFn ) {
			this.operation.cancel( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds handler functions for if the Operation completes successfully, or fails to complete successfully.
		 * 
		 * Note: This method does not support jQuery's "filtering" functionality.
		 * 
		 * Handlers are called with the following two arguments when the Operation has completed successfully or has failed:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 * 
		 * @param {Function} successHandlerFn
		 * @param {Function} failureHandlerFn
		 * @chainable
		 */
		then : function( successHandlerFn, failureHandlerFn ) {
			this.operation.then( successHandlerFn, failureHandlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for when the Operation completes, regardless of success or failure.
		 * 
		 * Handlers are called with the following two arguments when the Operation has completed successfully, has failed,
		 * or has been canceled (aborted):
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		always : function( handlerFn ) {
			this.operation.always( handlerFn );
			return this;
		},
		
		
		/**
		 * Returns the OperationPromise itself (this object). 
		 * 
		 * This method is purely for compatibility with jQuery's Promise API, and is also for methods like 
		 * `jQuery.when()`, which uses the existence of this method as a duck-type check in order to 
		 * determine if a Deferred or Promise object has been passed to it.  
		 * 
		 * @return {data.persistence.operation.Promise} This OperationPromise object.
		 */
		promise : function() {
			return this;
		}
		
	} );
	
	return OperationPromise;
	
} );