/*global define */
define( [
	'data/persistence/proxy/Proxy',  // for registering the proxy
	'data/persistence/proxy/WebStorage'
], function( Proxy, WebStorageProxy ) {
	
	/**
	 * @class data.persistence.proxy.LocalStorage
	 * @extends data.persistence.proxy.WebStorage
	 * @alias type.localstorage
	 * 
	 * The LocalStorage proxy is used for storing models using the HTML5 local storage mechanism.
	 * 
	 * ## Example
	 * 
	 * The proxy may be used as such:
	 * 
	 *     define( [
	 *         'data/Model',
	 *         'data/persistence/proxy/LocalStorage'
	 *     ], function( Model, LocalStorageProxy ) {
	 *     
	 *          var MyModel = Model.extend( {
	 *              attributes : [ ... ],
	 *              
	 *              proxy : new LocalStorageProxy( {
	 *                  storageKey : 'MyModel'
	 *              } );
	 *          } );
	 * 
	 *          return MyModel;
	 *          
	 *     } );
	 * 
	 * ## Limitations
	 * 
	 * At this time, the LocalStorage proxy will only store nested data with no circular references. Circular
	 * reference support will be added in a later release.
	 * 
	 * See the superclass, {@link data.persistence.proxy.WebStorage WebStorage}, for details on browser support. 
	 */
	var LocalStorageProxy = WebStorageProxy.extend( {
		
		/**
		 * Retrieves the WebStorage medium to use.
		 * 
		 * @protected
		 * @abstract
		 * @return {Object} The `window.localStorage` object, or `undefined` if local storage is unavailable.
		 */
		getStorageMedium : function() {
			return window.localStorage;
		}
		
	} );
	
	// Register the persistence proxy so that it can be created by an object literal with a `type` property
	Proxy.register( 'localstorage', LocalStorageProxy );
	
	return LocalStorageProxy;
	
} );