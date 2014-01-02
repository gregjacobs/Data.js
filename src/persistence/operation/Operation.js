/*global define */
define( [
	'jquery',
	'lodash',
	'Class',
	
	'data/persistence/operation/Deferred',
	'data/persistence/request/Batch'
], function( jQuery, _, Class, OperationDeferred, RequestBatch ) {
	
	/**
	 * @abstract
	 * @class data.persistence.operation.Operation
	 * 
	 * Represents a high level persistence-related operation executed on a {@link data.Model Model} or 
	 * {@link data.Collection Collection} (i.e. a {@link data.DataComponent DataComponent}. This includes load, save, 
	 * or destroy (delete) operations.
	 * 
	 * An Operation is made up of two parts:
	 * 
	 * 1. One or more Proxy {@link data.persistence.request.Request Requests}, which are used to fulfill the operation, and
	 * 2. The state that represents if the Operation has been completed in regards to the {@link #dataComponent} (Model or 
	 *    Collection). It is possible that all of the requests have completed, but the {@link #dataComponent} that the Operation 
	 *    is operating on has not been updated with the result of these requests just yet. The Operation is not considered to be 
	 *    {@link #isComplete complete} until this second part has finished.
	 * 
	 * The Operation object is also a Deferred (Promise) object, which implements the jQuery Promise interface. See the
	 * "Use" section below.
	 * 
	 * 
	 * ## Use
	 * 
	 * Besides the internal use by the framework to facilitate persistence operations, an Operation object is returned from each 
	 * of the persistence-related methods of {@link data.Model Model} and {@link data.Collection Collection}, in order for client
	 * code to observe them. Methods where an Operation object is returned from include:
	 * 
	 * - {@link data.Model#load}
	 * - {@link data.Model#save}
	 * - {@link data.Model#destroy}
	 * - {@link data.Collection#load}
	 * - {@link data.Collection#loadRange}
	 * - {@link data.Collection#loadPage}
	 * - {@link data.Collection#loadPageRange}
	 * - {@link data.Collection#sync}
	 * 
	 * Operation also supports the same interface as standard jQuery promises (see: 
	 * [http://api.jquery.com/category/deferred-object/](http://api.jquery.com/category/deferred-object/)), to allow observers
	 * to respond to the Operation's completion. See {@link #done}, {@link #fail}, {@link #then}, and {@link #always} methods.
	 * 
	 * The Operation object also adds a few extra methods for client usage, centering around the ability to abort the operation:
	 * - {@link #abort}, which aborts (cancels) an in-progress Operation entirely (the Model/Collection which created the Operation object 
	 *   will ignore any result, should one later be provided), and 
	 * - {@link #cancel}, which is used to subscribe one or more handlers for if the Operation has been {@link #abort aborted}.
	 * 
	 * 
	 * ## Sequence of Operations with Collaborators
	 * 
	 * In the following sequence diagram, the Collection's {@link data.Collection#method-load load} method is called. Collection delegates
	 * to an instantiated instance of the Operation class, which then delegates to the {@link #proxy} to execute one or more 
	 * {@link data.persistence.request.Request Requests} (such as if multiple pages of data are being loaded at once). 
	 * 
	 * When all Requests are complete, and the Collection has added the new {@link data.Model Models}, then the Operation is resolved,
	 * causing {@link #done} handlers to be called.
	 * 
	 *       Collection        Operation                 Proxy
	 *           |                 |                       |
	 *     load  |                 |                       |
	 *     ----->X                 |                       |
	 *           |                 |                       |
	 *           | executeRequests |                       |
	 *           X---------------->X                       |
	 *           |                 |     read: request 1   |
	 *           |                 X---------------------->X
	 *           |                 |     read: request 2   |
	 *           |                 X---------------------->X
	 *           |                 |                       |
	 *           |                 |                       |
	 *           |                 |  (request 1 complete) |
	 *           |                 X<----------------------X
	 *           |                 |  (request 2 complete) |
	 *           |                 X<----------------------X
	 *           |                 |                       |
	 *           | (reqs complete) |                       |
	 *           X<----------------X                       |
	 *           |                 |                       |
	 *           
	 *           // ...
	 *           // Models that have been loaded from Proxy are added to Collection
	 *           // ...
	 *           
	 *       Collection        Operation
	 *           |                 |
	 *           |     resolve     |
	 *           X---------------->X
	 *           |                 X-----------> `done` handlers are called on the Operation
	 * 
	 * 
	 * 
	 * ## Deferred Interface
	 * 
	 * The Operation implements the jQuery-style Deferred interface, and is controlled by the DataComponent (Model or Collection)
	 * which instantiates it. The interface, while not the full jQuery Deferred implementation, includes:
	 * 
	 * 1. The ability to attach {@link #done}, {@link #fail}, {@link #cancel}, {@link #then}, and {@link #always} handlers, 
	 *    to detect when the Operation has completed successfully, has failed, or has been aborted (canceled), and
	 * 2. {@link #resolve}, {@link #reject}, and {@link #abort} methods for setting the completion state of the Operation. 
	 *    {@link #resolve Resolve} and {@link #reject} are called by the DataComponent (Model or Collection) which instantiated the 
	 *    Operation, while {@link #abort} may be called by client code to abort (cancel) an Operation.
	 * 
	 *
	 * ## Subclasses
	 * 
	 * Operation's subclasses represent the three varieties of high level operations:
	 * 
	 * - {@link data.persistence.operation.Load}: Represents a Load operation from persistence storage. A Load operation
	 *   uses {@link data.persistence.request.Read Read} request(s) to fulfill its requirements.
	 *   
	 * - {@link data.persistence.operation.Save}: Represents a save operation persistence storage. This may use
	 *   to {@link data.persistence.request.Create Create} and/or {@link data.persistence.request.Update Update} requests
	 *   to fulfill its requirements.
	 *   
	 * - {@link data.persistence.request.Destroy}: Represents a destroy operation on the persistence storage. A Destroy
	 *   operation uses {@link data.persistence.request.Destroy Destroy} request(s) to fulfill its requirements.
	 * 
	 * This class is used internally by the framework for making requests to {@link data.persistence.proxy.Proxy Proxies},
	 * but is provided to client callbacks for when {@link data.Model Model}/{@link data.Collection Collection} persistence
	 * operations complete, so information can be obtained about the request(s) that took place.
	 */
	var Operation = Class.create( {
		abstractClass : true,
		
		
		statics : {
			
			/**
			 * @private
			 * @static
			 * @property {Number} idCounter
			 * 
			 * The counter used to create unique, increasing IDs for Operation instances. 
			 */
			idCounter : 0
			
		},
		
		
		/**
		 * @cfg {data.DataComponent} dataComponent (required)
		 * 
		 * The DataComponent ({@link data.Model Model} or {@link data.Collection Collection}) that the Operation is
		 * operating on.
		 */
		
		/**
		 * @cfg {data.persistence.proxy.Proxy} proxy (required)
		 * 
		 * The Proxy that the {@link #requests} of the Operation should be made to. Running the {@link #executeRequests} 
		 * method will make the requests to this Proxy.
		 */
		
		/**
		 * @cfg {data.persistence.request.Request/data.persistence.request.Request[]} requests
		 * 
		 * One or more Request(s) that make up the Operation. May also be set using {@link #setRequests}
		 * and {@link #addRequest}.
		 */
		
		
		/**
		 * @private
		 * @property {Number} id
		 * 
		 * The Operation's ID. This is a unique number for each Operation that is created, and its value
		 * increases for each new Operation that is instantiated. This means that an Operation object created after 
		 * another Operation will have a higher ID value than the first Operation. 
		 * 
		 * This property of the ID value is used to determine when an older Operation has completed after a newer one.
		 */
		
		/**
		 * @protected
		 * @property {data.persistence.operation.Deferred} deferred
		 * 
		 * The Operation's internal OperationDeferred object, which is resolved, rejected based on the successful completion or
		 * failure of the Operation. The Operation may also be {@link #aborted}.
		 * 
		 * Handlers for the Deferred are attached via the {@link #done}, {@link #fail}, {@link #cancel}, {@link #then}, or 
		 * {@link #always} methods of the Operation itself.
		 */
		
		
		/**
		 * @protected
		 * @property {Boolean} started
		 * 
		 * Flag that is set to `true` when the Operation's {@link #requests} have been started from 
		 * {@link #executeRequests}.
		 * 
		 * Note that it is possible for the Operation to have been started, *and* be {@link #completed}.
		 */
		started : false,
		
		
		/**
		 * Creates a new Operation instance.
		 * 
		 * @constructor
		 * @param {Object} [cfg] Any of the configuration options for this class, in an Object (map).
		 */
		constructor : function( cfg ) {
			_.assign( this, cfg );
			
			// <debug>
			if( !this.dataComponent ) throw new Error( "`dataComponent` cfg required" );
			if( !this.proxy ) throw new Error( "`proxy` cfg required" );
			// </debug>
			
			this.id = ++Operation.idCounter;
			this.deferred = new OperationDeferred();
			this.requestsDeferred = new jQuery.Deferred();  // need a separate Deferred to keep track of the completion of the Operation's Requests
			
			// normalize the `requests` config to an array
			this.requests = ( this.requests ) ? [].concat( this.requests ) : [];
		},
		
		
		/**
		 * Retrieves the Operation's {@link #id}.
		 * 
		 * @return {Number}
		 */
		getId : function() {
			return this.id;
		},
		
		
		/**
		 * Retrieves the {@link data.DataComponent DataComponent} that the Operation is operating on.
		 * This will be either a {@link data.Model Model} or {@link data.Collection Collection}.
		 * 
		 * @return {data.DataComponent}
		 */
		getDataComponent : function() {
			return this.dataComponent;
		},
		
		
		// -----------------------------------
		
		// Requests' state interface
		
		
		/**
		 * Sets (overwrites) all of the {@link #requests} that make up this Operation. 
		 * 
		 * This may only be performed if the Operation has not yet {@link #started}. Any requests set after 
		 * the Operation has been started will be ignored.
		 * 
		 * @param {data.persistence.request.Request[]} requests
		 */
		setRequests : function( requests ) {
			this.requests = requests;
		},
		
		
		/**
		 * Adds one or more requests to this Operation. 
		 * 
		 * This may only be performed if the Operation has not yet {@link #started}. Any requests added 
		 * after the Operation has been started will be ignored.
		 * 
		 * @param {data.persistence.request.Request/data.persistence.request.Request[]} request
		 */
		addRequest : function( request ) {
			this.requests = this.requests.concat( request );  // using concat as it may be multiple requests
		},
		
		
		/**
		 * Retrieves all of the {@link #requests} that make up this Operation. 
		 * 
		 * @return {data.persistence.request.Request[]}
		 */
		getRequests : function() {
			return this.requests;
		},
		
		
		/**
		 * Returns the `jQuery.Promise` object that is resolved when all of the Operation's {@link #requests}
		 * have completed, or is rejected if any of the requests failed. This Operation object is provided as the
		 * first argument to Promise handlers.
		 * 
		 * Note: This same promise object is returned from the {@link #executeRequests} method.
		 * 
		 * @return {jQuery.Promise}
		 */
		getRequestsPromise : function() {
			return this.requestsDeferred.promise();
		},
		
		
		/**
		 * Executes all of the {@link #requests} that make up the Operation.
		 * 
		 * This may only be executed if the Operation has not yet started.
		 * 
		 * @return {jQuery.Promise} A Promise object that is resolved when all of the Operation's {@link #requests}
		 * have completed, or is rejected if any of the requests failed. This Operation object is provided as the
		 * first argument to Promise handlers.
		 */
		executeRequests : function() {
			if( this.started ) return;  // already started, return
			this.started = true;
			
			var me = this,  // for closures
			    proxy = this.proxy,
			    requests = this.requests,
			    batch = new RequestBatch( { requests: requests } ),
			    requestsDeferred = this.requestsDeferred,  // The Operation's requestDeferred
			    notify = _.bind( this.notify, this );
			
			// Add handlers to each Request for the Operation, and then execute all requests
			_.forEach( requests, function( request ) { 
				request.progress( notify ).done( notify );  // notify of "progress" and completion (calls `progress` handlers)
			} );
			proxy.batch( batch );  // execute the requests, via the Batch object
			
			// When all requests are complete, resolve or reject the Operation's `requestsDeferred`
			jQuery.when.apply( jQuery, requests )
				.done( function() { requestsDeferred.resolve( me ); } )
				.fail( function() { requestsDeferred.reject( me ); } );
			
			return requestsDeferred.promise();
		},
		
		
		/**
		 * Retrieves the {@link data.persistence.request.Request Request} objects that are currently
		 * incomplete.
		 * 
		 * @return {data.persistence.request.Request[]} An array of the Requests which have not yet
		 *   completed.
		 */
		getIncompleteRequests : function() {
			return _.filter( this.getRequests(), function( req ) { return !req.isComplete(); } );
		},
		
		
		/**
		 * Retrieves each {@link data.persistence.request.Request Request} object that has completed
		 * successfully.
		 * 
		 * @return {data.persistence.request.Request[]} An array of the Requests which have completed
		 *   successfully.
		 */
		getSuccessfulRequests : function() {
			return _.filter( this.getRequests(), function( req ) { return req.wasSuccessful(); } );
		},
		
		
		/**
		 * Retrieves each {@link data.persistence.request.Request Request} object that has errored.
		 * 
		 * @return {data.persistence.request.Request[]} An array of the Requests which have errored.
		 */
		getErroredRequests : function() {
			return _.filter( this.getRequests(), function( req ) { return req.hasErrored(); } );
		},
		
		
		/**
		 * Determines if all of the {@link #requests} in the Operation are complete. A request is considered
		 * "complete" if it has finished, regardless of if it finished successfully or failed. 
		 * 
		 * @return {Boolean} `true` if all {@link #requests} are complete, `false` if any are not yet complete.
		 */
		requestsAreComplete : function() {
			return _.all( this.getRequests(), function( req ) { return req.isComplete(); } );
		},
		
		
		/**
		 * Determines if all of the {@link #requests} completed successfully. 
		 * 
		 * Note: All {@link #requests} must have completed successfully for this Operation to eventually
		 * be considered successful.
		 * 
		 * @return {Boolean}
		 */
		requestsWereSuccessful : function() {
			return _.all( this.getRequests(), function( req ) { return req.wasSuccessful(); } );
		},
		
		
		/**
		 * Determines if one or more of the Operation's {@link #requests} have failed complete successfully. 
		 * If any of the {@link #requests} have errored, this method returns `true`.
		 * 
		 * @return {Boolean}
		 */
		requestsHaveErrored : function() {
			return _.any( this.getRequests(), function( req ) { return req.hasErrored(); } );
		},
		
		
		// -----------------------------------
		
		// Operation's Deferred/State interface
		
		
		/**
		 * Marks the Operation as successful, and calls all {@link #done} handlers of the Operation's deferred.
		 * This includes `done` handlers set using the {@link #then} method.
		 * 
		 * {@link #done} handlers are called with two arguments:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 */
		resolve : function() {
			this.deferred.resolve( this.dataComponent, this );
		},
		
		
		/**
		 * Marks the Operation as having errored, and calls all {@link #fail} handlers of the Operation's deferred.
		 * This includes `fail` handlers set using the {@link #then} method.
		 * 
		 * {@link #fail} handlers are called with two arguments:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 */
		reject : function() {
			this.deferred.reject( this.dataComponent, this );
		},
		
		
		/**
		 * Calls {@link #progress} handlers of the Operation.
		 * 
		 * {@link #progress} handlers are called with two arguments:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that this Operation is operating on.
		 * - **operationBatch** (Operation): This Operation object.
		 */
		notify : function() {
			this.deferred.notify( this.dataComponent, this );
		},
		
		
		/**
		 * Aborts (cancels) the Operation, if it is still in progress. The {@link data.DataComponent DataComponent}
		 * ({@link data.Model} or {@link data.Collection}) will ignore the result of the Operation, even if it
		 * ends up completing at a later time. 
		 * 
		 * This method call's the {@link #proxy proxy's} {@link data.persistence.proxy.Proxy#abort abort} method with 
		 * each remaining incomplete {@link data.persistence.request.Request Request}, which gives the {@link #proxy}
		 * in use a chance to perform any cleanup or cancelation of the underlying request to the persistent storage
		 * mechanism.
		 * 
		 * This method may only be useful for {@link data.persistence.operation.Load LoadOperations}, as it may cause 
		 * {@link data.persistence.operation.Save Save} and {@link data.persistence.operation.Destroy Destroy}
		 * operations to leave the backing persistence medium in an inconsistent state. However, it is provided
		 * if say, a retry is going to be performed and the previous operation should be aborted on the client-side.
		 * 
		 * {@link #cancel} handlers are called with two arguments:
		 * 
		 * - **dataComponent** ({@link data.DataComponent}): The Model or Collection that the Operation is operating on.
		 * - **operation** (Operation): This Operation object.
		 */
		abort : function() {
			if( !this.isComplete() ) {
				// Abort any remaining incomplete requests with the proxy. Proxies may or may not implement
				// the abort() method specifically, but it defaults to an empty function on the Proxy class.
				_.forEach( this.getIncompleteRequests(), function( req ) { this.proxy.abort( req ); }, this ); 
				
				this.deferred.abort( this.dataComponent, this );
			}
		},
		
		
		/**
		 * Determines if the Operation itself was successful. In order to be considered successful, all of the Operation's 
		 * {@link #requests} must have completed successfully, and the {@link #dataComponent} must have set its status to
		 * {@link #resolve resolved}.
		 * 
		 * @return {Boolean}
		 */
		wasSuccessful : function() {
			return ( this.state() === 'resolved' );
		},
		
		
		/**
		 * Determines if the Operation failed to complete successfully. If any of the {@link #requests}
		 * have errored, this method returns `true`.
		 * 
		 * @return {Boolean}
		 */
		hasErrored : function() {
			return ( this.state() === 'rejected' );
		},
		
		
		/**
		 * Determines if the Operation was {@link #aborted} (via the {@link #abort} method).
		 * 
		 * @return {Boolean}
		 */
		wasAborted : function() {
			return ( this.state() === 'aborted' );
		},
		
		
		/**
		 * Determines if the Operation has been completed. This means that all {@link #requests} have been completed,
		 * and the {@link #dataComponent} has processed their results.
		 * 
		 * @return {Boolean} `true` if all {@link #requests} are complete, `false` if any are not yet complete.
		 */
		isComplete : function() {
			return ( this.state() !== 'pending' );
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
	
	return Operation;
	
} );