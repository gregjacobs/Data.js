/*global window, Ext, Y, JsMockito, tests, Data */
tests.integration.add( new Ext.test.TestSuite( {
	
	name: 'Model with ObjectAttribute',
	
	
	items : [
		{
			/*
			 * Test defaultValue of ObjectAttribute
			 */
			name : "Test defaultValue of ObjectAttribute",
			
			
			"The defaultValue for an ObjectAttribute should be null" : function() {
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