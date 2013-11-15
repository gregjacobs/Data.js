/*global define */
define( [
	'lodash',
	'Class',
	'Observable',
	'data/persistence/reader/Json'  // default `reader` type
], function( _, Class, Observable, JsonReader ) {
	
	/**
	 * @abstract
	 * @class data.persistence.proxy.Proxy
	 * @extends Observable
	 * 
	 * Proxy is the base class for subclasses that perform CRUD (Create, Read, Update, and Delete) requests on
	 * some sort of persistence medium. This can be a backend server, a webservice, or a local storage data store,
	 * to name a few examples.
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
	 * For an example implementation, see the {@link data.persistence.proxy.Ajax Ajax} proxy.
	 * 
	 * 
	 * ## Implementing the {@link #abort} method.
	 * 
	 * Proxy gives a hook method for when a persistence operation is {@link data.persistence.operation.Operation#abort aborted}. 
	 * This is to allow any proxy-specific cleanup of {@link data.persistence.request.Request Requests} made by the proxy. 
	 * For example, the {@link data.persistence.proxy.Ajax Ajax} proxy calls the `abort()` method on the underlying 
	 * `XMLHttpRequest` object for a request, to terminate the connection to the remote server.
	 * 
	 * The {@link #abort} method is passed the original {@link data.persistence.request.Request Request} object that 
	 * began the request. If multiple Requests were made to perform a persistence {@link data.persistence.operation.Operation},
	 * then the {@link #abort} method is called once for each Request. Note that only Request objects which are not yet 
	 * {@link data.persistence.request.Request#isComplete complete} are passed to the {@link #abort} method.
	 * 
	 * It is not required that this method be implemented by the Proxy. The data container classes ({@link data.Model Model} 
	 * and {@link data.Collection Collection} will properly handle an aborted request by ignoring its result (or error) if 
	 * the Request eventually completes at a later time. However, it is useful to implement if resources can be saved or
	 * if any cleanup needs to be made.
	 */
	var Proxy = Class.extend( Observable, {
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
			 * @method register
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
			 * @method create
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
		 * @abstract
		 * @method create
		 * @param {data.persistence.request.Create} request The CreateRequest instance to represent
		 *   the creation on the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
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
		 * @abstract
		 * @method read
		 * @param {data.persistence.request.Read} request The ReadRequest instance to represent
		 *   the reading of data from the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		read : Class.abstractMethod,
		
		
		/**
		 * Updates one or more Models on the persistent storage medium.  
		 * 
		 * @abstract
		 * @method update
		 * @param {data.persistence.request.Update} request The UpdateRequest instance to represent
		 *   the update on the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		update : Class.abstractMethod,
		
		
		/**
		 * Destroys (deletes) one or more Models on the persistent storage medium.
		 * 
		 * Note: This method is not named "delete", as `delete` is a JavaScript keyword.
		 * 
		 * @abstract
		 * @method destroy
		 * @param {data.persistence.request.Destroy} request The DestroyRequest instance to represent
		 *   the destruction (deletion) on the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		destroy : Class.abstractMethod,
		
		
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