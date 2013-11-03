/*global define */
/*jshint eqnull:true */
define( [
	'jquery',
	
	'data/persistence/proxy/Proxy',
	'data/persistence/ResultSet'
], function( jQuery, Proxy, ResultSet ) {
	
	/**
	 * @class spec.lib.ManualResolveProxy
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
	 *         'spec/lib/ManualResolveProxy',
	 *     ], function( Model, ManualResolveProxy ) {
	 *     
	 *         var manualProxy = new ManualResolveProxy();
	 *         var ManualProxyModel = Model.extend( {
	 *             attributes : [ 'id', 'attr' ],
	 *             proxy : manualProxy
	 *         } );
	 *         
	 *         
	 *         var model = new ManualProxyModel( { id: 1 } );
	 *         
	 *         var promise = model.load();  // generates a 'read' request against the ManualResolveProxy
	 *         promise.done( function( model ) { alert( "Done Loading Model. `attr` value: '" + model.get( 'attr' ) + "'" ); } );
	 *         
	 *         // Resolve the "read" request that the load operation performed (the first 'read' request in the proxy). 
	 *         // This will have the effect of displaying the "alert" box created in the `done` handler, with the "New 
	 *         // Attr Value" text. The first argument is the request's index to resolve, and the second is the data to 
	 *         // load into the Model through the proxy's reader (2nd arg is optional).
	 *         manualProxy.resolveRead( 0, { attr: "New Attr Value" } );
	 *     } );
	 */
	var ManualResolveProxy = Proxy.extend( {
		
		
		/**
		 * @protected
		 * @property {Object} requests
		 * 
		 * An Object (map) of stored requests. 
		 * 
		 * There are four keys under this map: 'create', 'read', 'update', and 'destroy'. Under each of these four
		 * top-level keys are an Object like:
		 * 
		 *     {
		 *         deferred: jQuery.Deferred,
		 *         request:  data.persistence.request.Request
		 *     }
		 * 
		 * Where `deferred` is a jQuery.Deferred instance which is resolved or rejected when requested (via 
		 * methods like {@link #resolveCreate}, {@link #rejectCreate}, {@link #resolveRead}, {@link #rejectRead}, etc.),
		 * and `request` is a {@link data.persistence.request.Request} object.
		 * 
		 * An example of the full data structure may look like something like this:
		 * 
		 *     {
		 *         create : [
		 *             { deferred: [jQuery.Deferred], request: [data.persistence.request.Request],
		 *             { deferred: [jQuery.Deferred], request: [data.persistence.request.Request]
		 *         ],
		 *         read : [
		 *             { deferred: [jQuery.Deferred], request: [data.persistence.request.Request]
		 *         ],
		 *         update : [
		 *         
		 *         ],
		 *         destroy : [
		 *             { deferred: [jQuery.Deferred], request: [data.persistence.request.Request]
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
		 * @return {jQuery.Promise} The Promise object which is resolved or rejected when the appropriate resolve/reject method
		 *   is called with the index for the given `request`.
		 */
		appendRequest : function( actionName, request ) {
			var deferred = new jQuery.Deferred();
			
			this.requests[ actionName ].push( { deferred: deferred, request: request } );
			return deferred.promise();
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
			var storedReqObj = this.requests[ actionName ][ requestIdx ],
			    deferred = storedReqObj.deferred,
			    request  = storedReqObj.request;
			
			// Process the ResultSet for create/read/update actions - not destroy
			if( actionName === 'create' || actionName === 'read' || actionName === 'update' ) {
				var resultSet;
				if( data instanceof ResultSet ) {
					resultSet = data;
				} else if( data != null ) {
					resultSet = this.reader.read( data );
				}
				
				request.setResultSet( resultSet || new ResultSet() );
			}
			
			request.setSuccess();
			deferred.resolve( request );
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
			var storedReqObj = this.requests[ actionName ][ requestIdx ],
			    deferred = storedReqObj.deferred,
			    request  = storedReqObj.request;
			
			request.setException( error );
			deferred.reject( request );
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
			return this.appendRequest( 'create', request );
		},
		
		/**
		 * Resolves the 'create' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 * @param {data.persistence.ResultSet} [resultSet] The ResultSet to set to the 
		 *   {@link data.persistence.request.Create CreateRequest}, if any.
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
		 * Reads one or more Models from the persistent storage medium.
		 * 
		 * @param {data.persistence.request.Read} request The ReadRequest instance to represent
		 *   the reading of data from the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		read : function( request ) {
			return this.appendRequest( 'read', request );
		},
		
		/**
		 * Resolves the 'read' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 * @param {data.persistence.ResultSet} [resultSet] The ResultSet to set to the 
		 *   {@link data.persistence.request.Read ReadRequest}, if any.
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
		 * Updates one or more Models on the persistent storage medium.  
		 * 
		 * @param {data.persistence.request.Update} request The UpdateRequest instance to represent
		 *   the update on the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		update : function( request ) {
			return this.appendRequest( 'update', request );
		},
		
		/**
		 * Resolves the 'update' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 * @param {data.persistence.ResultSet} [resultSet] The ResultSet to set to the 
		 *   {@link data.persistence.request.Update UpdateRequest}, if any.
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
			return this.appendRequest( 'destroy', request );
		},
		
		/**
		 * Resolves the 'destroy' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 */
		resolveDestroy : function( requestIdx ) {
			this.resolve( 'destroy', requestIdx );
		},
		
		/**
		 * Rejects the 'destroy' request at the given `requestIdx`.
		 * 
		 * @param {Number} requestIdx The index of the request to resolve.
		 * @param {Mixed} [error] The error object to set as the Request's exception, if any.
		 */
		rejectDestroy : function( requestIdx, error ) {
			this.reject( 'destroy', requestIdx, error );
		}
		
	} );
	
	return ManualResolveProxy;
	
} );