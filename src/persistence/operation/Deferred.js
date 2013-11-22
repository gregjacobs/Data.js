/*global define */
define( [
	'jquery',
	'lodash',
	'Class'
], function( jQuery, _, Class ) {
	
	/**
	 * @private
	 * @class data.persistence.operation.Deferred
	 * 
	 * Used internally by the {@link data.persistence.operation.Operation} object, OperationDeferred is an "extension" (of sorts) 
	 * of the jQuery Deferred object. It supports the same interface as the jQuery Deferred object (see: 
	 * [http://api.jquery.com/category/deferred-object/](http://api.jquery.com/category/deferred-object/)), 
	 * and extends it to add support for an 'aborted' state (on top of the regular 'resolved' and 'rejected' states).
	 * 
	 * As stated, OperationDeferred supports the jQuery Deferred interface. This includes:
	 * 
	 * 1. The ability to attach {@link #progress}, {@link #done}, {@link #fail}, {@link #then}, and {@link #always} 
	 *    handlers, to detect when the OperationDeferred has been notified (i.e. made progress), has been resolved, or has been
	 *    rejected.
	 * 2. The {@link #notify}, {@link #resolve}, and {@link #reject} methods, for notifying observers of progress, and setting the 
	 *    "finalized" state of the OperationDeferred.
	 * 3. The {@link #state} method, to determine the current state that the Deferred is in.
	 * 
	 * In addition to the jQuery supported methods, th implementation adds {@link #abort} and {@link #cancel} methods:
	 * 
	 * - {@link #abort} is the new "finalizer" method (akin to {@link #resolve} or {@link #reject}), and
	 * - {@link #cancel} is used to subscribe one or more handlers for if the OperationDeferred has been {@link #abort aborted}.
	 * 
	 * It also adds a new state which may be returned by the {@link #state} method: "aborted".
	 * 
	 * 
	 * ## Example
	 * 
	 * Resolving an OperationDeferred:
	 * 
	 *     require( [
	 *         'data/persistence/operation/Deferred'
	 *     ], function( OperationDeferred ) {
	 *     
	 *         var deferred = new OperationDeferred();
	 *         deferred
	 *             .done( function() { console.log( "Resolved" ) } )
	 *             .fail( function() { console.log( "Rejected" ) } )
	 *             .cancel( function() { console.log( "Aborted" ) } )
	 *             .always( function() { console.log( "Completed" ) } );
	 *             
	 *         console.log( deferred.state() );  // "pending"
	 *         
	 *         
	 *         // "Resolve" the Deferred
	 *         deferred.resolve();  // the `done` handler function attached above is executed
	 *         
	 *         console.log( deferred.state() );  // "resolved"
	 *         
	 *     } );
	 *     
	 * 
	 * Aborting an OperationDeferred:
	 * 
	 *     require( [
	 *         'data/persistence/operation/Deferred'
	 *     ], function( OperationDeferred ) {
	 *     
	 *         var deferred = new OperationDeferred();
	 *         deferred
	 *             .done( function() { console.log( "Resolved" ) } )
	 *             .fail( function() { console.log( "Rejected" ) } )
	 *             .cancel( function() { console.log( "Aborted" ) } )
	 *             .always( function() { console.log( "Completed" ) } );
	 *             
	 *         console.log( deferred.state() );  // "pending"
	 *         
	 *         
	 *         // "Abort" the Deferred
	 *         deferred.abort();  // the `cancel` handler function attached above is executed
	 *         
	 *         console.log( deferred.state() );  // "aborted"
	 *         
	 *     } );
	 */
	var OperationDeferred = Class.create( {
		
		/**
		 * @protected
		 * @property {jQuery.Deferred} deferred
		 * 
		 * The OperationDeferred's main internal jQuery Deferred object, which is used to notify {@link #progress} handlers, and
		 * is resolved or rejected when the OperationDeferred is {@link #resolve resolved} or {@link #reject rejected}. 
		 * 
		 * Handlers for this Deferred are attached via the {@link #done}, {@link #fail}, {@link #then}, or {@link #always} methods 
		 * of the OperationDeferred. The {@link #cancel} method is handled separately by the {@link #cancelDeferred}.
		 */
		
		/**
		 * @protected
		 * @property {jQuery.Deferred} cancelDeferred
		 * 
		 * The OperationDeferred's internal jQuery Deferred object which is solely responsible for keeping track of {@link #cancel}
		 * handlers, and will be resolved if the Operation has been {@link #abort aborted}. {@link #always} handlers are called
		 * as well when the OperationDeferred is {@link #abort aborted}.
		 */
		
		
		/**
		 * Creates a new OperationDeferred instance.
		 * 
		 * @constructor
		 */
		constructor : function() {
			this.mainDeferred = new jQuery.Deferred();    // for handling `progress`, `done`, `fail`, `then`, and `always` handlers
			this.cancelDeferred = new jQuery.Deferred();  // need a separate Deferred to keep track of `cancel` handlers
		},
		
		
		// -----------------------------------
		
		// Deferred interface
		
		/**
		 * Notifies {@link #progress} handlers that progress has been made. This includes `progress` handlers attached
		 * using the {@link #then} method.
		 * 
		 * @param {Mixed...} args The arguments to pass to {@link #progress} handlers.
		 */
		notify : function() {
			if( this.state() === 'pending' ) {
				this.mainDeferred.notify.apply( this.mainDeferred, arguments );
			}
		},
		
		
		/**
		 * Marks the OperationDeferred's {@link #state} as 'resolved', and calls all {@link #done} handlers.
		 * This includes `done` handlers attached using the {@link #then} method.
		 * 
		 * @param {Mixed...} args The arguments to pass to {@link #done} handlers.
		 */
		resolve : function() {
			if( this.state() === 'pending' ) {
				this.mainDeferred.resolve.apply( this.mainDeferred, arguments );
			}
		},
		
		
		/**
		 * Marks the OperationDeferred's {@link #state} as 'rejected', and calls all {@link #fail} handlers.
		 * This includes `fail` handlers attached using the {@link #then} method.
		 * 
		 * @param {Mixed...} args The arguments to pass to {@link #fail} handlers.
		 */
		reject : function() {
			if( this.state() === 'pending' ) {
				this.mainDeferred.reject.apply( this.mainDeferred, arguments );
			}
		},
		
		
		/**
		 * Marks the OperationDeferred's {@link #state} as 'aborted', and calls all {@link #cancel} handlers.
		 * 
		 * @param {Mixed...} args The arguments to pass to {@link #cancel} handlers.
		 */
		abort : function() {
			if( this.state() === 'pending' ) {
				this.cancelDeferred.resolve.apply( this.cancelDeferred, arguments );
			}
		},
		
		
		// -----------------------------------
		
		// Promise interface

		/**
		 * Returns the OperationDeferred itself (this object). 
		 * 
		 * This method is purely for compatibility with jQuery's Promise API, and is also for methods like 
		 * `jQuery.when()`, which uses the existence of this method as a duck-type check in order to 
		 * determine if a Deferred or Promise object has been passed to it.
		 * 
		 * @return {data.persistence.operation.Deferred} This OperationDeferred object.
		 */
		promise : function() {
			return this;
		},
		
		
		/**
		 * Determines the state of the OperationDeferred. This method will return one of the following values:
		 * 
		 * - **"pending"**: The OperationDeferred is not yet in a completed state (i.e. it has not been {@link #resolve resolved}, 
		 *   {@link #reject rejected}, or {@link #abort aborted}).
		 * - **"resolved"**: The OperationDeferred is in its {@link #resolve resolved} state.
		 * - **"rejected"**: The OperationDeferred is in its {@link #reject rejected} state.
		 * - **"aborted"**: The OperationDeferred is in its {@link #abort aborted} state.
		 * 
		 * This method is also here for compatibility with jQuery's Deferred/Promise interface, although `jQuery.when()`
		 * will *not* respond to an OperationDeferred that has been {@link #abort aborted}.
		 * 
		 * @return {String} See return values, above.
		 */
		state : function() {
			return ( this.cancelDeferred.state() === 'resolved' ) ? 'aborted' : this.mainDeferred.state();
		},
		
		
		/**
		 * Adds a handler for when the OperationDeferred has been {@link #notify notified} of some progress.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		progress : function( handlerFn ) {
			this.mainDeferred.progress( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for when the OperationDeferred has been {@link #resolve resolved}.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		done : function( handlerFn ) {
			this.mainDeferred.done( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for when the OperationDeferred has been {@link #reject rejected}.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		fail : function( handlerFn ) {
			this.mainDeferred.fail( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for when the OperationDeferred has been {@link #abort aborted}.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		cancel : function( handlerFn ) {
			this.cancelDeferred.done( handlerFn );
			return this;
		},
		
		
		/**
		 * Adds handler functions for when the OperationDeferred has been {@link #resolve resolved}, {@link #reject rejected},
		 * and when {@link #notify notified} that progress has been made.
		 * 
		 * Note: This method does *not* support jQuery's "filtering" functionality.
		 * 
		 * @param {Function} successHandlerFn
		 * @param {Function} [failureHandlerFn]
		 * @param {Function} [progressHandlerFn]
		 * @chainable
		 */
		then : function( successHandlerFn, failureHandlerFn, progressHandlerFn ) {
			this.mainDeferred.then( successHandlerFn, failureHandlerFn, progressHandlerFn );
			return this;
		},
		
		
		/**
		 * Adds a handler for when the Operation completes, regardless of being {@link #resolve resolved}, {@link #reject rejected}, 
		 * or {@link #abort aborted}.
		 * 
		 * @param {Function} handlerFn
		 * @chainable
		 */
		always : function( handlerFn ) {
			this.mainDeferred.always( handlerFn );
			this.cancelDeferred.always( handlerFn );
			return this;
		}
		
	} );
	
	
	return OperationDeferred;
	
} );