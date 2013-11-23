/*global define, window, describe, beforeEach, afterEach, it, expect */
define( [
	'data/Model',
	'data/attribute/Float'
], function( Model ) {
	
	describe( "Integration: Model with Float Attribute", function() {
		
		it( "The attribute should have a default value of 0, if `useNull` is false", function() {
			var MyModel = Model.extend( {
				attributes : [
					{ name : 'floatAttr', type: 'float' }
				]
			} );

			var model = new MyModel();
			expect( model.get( 'floatAttr' ) ).toBe( 0 );
			
			var model2 = new MyModel( {} );
			expect( model2.get( 'floatAttr' ) ).toBe( 0 );
		} );
		
		
		it( "The attribute should have a default value of `null`, if `useNull` is true", function() {
			var MyModel = Model.extend( {
				attributes : [
					{ name : 'floatAttr', type: 'float', useNull: true }
				]
			} );
			
			var model = new MyModel();
			expect( model.get( 'floatAttr' ) ).toBe( null );
			
			var model2 = new MyModel( {} );
			expect( model2.get( 'floatAttr' ) ).toBe( null );
		} );
		
	} );
} );