/*global define */
define( [
	'lodash',
	'Class',
	'Observable'
], function( _, Class, Observable ) {
	
	/**
	 * @abstract
	 * @class Data.persistence.Proxy
	 * @extends Observable
	 * 
	 * Proxy is the base class for subclasses that perform CRUD (Create, Read, Update, and Delete) operations on the server.
	 * 
	 * @param {Object} config The configuration options for this class, specified in an object (hash).
	 */
	var Proxy = Class.extend( Observable, {
		abstractClass : true,
		
		
		constructor : function( config ) {
			// Apply the config
			_.assign( this, config );
		},
		
		
		/**
		 * Creates a Model on the server.
		 * 
		 * @abstract
		 * @method create
		 * @param {Data.Model} model The Model instance to create on the server.
		 */
		create : Class.abstractMethod,
		
		
		/**
		 * Reads a Model from the server.
		 * 
		 * @abstract
		 * @method read
		 * @param {Data.Model} model The Model instance to read from the server.
		 */
		read : Class.abstractMethod,
		
		
		/**
		 * Updates the Model on the server, using the provided `data`.  
		 * 
		 * @abstract
		 * @method update
		 * @param {Data.Model} model The model to persist to the server. 
		 */
		update : Class.abstractMethod,
		
		
		/**
		 * Destroys (deletes) the Model on the server. This method is not named "delete" as "delete" is a JavaScript reserved word.
		 * 
		 * @abstract
		 * @method destroy
		 * @param {Data.Model} model The Model instance to delete on the server.
		 */
		destroy : Class.abstractMethod
		
	} );
	
	
	// Apply Static Properties
	_.assign( Proxy, {
		
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
				throw new Error( "Data.persistence.Proxy.create(): No `type` property provided on persistenceProxy config object" );
				 
			} else {
				// No registered Proxy type with the given type, throw an error
				throw new Error( "Data.persistence.Proxy.create(): Unknown Proxy type: '" + type + "'" );
			}
		}
	
	} );
	
	return Proxy;
	
} );