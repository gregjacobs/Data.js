/*global define */
define( [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @abstract
	 * @class Data.persistence.Operation
	 * 
	 * Represents an operation for a {@link Data.persistence.Proxy} to carry out. This class basically represents 
	 * any CRUD operation to be performed. Its subclasses are split into two distinct implementations:
	 * 
	 * - {@link Data.persistence.ReadOperation}: Represents an Operation to read (load) data from persistence storage.
	 * - {@link Data.persistence.WriteOperation}: Represents an Operation to write (store) data to persistence storage.
	 *   This includes destroying (deleting) models as well.
	 * 
	 * This class is used internally by the framework when making requests to {@link Data.persistence.Proxy Proxies},
	 * but is provided to client callbacks for when {@link Data.Model Model}/{@link Data.Collection Collection} operations 
	 * complete.
	 */
	var Operation = Class.extend( Object, {
		
		/**
		 * @cfg {Object} params
		 * 
		 * Any parameters to pass along for the Operation.
		 */
		
		
		/**
		 * @protected
		 * @property {Data.Model[]} models
		 * 
		 * All Operations operate on a set of models. This protected property allows their storage.
		 * The models can be retrieved from {@link #getModels}.
		 */
		
		
		/**
		 * @constructor
		 * @param {Object} [cfg] Any of the configuration options for this class, in an Object (map).
		 */
		constructor : function( cfg ) {
			_.assign( this, cfg );
		},
		
		
		/**
		 * Retrieves the {@link #params} for this Operation. Returns an empty
		 * object if no params were provided.
		 * 
		 * @return {Object}
		 */
		getParams : function() {
			return ( this.params || (this.params = {}) );
		},
		
		
		/**
		 * Retrieves the {@link #models} provided for this Operation, or retrieves the models that
		 * were set to the Operation object by a 'read' operation (when the request completed).
		 * 
		 * @return {Data.Model[]}
		 */
		getModels : function() {
			return ( this.models || (this.models = []) );
		}
		
	} );
	
	return Operation;
	
} );