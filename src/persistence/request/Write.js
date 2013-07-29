/*global define */
define( [
	'lodash',
	'Class',
	'data/persistence/request/Request'
], function( _, Class, Request ) {
	
	/**
	 * @class data.persistence.request.Write
	 * @extends data.persistence.request.Request
	 * 
	 * Represents a write request to a persistent storage mechanism. This includes creating, updating, or destroying
	 * (deleting) models on the persistent storage.
	 * 
	 * This class is used internally by the framework when making requests to {@link data.persistence.proxy.Proxy Proxies},
	 * but is provided to client callbacks for when {@link data.Model Model}/{@link data.Collection Collection} requests 
	 * complete.
	 */
	var WriteRequest = Class.extend( Request, {
		
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