/*global define, window, Ext, Y, JsMockito, tests */
define( [
	'lodash',
	'data/Model',
	'data/persistence/RestProxy',
	'data/persistence/operation/WriteOperation'
], function( _, Model, RestProxy, WriteOperation ) {

	tests.integration.persistence.add( new Ext.test.TestSuite( {
		
		name: 'RestProxy with Nested Models',
		
		
		items : [
			
			{
				/*
				 * Test updating when nested model attributes are changed
				 */
				name : "Test updating when nested model attributes are changed",
				
				setUp : function() {
					// A RestProxy subclass used for testing
					this.ajaxCallCount = 0;
					this.RestProxy = RestProxy.extend( {
						ajax : _.bind( function() { 
							this.ajaxCallCount++; 
							return {};  // just an anonymous "ajax" object 
						}, this )
					} );
					
					this.ParentModel = Model.extend( {
						attributes : [
							{ name: 'id', type: 'string' },
							{ name: 'child', type: 'model', embedded: true }
						]
					} );
					
					this.ChildModel = Model.extend( {
						attributes : [
							{ name : 'persistedAttr', type: 'string' },
							{ name : 'unpersistedAttr', type: 'string', persist: false }
						]
					} );
				},
				
				
				"The parent model should *not* be persisted when only a non-persisted attribute of a nested model is changed" : function() {
					var childModel = new this.ChildModel();
					var parentModel = new this.ParentModel( {
						id: 1,
						child: childModel
					} );
					childModel.set( 'unpersistedAttr', 'newValue' );
					
					var proxy = new this.RestProxy(),
					    operation = new WriteOperation( { models: [ parentModel ] } );
					
					proxy.update( operation );
					
					Y.Assert.areSame( this.ajaxCallCount, 0, "The update() method should not have made an ajax request, because there should have been nothing to persist" );
				}
				
			}
		
		]
		
	} ) );
	
} );