/*global define, window, describe, beforeEach, afterEach, it, expect */
define( [
	'data/Model'
], function( Model ) {
	
	describe( "Integration: Model with Model Attribute", function() {
		
		it( "The get() method should be able to retrieve the inner Model after it has been instantiated via anonymous data object", function() {
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