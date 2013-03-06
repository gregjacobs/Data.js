/*global define, window, Ext, Y, JsMockito, tests */
define( [
	'data/Model',
	'data/attribute/Object'  // used in the tests with type: 'object'
], function( Model ) {

	tests.integration.add( new Ext.test.TestSuite( {
		
		name: 'Model with Object Attribute',
		
		
		items : [
			{
				/*
				 * Test defaultValue of Object Attribute
				 */
				name : "Test defaultValue of Object Attribute",
				
				
				"The defaultValue for an Object Attribute should be null" : function() {
					var MyModel = Model.extend( {
						attributes : [
							{
								name : 'attr',
								type : 'object'
							}
						]
					} );
					
					var model = new MyModel();
					Y.Assert.isNull( model.get( 'attr' ) );
				}
			}
		]
		
	} ) );
	
} );