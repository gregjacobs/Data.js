/*global define */
define( [
	'data/persistence/request/Write'
], function( WriteRequest ) {
	
	/**
	 * @class data.persistence.request.Create
	 * @extends data.persistence.request.Write
	 * 
	 * Represents a "create" CRUD request to a persistent storage mechanism. 
	 */
	var CreateRequest = WriteRequest.extend( {
		
		/**
		 * Implementation of abstract method to return the {@link data.persistence.proxy.Proxy Proxy}
		 * CRUD action name for the Request.
		 * 
		 * @protected
		 * @return {String} Always returns 'create' for the CreateRequest.
		 */
		getAction : function() {
			return 'create';
		}
		
	} );
	
	return CreateRequest;
	
} );