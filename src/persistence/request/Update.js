/*global define */
define( [
	'data/persistence/request/Write'
], function( WriteRequest ) {
	
	/**
	 * @class data.persistence.request.Update
	 * @extends data.persistence.request.Write
	 * 
	 * Represents an "update" CRUD request to a persistent storage mechanism. 
	 */
	var UpdateRequest = WriteRequest.extend( {
		
		/**
		 * Implementation of abstract method to return the {@link data.persistence.proxy.Proxy Proxy}
		 * CRUD action name for the Request.
		 * 
		 * @protected
		 * @return {String} Always returns 'update' for the UpdateRequest.
		 */
		getAction : function() {
			return 'update';
		}
		
	} );
	
	return UpdateRequest;
	
} );