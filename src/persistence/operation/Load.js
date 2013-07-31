/*global define */
define( [
	'data/persistence/operation/Operation'
], function( Operation ) {
	
	/**
	 * @class data.persistence.operation.Load
	 * @extends data.persistence.operation.Operation
	 *
	 * Represents a high level Load operation performed on a {@link data.Model Model} or {@link data.Collection Collection}.
	 * See the superclass for details.
	 */
	var ReadOperation = Operation.extend( {
		
		/**
		 * @cfg {Boolean} addModels
		 * 
		 * This config is only relevant when loading a {@link data.Collection Collection}. Specifies if 
		 * models loaded by this Operation should be added to the Collection (`true`), or should replace
		 * the current contents of the Collection (`false`).
		 */
		addModels : false,
		
		
		/**
		 * Returns the value of the {@link #addModels} config. See {@link #addModels} for details.
		 * 
		 * @return {Boolean}
		 */
		isAddModels : function() {
			return this.addModels;
		}
		
	} );
	
	return ReadOperation;
	
} );