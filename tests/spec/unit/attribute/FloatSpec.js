/*global define, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/attribute/Float',
	'data/Model'
], function( FloatAttribute, Model ) {

	describe( "data.attribute.Float", function() {
		
		describe( "Test getDefaultValue()", function() {
			
			it( "getDefaultValue() should return 0 in the default case (i.e. when the `useNull` config is false)", function() {
				var attribute = new FloatAttribute( { name: 'attr', useNull: false } );
				
				expect( attribute.getDefaultValue() ).toBe( 0 );
			} );
			
			
			it( "getDefaultValue() should return null when the `useNull` config is true", function() {
				var attribute = new FloatAttribute( { name: 'attr', useNull: true } );
				
				expect( attribute.getDefaultValue() ).toBe( null );
			} );
			
		} );
		
		
		describe( 'convert()', function() {
			
			it( "should return the appropriate string value when provided a range of values and types, when the useNull config is false", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new FloatAttribute( { name: 'attr', useNull: false } ),
				    oldValue,  // undefined
				    value;
				
				// Test with undefined and null
				value = attribute.convert( undefined );
				expect( value ).toBe( 0 );
				
				value = attribute.convert( null );
				expect( value ).toBe( 0 );
				
				
				// Test with booleans
				value = attribute.convert( false );
				expect( value ).toBe( 0 );
				
				value = attribute.convert( true );
				expect( value ).toBe( 0 );
				
				
				// Test with numbers
				value = attribute.convert( 0 );
				expect( value ).toBe( 0 );
				
				value = attribute.convert( 1 );
				expect( value ).toBe( 1 );
				
				value = attribute.convert( 1.42 );
				expect( value ).toBe( 1.42 );
				
				
				// Test with actual strings
				value = attribute.convert( "" );
				expect( value ).toBe( 0 );
				
				value = attribute.convert( "hi" );
				expect( value ).toBe( 0 );
				
				value = attribute.convert( "true" );
				expect( value ).toBe( 0 );
				
				value = attribute.convert( "1" );
				expect( value ).toBe( 1 );
				
				value = attribute.convert( "1.11" );
				expect( value ).toBe( 1.11 );
				
				
				// Test with an object
				value = attribute.convert( {} );
				expect( value ).toBe( 0 );
			} );
			
			
			it( "should return null for 'unparsable' values/types, when the useNull config is true", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new FloatAttribute( { name: 'attr', useNull: true } ),
				    oldValue,  // undefined
				    value;
				
				// Test with undefined and null
				value = attribute.convert( undefined );
				expect( value ).toBe( null );
				
				value = attribute.convert( null );
				expect( value ).toBe( null );
				
				
				// Test with booleans
				value = attribute.convert( false );
				expect( value ).toBe( null );
				
				value = attribute.convert( true );
				expect( value ).toBe( null );
				
				
				// Test with numbers
				value = attribute.convert( 0 );
				expect( value ).toBe( 0 );
				
				value = attribute.convert( 1 );
				expect( value ).toBe( 1 );
				
				value = attribute.convert( 1.42 );
				expect( value ).toBe( 1.42 );
				
				
				// Test with actual strings
				value = attribute.convert( "" );
				expect( value ).toBe( null );
				
				value = attribute.convert( "hi" );
				expect( value ).toBe( null );
				
				value = attribute.convert( "true" );
				expect( value ).toBe( null );
				
				value = attribute.convert( "1" );
				expect( value ).toBe( 1 );
				
				value = attribute.convert( "1.11" );
				expect( value ).toBe( 1.11 );
				
				
				// Test with an object
				value = attribute.convert( {} );
				expect( value ).toBe( null );
			} );
			
			
			it( "should strip off $, %, and comma (',') characters from an input string, to make a float", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new FloatAttribute( { name: 'attr', useNull: true } ),
				    oldValue,  // undefined
				    value;
				
				value = attribute.convert( "$1,000.32%" );
				expect( value ).toBe( 1000.32 );
			} );
			
		} );
		
	} );
} );