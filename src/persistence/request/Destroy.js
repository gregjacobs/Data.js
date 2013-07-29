/*global define */
define( [
	'data/persistence/request/Write'
], function( WriteRequest ) {
	
	/**
	 * @class data.persistence.request.Destroy
	 * @extends data.persistence.request.Write
	 * 
	 * Represents a "destroy" (delete) CRUD request to a persistent storage mechanism.
	 */
	var DestroyRequest = WriteRequest.extend( {
		
		/**
		 * Implementation of abstract method to return the {@link data.persistence.proxy.Proxy Proxy}
		 * CRUD action name for the Request.
		 * 
		 * @protected
		 * @return {String} Always returns 'destroy' for the DestroyRequest.
		 */
		getAction : function() {
			return 'destroy';
		}
		
	} );
	
	return DestroyRequest;
	
} );