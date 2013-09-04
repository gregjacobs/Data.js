/*global define */
define( [
	'data/persistence/proxy/Proxy',  // for registering the proxy
	'data/persistence/proxy/WebStorage'
], function( Proxy, WebStorageProxy ) {
	
	/**
	 * @class data.persistence.proxy.SessionStorage
	 * @extends data.persistence.proxy.WebStorage
	 * @alias type.sessionstorage
	 * 
	 * The SessionStorage proxy is used for storing models using the HTML5 session storage mechanism.
	 * 
	 * ## Example
	 * 
	 * The proxy may be used as such:
	 * 
	 *     define( [
	 *         'data/Model',
	 *         'data/persistence/proxy/SessionStorage'
	 *     ], function( Model, SessionStorage ) {
	 *     
	 *          var MyModel = Model.extend( {
	 *              attributes : [ ... ],
	 *              
	 *              proxy : new SessionStorage( {
	 *                  storageKey : 'MyModel'
	 *              } );
	 *          } );
	 * 
	 *          return MyModel;
	 *          
	 *     } );
	 * 
	 * 
	 * ## Limitations
	 * 
	 * At this time, the SessionStorage proxy will only store nested data with no circular references. Circular
	 * reference support will be added in a later release.
	 * 
	 * See the superclass, {@link data.persistence.proxy.WebStorage WebStorage}, for details on browser support. 
	 */
	var SessionStorageProxy = WebStorageProxy.extend( {
		
		/**
		 * Retrieves the WebStorage medium to use.
		 * 
		 * @protected
		 * @abstract
		 * @return {Object} The `window.sessionStorage` object, or `undefined` if session storage is unavailable.
		 */
		getStorageMedium : function() {
			return window.sessionStorage;
		}
		
	} );
	
	// Register the persistence proxy so that it can be created by an object literal with a `type` property
	Proxy.register( 'sessionstorage', SessionStorageProxy );
	
	return SessionStorageProxy;
	
} );