/*global window, Ext, Y, JsMockito, tests, Data */
tests.integration.add( new Ext.test.TestSuite( {
	
	name: 'Model with Object Attribute',
	
	
	items : [
		{
			/*
			 * Test defaultValue of Object Attribute
			 */
			name : "Test defaultValue of Object Attribute",
			
			
			"The defaultValue for an Object Attribute should be null" : function() {
				var Model = Data.Model.extend( {
					attributes : [
						{
							name : 'attr',
							type : 'object'
						}
					]
				} );
				
				var model = new Model();
				Y.Assert.isNull( model.get( 'attr' ) );
			}
		}
	]
	
} ) );