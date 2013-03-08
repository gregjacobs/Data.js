/*global define */
define( [
	'lodash',
	'Class',
	'data/persistence/Operation'
], function( _, Class, Operation ) {
	
	/**
	 * @class Data.persistence.WriteOperation
	 * @extends Data.persistence.Operation
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
		 * @cfg {String} action (required)
		 * 
		 * One of: 'create', 'update', 'destroy', to represent the write action that the Operation is performing.
		 */
		
		/**
		 * @cfg {Data.Model[]} models
		 * 
		 * The models to write during the WriteOperation.
		 */
		
		
		/**
		 * @constructor
		 * @param {Object} [cfg] Any of the configuration options for this class, in an Object (map).
		 */
		constructor : function( cfg ) {
			this._super( arguments );
			
			// <debug>
			if( !_.contains( [ 'create', 'update', 'destroy' ], this.action ) ) {
				throw new Error( "'action' config must be provided, and one of: 'create', 'update', destroy'" );
			}
			// </debug>
		},
		
		
		/**
		 * Sets the {@link #models} for the Operation.
		 * 
		 * @param {Data.Model[]} models The models to set to the Operation.
		 */
		setModels : function( models ) {
			this.models = models;
		}
		
	} );
	
	return WriteOperation;
	
} );