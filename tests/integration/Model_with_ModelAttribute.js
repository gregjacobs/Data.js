/*global define, window, Ext, Y, JsMockito, tests */
define( [
	'data/Model'
], function( Model ) {
	
	tests.integration.add( new Ext.test.TestSuite( {
		
		name: 'Model with Model Attribute',
		
		
		items : [
			{
				/*
				 * Test provided set() function
				 */
				name : "Test provided set() function",
				
				
				"The set() function provided to a Model Attribute should be passed the instantiated Model if a 'modelClass' config is provided" : function() {
					var setValue;
					
					var InnerModel = Model.extend( {
						attributes : [ 'someAttr' ]
					} );
					
					var MyModel = Model.extend( {
						attributes : [
							{
								name : 'attr',
								type : 'model',
								modelClass : InnerModel,
								
								set : function( value ) {
									setValue = value;
									return value;
								}
							}
						]
					} );
					
					var model = new MyModel( {
						attr : { someAttr: 1 }
					} );
					Y.Assert.isInstanceOf( InnerModel, setValue );
				}
			},
			
			
			{
				/*
				 * Test retrieving the inner model from the outer model after it is set
				 */
				name : "Test retrieving the inner model from the outer model after it is set",
				
				
				"The get() method should be able to retrieve the Model after it has been set" : function() {
					var InnerModel = Model.extend( {
						attributes : [ 'someValue' ]
					} );
					
					var MyModel = Model.extend( {
						attributes : [
							{
								name : 'innerModel',
								type : 'model',
								modelClass : InnerModel
							}
						]
					} );
					
					var model = new MyModel( {
						innerModel : { someValue: 1 }
					} );
					var innerModel = model.get( 'innerModel' );
					
					Y.Assert.isInstanceOf( InnerModel, innerModel );
				}
			}
		]
		
	} ) );
} );