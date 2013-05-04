/*global define, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/attribute/Object',
	'data/Model'
], function( ObjectAttribute, Model ) {
	
	describe( "data.attribute.Object", function() {
		
		describe( "Test the defaultValue", function() {
			
			it( "The default defaultValue for Object Attribute should be null", function() {
				expect( ObjectAttribute.prototype.defaultValue ).toBe( null );
			} );
			
		} );
		
		
		describe( 'convert()', function() {
			
			it( "should return null when provided any falsy value, or non-object", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new ObjectAttribute( { name: 'attr' } ),
				    oldValue,  // undefined
				    value;
				
				value = attribute.convert( 0 );
				expect( value ).toBe( null );
				
				value = attribute.convert( 1 );
				expect( value ).toBe( null );
				
				value = attribute.convert( "" );
				expect( value ).toBe( null );
				
				value = attribute.convert( "hi" );
				expect( value ).toBe( null );
				
				value = attribute.convert( false );
				expect( value ).toBe( null );
				
				value = attribute.convert( true );
				expect( value ).toBe( null );
				
				value = attribute.convert( undefined );
				expect( value ).toBe( null );
				
				value = attribute.convert( null );
				expect( value ).toBe( null );
			} );
			
			
			it( "should return an object unchanged", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new ObjectAttribute( { name: 'attr' } ),
				    oldValue;  // undefined
				
				var data = { attr1: 1, attr2: 2 };
				var value = attribute.convert( data );
				
				expect( value ).toBe( data );
			} );
			
		} );
		
	} );
} );