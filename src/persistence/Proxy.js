/*global define */
define( [
	'lodash',
	'Class',
	'Observable',
	'data/persistence/reader/Json'
], function( _, Class, Observable, JsonReader ) {
	
	/**
	 * @abstract
	 * @class Data.persistence.Proxy
	 * @extends Observable
	 * 
	 * Proxy is the base class for subclasses that perform CRUD (Create, Read, Update, and Delete) operations on
	 * some sort of persistence medium. This can be a backend server, a webservice, or a local storage data store,
	 * to name a few examples. 
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
			 * with a `type` attribute when set to the prototype of a {@link Data.Model}.
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
			 * Creates (instantiates) a {@link Data.persistence.Proxy} based on its type name, given
			 * a configuration object that has a `type` property. If an already-instantiated 
			 * {@link Data.persistence.Proxy Proxy} is provided, it will simply be returned unchanged.
			 * 
			 * @static
			 * @method create
			 * @param {Object} config The configuration object for the Proxy. Config objects should have the property `type`, 
			 *   which determines which type of {@link Data.persistence.Proxy} will be instantiated. If the object does not
			 *   have a `type` property, an error will be thrown. Note that already-instantiated {@link Data.persistence.Proxy Proxies} 
			 *   will simply be returned unchanged. 
			 * @return {Data.persistence.Proxy} The instantiated Proxy.
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
					throw new Error( "Data.persistence.Proxy.create(): No `type` property provided on proxy config object" );
					 
				} else {
					// No registered Proxy type with the given type, throw an error
					throw new Error( "Data.persistence.Proxy.create(): Unknown Proxy type: '" + type + "'" );
				}
			}
		},
		
		
		/**
		 * @cfg {Data.persistence.reader.Reader} reader
		 * 
		 * The reader to use to transform the raw data that is read by the proxy into JavaScript object(s),
		 * so that they can be passed to a {@link Data.Model} or {@link Data.Collection}.
		 * 
		 * This defaults to a {@link Data.persistence.reader.Json Json} reader, as this is the most common
		 * format. However, other implementations may be created and used, which may include method overrides
		 * to apply transformations to incoming data before that data is handed off to a {@link Data.Model Model}
		 * or {@link Data.Collection Collection}.
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
		 * Creates a Model on the persistent storage.
		 * 
		 * @abstract
		 * @method create
		 * @param {Data.persistence.operation.WriteOperation} operation The WriteOperation instance to represent
		 *   the creation on the persistent storage.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		create : Class.abstractMethod,
		
		
		/**
		 * Reads a Model from the server.
		 * 
		 * @abstract
		 * @method read
		 * @param {Data.persistence.operation.ReadOperation} operation The ReadOperation instance to represent
		 *   the reading of data from the persistent storage.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		read : Class.abstractMethod,
		
		
		/**
		 * Updates the Model on the server, using the provided `data`.  
		 * 
		 * @abstract
		 * @method update
		 * @param {Data.persistence.operation.WriteOperation} operation The WriteOperation instance to represent
		 *   the update on the persistent storage.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		update : Class.abstractMethod,
		
		
		/**
		 * Destroys (deletes) the Model on the server. This method is not named "delete" as "delete" is a JavaScript reserved word.
		 * 
		 * @abstract
		 * @method destroy
		 * @param {Data.persistence.operation.WriteOperation} operation The WriteOperation instance to represent
		 *   the destruction (deletion) on the persistent storage.
		 * @return {jQuery.Promise} A Promise object which is resolved when the operation is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `operation` object provided to 
		 *   this method as the first argument.
		 */
		destroy : Class.abstractMethod
		
	} );
	
	return Proxy;
	
} );