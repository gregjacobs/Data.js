/*global define */
define( [
	'data/persistence/operation/Operation'
], function( Operation ) {
	
	/**
	 * @class data.persistence.operation.Destroy
	 * @extends data.persistence.operation.Operation
	 *
	 * Represents a high level Destroy operation performed on a {@link data.Model Model}, or part of a
	 * sync operation on a {@link data.Collection Collection}. See the superclass for details.
	 */
	var DestroyOperation = Operation.extend( {
		
	} );
	
	return DestroyOperation;
	
} );