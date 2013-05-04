/*global define, window, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/Model'
], function( Model ) {

	describe( "Integration: Model with Object Attribute", function() {
		
		describe( "Test defaultValue of Object Attribute", function() {
			
			it( "The defaultValue for an Object Attribute should be null", function() {
				var MyModel = Model.extend( {
					attributes : [
						{
							name : 'attr',
							type : 'object'
						}
					]
				} );
				
				var model = new MyModel();
				expect( model.get( 'attr' ) ).toBe( null );
			} );
			
		} );
		
	} );
	
} );