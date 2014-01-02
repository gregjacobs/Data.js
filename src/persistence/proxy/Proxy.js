/*global define */
define( [
	'jquery',
	'lodash',
	'Class',
	'Observable',
	'data/persistence/reader/Json'  // default `reader` type
], function( jQuery, _, Class, Observable, JsonReader ) {
	
	/**
	 * @abstract
	 * @class data.persistence.proxy.Proxy
	 * @extends Observable
	 * 
	 * Proxy is the base class for subclasses that perform CRUD (Create, Read, Update, and Delete) requests on a persistence 
	 * medium. The persistence medium can be a backend server, a webservice, or a local storage data store, to name a few 
	 * examples.
	 * 
	 * 
	 * ## Creating a Proxy
	 * 
	 * Each proxy needs to implement the four abstract methods:
	 * 
	 * - {@link #create}
	 * - {@link #read}
	 * - {@link #update}
	 * - {@link #destroy}
	 * 
	 * Each method is passed a {@link data.persistence.request.Request Request} object, which provides the information
	 * needed to perform each operation. 
	 * 
	 * Each method must {@link data.persistence.request.Request#resolve resolve} the Request when the underlying operation
	 * has been completed successfully, or should {@link data.persistence.request.Request#reject reject} the Request if the 
	 * underlying operation errors.
	 * 
	 * - A {@link data.persistence.ResultSet} object is used to return data from the Proxy. Providing any raw data to the
	 *   proxy's {@link #reader} (i.e. to the {@link data.persistence.reader.Reader#read read} method) will return a ResultSet
	 *   object. The Request should then be resolved with this object, or otherwise no argument if there is no data to return.
	 * - If an error occurs, the Request should be rejected. Optionally, an error message or object may be provided as the first
	 *   argument to the reject method.
	 * 
	 * 
	 * ## Example Implementation Method
	 * 
	 *     read : function( request ) {
	 *         var me = this;  // for closures
	 *         
	 *         jQuery.ajax( {
	 *             url : '...',
	 *             dataType: 'json',
	 *             
	 *             success : function( data ) {
	 *                 var resultSet = me.reader.read( data );  // default reader is a {@link data.persistence.reader.Json JsonReader}
	 *                 request.resolve( resultSet );
	 *             },
	 *             error : function( jqXHR, textStatus, errorThrown ) {
	 *                 request.reject( { textStatus: textStatus, errorThrown: errorThrown } );
	 *             }
	 *         } );
	 *     }
	 * 
	 * For a full example implementation, see the {@link data.persistence.proxy.Ajax Ajax} proxy.
	 * 
	 * 
	 * ## Notifying of progress
	 * 
	 * Normally, if a Proxy does not notify of any progress explicitly, then a Requests's parent
	 * {@link data.persistence.operation.Operation Operation} is notified of progress as each individual
	 * {@link data.persistence.request.Request Request} completes. 
	 * 
	 * Proxies can notify observers of progress being made within the proxy at a Request level though, for finer grained
	 * progress notification. The Request object which a Proxy is passed may have the {@link data.persistence.request.Request#notify notify}
	 * method called on it, which will in turn notify its parent Operation. For example:
	 * 
	 *      destroy : function( request ) {
	 *         var me = this;  // for closures
	 *         
	 *         // Assume the `request` object (a {@link data.persistence.request.Destroy DestroyRequest} object) has 2 models 
	 *         // to destroy on a server via 2 individual ajax requests
	 *         var promises = _.map( request.getModels(), function( model ) {
	 *             var promise = jQuery.ajax( {
	 *                 url : '...',
	 *                 dataType: 'json',
	 *                 
	 *                 success : function( data ) {
	 *                     request.notify();  // notify of progress when each individual ajax request is complete
	 *                 },
	 *                 error : function( jqXHR, textStatus, errorThrown ) {
	 *                     request.reject( { textStatus: textStatus, errorThrown: errorThrown } );  // as soon as one ajax request errors, reject the Request
	 *                 }
	 *             } );
	 *             
	 *             return promise;
	 *         } );
	 *         
	 *         // Only resolve the main Request when all individual AJAX promises are resolved
	 *         jQuery.when.apply( jQuery, promises ).then( function() { request.resolve(); } );
	 *     }
	 * 
	 * 
	 * ## Implementing the {@link #abort} method.
	 * 
	 * Proxy gives a hook method for when a persistence operation is {@link data.persistence.operation.Operation#abort aborted}. 
	 * This is to allow any proxy-specific cleanup of {@link data.persistence.request.Request Requests} made by the proxy. 
	 * For example, the {@link data.persistence.proxy.Ajax Ajax} proxy calls the `abort()` method on the underlying 
	 * `XMLHttpRequest` object for a request, to terminate the connection to a remote server.
	 * 
	 * The {@link #abort} method is passed the original {@link data.persistence.request.Request Request} object that 
	 * began the request. If multiple Requests were made to perform a persistence {@link data.persistence.operation.Operation},
	 * then the {@link #abort} method is called multiple times - once for each Request. Note that only Request objects which 
	 * are not yet {@link data.persistence.request.Request#isComplete complete} are passed to the {@link #abort} method.
	 * 
	 * It is not required that the {@link #abort} method be implemented by the Proxy. The data container classes 
	 * ({@link data.Model Model} and {@link data.Collection Collection} will properly handle an aborted request by ignoring 
	 * its result (or error) if the Request eventually completes at a later time. However, it is useful to implement if resources 
	 * can be saved or if any cleanup needs to be made.
	 */
	var Proxy = Observable.extend( {
		abstractClass : true,
		
		
		statics : {
			
			/**
			 * An object (hashmap) of persistence proxy name -> Proxy class key/value pairs, used to look up
			 * a Proxy subclass by name.
			 * 
			 * @private
			 * @static
			 * @property {Object} proxies
			 */
			proxies : {},
			
			/**
			 * Registers a Proxy subclass by name, so that it may be created by an anonymous object
			 * with a `type` attribute when set to the prototype of a {@link data.Model}.
			 *
			 * @static
			 * @param {String} type The type name of the persistence proxy.
			 * @param {Function} proxyClass The class (constructor function) to register.
			 */
			register : function( type, proxyClass ) {
				type = type.toLowerCase();
				if( typeof proxyClass !== 'function' ) {
					throw new Error( "A Proxy subclass constructor function must be provided to registerProxy()" );
				}
				
				if( !Proxy.proxies[ type ] ) { 
					Proxy.proxies[ type ] = proxyClass;
				} else {
					throw new Error( "Error: Proxy type '" + type + "' already registered." );
				}
			},
			
			
			/**
			 * Creates (instantiates) a {@link data.persistence.proxy.Proxy} based on its type name, given
			 * a configuration object that has a `type` property. If an already-instantiated 
			 * {@link data.persistence.proxy.Proxy Proxy} is provided, it will simply be returned unchanged.
			 * 
			 * @static
			 * @param {Object} config The configuration object for the Proxy. Config objects should have the property `type`, 
			 *   which determines which type of {@link data.persistence.proxy.Proxy} will be instantiated. If the object does not
			 *   have a `type` property, an error will be thrown. Note that already-instantiated {@link data.persistence.proxy.Proxy Proxies} 
			 *   will simply be returned unchanged. 
			 * @return {data.persistence.proxy.Proxy} The instantiated Proxy.
			 */
			create : function( config ) {
				var type = config.type ? config.type.toLowerCase() : undefined;
				
				if( config instanceof Proxy ) {
					// Already a Proxy instance, return it
					return config;
					
				} else if( Proxy.proxies[ type ] ) {
					return new Proxy.proxies[ type ]( config );
					
				} else if( !( 'type' in config ) ) {
					// No `type` property provided on config object
					throw new Error( "data.persistence.proxy.Proxy.create(): No `type` property provided on proxy config object" );
					 
				} else {
					// No registered Proxy type with the given type, throw an error
					throw new Error( "data.persistence.proxy.Proxy.create(): Unknown Proxy type: '" + type + "'" );
				}
			}
		},
		
		
		/**
		 * @cfg {data.persistence.reader.Reader} reader
		 * 
		 * The reader to use to transform the raw data that is read by the proxy into JavaScript object(s),
		 * so that they can be passed to a {@link data.Model} or {@link data.Collection}.
		 * 
		 * This defaults to a {@link data.persistence.reader.Json Json} reader, as this is the most common
		 * format. However, other implementations may be created and used, which may include method overrides
		 * to apply transformations to incoming data before that data is handed off to a {@link data.Model Model}
		 * or {@link data.Collection Collection}.
		 */
		
		
		/**
		 * @constructor
		 * @param {Object} config The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			// Apply the config to this instance
			_.assign( this, cfg );
			
			if( !this.reader ) {
				this.reader = new JsonReader();
			}
		},
		
		
		/**
		 * Creates one or more Models on the persistent storage medium.
		 * 
		 * For how an implementation of this method should interact with the `request` object, see the description
		 * for this class.
		 * 
		 * @abstract
		 * @method create
		 * @param {data.persistence.request.Create} request The CreateRequest instance to represent
		 *   the creation on the persistent storage medium.
		 */
		create : Class.abstractMethod,
		
		
		/**
		 * Reads one or more Models from the persistent storage medium.
		 * 
		 * Note that this method should support the configuration options of the {@link data.persistence.request.Read ReadRequest}
		 * object. This includes handling the following configs as appropriate for the particular Proxy subclass:
		 * 
		 * - {@link data.persistence.request.Read#modelId modelId}
		 * - {@link data.persistence.request.Read#page page}/{@link data.persistence.request.Read#pageSize pageSize}
		 * - {@link data.persistence.request.Read#start start}/{@link data.persistence.request.Read#limit limit}
		 * - {@link data.persistence.request.Read#params params} (if applicable)
		 * 
		 * For how an implementation of this method should interact with the `request` object, see the description
		 * for this class.
		 * 
		 * @abstract
		 * @method read
		 * @param {data.persistence.request.Read} request The ReadRequest instance to represent
		 *   the reading of data from the persistent storage medium.
		 */
		read : Class.abstractMethod,
		
		
		/**
		 * Updates one or more Models on the persistent storage medium.  
		 * 
		 * For how an implementation of this method should interact with the `request` object, see the description
		 * for this class.
		 * 
		 * @abstract
		 * @method update
		 * @param {data.persistence.request.Update} request The UpdateRequest instance to represent
		 *   the update on the persistent storage medium.
		 */
		update : Class.abstractMethod,
		
		
		/**
		 * Destroys (deletes) one or more Models on the persistent storage medium.
		 * 
		 * For how an implementation of this method should interact with the `request` object, see the description
		 * for this class.
		 * 
		 * Note: This method is not named "delete", as `delete` is a JavaScript keyword.
		 * 
		 * @abstract
		 * @method destroy
		 * @param {data.persistence.request.Destroy} request The DestroyRequest instance to represent
		 *   the destruction (deletion) on the persistent storage medium.
		 */
		destroy : Class.abstractMethod,
		
		
		/**
		 * Performs a batch of create/read/update/destroy requests, specified by the given 
		 * {@link data.persistence.request.Batch Batch} object.
		 * 
		 * By default, this method sends the 'create' requests to the {@link #create} method, the 'read' requests
		 * to the {@link #read} method, the 'update' requests to the {@link #update} method, and the 'destroy' requests 
		 * to the {@link #destroy} method. 
		 * 
		 * However, this method may be overridden to support different batching functionality. For example, one might want 
		 * to combine multiple create/update/destroy requests made by a {@link data.Collection} (via the 
		 * {@link data.Collection#sync sync} method) into a single network request, and send them to a server for processing 
		 * all at once.
		 * 
		 * @param {data.persistence.request.Batch} batch The Batch object which holds the Request(s) to perform.
		 */
		batch : function( batch ) {
			_.forEach( batch.getRequests(), function( request ) {
				switch( request.getAction() ) {
					case 'create'  : return this.create( request );
					case 'read'    : return this.read( request );
					case 'update'  : return this.update( request );
					case 'destroy' : return this.destroy( request );
				}
			}, this );
		},
		
		
		/**
		 * Aborts a {@link data.persistence.request.Request Request} that was made to the Proxy.
		 * 
		 * This is an empty implementation for the Proxy base class, and may be overridden in subclasses
		 * to provide a specific implementation if one can be made. See the description of this class 
		 * for more details, and {@link data.persistence.proxy.Ajax#abort} for an example.
		 * 
		 * @param {data.persistence.request.Request} request The Request to abort. This will be a request
		 *   that is currently in progress (i.e. not yet {@link data.persistence.request.Request#isComplete complete}).
		 */
		abort : function() {},
		
		
		// -----------------------------------
		
		
		/**
		 * Retrieves the {@link #reader} for the Proxy.
		 * 
		 * @return {data.persistence.reader.Reader} The Proxy's {@link #reader}, or `null` if there is none set.
		 */
		getReader : function() {
			return this.reader || null;
		}
		
	} );
	
	return Proxy;
	
} );