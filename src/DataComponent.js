/*global define */
define( [
	'lodash',
	'Class',
	'Observable',
	'data/persistence/proxy/Proxy'
], function( _, Class, Observable, Proxy ) {

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
	var DataComponent = Class.extend( Observable, {
		abstractClass : true,
		
		/**
		 * @cfg {data.persistence.proxy.Proxy} proxy
		 * 
		 * The persistence proxy to use (if any) to load or persist the DataComponent's data to/from persistent
		 * storage. If this is not specified, the DataComponent may not save or load its data to/from an external
		 * source. (Note that the way that the DataComponent loads/saves its data is dependent on the particular
		 * implementation.)
		 */
		proxy : null,
		
		
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
		getData : Class.abstractMethod,
		
		
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
		isModified : Class.abstractMethod,
		
		
		/**
		 * Commits the data in the DataComponent, so that it is no longer considered "modified".
		 * 
		 * @abstract
		 * @method commit
		 */
		commit : Class.abstractMethod,
		
		
		/**
		 * Rolls the data in the DataComponent back to its state before the last {@link #commit}
		 * or rollback.
		 * 
		 * @abstract
		 * @method rollback
		 */
		rollback : Class.abstractMethod,
		
		
		/**
		 * Creates a {@link data.persistence.proxy.Proxy Proxy} instance from an anonymous config object. If a Proxy instance is provided instead of an
		 * anonymous config object, it will simply be returned.
		 * 
		 * @protected
		 * @param {Object/data.persistence.proxy.Proxy} The anonymous object which should be instantiated into a {@link data.persistence.proxy.Proxy Proxy}
		 *   instance. This configuration object must have the `type` property specifying the Proxy type. The `type` property must correspond to a registered 
		 *   (and loaded) {@link data.persistence.proxy.Proxy Proxy} class. If a Proxy instance is provided, it will simply be returned.
		 * @return {data.persistence.proxy.Proxy}
		 */
		createProxy : function( proxy ) {
			// instantiate an anonymous config object to a Proxy instance
			if( !( proxy instanceof Proxy ) ) {
				proxy = Proxy.create( proxy );
			}
			return proxy;
		},
		
		
		/**
		 * Sets the {@link #proxy} for this DataComponent instance.
		 * 
		 * @param {Object/data.persistence.proxy.Proxy} The proxy to set to the DataComponent. This may be a `proxy` configuration object,
		 *   which must have the `type` property specifying the proxy type. The `type` property must correspond to a registered (and loaded)
		 *   {@link data.persistence.proxy.Proxy Proxy}.
		 */
		setProxy : function( proxy ) {
			this.proxy = this.createProxy( proxy );
		},
		
		
		/**
		 * Gets the {@link #proxy} that is currently configured for this DataComponent.
		 * 
		 * @return {data.persistence.proxy.Proxy} The configured persistence proxy, or `null` if there is none configured.
		 */
		getProxy : function() {
			return this.proxy;
		}
		
	} );
	
	return DataComponent;
	
} );