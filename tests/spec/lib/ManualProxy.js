/*global define */
/*jshint eqnull:true */
define( [
	'jquery',
	
	'data/persistence/proxy/Proxy',
	'data/persistence/ResultSet'
], function( jQuery, Proxy, ResultSet ) {
	
	/**
	 * @class spec.lib.ManualProxy
	 * @extends data.persistence.proxy.Proxy
	 * 
	 * A proxy specifically for use with unit tests, which allows for manual resolution/rejection of requests made
	 * to its four CRUD methods. Basically, it allows tests to resolve/reject requests at the appropriate time, in
	 * order to test different {@link data.Model Model}/{@link data.Collection Collection} functionality, and the
	 * functionality of other helper classes.
	 * 
	 * The four CRUD methods ({@link #create}, {@link #read}, {@link #update}, and {@link destroy}) are usually
	 * called internally by the {@link data.Model} and {@link data.Collection} classes in tests. These tests may 
	 * then want to check for the correct loading/saving/destroying state "during" the requests. After that, the 
	 * CRUD method should be either resolved or rejected by the test, and then the correct state can be checked 
	 * for afterwards.
	 * 
	 * One thing that you do need to keep track of though is the requests that are being made to the proxy. For
	 * instance, {@link data.Model#load loading} a Model will most often make one {@link #read} request (if it
	 * is not loading nested data). When testing the {@link data.Model#load} method, you would call the method,
	 * and then call {@link #resolveRead} with an argument of `0`, to resolve the first "read" request. If more
	 * requests are made, you would call {@link #resolveRead} with the index of the other requests. Note that
	 * indexes do not reset, and subsequent calls to {@link #read} on the proxy will create new indexes that need
	 * to be resolved or rejected.
	 * 
	 * 
	 * ## Example
	 * 
	 *     require( [
	 *         'data/Model',
	 *         'spec/lib/ManualProxy',
	 *     ], function( Model, ManualProxy ) {
	 *     
	 *         var manualProxy = new ManualProxy();
	 *         var ManualProxyModel = Model.extend( {
	 *             attributes : [ 'id', 'attr' ],
	 *             proxy : manualProxy
	 *         } );
	 *         
	 *         
	 *         var model = new ManualProxyModel( { id: 1 } );
	 *         
	 *         var promise = model.load();  // generates a 'read' request against the ManualProxy
	 *         promise.done( function( model ) { alert( "Done Loading Model. `attr` value: '" + model.get( 'attr' ) + "'" ); } );
	 *         
	 *         // Resolve the "read" request that the load operation performed (the first 'read' request in the proxy). 
	 *         // This will have the effect of displaying the "alert" box created in the `done` handler, with the "New 
	 *         // Attr Value" text. The first argument is the request's index to resolve, and the second is the data to 
	 *         // load into the Model through the proxy's reader (2nd arg is optional).
	 *         manualProxy.resolveRead( 0, { attr: "New Attr Value" } );
	 *     } );
	 */
	var ManualProxy = Proxy.extend( {
		
		
		/**
		 * @protected
		 * @property {Object} requests
		 * 
		 * An Object (map) of stored requests. 
		 * 
		 * There are four keys under this map: 'create', 'read', 'update', and 'destroy'. Under each of these four
		 * top-level keys are an Array of {@link data.persistence.request.Request Request} objects.
		 * 
		 * Each Request is either resolved or rejected via methods such as {@link #resolveCreate}, {@link #rejectCreate}, 
		 * {@link #resolveRead}, {@link #rejectRead}, etc.
		 * 
		 * An example of the full data structure may look like something like this:
		 * 
		 *     {
		 *         create : [
		 *             data.persistence.request.Request,
		 *             data.persistence.request.Request
		 *         ],
		 *         read : [
		 *             data.persistence.request.Request
		 *         ],
		 *         update : [
		 *         
		 *         ],
		 *         destroy : [
		 *             data.persistence.request.Request
		 *         ]
		 *     }
		 */
		
		
		/**
		 * @constructor
		 */
		constructor : function() {
			this._super( arguments );
			
			this.requests = {
				create  : [],
				read    : [],
				update  : [],
				destroy : []
			};
		},
		
		
		/**
		 * Adds a request to the queue of pending requests.
		 * 
		 * @protected
		 * @param {String} actionName One of: 'create', 'read', 'update', 'destroy'
		 * @param {data.persistence.request.Request} request The Request instance that should be queued for the given action.
		 */
		appendRequest : function( actionName, request ) {
			this.requests[ actionName ].push( request );
		},
		
		
		/**
		 * Generalized request retrieval method which is called internally by {@link #getCreateRequest}, {@link #getReadRequest},
		 * {@link #getUpdateRequest}, and {@link #getDestroyRequest}.
		 * 
		 * Retrieves the {@link data.persistence.request.Request} object for the given `actionName` and `requestIdx`. 
		 * 
		 * @protected
		 * @param {String} actionName One of: 'create', 'read', 'update', 'destroy'
		 * @param {Number} requestIdx The request number to retrieve.
		 * @return {data.persistence.request.Request} The Request object, or `null` if there is none for the given
		 *   `actionName` and `requestIdx`. 
		 */
		getRequest : function( actionName, requestIdx ) {
			var request = this.requests[ actionName ][ requestIdx ];
			
			return request || null;
		},
		
		
		/**
		 * Generalized request count retrieval method which is called internally by {@link #getCreateRequestCount}, 
		 * {@link #getReadRequestCount}, {@link #getUpdateRequestCount}, and {@link #getDestroyRequestCount}.
		 * 
		 * Retrieves the number of {@link data.persistence.request.Request Requests} that have been made for the given 
		 * `actionName`. 
		 * 
		 * @protected
		 * @param {String} actionName One of: 'create', 'read', 'update', 'destroy'
		 * @return {Number} The number of requests that have been made 
		 */
		getRequestCount : function( actionName ) {
			return this.requests[ actionName ].length;
		},
		
		
		/**
		 * Generalized resolution method which is called internally from {@link #resolveCreate}, {@link #resolveRead},
		 * {@link #resolveUpdate}, and {@link #resolveDestroy}.
		 * 
		 * @protected
		 * @param {String} actionName One of: 'create', 'read', 'update', 'destroy'
		 * @param {Number} requestIdx The request number to resolve.
		 * @param {Mixed/data.persistence.ResultSet} [data] The data to resolve the request with, if any.
		 *   If this is a {@link data.persistence.ResultSet ResultSet} object, then this ResultSet is used as-is.
		 *   If this is any other data type, it is fed through the Proxy's {@link #reader}.
		 *   Defaults to an empty {@link data.persistence.ResultSet ResultSet}.
		 */
		resolve : function( actionName, requestIdx, data ) {
			var request = this.requests[ actionName ][ requestIdx ],
			    resultSet;
			
			// Process the ResultSet if one was provided, or if raw data was provided
			if( data instanceof ResultSet ) {
				resultSet = data;
			} else if( data != null ) {
				resultSet = this.reader.read( data );
			}
			
			request.resolve( resultSet );
		},
		
		
		/**
		 * Generalized rejection method which is called internally from {@link #rejectCreate}, {@link #rejectRead},
		 * {@link #rejectUpdate}, and {@link #rejectDestroy}.
		 * 
		 * @protected
		 * @param {String} actionName One of: 'create', 'read', 'update', 'destroy'
		 * @param {Number} requestIdx The request number to reject.
		 * @param {Mixed} [error] The error object to set as the Request's exception, if any.
		 */
		reject : function( actionName, requestIdx, error ) {
			var request = this.requests[ actionName ][ requestIdx ];
			
			request.reject( error );
		},
		
		
		/**
		 * Generalized notification method which is called internally from {@link #notifyCreate}, {@link #notifyRead},
		 * {@link #notifyUpdate}, and {@link #notifyDestroy}. This has the effect of calling `progress` handlers
		 * of the Request's Deferred.
		 * 
		 * @protected
		 * @param {String} actionName One of: 'create', 'read', 'update', 'destroy'
		 * @param {Number} requestIdx The request number to notify.
		 */
		notify : function( actionName, requestIdx ) {
			var request = this.requests[ actionName ][ requestIdx ];
			
			request.notify();
		},
		
		
		// ------------------------------------
		
		
		/**
		 * Creates one or more Models on the persistent storage medium.
		 * 
		 * @param {data.persistence.request.Create} request The CreateRequest instance to represent
		 *   the creation on the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		create : function( request ) {
			this.appendRequest( 'create', request );
		},
		
		/**
		 * Retrieves the 'create' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the Request to retrieve.
		 * @return {data.persistence.request.Create} The CreateRequest at the `requestIdx`, or `null` if
		 *   one does not exist.
		 */
		getCreateRequest : function( requestIdx ) {
			return this.getRequest( 'create', requestIdx );
		},
		
		/**
		 * Retrieves the number of 'create' requests that have been made to the proxy.
		 *
		 * @return {Number} The number of 'create' requests that have been made to the proxy.
		 */
		getCreateRequestCount : function() {
			return this.getRequestCount( 'create' );
		},
		
		/**
		 * Resolves the 'create' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 * @param {data.persistence.ResultSet} [resultSet] The ResultSet to set to the 
		 *   {@link data.persistence.request.Create CreateRequest}, if any. This may
		 *   also be anonymous data to be read by the proxy's {@link #reader}.
		 */
		resolveCreate : function( requestIdx, resultSet ) {
			this.resolve( 'create', requestIdx, resultSet );
		},
		
		/**
		 * Rejects the 'create' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 * @param {Mixed} [error] The error object to set as the Request's exception, if any.
		 */
		rejectCreate : function( requestIdx, error ) {
			this.reject( 'create', requestIdx, error );
		},
		
		/**
		 * Notifies (calls `progress` handlers of) the 'create' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to notify.
		 */
		notifyCreate : function( requestIdx ) {
			this.notify( 'create', requestIdx );
		},
		
		
		/**
		 * Reads one or more Models from the persistent storage medium.
		 * 
		 * @param {data.persistence.request.Read} request The ReadRequest instance to represent
		 *   the reading of data from the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		read : function( request ) {
			this.appendRequest( 'read', request );
		},
		
		/**
		 * Retrieves the 'read' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the Request to retrieve.
		 * @return {data.persistence.request.Read} The ReadRequest at the `requestIdx`, or `null` if
		 *   one does not exist.
		 */
		getReadRequest : function( requestIdx ) {
			return this.getRequest( 'read', requestIdx );
		},
		
		/**
		 * Retrieves the number of 'read' requests that have been made to the proxy.
		 *
		 * @return {Number} The number of 'read' requests that have been made to the proxy.
		 */
		getReadRequestCount : function() {
			return this.getRequestCount( 'read' );
		},
		
		/**
		 * Resolves the 'read' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 * @param {data.persistence.ResultSet} [resultSet] The ResultSet to set to the 
		 *   {@link data.persistence.request.Read ReadRequest}, if any. This may
		 *   also be anonymous data to be read by the proxy's {@link #reader}.
		 */
		resolveRead : function( requestIdx, resultSet ) {
			this.resolve( 'read', requestIdx, resultSet );
		},
		
		/**
		 * Rejects the 'read' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 * @param {Mixed} [error] The error object to set as the Request's exception, if any.
		 */
		rejectRead : function( requestIdx, error ) {
			this.reject( 'read', requestIdx, error );
		},
		
		/**
		 * Notifies (calls `progress` handlers of) the 'read' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to notify.
		 */
		notifyRead : function( requestIdx ) {
			this.notify( 'read', requestIdx );
		},
		
		
		
		/**
		 * Updates one or more Models on the persistent storage medium.  
		 * 
		 * @param {data.persistence.request.Update} request The UpdateRequest instance to represent
		 *   the update on the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		update : function( request ) {
			this.appendRequest( 'update', request );
		},
		
		/**
		 * Retrieves the number of 'update' requests that have been made to the proxy.
		 *
		 * @return {Number} The number of 'update' requests that have been made to the proxy.
		 */
		getUpdateRequestCount : function() {
			return this.getRequestCount( 'update' );
		},
		
		/**
		 * Retrieves the 'update' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the Request to retrieve.
		 * @return {data.persistence.request.Update} The UpdateRequest at the `requestIdx`, or `null` if
		 *   one does not exist.
		 */
		getUpdateRequest : function( requestIdx ) {
			return this.getRequest( 'update', requestIdx );
		},
		
		/**
		 * Resolves the 'update' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 * @param {data.persistence.ResultSet} [resultSet] The ResultSet to set to the 
		 *   {@link data.persistence.request.Update UpdateRequest}, if any. This may
		 *   also be anonymous data to be read by the proxy's {@link #reader}.
		 */
		resolveUpdate : function( requestIdx, resultSet ) {
			this.resolve( 'update', requestIdx, resultSet );
		},
		
		/**
		 * Rejects the 'update' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 * @param {Mixed} [error] The error object to set as the Request's exception, if any.
		 */
		rejectUpdate : function( requestIdx, error ) {
			this.reject( 'update', requestIdx, error );
		},
		
		/**
		 * Notifies (calls `progress` handlers of) the 'update' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to notify.
		 */
		notifyUpdate : function( requestIdx ) {
			this.notify( 'update', requestIdx );
		},
		
		
		/**
		 * Destroys (deletes) one or more Models on the persistent storage medium.
		 * 
		 * Note: This method is not named "delete", as `delete` is a JavaScript keyword.
		 * 
		 * @param {data.persistence.request.Destroy} request The DestroyRequest instance to represent
		 *   the destruction (deletion) on the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		destroy : function( request ) {
			this.appendRequest( 'destroy', request );
		},
		
		/**
		 * Retrieves the 'destroy' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the Request to retrieve.
		 * @return {data.persistence.request.Destroy} The DestroyRequest at the `requestIdx`, or `null` if
		 *   one does not exist.
		 */
		getDestroyRequest : function( requestIdx ) {
			return this.getRequest( 'destroy', requestIdx );
		},
		
		/**
		 * Retrieves the number of 'destroy' requests that have been made to the proxy.
		 *
		 * @return {Number} The number of 'destroy' requests that have been made to the proxy.
		 */
		getDestroyRequestCount : function() {
			return this.getRequestCount( 'destroy' );
		},
		
		/**
		 * Resolves the 'destroy' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 * @param {data.persistence.ResultSet} [resultSet] The ResultSet to set to the 
		 *   {@link data.persistence.request.Destroy DestroyRequest}, if any. This may
		 *   also be anonymous data to be read by the proxy's {@link #reader}.
		 */
		resolveDestroy : function( requestIdx, resultSet ) {
			this.resolve( 'destroy', requestIdx, resultSet );
		},
		
		/**
		 * Rejects the 'destroy' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 * @param {Mixed} [error] The error object to set as the Request's exception, if any.
		 */
		rejectDestroy : function( requestIdx, error ) {
			this.reject( 'destroy', requestIdx, error );
		},
		
		/**
		 * Notifies (calls `progress` handlers of) the 'destroy' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to notify.
		 */
		notifyDestroy : function( requestIdx ) {
			this.notify( 'destroy', requestIdx );
		}
		
	} );
	
	
	Proxy.register( 'manual', ManualProxy );
	
	return ManualProxy;
	
} );