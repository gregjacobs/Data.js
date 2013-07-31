/*global define */
define( [
	'lodash',
	'Class',
	'data/persistence/request/Request'
], function( _, Class, Request ) {
	
	/**
	 * @abstract
	 * @class data.persistence.request.Write
	 * @extends data.persistence.request.Request
	 * 
	 * Abstract base class which represents a write request to a persistent storage mechanism. This includes creating, updating, 
	 * or destroying (deleting) models on the persistent storage.
	 * 
	 * This class is used internally by the framework when making requests to {@link data.persistence.proxy.Proxy Proxies}.
	 */
	var WriteRequest = Class.extend( Request, {
		abstractClass : true,
		
		
		/**
		 * @cfg {data.Model[]} models
		 * 
		 * The models to write during the WriteRequest.
		 */
		
		
		/**
		 * Retrieves the {@link #models} provided for this WriteRequest.
		 * 
		 * @return {data.Model[]}
		 */
		getModels : function() {
			return ( this.models || (this.models = []) );
		}
		
	} );
	
	return WriteRequest;
	
} );