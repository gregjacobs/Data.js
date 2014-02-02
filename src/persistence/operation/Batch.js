/*global define */
define( [
	'jquery',
	'lodash',
	'Class',
	
	'data/persistence/operation/Deferred'
], function( jQuery, _, Class, OperationDeferred ) {
	
	/**
	 * @class data.persistence.operation.Batch
	 * 
	 * Represents one or more persistence {@link data.persistence.operation.Operation Operations} as a whole.
	 * 
	 * The OperationBatch is a Deferred object. It {@link #resolve resolves} itself when all of the
	 * {@link #operations} that it has been configured with resolve themselves. See {@link data.persistence.operation.Operation}
	 * for more details on Deferred objects, the states that it may be in, and which handler functions are called
	 * when the Deferred changes state.
	 * 
	 * Note that OperationBatch is also an immutable object, which must be configured with the Operations that it is
	 * to keep track of. When all Operations are complete, the OperationBatch {@link #resolve resolves} itself.
	 */
	var OperationBatch = Class.create( {
		
		/**
		 * @cfg {data.DataComponent} dataComponent (required)
		 * 
		 * The DataComponent ({@link data.Model Model) or {@link data.Collection Collection} that the OperationBatch is
		 * operating on.
		 */
		
		/**
		 * @cfg {data.persistence.operation.Operation[]} operations (required)
		 * 
		 * The Operations to keep track of.
		 */
		
		
		/**
		 * @protected
		 * @property {data.persistence.operation.Deferred} deferred
		 * 
		 * The OperationDeferred instance for the OperationBatch. This Deferred is resolved when all
		 * {@link #operations} have completed.
		 */
		
		
		/**
		 * @constructor
		 * @param {Object} cfg The configuration options for this class, provided in an Object (map).
		 */
		constructor : function( cfg ) {
			_.assign( this, cfg );
			
			// <debug>
			if( !this.dataComponent ) throw new Error( "`dataComponent` cfg required" );
			if( !this.operations ) throw new Error( "`operations` cfg required" );
			// </debug>
			
			this.deferred = new OperationDeferred();
			
			this.subscribeOperationHandlers( this.operations );
		},
		
		
		/**
		 * Subscribes promise handlers to the individual {@link #operations}, which subsequently interact with
		 * this OperationBatch's {@link #deferred}.
		 * 
		 * @protected
		 * @param {data.persistence.operation.Operation[]} operations
		 */
		subscribeOperationHandlers : function( operations ) {
			// Set up handlers to call `progress` handlers of the OperationBatch when each operation completes or 
			// reports progress themselves
			var notify = _.bind( this.notify, this );
			_.forEach( operations, function( operation ) { operation.progress( notify ).done( notify ); } );
			
			// Resolve the internal Deferred when all operations have completed, or reject it if one has errored.
			jQuery.when.apply( jQuery, operations )
				.done( _.bind( this.resolve, this ) )
				.fail( _.bind( this.reject, this ) );
		},
		
		
		/**
		 * Retrieves the {@link #operations} in the OperationBatch.
		 * 
		 * @return {data.persistence.operation.Operation[]}
		 */
		getOperations : function() {
			return this.operations;
		},
		
		
		// -----------------------------------
		
		// OperationBatch's Deferred/State interface
		
		
		/**
		 * Marks the OperationBatch as successful, and calls all {@link #done} handlers of the OperationBatch's deferred.
		 * This includes `done` handlers set using the {@link #then} method.
		 * 
		 * {@link #done} handlers are called with two arguments:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this OperationBatch is operating on.
		 * - **operationBatch** (OperationBatch): This OperationBatch object.
		 * 
		 * @protected
		 */
		resolve : function() {
			this.deferred.resolve( this.dataComponent, this );
		},
		
		
		/**
		 * Marks the OperationBatch as having errored, and calls all {@link #fail} handlers of the OperationBatch's deferred.
		 * This includes `fail` handlers set using the {@link #then} method.
		 * 
		 * {@link #fail} handlers are called with two arguments:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this OperationBatch is operating on.
		 * - **operationBatch** (OperationBatch): This OperationBatch object.
		 * 
		 * @protected
		 */
		reject : function() {
			this.deferred.reject( this.dataComponent, this );
		},
		
		
		/**
		 * Calls {@link #progress} handlers of the OperationBatch.
		 * 
		 * {@link #progress} handlers are called with two arguments:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this OperationBatch is operating on.
		 * - **operationBatch** (OperationBatch): This OperationBatch object.
		 * 
		 * @protected
		 */
		notify : function() {
			this.deferred.notify( this.dataComponent, this );
		},
		
		
		/**
		 * Aborts (cancels) the OperationBatch, if it is still in progress. The {@link data.DataComponent DataComponent}
		 * ({@link data.Model} or {@link data.Collection}) will ignore the result of the Operations, even if they
		 * ends up completing at a later time. 
		 * 
		 * This method calls each of the incomplete operations' {@link data.persistence.operation.Operation#abort abort}
		 * method. See {@link data.persistence.operation.Operation#abort} for more details.
		 *  
		 * This method may only be useful for {@link data.persistence.operation.Load LoadOperations}, as it may cause 
		 * {@link data.persistence.operation.Save Save} and {@link data.persistence.operation.Destroy Destroy}
		 * operations to leave the backing persistence medium in an inconsistent state. However, it is provided
		 * if say, a retry is going to be performed and the previous operation should be aborted on the client-side.
		 * 
		 * {@link #cancel} handlers are called with two arguments:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that the OperationBatch is operating on.
		 * - **operationBatch** (OperationBatch): This OperationBatch object.
		 */
		abort : function() {
			if( !this.isComplete() ) {
				this.deferred.abort( this.dataComponent, this );
				
				_.forEach( this.operations, function( operation ) { operation.abort(); } );
			}
		},
		
		
		/**
		 * Determines if the OperationBatch itself was successful. In order to be considered successful, all of the OperationBatch's 
		 * {@link #operations} must have completed successfully.
		 * 
		 * @return {Boolean}
		 */
		wasSuccessful : function() {
			return ( this.state() === 'resolved' );
		},
		
		
		/**
		 * Determines if the OperationBatch failed to complete successfully. If any of the {@link #operations}
		 * have errored, this method returns `true`.
		 * 
		 * @return {Boolean}
		 */
		hasErrored : function() {
			return ( this.state() === 'rejected' );
		},
		
		
		/**
		 * Determines if the OperationBatch was aborted (via the {@link #abort} method).
		 * 
		 * @return {Boolean}
		 */
		wasAborted : function() {
			return ( this.state() === 'aborted' );
		},
		
		
		/**
		 * Determines if the OperationBatch has been completed. This means that all {@link #operations} have been completed,
		 * and the {@link #dataComponent} has processed their results.
		 * 
		 * @return {Boolean} `true` if all {@link #operations} are complete, `false` if any are not yet complete.
		 */
		isComplete : function() {
			return ( this.state() !== 'pending' );
		},
		
		
		
		// -----------------------------------
		
		// Promise interface

		/**
		 * Returns the OperationBatch itself (this object). 
		 * 
		 * This method is purely for compatibility with jQuery's Promise API, and is also for methods like 
		 * `jQuery.when()`, which uses the existence of this method as a duck-type check in order to 
		 * determine if a Deferred or Promise object has been passed to it.  
		 * 
		 * @return {data.persistence.operation.Batch} This OperationBatch object.
		 */
		promise : function() {
			return this;
		},
		
		
		/**
		 * Determines the state of the OperationBatch's {@link #deferred} object. This method is here for compatibility with 
		 * jQuery's Deferred/Promise interface.
		 * 
		 * This method will return one of the following values:
		 * - **"pending"**: The OperationDeferred object is not yet in a completed state (neither "rejected", "resolved", nor 
		 *   "aborted").
		 * - **"resolved"**: The OperationDeferred object is in its 'resolved' state, when the OperationBatch has completed
		 *   {@link #wasSuccessful successfully}.
		 * - **"rejected"**: The OperationDeferred object is in its 'rejected' state, when the OperationBatch has 
		 *   {@link #hasErrored errored}.
		 * - **"aborted"**: The OperationDeferred object is in its 'aborted' state, when the OperationBatch has been
		 *   {@link #wasAborted aborted}.
		 * 
		 * @return {String} See return values, above.
		 */
		state : function() {
			return this.deferred.state();
		},
		
		
		/**
		 * Adds a handler for when the OperationBatch has made progress. Progress is defined as one of the OperationBatch's
		 * {@link #operations} having been completed successfully. 
		 * 
		 * Note that the OperationBatch shouldn't necessarily be considered "complete" if all of its {@link #operations} have completed 
		 * successfully. The OperationBatch may still be in an "in progress" state if its {@link #dataComponent} ({@link data.Model Model} 
		 * or {@link data.Collection Collection}) has not yet processed the OperationBatch's results. (For instance, the 
		 * {@link #dataComponent} may be waiting for other Operations to complete alongside this one, before it will process the 
		 * result.) Therefore, do not rely on the completion of all {@link #operations} in order to consider the OperationBatch "complete."
		 * 
		 * 
		 * Handlers are called with the following arguments when the OperationBatch has been notified of progress (i.e. one
		 * of its requests has been completed):
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this OperationBatch is operating on.
		 * - **operation** (OperationBatch): This OperationBatch object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		progress : function( handlerFn ) {
			this.deferred.progress( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for when the OperationBatch has completed successfully.
		 * 
		 * Handlers are called with the following two arguments when the OperationBatch completes successfully:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that the OperationBatch is operating on.
		 * - **operation** (OperationBatch): This OperationBatch object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		done : function( handlerFn ) {
			this.deferred.done( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for if the OperationBatch fails to complete successfully.
		 * 
		 * Handlers are called with the following two arguments when the OperationBatch fails to complete successfully:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that the OperationBatch is operating on.
		 * - **operation** (OperationBatch): This OperationBatch object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		fail : function( handlerFn ) {
			this.deferred.fail( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for if the OperationBatch has been {@link #abort aborted}.
		 * 
		 * Handlers are called with the following two arguments when the OperationBatch has been aborted (canceled):
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that the OperationBatch is operating on.
		 * - **operation** (OperationBatch): This OperationBatch object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		cancel : function( handlerFn ) {
			this.deferred.cancel( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds handler functions for if the OperationBatch completes successfully, fails to complete successfully, and when notified
		 * that progress has been made.
		 * 
		 * Note: This method does *not* support jQuery's "filtering" functionality.
		 * 
		 * Handlers are called with the following two arguments when the OperationBatch has completed successfully or has failed:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that the OperationBatch is operating on.
		 * - **operation** (OperationBatch): This OperationBatch object.
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
		 * Adds a handler for when the OperationBatch completes, regardless of success or failure.
		 * 
		 * Handlers are called with the following two arguments when the OperationBatch has completed successfully, has failed,
		 * or has been aborted (canceled):
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that the OperationBatch is operating on.
		 * - **operation** (OperationBatch): This OperationBatch object.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		always : function( handlerFn ) {
			this.deferred.always( handlerFn );
			return this;
		}
		
	} );
	
	return OperationBatch;
		
} );
	