/*global define */
define( [
	'lodash',
	'Class',
	'Observable',
	
	'data/persistence/proxy/Proxy'
], function( _, Class, Observable, Proxy ) {
	
	var abstractMethod = Class.abstractMethod;
	

	/**
	 * @private
	 * @abstract
	 * @class data.DataComponent
	 * @extends Observable
	 * 
	 * Base class for data-holding classes ({@link data.Model} and {@link data.Collection}), that abstracts out some
	 * of the commonalities between them.
	 * 
	 * This class is used internally by the framework, and shouldn't be used directly.
	 */
	var DataComponent = Observable.extend( {
		abstractClass : true,
		
		
		inheritedStatics : {
			
			/**
			 * @static
			 * @inheritable
			 * @property {Boolean} isDataComponentClass (readonly)
			 * 
			 * A property simply to identify DataComponent classes (constructor functions) as such. This is so that we don't need circular dependencies 
			 * in some of the other Data.js files, which only bring in the DataComponent class in order to determine if a function is in fact a 
			 * DataComponent constructor function.
			 * 
			 * Although RequireJS supports circular dependencies, compiling in advanced mode with the Google Closure Compiler requires that
			 * no circular dependencies exist.
			 */
			isDataComponent : true,
			
			/**
			 * Retrieves the {@link data.persistence.proxy.Proxy} that is configured for the DataComponent class. To retrieve
			 * a proxy that may belong to a particular DataComponent instance, use the instance level {@link #method-getProxy}.
			 * 
			 * @inheritable
			 * @static
			 * @return {data.persistence.proxy.Proxy} The Proxy configured with the Model, or null.
			 */
			getProxy : function() {
				return this.prototype.proxy || null;
			},
			
			
			/**
			 * Subclass-specific setup. This method instantiates any anonymous proxy configuration object
			 * set to the prototype of the class into a {@link data.persistence.proxy.Proxy} instance.
			 * 
			 * @ignore
			 */
			onClassCreated : function( newDataComponentClass ) {
				var proto = newDataComponentClass.prototype;
				
				// Instantiate an anonymous proxy configuration object on the class's prototype into a Proxy instance
				if( proto.hasOwnProperty( 'proxy' ) && proto.proxy && !( proto.proxy instanceof Proxy ) ) {
					proto.proxy = Proxy.create( proto.proxy );
				}
			}
			
		},
		
		
		/**
		 * @cfg {data.persistence.proxy.Proxy} proxy
		 * 
		 * The persistence proxy to use (if any) to load or persist the DataComponent's data to/from persistent
		 * storage. If this is not specified, the DataComponent may not save or load its data to/from an external
		 * source. (Note that the way that the DataComponent loads/saves its data is dependent on the particular
		 * implementation.)
		 */
		
		
		/**
		 * @property {Boolean} isDataComponent (readonly)
		 * 
		 * A property simply to identify DataComponent instances as such. This is so that we don't need circular dependencies in some of the
		 * other Data.js files, which only bring in the DataComponent class for an `instanceof` check to determine if a given value is a
		 * DataComponent.
		 * 
		 * Although RequireJS supports circular dependencies, compiling in advanced mode with the Google Closure Compiler requires that
		 * no circular dependencies exist.
		 */
		isDataComponent : true,
		
		/**
		 * @protected
		 * @property {String} clientId (readonly)
		 * 
		 * A unique ID for the Model on the client side. This is used to uniquely identify each Model instance.
		 * Retrieve with {@link #getClientId}.
		 */
		
		
		/**
		 * @constructor
		 */
		constructor : function() {
			// Call the superclass's constructor (Observable)
			this._super( arguments );
			
			// Create a client ID for the DataComponent
			this.clientId = 'c' + _.uniqueId();
		},
		
		
		/**
		 * Retrieves the DataComponent's unique {@link #clientId}.
		 * 
		 * @return {String} The DataComponent's unique {@link #clientId}. 
		 */
		getClientId : function() {
			return this.clientId;
		},
		
		
		/**
		 * Retrieves the native JavaScript value for the DataComponent.
		 * 
		 * @abstract
		 * @method getData
		 * @param {Object} [options] An object (hash) of options to change the behavior of this method. This object is sent to
		 *   the {@link data.NativeObjectConverter#convert NativeObjectConverter's convert method}, and accepts all of the options
		 *   that the {@link data.NativeObjectConverter#convert} method does. See that method for details.
		 * @return {Object} A hash of the data, where the property names are the keys, and the values are the {@link data.attribute.Attribute Attribute} values.
		 */
		getData : abstractMethod,
		
		
		/**
		 * Determines if the DataComponent has any modifications.
		 * 
		 * @abstract
		 * @method isModified
		 * @param {Object} [options] An object (hash) of options to change the behavior of this method.  Options may include:
		 * @param {Boolean} [options.persistedOnly=false] True to have the method only return true if a {@link data.attribute.Attribute#persist persisted} 
		 *   attribute of a Model is modified within the DataComponent.
		 * @return {Boolean}
		 */
		isModified : abstractMethod,
		
		
		/**
		 * Commits the data in the DataComponent, so that it is no longer considered "modified".
		 * 
		 * @abstract
		 * @method commit
		 */
		commit : abstractMethod,
		
		
		/**
		 * Rolls the data in the DataComponent back to its state before the last {@link #commit}
		 * or rollback.
		 * 
		 * @abstract
		 * @method rollback
		 */
		rollback : abstractMethod,
		
		
		/**
		 * Determines if the DataComponent is currently loading data, through its {@link #proxy}.
		 * 
		 * @abstract
		 * @method isLoading
		 * @return {Boolean} `true` if the DataComponent is currently loading, `false` otherwise.
		 */
		isLoading : abstractMethod,
		
			
		/**
		 * Sets a {@link data.persistence.proxy.Proxy} to this particular DataComponent instance. Setting a 
		 * proxy with this method will only affect this particular DataComponent instance, not any others.
		 * 
		 * To configure a proxy that will be shared between all instances of the DataComponent, set one in a DataComponent 
		 * subclass. Example of doing this:
		 * 
		 *     define( [
		 *         'data/Model',
		 *         'data/persistence/proxy/Ajax'
		 *     ], function( Model, AjaxProxy ) {
		 *         
		 *         var UserModel = Model.extend( {
		 *             attributes : [ 'id', 'firstName', 'lastName' ],
		 *         
		 *             proxy : new AjaxProxy( {
		 *                 url : '/users'
		 *             } )
		 *         } );
		 *         
		 *         return UserModel;
		 *         
		 *     } );
		 * 
		 * @param {data.persistence.proxy.Proxy/Object} The Proxy to set to this DataComponent instance. May also be an
		 *   anonymous Proxy configuration object, which must have a `type` property. Ex: `{ type: 'ajax', url: '...' }`.
		 */
		setProxy : function( proxy ) {
			this.proxy = proxy;
		},
		
		
		/**
		 * Retrieves the {@link data.persistence.proxy.Proxy Proxy} that is configured for this DataComponent. This will be
		 * any Proxy set to the DataComponent instance itself using {@link #setProxy}, or otherwise will be the Proxy set to
		 * the DataComponent's prototype. (See example of how to set up a proxy on the prototype in {@link #setProxy}.) 
		 * 
		 * Note: To retrieve the proxy that belongs to the DataComponent class (or subclass) itself, use the static 
		 * {@link #static-method-getProxy} method.
		 * 
		 * @return {data.persistence.proxy.Proxy} The Proxy configured for the DataComponent, or `null`.
		 */
		getProxy : function() {
			var proxy = this.proxy;
			
			// Lazily instantiate an anonymous config object into a Proxy instance, if that is what exists
			if( proxy && !( proxy instanceof Proxy ) ) {
				this.proxy = proxy = Proxy.create( proxy );
			}
			
			return proxy || null;
		}
		
	} );
	
	return DataComponent;
	
} );