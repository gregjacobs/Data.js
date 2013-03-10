/*global define */
define( [
	'lodash',
	'Class',
	'data/persistence/operation/Operation'
], function( _, Class, Operation ) {
	
	/**
	 * @class Data.persistence.operation.WriteOperation
	 * @extends Data.persistence.operation.Operation
	 * 
	 * Represents a write operation to a persistent storage mechanism. This includes creating, updating, or destroying
	 * (deleting) models on the persistent storage.
	 * 
	 * This class is used internally by the framework when making requests to {@link Data.persistence.Proxy Proxies},
	 * but is provided to client callbacks for when {@link Data.Model Model}/{@link Data.Collection Collection} operations 
	 * complete.
	 */
	var WriteOperation = Class.extend( Operation, {
		
		/**
		 * @cfg {Data.Model[]} models
		 * 
		 * The models to write during the WriteOperation.
		 */
		
		
		/**
		 * Retrieves the {@link #models} provided for this WriteOperation.
		 * 
		 * @return {Data.Model[]}
		 */
		getModels : function() {
			return ( this.models || (this.models = []) );
		}
		
	} );
	
	return WriteOperation;
	
} );