/*global define, window, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/Model'
], function( Model ) {
	
	describe( "integration.Model with Model Attribute", function() {
		
		describe( "Test provided set() function", function() {
			
			it( "The set() function provided to a Model Attribute should be passed the instantiated Model if a `model` config is provided on the attribute", function() {
				var setValue;
				
				var InnerModel = Model.extend( {
					attributes : [ 'someAttr' ]
				} );
				
				var MyModel = Model.extend( {
					attributes : [
						{
							name  : 'attr',
							type  : 'model',
							model : InnerModel,
							
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
				expect( setValue instanceof InnerModel ).toBe( true );
			} );
			
		} );
		
		
		describe( "Test retrieving the inner model from the outer model after it is set", function() {
			
			it( "The get() method should be able to retrieve the Model after it has been set", function() {
				var InnerModel = Model.extend( {
					attributes : [ 'someValue' ]
				} );
				
				var MyModel = Model.extend( {
					attributes : [
						{
							name  : 'innerModel',
							type  : 'model',
							model : InnerModel
						}
					]
				} );
				
				var model = new MyModel( {
					innerModel : { someValue: 1 }
				} );
				var innerModel = model.get( 'innerModel' );
				
				expect( innerModel instanceof InnerModel ).toBe( true );
			} );
			
		} );
		
	} );
} );