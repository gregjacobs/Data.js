/*global define */
define( [
	'spec/lib/DeferredTestCreator',
	
	'data/persistence/operation/Operation',
	
	'data/Model',
	'data/persistence/proxy/Proxy'
], function( DeferredTestCreator, Operation, Model, Proxy ) {
	
	/**
	 * @class spec.unit.persistence.operation.OperationSpec.DeferredTestCreator
	 * @extends spec.lib.DeferredTestCreator
	 * 
	 * DeferredTestCreator class for the {@link data.persistence.operation.Operation Operation} class.
	 */
	var OperationDeferredTestCreator = DeferredTestCreator.extend( {
		
		/**
		 * @protected
		 * @property {Function} ConcreteOperation
		 * 
		 * A concrete subclass of {@link data.persistence.operation.Operation} to use for testing.
		 */
		ConcreteOperation : Operation.extend( {} ),
		
		/**
		 * @protected
		 * @property {Function} ConcreteProxy
		 * 
		 * A concrete subclass of {@link data.persistence.proxy.Proxy} to use for testing.
		 */
		ConcreteProxy : Proxy.extend( {
			create  : function() {},
			read    : function() {},
			update  : function() {},
			destroy : function() {}
		} ),
		
		
		/**
		 * Implementation of abstract method create the {@link data.persistence.operation.Operation Operation}
		 * instance.
		 * 
		 * @protected
		 * @return {data.persistence.operation.Operation}
		 */
		createDeferredInstance : function() {
			var anonymousModel = new Model(),
			    proxy = new this.ConcreteProxy();
			
			return new this.ConcreteOperation( { dataComponent: anonymousModel, proxy: proxy } );
		}
		
	} );
	
	
	return OperationDeferredTestCreator;
	
} );